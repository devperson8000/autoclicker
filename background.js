const DEFAULT_STATE = {
  cps: 10,
  mode: "toggle", // "toggle" | "hold"
  hotkey: "F6",
  hotkeyCode: "F6",
  holdEnabled: false,
  running: false
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  const merged = { ...DEFAULT_STATE, ...existing };
  await chrome.storage.local.set(merged);
});
