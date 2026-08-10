# Easy Autoclicker (macOS standalone)

A small desktop app (not a browser extension) with the same controls: adjustable
CPS, an Always On toggle mode, and a Hold Key mode. Since it's a regular local
script, it isn't affected by Chrome's "Extension installation is blocked by
policy" error — that policy only governs Chrome extensions.

## 1. Install Python (if you don't have it)

Check first:

```
python3 --version
```

If that fails, install Python from [python.org](https://www.python.org/downloads/macos/)
(the "Install Certificates.command" it adds isn't needed here) or via Homebrew:
`brew install python`.

## 2. Install the one dependency

```
cd desktop-mac
pip3 install -r requirements.txt
```

## 3. Run it

```
python3 autoclicker.py
```

## 4. Grant permissions (first run only)

macOS will prompt you, or you can pre-grant it in
**System Settings → Privacy & Security**:

- **Accessibility** — add your terminal app (Terminal.app, iTerm, etc.) or
  `python3` itself, and turn it on.
- **Input Monitoring** — same, add and enable your terminal app.

This is a standard macOS permission for any app that simulates mouse clicks
or reads global key presses — every autoclicker needs it, not just this one.
After granting, quit and restart the terminal/app once.

## Usage

- **Always On mode**: press the hotkey (default `F6`) anywhere, even with
  another app focused, to start clicking continuously at your current mouse
  position. Press it again to stop. The window's Start/Stop button does the
  same thing if the app is focused.
- **Hold Key mode**: switch to "Hold Key", then just hold the hotkey down —
  it clicks continuously while held and stops the instant you release it.
- Click the hotkey button in the app to change it — click it, then press
  whatever key you want to use.

## Notes

- Runs fully locally; nothing is sent anywhere.
- If clicks or the hotkey don't seem to register, double check the
  Accessibility/Input Monitoring permissions above and restart the app.
