(function () {
  if (window.__eacToggle) {
    window.__eacToggle();
    return;
  }

  const STORAGE_KEY = "__eacSettings";
  const defaults = { cps: 10, delay: 3, mode: "toggle", hotkey: "F6", hotkeyCode: "F6", holdEnabled: false };
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (e) {
    saved = {};
  }
  const state = { ...defaults, ...saved };

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cps: state.cps, delay: state.delay, mode: state.mode, hotkey: state.hotkey,
        hotkeyCode: state.hotkeyCode, holdEnabled: state.holdEnabled
      }));
    } catch (e) {}
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let timer = null;
  let phase = "idle";
  let countdownTimer = null;
  let countdownRemaining = 0;
  let holdDown = false;
  let listeningForKey = false;

  document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true, capture: true });

  function doClick() {
    const el = document.elementFromPoint(mouseX, mouseY) || document.body;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: mouseX, clientY: mouseY, button: 0 };
    el.dispatchEvent(new MouseEvent("mousedown", { ...opts, buttons: 1 }));
    el.dispatchEvent(new MouseEvent("mouseup", { ...opts, buttons: 0 }));
    el.dispatchEvent(new MouseEvent("click", { ...opts, buttons: 0 }));
  }

  function activate() {
    phase = "active";
    timer = setInterval(doClick, Math.max(1000 / Math.max(state.cps, 1), 1));
    render();
  }

  function start() {
    if (phase !== "idle") return;
    const delay = Math.max(state.delay || 0, 0);
    if (delay <= 0) {
      activate();
      return;
    }
    phase = "pending";
    countdownRemaining = delay;
    render();
    countdownTimer = setInterval(() => {
      countdownRemaining -= 1;
      if (countdownRemaining <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        activate();
      } else {
        render();
      }
    }, 1000);
  }

  function stop() {
    if (phase === "idle") return;
    phase = "idle";
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (timer) { clearInterval(timer); timer = null; }
    render();
  }

  document.addEventListener("keydown", (e) => {
    if (listeningForKey) {
      e.preventDefault();
      listeningForKey = false;
      state.hotkey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      state.hotkeyCode = e.code;
      saveSettings();
      render();
      return;
    }
    if (e.code !== state.hotkeyCode) return;
    if (state.mode === "toggle") {
      phase !== "idle" ? stop() : start();
    } else if (state.mode === "hold" && state.holdEnabled && !holdDown) {
      holdDown = true;
      start();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.code !== state.hotkeyCode) return;
    holdDown = false;
    if (state.mode === "hold") stop();
  });

  const panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;top:16px;right:16px;z-index:2147483647;background:#1c1d24;color:#f2f2f7;" +
    "font:12px/1.4 -apple-system,sans-serif;border-radius:10px;padding:12px;width:230px;" +
    "box-shadow:0 4px 20px rgba(0,0,0,.4);cursor:move;user-select:none;";
  document.body.appendChild(panel);

  let dragging = false, dragOffX = 0, dragOffY = 0;
  panel.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
    dragging = true;
    dragOffX = e.clientX - panel.offsetLeft;
    dragOffY = e.clientY - panel.offsetTop;
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    panel.style.left = e.clientX - dragOffX + "px";
    panel.style.top = e.clientY - dragOffY + "px";
    panel.style.right = "auto";
  });
  document.addEventListener("mouseup", () => { dragging = false; });

  function statusLabel() {
    if (phase === "active") return "Active - clicking";
    if (phase === "pending") return "Starting in " + countdownRemaining + "s...";
    return "Inactive";
  }

  function render() {
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
      '<b>Easy Autoclicker</b><span id="eacClose" style="cursor:pointer;opacity:.6;">&times;</span></div>' +
      '<div style="margin-bottom:6px;">CPS: <input id="eacCps" type="number" min="1" max="1000" value="' + state.cps +
      '" style="width:60px;"></div>' +
      '<div style="margin-bottom:6px;">Start delay (sec): <input id="eacDelay" type="number" min="0" max="60" step="0.5" value="' + state.delay +
      '" style="width:60px;"></div>' +
      '<div style="margin-bottom:6px;">' +
      '<button id="eacModeToggle" style="' + (state.mode === "toggle" ? "background:#6c5ce7;color:#fff;" : "") + '">Always On</button> ' +
      '<button id="eacModeHold" style="' + (state.mode === "hold" ? "background:#6c5ce7;color:#fff;" : "") + '">Hold Key</button></div>' +
      '<div style="margin-bottom:6px;">Hotkey: <button id="eacKeyBtn">' + (listeningForKey ? "Press a key..." : state.hotkey) + "</button></div>" +
      (state.mode === "toggle"
        ? '<button id="eacStartStop" style="width:100%;padding:6px;">' + (phase !== "idle" ? "Stop" : "Start") + "</button>"
        : '<label><input id="eacHoldEnable" type="checkbox" ' + (state.holdEnabled ? "checked" : "") + "> Enable hold-to-click</label>") +
      '<div style="margin-top:6px;opacity:.7;">' + statusLabel() + "</div>";

    panel.querySelectorAll("button").forEach((b) => (b.style.cssText += "background:#333;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;"));

    panel.querySelector("#eacClose").onclick = () => { stop(); panel.remove(); window.__eacToggle = null; };
    panel.querySelector("#eacCps").oninput = (e) => {
      state.cps = Math.max(parseInt(e.target.value, 10) || 1, 1);
      saveSettings();
      if (phase === "active") { clearInterval(timer); timer = setInterval(doClick, Math.max(1000 / Math.max(state.cps, 1), 1)); }
    };
    panel.querySelector("#eacDelay").oninput = (e) => {
      state.delay = Math.max(parseFloat(e.target.value) || 0, 0);
      saveSettings();
    };
    panel.querySelector("#eacModeToggle").onclick = () => { state.mode = "toggle"; saveSettings(); stop(); render(); };
    panel.querySelector("#eacModeHold").onclick = () => { state.mode = "hold"; saveSettings(); stop(); render(); };
    panel.querySelector("#eacKeyBtn").onclick = () => { listeningForKey = true; render(); };
    if (state.mode === "toggle") {
      panel.querySelector("#eacStartStop").onclick = () => (phase !== "idle" ? stop() : start());
    } else {
      panel.querySelector("#eacHoldEnable").onchange = (e) => { state.holdEnabled = e.target.checked; saveSettings(); };
    }
  }

  window.__eacToggle = () => { panel.style.display = panel.style.display === "none" ? "block" : "none"; };

  render();
})();
