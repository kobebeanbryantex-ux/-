# EUS Atelier · 消化内镜手术可视化解说工具

一个面向医生、医学生及患者和家属的医学教学与手术方案解说原型，提供 **3D 器官选择 → 手术点位 → 2D 器械交互** 的统一工作流，同时支持网页和 Windows 桌面版。

> 本项目用于教学与沟通，不是经认证的临床决策系统。图像包含 AI 医学示意素材，不是患者真实影像，也不代表所有病例都采用相同技术路径；具体适应证、器械、参数与治疗方案须由专业团队决定。医学依据的收录和软件测试通过，不等同于完成临床专家审核。

## 下载安装包

[前往 Releases 下载 Windows 安装包](https://github.com/kobebeanbryantex-ux/-/releases)

安装器版本：**1.0.2**。文件名：`EUS_Surgery_Explainer_Setup_20261008_1_0_2.exe`，约 **327 MiB**。

Windows 10/11 64 位；需要 Microsoft Edge WebView2 Runtime。安装前请退出旧版本，双击安装包后点击 **安装并打开**。安装器创建桌面快捷方式，应用使用与网页版相同的页面和运行素材；使用安装版不需要另外安装 Python 或 Node.js。

1.0.2 修复了安装窗口高度不足导致安装按钮被裁剪的问题，并加入解包数量和分阶段提示。此前版本修正了 2D 素材打包目录层级及桌面外壳对 HTML 拖拽的拦截。

安装包 SHA-256：

```text
6D0549959EC83A23E6357FB411F5E43F79BC1724C60C0A338E3028BC6A1BE76F
```

## 使用网页版

1. 在 GitHub 点击 **Code → Download ZIP**，完整解压；也可以克隆本仓库。
2. 使用 Microsoft Edge 或 Chrome 打开源码目录中的 `index.html`。
3. 从左侧拖入所需器官，点击器官上的手术点位，或点击右侧对应术式名称。
4. 进入 2D 工作区后，确认点位，将右侧器械拖到目标区域，观察器械的局部操作与组织变化。

不要只拷贝 `index.html`；JavaScript、CSS 和素材目录必须保留原有相对位置。工具的核心是器械与器官交互，不是用视频替代操作。

## 主要功能

- 3D 器官拖入、视角操作和附着在器官上的手术点位；初始空工作区不自动显示所有器官或点位。
- 点位与右侧术式列表双向联动，支持从两处进入对应 2D 场景。
- 器械拖到目标部位后触发对应的独立操作图片过程；可直接查看某个环节，建议顺序不是强制解锁条件。
- 2D 画面缩放及病变/处理后状态对比；即时效果不应被理解为长期愈合或治愈保证。
- 左右侧栏折叠展开，以及器械列表的增删管理。
- 医学依据、审核人、审核日期、审核状态和意见的本地追溯记录。

## 已建立的 15 个教学模块

这些是项目中的教学展示模块，不表示已经覆盖所有临床术式或完成临床审核。

| 模块 | 教学主题 |
| --- | --- |
| EUS-GE | EUS 引导胃空肠吻合 |
| EUS-PD | EUS 引导胰管引流 |
| EUS-HGS | EUS 引导肝胃吻合胆道引流 |
| EUS-CDS | EUS 引导胆总管十二指肠引流 |
| EUS-PFC | EUS 引导胰周液体积聚引流 |
| EUS-RV | EUS 引导胆道会师 |
| EUS-AG | EUS 引导顺行胆道治疗 |
| EUS-GBD | EUS 引导胆囊引流 |
| EUS-FNB | EUS 引导胰腺占位组织取样 |
| EUS-CPN | EUS 引导腹腔神经丛毁损的疼痛姑息示意 |
| ERCP-DSOC | 直视胆道镜辅助困难胆总管结石处理 |
| DSOC-Bx | 直视胆道镜下胆道狭窄评估与靶向活检 |
| POEM | 经口内镜下肌切开 |
| ESD | 胃部内镜黏膜下剥离 |
| EDAT | 直视化阑尾腔诊疗 |

## 目录说明

- `index.html`：网页入口，内嵌主解剖模型和 Three.js。
- `two_d_workspace.js/.css`：多术式 2D 工作区、点位、器械和互动逻辑。
- `esd_interaction.js/.css`、`stopmotion_optimizer.js/.css`：教学交互与兼容展示模块。
- `medical_review_registry.js`：医学依据及本地审核台账。
- `media/`：手术图片、器械照片、模型及兼容运行素材。
- 医学照片与图片帧目录：保留运行和开发所需的素材层级。
- `desktop_app.py`：基于 pywebview / WebView2 的桌面外壳。
- `installer_bootstrap.py`、`build_desktop_app.ps1`、`build_installer.ps1`、`uninstall.ps1`：构建、安装及卸载源码。
- `scripts/`、`tests/`：辅助处理脚本及自动化测试。
- `SOURCE_MANIFEST.json`：源码快照文件的大小及 SHA-256；不包含后续新增的本 README 等发布文件。
- `医学审核追溯台账.md` 等文档：医学内容依据、修订与审核说明。

不提交历史备份、旧安装器、构建缓存、原始资料大型视频/PPT，或本机填写的审核数据。EXE 安装包放在 Release 附件，而不是普通 Git 源码提交里。

## 从源码构建 Windows 桌面版

构建需要 Windows、Python、PowerShell 7 和 Node.js。本机验证环境为 Python 3.11.9、pywebview 6.2.1、PyInstaller 6.22.2；运行桌面应用需要 WebView2 Runtime。

在源码根目录执行：

```powershell
python -m pip install pywebview==6.2.1 pyinstaller==6.22.2
pwsh -NoProfile -File ./build_desktop_app.ps1
pwsh -NoProfile -File ./build_installer.ps1
```

输出位于 `桌面版输出/`，完整安装包位于 `桌面版输出/完整安装包/`。

已有网页模型的显示不需要 Blender。部分模型再生成脚本依赖 Blender 和脚本注明的 Z-Anatomy 原始 FBX 等外部资源，本仓库不包含完整外部软件或模型库。

## 检查与测试

运行素材引用检查：

```powershell
node tests/desktop-assets.cjs .
```

浏览器交互测试使用 Playwright（本机版本 1.62.1）及 Microsoft Edge；可先安装测试依赖，再运行：

```powershell
npm install --no-save playwright@1.62.1
node tests/package-smoke.cjs .
node tests/point-navigation.cjs
node tests/esd-interaction.cjs
```

2026-10-11 对解压源码进行了验证：1035 个快照文件逐项 SHA-256 一致、243 项运行素材引用无缺失、15 个模块加载和 17 次器械拖入检查通过；同时检查了器官点位、缩放、侧栏折叠及 ESD 独立操作和对比画面。测试不穷尽所有临床情境、所有器械分支或其他电脑配置。

## 数据和审核

审核记录与自定义器械配置保存在使用者自己的浏览器或桌面应用本机存储中，不会自动同步到 GitHub 或随源码 ZIP 传递。需要移交记录时，在工具中导出相应 JSON；不要公开上传包含患者或个人信息的记录。

本项目目前是教学原型。公开仓库不代表第三方参考照片、模型、商标和文档都已取得统一的再分发许可；再次分发或用于正式教学/商业场景前，应核实相关权利与机构要求。
