"""Regression: every installer action must fit at common Tk font scales."""

from pathlib import Path
import json
import sys
from tkinter import Tk

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from installer_bootstrap import create_install_ui

results = []
for scale in (1.0, 1.333, 1.667, 2.0, 2.667):
    root = Tk()
    root.withdraw()
    root.tk.call("tk", "scaling", scale)
    status, bar, button = create_install_ui(
        root, Path(r"C:\Users\wuhaotian\AppData\Local\Programs\EUS_Surgery_Explainer")
    )
    root.deiconify()
    root.update()
    for widget in (status, bar, button):
        left = widget.winfo_rootx() - root.winfo_rootx()
        top = widget.winfo_rooty() - root.winfo_rooty()
        assert widget.winfo_ismapped(), "Installer widget not visible"
        assert left >= 0 and top >= 0, "Installer widget above/outside client area"
        assert left + widget.winfo_width() <= root.winfo_width(), "Installer widget clipped horizontally"
        assert top + widget.winfo_height() <= root.winfo_height(), "Installer widget clipped vertically"
    results.append({"scale": scale, "window": [root.winfo_width(), root.winfo_height()], "buttonVisible": True})
    root.destroy()
print(json.dumps({"result": "PASS", "layouts": results}, indent=2))
