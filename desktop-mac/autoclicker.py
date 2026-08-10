#!/usr/bin/env python3
"""Standalone macOS autoclicker with a simple GUI.

Two modes:
  - Always On: press the hotkey (or the Start/Stop button) once to start
    clicking continuously at the current mouse position; press again to stop.
  - Hold Key: hold the hotkey down to click continuously; release to stop.

Requires the `pynput` package and macOS Accessibility + Input Monitoring
permission for the terminal/python process running this script (see README.md
in this folder).
"""

import threading
import time
import tkinter as tk
from tkinter import ttk

from pynput import keyboard
from pynput.mouse import Button, Controller

mouse = Controller()

DEFAULT_HOTKEY = keyboard.Key.f6
DEFAULT_HOTKEY_LABEL = "F6"


class AutoclickerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Easy Autoclicker")
        self.root.resizable(False, False)

        self.cps = tk.IntVar(value=10)
        self.mode = tk.StringVar(value="toggle")
        self.hotkey_label = tk.StringVar(value=DEFAULT_HOTKEY_LABEL)
        self.status_text = tk.StringVar(value="Inactive")

        self.hotkey = DEFAULT_HOTKEY
        self.listening_for_key = False
        self.is_clicking = False
        self.click_thread = None
        self.click_stop_event = threading.Event()
        self.hold_key_down = False

        self._build_ui()
        self._start_global_listener()

    def _build_ui(self):
        pad = {"padx": 12, "pady": 6}

        frm_cps = ttk.LabelFrame(self.root, text="Clicks per second")
        frm_cps.pack(fill="x", **pad)
        ttk.Scale(
            frm_cps, from_=1, to=50, orient="horizontal", variable=self.cps,
            command=lambda v: self.cps.set(int(float(v)))
        ).pack(side="left", fill="x", expand=True, padx=(8, 8), pady=8)
        ttk.Entry(frm_cps, textvariable=self.cps, width=5).pack(side="left", padx=(0, 8))

        frm_mode = ttk.LabelFrame(self.root, text="Mode")
        frm_mode.pack(fill="x", **pad)
        ttk.Radiobutton(
            frm_mode, text="Always On", variable=self.mode, value="toggle",
            command=self._on_mode_change
        ).pack(side="left", padx=8, pady=6)
        ttk.Radiobutton(
            frm_mode, text="Hold Key", variable=self.mode, value="hold",
            command=self._on_mode_change
        ).pack(side="left", padx=8, pady=6)

        frm_key = ttk.LabelFrame(self.root, text="Hotkey")
        frm_key.pack(fill="x", **pad)
        self.hotkey_btn = ttk.Button(
            frm_key, textvariable=self.hotkey_label, command=self._start_key_capture
        )
        self.hotkey_btn.pack(side="left", padx=8, pady=6)
        ttk.Label(frm_key, text="click to change").pack(side="left")

        self.toggle_btn = ttk.Button(
            self.root, text="Start Autoclicking (or press hotkey)", command=self._toggle_clicking
        )
        self.toggle_btn.pack(fill="x", **pad)

        status_frame = ttk.Frame(self.root)
        status_frame.pack(fill="x", **pad)
        ttk.Label(status_frame, text="Status:").pack(side="left")
        ttk.Label(status_frame, textvariable=self.status_text).pack(side="left", padx=(6, 0))

        ttk.Label(
            self.root,
            text="Always On: hotkey starts/stops.\nHold Key: click stops while the key is held.",
            foreground="#666", justify="left"
        ).pack(fill="x", padx=12, pady=(0, 10))

        self._on_mode_change()

    def _on_mode_change(self):
        if self.mode.get() == "toggle":
            self.toggle_btn.state(["!disabled"])
            self.toggle_btn.config(text="Start Autoclicking (or press hotkey)")
        else:
            self.toggle_btn.state(["disabled"])
            self.toggle_btn.config(text="Hold the hotkey to click")
        self._stop_clicking()

    def _start_key_capture(self):
        self.listening_for_key = True
        self.hotkey_label.set("Press a key...")

    def _set_status(self, text):
        self.status_text.set(text)

    def _start_clicking(self):
        if self.is_clicking:
            return
        self.is_clicking = True
        self.click_stop_event.clear()
        self.click_thread = threading.Thread(target=self._click_loop, daemon=True)
        self.click_thread.start()
        self._set_status("Active - clicking")
        if self.mode.get() == "toggle":
            self.toggle_btn.config(text="Stop Autoclicking (or press hotkey)")

    def _stop_clicking(self):
        if not self.is_clicking:
            return
        self.is_clicking = False
        self.click_stop_event.set()
        self._set_status("Inactive")
        if self.mode.get() == "toggle":
            self.toggle_btn.config(text="Start Autoclicking (or press hotkey)")

    def _toggle_clicking(self):
        if self.mode.get() != "toggle":
            return
        if self.is_clicking:
            self._stop_clicking()
        else:
            self._start_clicking()

    def _click_loop(self):
        while not self.click_stop_event.is_set():
            cps = max(self.cps.get(), 1)
            mouse.click(Button.left, 1)
            self.click_stop_event.wait(1.0 / cps)

    def _matches_hotkey(self, key):
        return key == self.hotkey

    def _start_global_listener(self):
        def on_press(key):
            if self.listening_for_key:
                self.listening_for_key = False
                self.hotkey = key
                label = getattr(key, "char", None) or str(key).replace("Key.", "").upper()
                self.root.after(0, lambda: self.hotkey_label.set(label))
                return

            if not self._matches_hotkey(key):
                return

            if self.mode.get() == "toggle":
                self.root.after(0, self._toggle_clicking)
            elif self.mode.get() == "hold" and not self.hold_key_down:
                self.hold_key_down = True
                self.root.after(0, self._start_clicking)

        def on_release(key):
            if self.mode.get() == "hold" and self._matches_hotkey(key):
                self.hold_key_down = False
                self.root.after(0, self._stop_clicking)

        listener = keyboard.Listener(on_press=on_press, on_release=on_release)
        listener.daemon = True
        listener.start()


def main():
    root = tk.Tk()
    AutoclickerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
