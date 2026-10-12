"""Self-contained, per-user installer for the surgical explainer desktop app."""

from __future__ import annotations

import argparse
import base64
import ctypes
import os
import queue
import shutil
import subprocess
import sys
import threading
import uuid
import winreg
import zipfile
from pathlib import Path, PurePosixPath
from tkinter import Tk, ttk, messagebox


APP_NAME = "EUS 手术解说工具"
APP_FOLDER = "EUS_Surgery_Explainer"
EXE_NAME = "EUS_Surgery_Explainer.exe"
UNINSTALL_KEY = rf"Software\Microsoft\Windows\CurrentVersion\Uninstall\{APP_FOLDER}"


def packaged_payload() -> Path:
    root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return root / "app_payload.zip"


def default_target() -> Path:
    local = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    return local / "Programs" / APP_FOLDER


def check_target(target: Path) -> None:
    target = target.resolve()
    if target.name != APP_FOLDER or target.parent == target or target.parent == Path(target.anchor):
        raise ValueError("安装目录不安全；安装文件夹必须命名为 EUS_Surgery_Explainer。")
    if target.exists() and not (target / EXE_NAME).is_file():
        raise ValueError(f"目标目录已存在且不是本工具的安装目录：{target}")


def check_archive(archive: zipfile.ZipFile) -> None:
    names = archive.namelist()
    required = (
        EXE_NAME,
        "_internal/app_content/index.html",
        "_internal/app_content/media/two_d_surgery/eus_ge_obstruction_base_v1.png",
        "_internal/app_content/media/official_photos/02_eus_scope_angle1_full.jpg",
    )
    if any(name not in names for name in required):
        raise RuntimeError("安装包内容不完整：缺少主程序或网页。")
    for name in names:
        part = PurePosixPath(name)
        if part.is_absolute() or ".." in part.parts or ":" in name:
            raise RuntimeError(f"安装包中存在不安全路径：{name}")


def powershell(script: str) -> None:
    encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
    result = subprocess.run(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-EncodedCommand", encoded],
        capture_output=True,
        text=True,
        creationflags=subprocess.CREATE_NO_WINDOW,
        timeout=45,
    )
    if result.returncode:
        raise RuntimeError((result.stderr or result.stdout).strip() or "创建快捷方式失败。")


def ps_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def add_shortcuts(target: Path) -> None:
    exe = ps_quote(str(target / EXE_NAME))
    workdir = ps_quote(str(target))
    name = ps_quote(APP_NAME + ".lnk")
    powershell(
        "$ErrorActionPreference='Stop';"
        "$shell=New-Object -ComObject WScript.Shell;"
        "$folders=@([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('Programs'));"
        f"foreach($folder in $folders){{$link=$shell.CreateShortcut((Join-Path $folder {name}));"
        f"$link.TargetPath={exe};$link.WorkingDirectory={workdir};$link.IconLocation={exe};$link.Save()}}"
    )


def add_uninstall_entry(target: Path) -> None:
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY) as key:
        values = {
            "DisplayName": APP_NAME,
            "DisplayVersion": "1.0.2",
            "Publisher": "EUS Surgical Studio",
            "InstallLocation": str(target),
            "DisplayIcon": str(target / EXE_NAME),
            "UninstallString": (
                'powershell.exe -NoProfile -ExecutionPolicy Bypass -File '
                f'"{target / "uninstall.ps1"}"'
            ),
        }
        for name, value in values.items():
            winreg.SetValueEx(key, name, 0, winreg.REG_SZ, value)


def install(target: Path, shortcuts: bool, progress, phase=None) -> tuple[Path, list[str]]:
    report_phase = phase or (lambda _message: None)
    report_phase("正在检查安装目录……")
    check_target(target)
    payload = packaged_payload()
    if not payload.is_file():
        raise RuntimeError("安装包内容缺失：app_payload.zip。")
    target.parent.mkdir(parents=True, exist_ok=True)
    stage = target.with_name(f"{APP_FOLDER}.installing-{uuid.uuid4().hex[:8]}")
    prior = target.with_name(f"{APP_FOLDER}.previous-{uuid.uuid4().hex[:8]}")
    moved_prior = False
    try:
        stage.mkdir()
        report_phase("正在校验并解包程序素材……")
        with zipfile.ZipFile(payload) as archive:
            check_archive(archive)
            members = archive.infolist()
            for index, item in enumerate(members, start=1):
                archive.extract(item, stage)
                if index % 8 == 0 or index == len(members):
                    progress(index, len(members))
        if not (stage / EXE_NAME).is_file() or not (stage / "_internal" / "app_content" / "index.html").is_file():
            raise RuntimeError("解包后缺少程序文件，安装未完成。")
        if target.exists():
            report_phase("正在更新旧版本，请先退出手术工具……")
            target.rename(prior)
            moved_prior = True
        try:
            stage.rename(target)
        except Exception:
            if moved_prior:
                prior.rename(target)
            raise
        if moved_prior:
            shutil.rmtree(prior)
        warnings = []
        report_phase("正在登记安装信息……")
        try:
            add_uninstall_entry(target)
        except OSError:
            warnings.append("无法登记到 Windows 的“已安装的应用”；仍可使用安装目录里的 uninstall.ps1 卸载。")
        if shortcuts:
            try:
                report_phase("正在创建桌面快捷方式……")
                add_shortcuts(target)
            except Exception:
                warnings.append("无法创建桌面快捷方式；可从安装目录直接打开程序。")
        return target / EXE_NAME, warnings
    finally:
        if stage.exists():
            shutil.rmtree(stage)


