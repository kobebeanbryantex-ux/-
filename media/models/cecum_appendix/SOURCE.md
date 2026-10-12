# 盲肠与阑尾 3D 模型来源

源文件：用户本地 `Z-Anatomy-PC-Version/Resources/Models/FBX/VisceralSystem100.fbx`。

项目：[Z-Anatomy / Lluís Vinent Juanico](https://github.com/LluisV/Z-Anatomy/tree/PC-Version)。源模型来自 Z-Anatomy 项目。按 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 标注来源并分发本模型衍生文件。

提取与修改：

- `Organ_Cecum`：从 `Ascending colon` 原始网格提取下端盲肠盲袋及短段升结肠，在原始 Blender 坐标 Z=0.998m 处截取并封闭展示切面，细分平滑一级。上端封口是展示裁切边界，不代表生理盲端。
- `Organ_Appendix`：来自独立 `Vermiform appendix` 网格，细分平滑两级，保留其原始走向。
- `Organ_Mesoappendix`：来自 `Meso-appendix` 网格，细分平滑一级。
- 根据同源 `Stomach` 与现有 `Organ_Stomach_Full` 的包围盒，验证三轴同为约 4.2 倍缩放，应用同一平移与缩放。未为展示而单独放大或移至上腹部。
- 材质调整为与工具原有肠道配色接近的红褐色；不声称来源具有患者特定精度。
- EDAT 点位锚定阑尾与盲肠邻接的根部表面顶点，随模型一起旋转、缩放。

文件：`cecum_appendix.glb` 可独立导入三维软件；`cecum_appendix.blend` 可编辑；`cecum_appendix.data.js` 用于直接双击网页时离线载入；`preview.png` 是同一模型的渲染预览；`provenance.json` 记录坐标变换与网格信息。

复现脚本：项目 `scripts/extract_cecum_appendix.py`。本模型代表该解剖图谱的一个参考形态，阑尾位置和走向存在个体差异。
