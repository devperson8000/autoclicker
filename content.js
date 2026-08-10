(() => {
  if (window.__easyAutoclickerInjected) return;
  window.__easyAutoclickerInjected = true;

  const DEFAULT_STATE = {
    cps: 10,
    mode: "toggle",
    hotkey: "F6",
    hotkeyCode: "F6",
    holdEnabled: false,
    running: false
  };

  let state = { ...DEFAULT_STATE };
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let clickTimer = null;
  let isClicking = false;
  let holdKeyDown = false;

  document.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    },
    { passive: true, capture: true }
  );

  function dispatchClickAt(x, y) {
    const el = document.elementFromPoint(x, y) || document.body;
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 1
    };
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    el.dispatchEvent(new MouseEvent("mouseup", { ...opts, buttons: 0 }));
    el.dispatchEvent(new MouseEvent("click", { ...opts, buttons: 0 }));
  }

  function startClicking() {
    if (isClicking) return;
    isClicking = true;
    const intervalMs = Math.max(1000 / Math.max(state.cps, 1), 1);
    clickTimer = setInterval(() => dispatchClickAt(mouseX, mouseY), intervalMs);
  }

  function stopClicking() {
    isClicking = false;
    if (clickTimer) {
      clearInterval(clickTimer);
      clickTimer = null;
    }
  }

  function restartIfRunning() {
    if (isClicking) {
      stopClicking();
      startClicking();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (state.mode !== "hold" || !state.holdEnabled) return;
    if (e.code !== state.hotkeyCode) return;
    if (holdKeyDown) return;
    holdKeyDown = true;
    startClicking();
  });

  document.addEventListener("keyup", (e) => {
    if (e.code !== state.hotkeyCode) return;
    holdKeyDown = false;
    if (state.mode === "hold") stopClicking();
  });

  window.addEventListener("blur", () => {
    if (state.mode === "hold" && holdKeyDown) {
      holdKeyDown = false;
      stopClicking();
    }
  });

  chrome.storage.local.get(Object.keys(DEFAULT_STATE), (stored) => {
    state = { ...DEFAULT_STATE, ...stored };
    if (state.mode === "toggle" && state.running) {
      startClicking();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    for (const key of Object.keys(changes)) {
      if (key in state) state[key] = changes[key].newValue;
    }
    if (changes.cps) restartIfRunning();
    if (changes.mode) {
      stopClicking();
      holdKeyDown = false;
    }
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    switch (msg.action) {
      case "start":
        state.mode = "toggle";
        startClicking();
        sendResponse({ ok: true, isClicking });
        break;
      case "stop":
        stopClicking();
        sendResponse({ ok: true, isClicking });
        break;
      case "getStatus":
        sendResponse({ ok: true, isClicking });
        break;
      default:
        sendResponse({ ok: false });
    }
    return true;
  });
})();