def create_install_ui(root: Tk, target: Path):
    """Size the dialog from its widgets, including Windows font/DPI scaling."""
    root.title(APP_NAME + " 安装程序")
    root.resizable(True, True)
    root.configure(background="#f8f1e9")
    panel = ttk.Frame(root, padding=22)
    panel.pack(fill="both", expand=True)
    ttk.Label(panel, text=APP_NAME, font=("Microsoft YaHei UI", 17, "bold")).pack(anchor="w")
    ttk.Label(panel, text="保留网页版界面、3D 模型、2D 手术交互及运行图片素材。", wraplength=440).pack(anchor="w", pady=(9, 4))
    ttk.Label(panel, text=f"安装位置：{target}", wraplength=440).pack(anchor="w")
    status = ttk.Label(panel, text="准备就绪，请点击下方“安装并打开”", wraplength=440)
    status.pack(anchor="w", pady=(16, 5))
    bar = ttk.Progressbar(panel, length=430, mode="determinate", maximum=100)
    bar.pack(anchor="w")
    button = ttk.Button(panel, text="安装并打开", width=18)
    button.pack(anchor="e", pady=(14, 0))
    # A fixed 230px height clipped the action button before installation began.
    # Let Tk calculate the required height at the current text and DPI size.
    root.update_idletasks()
    width = max(540, root.winfo_reqwidth())
    height = max(300, root.winfo_reqheight() + 16)
    root.minsize(width, height)
    root.geometry(f"{width}x{height}")
    return status, bar, button


def gui_main(target: Path | None = None) -> int:
    target = target or default_target()
    root = Tk()
    root.withdraw()
    status, bar, button = create_install_ui(root, target)
    events: queue.Queue = queue.Queue()

    def worker() -> None:
        try:
            result = install(
                target, True,
                lambda done, total: events.put(("progress", (done, total))),
                lambda message: events.put(("phase", message)),
            )
            events.put(("done", result))
        except Exception as error:
            events.put(("error", str(error)))

    def start() -> None:
        if str(button.cget("state")) == "disabled":
            return
        button.configure(state="disabled")
        status.configure(text="正在安装，请稍候……")
        threading.Thread(target=worker, daemon=True).start()

    def poll() -> None:
        try:
            while True:
                kind, value = events.get_nowait()
                if kind == "progress":
                    done, total = value
                    bar.configure(value=done * 100 / total)
                    status.configure(text=f"正在解包：{done} / {total} 项文件")
                elif kind == "phase":
                    status.configure(text=value)
                elif kind == "done":
                    exe, warnings = value
                    status.configure(text="安装完成")
                    note = "安装完成。程序即将打开。"
                    if warnings:
                        note += "\n\n" + "\n".join(warnings)
                        messagebox.showwarning(APP_NAME, note)
                    else:
                        messagebox.showinfo(APP_NAME, note + "以后也可以从桌面快捷方式启动。")
                    try:
                        subprocess.Popen([str(exe)], cwd=str(exe.parent), close_fds=True)
                    except OSError as error:
                        messagebox.showerror(APP_NAME, f"已安装，但未能自动启动：{error}\n请尝试使用桌面快捷方式打开。")
                    root.destroy()
                    return
                else:
                    status.configure(text="安装失败")
                    button.configure(state="normal")
                    messagebox.showerror(APP_NAME, value)
        except queue.Empty:
            pass
        root.after(100, poll)

    button.configure(command=start)
    root.bind("<Return>", lambda _event: start())
    root.deiconify()
    button.focus_set()
    root.after(100, poll)
    root.mainloop()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument("--no-shortcuts", action="store_true")
    parser.add_argument("--install-dir", type=Path)
    args = parser.parse_args()
    if args.verify_only:
        with zipfile.ZipFile(packaged_payload()) as archive:
            check_archive(archive)
            bad = archive.testzip()
            if bad:
                raise RuntimeError(f"安装包校验失败：{bad}")
        return 0
    if args.quiet:
        install(args.install_dir or default_target(), not args.no_shortcuts, lambda _done, _total: None)
        return 0
    return gui_main(args.install_dir)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        ctypes.windll.user32.MessageBoxW(None, str(error), APP_NAME + " 安装失败", 0x10)
        raise SystemExit(1)
