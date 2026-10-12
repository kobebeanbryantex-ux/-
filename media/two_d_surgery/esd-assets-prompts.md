# ESD 图片素材与最终提示词

使用内置 imagegen 技能生成，不使用 CLI/API 替代流程。图片为 AI 医学示意，不是患者影像、品牌实物或经临床签审的标准操作图。运行时局部变化由 SVG 图层与交互状态控制，源 PNG 未做程序化涂改。

## 当前术前胃部局部剖面底图（v2）

保存位置：`C:/Users/wuhaotian/Desktop/手术解说工具设计/media/two_d_surgery/esd_00_gastric_section_v2.png`，1536 × 1024。

最终提示词：

> Use case: scientific-educational, for a browser-based interactive teaching canvas. Asset type: a clean, realistic medical illustration raster background, 3:2 landscape (1536×1024 ideal). Create a recognizable focused partial cross-section of a HUMAN STOMACH for an endoscopic submucosal dissection teaching scene. This must clearly read as a stomach, NOT as a rectangular slab of generic tissue and NOT as a full abdomen. A rounded, partial gastric chamber / cutaway occupies about 75% of the canvas, centered, on a warm ivory clinical background. Show an open gastric lumen with pink folded mucosa (rugae) along the inner surface, in a simple side-oblique surgical cross-section. On the lower-inner wall, at approximately the center of the canvas (x 50%, y 44%), show one clearly visible flat irregular reddish superficial mucosal lesion, roughly 14% of canvas width. Along the lower wall, reveal a clean small cutaway edge of tissue layers: pink mucosa, pale/yellow submucosa, and a continuous deeper red muscle layer. Keep these layers medically legible but simple. Leave comfortable empty ivory margin around it for UI labels and drag interaction. No instruments, no device, no endoscope, no blood, no text, no arrows, no labels, no logos, no watermark. High-quality realistic medical textbook illustration, softly lit, clean edges, restrained colors. Critical: the lesion must be unmistakably different from normal mucosa and centered in the working target area.

## 当前即时切除创面底图（v2）

保存位置：`C:/Users/wuhaotian/Desktop/手术解说工具设计/media/two_d_surgery/esd_01_gastric_resection_bed_v2.png`，1536 × 1024。以 v2 术前图为编辑目标，保持画面配准，仅更改局部病灶。

最终提示词：

> Edit this exact medical teaching illustration. Preserve the camera angle, entire stomach outline, gastric lumen, mucosal folds, all tissue-layer edges, scale, framing, ivory background, and lighting exactly so it is perfectly aligned with the source. Change only the red superficial lesion at the center of the lower-inner gastric mucosa: replace it with an unmistakable immediate post-ESD resection bed. It should be a sharply defined pale cream/pink oval mucosal defect with a subtly cauterized tan rim and exposed pale submucosal layer. The deeper muscularis layer must remain visibly continuous beneath it. Do NOT show a healed normal stomach, do NOT add blood, stitches, clips, instruments, labels, text, arrows, logos, or watermarks. This is an immediate post-procedure teaching comparison image, not a claim of completed healing.

## 旧版组织切片底图（v1，保留但不再加载）

保存位置：`C:/Users/wuhaotian/Desktop/手术解说工具设计/media/two_d_surgery/esd_00_lesion_v1.png`，1536 × 1024。

最终提示词：

> Use case: scientific-educational. Asset type: immutable raster anatomy background for a patient-facing interactive gastric ESD teaching workspace. Generate one 1536x1024 landscape medical illustration, realistic polished medical-textbook rendering, NOT cartoon, NOT a UI mockup. Warm ivory studio background matching a cream surgical teaching interface. Show ONLY one small rectangular patch of gastric wall, isolated as a softly curved broad tissue slab in a gentle oblique overhead view. The gastric mucosal surface occupies the central scene with fine realistic salmon-pink folds; an exposed front edge along the bottom reveals clearly separated thin pink mucosa, pale fibrous submucosa, and continuous intact thicker pink muscularis propria. No other organs. In the centre of the top mucosal surface, around image x=50%, y=46%, show a flat, sharply distinguishable reddish superficial oval mucosal lesion, occupying only about 24% of image width and 16% of image height; subtle irregular surface texture and slight depressed centre, not a large protruding polyp. This is a teaching depiction of a superficial gastric lesion, not diagnostic imaging. Keep the entire tissue patch comfortably within the canvas with 15% padding around it. Flat untouched lesion at this baseline: no needle, knife, endoscope, marks, incision, lifted tissue, blue injectate, wound, forceps, specimen or captions. No tumor in deep layers, no full-thickness hole, no blood splatter. Precisely fixed camera and geometry; this raster will later be masked and composited by code for local lifting and dissection feedback. No text, labels, arrows, logos, watermark, or embedded UI. Materials should look moist and anatomically textured but not excessively glossy. Clear simple composition; lesion must not dominate the entire canvas.

