"""Windows desktop shell for the existing surgical explanation workspace.

The UI itself stays in index.html and its adjacent assets.  WebView2 renders
that same page in a native application window, with persistent browser storage
for locally entered review records and instrument customizations.
"""

from __future__ import annotations

import ctypes
import os
import sys
from pathlib import Path

import webview


APP_NAME = "EUS 手术解说工具"


def content_directory() -> Path:
    bundled_root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    bundled_content = bundled_root / "app_content"
    if (bundled_content / "index.html").is_file():
        return bundled_content
    return Path(__file__).resolve().parent


def browser_storage_directory() -> Path:
    local_app_data = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    directory = local_app_data / "EUSSurgeryExplainer" / "WebView2"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def show_error(message: str) -> None:
    ctypes.windll.user32.MessageBoxW(None, message, APP_NAME, 0x10)


def main() -> int:
    index = content_directory() / "index.html"
    if not index.is_file():
        show_error("程序文件不完整：找不到 index.html。请重新安装完整应用后再启动。")
        return 1

    try:
        webview.create_window(
            APP_NAME,
            url=index.as_uri(),
            width=1600,
            height=980,
            min_size=(1100, 700),
            maximized=True,
            background_color="#f7f0e9",
            text_select=True,
            # Keep native HTML image/card dragging enabled, as in the webpage.
            draggable=True,
        )
        webview.start(
            gui="edgechromium",
            private_mode=False,
            storage_path=str(browser_storage_directory()),
        )
    except Exception as error:
        show_error(
            "桌面窗口启动失败。请确认电脑已安装 Microsoft Edge WebView2 Runtime。\n\n"
            f"错误信息：{error}"
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
