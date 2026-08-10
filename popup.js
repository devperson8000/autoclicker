const DEFAULT_STATE = {
  cps: 10,
  mode: "toggle",
  hotkey: "F6",
  hotkeyCode: "F6",
  holdEnabled: false,
  running: false
};

const cpsSlider = document.getElementById("cpsSlider");
const cpsInput = document.getElementById("cpsInput");
const modeSwitch = document.getElementById("modeSwitch");
const toggleSection = document.getElementById("toggleSection");
const holdSection = document.getElementById("holdSection");
const toggleBtn = document.getElementById("toggleBtn");
const hotkeyBtn = document.getElementById("hotkeyBtn");
const holdEnableToggle = document.getElementById("holdEnableToggle");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const warningText = document.getElementById("warningText");

let state = { ...DEFAULT_STATE };
let activeTabId = null;
let listeningForKey = false;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function sendToContent(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
}

function renderStatus(isClicking) {
  statusDot.classList.toggle("active", !!isClicking);
  if (state.mode === "toggle") {
    statusText.textContent = isClicking ? "Active - clicking" : "Inactive";
    toggleBtn.textContent = isClicking ? "Stop Autoclicking" : "Start Autoclicking";
    toggleBtn.classList.toggle("running", !!isClicking);
  } else {
    statusText.textContent = state.holdEnabled
      ? isClicking
        ? "Active - clicking"
        : `Armed - hold ${state.hotkey}`
      : "Inactive";
  }
}

function renderMode() {
  [...modeSwitch.children].forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === state.mode);
  });
  toggleSection.classList.toggle("hidden", state.mode !== "toggle");
  holdSection.classList.toggle("hidden", state.mode !== "hold");
}

async function refreshStatusFromPage() {
  if (!activeTabId) return;
  const res = await sendToContent(activeTabId, { action: "getStatus" });
  if (res === null) {
    warningText.classList.remove("hidden");
    renderStatus(false);
    return;
  }
  warningText.classList.add("hidden");
  renderStatus(res.isClicking);
}

async function init() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  state = { ...DEFAULT_STATE, ...stored };

  cpsSlider.value = clamp(state.cps, 1, 50);
  cpsInput.value = state.cps;
  holdEnableToggle.checked = !!state.holdEnabled;
  hotkeyBtn.textContent = state.hotkey;
  renderMode();

  const tab = await getActiveTab();
  activeTabId = tab ? tab.id : null;
  await refreshStatusFromPage();
}

function setCps(value) {
  const cps = clamp(parseInt(value, 10) || 1, 1, 1000);
  state.cps = cps;
  cpsSlider.value = clamp(cps, 1, 50);
  cpsInput.value = cps;
  chrome.storage.local.set({ cps });
}

cpsSlider.addEventListener("input", (e) => setCps(e.target.value));
cpsInput.addEventListener("input", (e) => setCps(e.target.value));

modeSwitch.addEventListener("click", async (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  const newMode = btn.dataset.mode;
  if (newMode === state.mode) return;

  if (activeTabId) await sendToContent(activeTabId, { action: "stop" });
  state.mode = newMode;
  state.running = false;
  await chrome.storage.local.set({ mode: newMode, running: false });
  renderMode();
  await refreshStatusFromPage();
});

toggleBtn.addEventListener("click", async () => {
  if (!activeTabId) return;
  const statusRes = await sendToContent(activeTabId, { action: "getStatus" });
  const isClicking = statusRes ? statusRes.isClicking : false;
  const action = isClicking ? "stop" : "start";
  const res = await sendToContent(activeTabId, { action, cps: state.cps });
  if (res === null) {
    warningText.classList.remove("hidden");
    return;
  }
  warningText.classList.add("hidden");
  state.running = res.isClicking;
  await chrome.storage.local.set({ running: res.isClicking });
  renderStatus(res.isClicking);
});

holdEnableToggle.addEventListener("change", async (e) => {
  state.holdEnabled = e.target.checked;
  await chrome.storage.local.set({ holdEnabled: state.holdEnabled });
  renderStatus(false);
});

hotkeyBtn.addEventListener("click", () => {
  listeningForKey = true;
  hotkeyBtn.textContent = "Press a key...";
  hotkeyBtn.classList.add("listening");
});

window.addEventListener("keydown", async (e) => {
  if (!listeningForKey) return;
  e.preventDefault();
  listeningForKey = false;
  hotkeyBtn.classList.remove("listening");

  const label = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  state.hotkey = label;
  state.hotkeyCode = e.code;
  hotkeyBtn.textContent = label;
  await chrome.storage.local.set({ hotkey: label, hotkeyCode: e.code });
  renderStatus(false);
});

init();