## 即时切除创面底图

保存位置：`C:/Users/wuhaotian/Desktop/手术解说工具设计/media/two_d_surgery/esd_01_resection_bed_v1.png`，1536 × 1024。以术前底图为编辑目标，保持画面配准，仅更改局部病灶。

最终提示词：

> Use case: precise-object-edit / scientific-educational. Edit target: the attached immutable gastric-wall baseline image. Create a matching immediate post-ESD resection-bed variant. CRITICAL: keep the image EXACTLY the same 1536x1024 framing, camera, scale, ivory background, slab contour, mucosal folds, all surrounding tissue and the exposed layered front edge; do not redraw, move or change them. Change ONLY the central superficial reddish lesion and a small oval margin surrounding it, approximately x=768,y=453 with oval radius x=270,y=128 pixels. In this oval, the lesion-bearing mucosa has been removed by gastric endoscopic submucosal dissection. Replace that superficial tissue with a shallow oval pale ivory/cream and subtly blue-tinted fibrous submucosal resection bed, thin delicate white connective fibres, with a gently raised pink mucosal edge. Show one or two very small visible superficial vessel stumps for later code-driven haemostasis teaching. All deeper layers including muscularis propria remain continuous and INTACT. No dark hole, crater through the wall, perforation, black char, blood pool, clip closure, instrument, removed specimen, text or arrow. This is IMMEDIATE POST-RESECTION, NOT healed normal mucosa and NOT proof of cure. The whole rest of the image must remain pixel-aligned with the baseline for local overlay compositing; no side-by-side layout. Polished realistic medical-textbook texture matching the input, not cartoon.

## 当前器械接触过程帧（v3）

为避免将带摄影棚底色的器械卡图片硬叠加到胃壁上，四个操作状态均以胃部局部剖面为编辑目标，生成同一镜头、同一光照、器械前端真实接触病灶的独立医学插画帧。运行时拖入器械后切换到对应帧，不使用矢量线条替代器械。

- `esd_02_knife_contact_v3.png`：以 v2 术前胃部剖面为编辑目标；仅加入从左侧胃腔进入的非品牌 ESD 针刀，短金属刀尖接触红色病灶左缘，并有极轻微接触光点；不改变胃壁、病灶、镜头或光照。
- `esd_03_injector_contact_v3.png`：以 v2 术前胃部剖面为编辑目标；仅加入从左侧进入的黏膜下注射针，针尖接触病灶左下缘，并显示不遮挡病灶的局部浅蓝色黏膜下液垫。
- `esd_04_hemostasis_contact_v3.png`：以 v2 即时切除创面为编辑目标；仅加入从左侧进入的内镜止血钳，杯状钳头接触剥离床左上缘一个细小可见血管点；不显示活动性出血或愈合。
- `esd_05_retrieval_contact_v3.png`：以 v2 即时切除创面为编辑目标；仅加入从左侧进入的标本回收网，网篮在创面旁承接一块游离的浅粉色黏膜标本；不将创面显示为愈合或治愈。

四帧共同最终提示词约束：`Use case: precise-object-edit / scientific-educational. Preserve the stomach anatomy, camera angle, gastric folds, wall layers, framing, lighting and ivory margins exactly. Match polished medical textbook realism. No labels, arrows, UI, watermark, blood pool, perforation, extra instruments, clips or hands.`

## 右侧四类器械卡

同样使用内置 imagegen 生成，均为 AI 形态示意、非品牌实物，不用于确定规格或替代器械说明书。

- `esd_instrument_knife_v2.png`：非品牌 ESD 电刀；深色柔性鞘管、短针刀头；必须与注射针、止血钳、回收网形态不同。
- `esd_instrument_injector_v2.png`：非品牌黏膜下注射针；透明 Luer 接头、细针尖；不得呈现为电刀、钳或网篮。
- `esd_instrument_hemostasis_v2.png`：非品牌内镜止血钳；黑色鞘管、清晰的杯状钳头与控制手柄；不得呈现为针或网篮。
- `esd_instrument_retrieval_v2.png`：非品牌标本回收网；细长导管和明显张开的网篮；不装载标本，不呈现为钳或刀。

四张图统一要求：暖象牙色摄影棚背景、横向器械卡构图、医学教材级真实质感；无品牌、文字、标识、组织、内镜或水印。
