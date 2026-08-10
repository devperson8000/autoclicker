# Easy Autoclicker

A simple Chrome (Manifest V3) extension autoclicker you control from the toolbar popup.

## Features

- **Adjustable CPS** — slider + number input, 1–1000 clicks per second.
- **Always On mode** — press Start in the popup and it clicks continuously (at your mouse position on the page) until you press Stop.
- **Hold Key mode** — enable the switch, then hold a key (default `F6`, click "Press a key..." to change it) anywhere on the page to autoclick; release to stop.
- Clicks happen wherever your mouse cursor currently is on the page.

## Install (unpacked, for now — not on the Chrome Web Store)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this project's folder.
4. Pin the "Easy Autoclicker" icon to your toolbar and click it to open the popup.

## Usage

- **Always On mode** (default): set your CPS, click **Start Autoclicking**, move your mouse over the spot you want clicked. Click **Stop Autoclicking** (or click the toolbar icon again and press Stop) to end it.
- **Hold Key mode**: switch to "Hold Key", flip the enable switch on, then just hold the configured key while hovering over the page — it clicks while held and stops the instant you let go.

## Notes

- Doesn't work on internal browser pages (e.g. `chrome://` pages, the Chrome Web Store) — Chrome blocks extensions from those pages.
- Each tab tracks its own clicking state independently.
