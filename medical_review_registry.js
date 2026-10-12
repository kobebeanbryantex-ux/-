/*
 * Medical evidence register — baseline for the teaching prototype.
 *
 * This file intentionally separates source evidence from the browser-local
 * review log.  A source listed here means "used to scope this teaching
 * module"; it never means that an individual case or a final procedure plan
 * has been approved.  Reviewer name, date and decision are deliberately blank
 * until an authorised clinician records them in the application.
 */
(function () {
  'use strict';

  var esgeTechnical = 'https://www.esge.com/assets/downloads/pdfs/guidelines/2022_a-1738-6780.pdf';
  var therapeuticBiliaryEus = 'https://www.asge.org/home/resources/publications/guidelines/american-society-for-gastrointestinal-endoscopy-guideline-on-the-role-of-therapeutic-eus-in-the-management-of-biliary-tract-disorders--summary-and-recommendations';
  var giiObstruction = 'https://www.asge.org/home/resources/publications/guidelines/asge-guideline-on-the-role-of-endoscopy-in-the-management-of-benign-and-malignant-gastroduodenal-obstruction';
  var pfcGuideline = 'https://www.asge.org/home/resources/publications/guidelines/2016_inflammatory_pancreatic_fluid_collections';
  var pancreaticNecrosis = 'https://gastro.org/clinical-guidance/management-of-pancreatic-necrosis/';
  var biliaryStricture = 'https://www.asge.org/home/resources/publications/guidelines/asge-guideline-on-the-role-of-endoscopy-in-the-diagnosis-of-malignancy-in-biliary-strictures-of-undetermined-etiology--summary-and-recommendations';
  var achalasia = 'https://gi.org/guideline/diagnosis-and-management-of-achalasia/';
  var esdGuideline = 'https://www.esge.com/endoscopic-submucosal-dissection-update-2022';
  var pancreasMass = 'https://www.asge.org/home/resources/publications/guidelines/american-society-for-gastrointestinal-endoscopy-guideline-on-role-of-endoscopy-in-the-diagnosis-and-management-of-solid-pancreatic-masses--methodology-and-review-of-evidence';
  var cpnGuideline = 'https://www.asge.org/home/resources/publications/guidelines/adverse-events-associated-with-eus-and-eus-guided-procedures';

  function source(type, title, href, note) {
    return { type: type, title: title, href: href || '', note: note || '' };
  }
  function local(title, note) { return source('项目原始资料', title, '', note); }
  function guideline(title, href, note) { return source('指南 / 共识', title, href, note); }
  function study(title, href, note) { return source('研究 / 综述', title, href, note); }
  function module(scope, reviewerRole, focus, sources) {
    return { scope: scope, reviewerRole: reviewerRole, focus: focus, sources: sources };
  }

  window.MedicalReviewRegistry = {
    schemaVersion: 'medical-review-register/v1',
    evidenceVersion: '2026-09-29',
    baselineDate: '2026-09-29',
    purpose: '教学原型医学内容可追溯台账；不构成个体诊疗建议、正式授权或临床审核结论。',
    modules: {
      eus_ge: module(
        '恶性或良性胃出口梗阻教学情境下的 EUS 引导胃空肠吻合：展示定位、肠袢准备的两条互斥教学路径及旁路建立，不给出设备参数或个体适应证结论。',
        '治疗性 EUS / 消化内镜专科医生',
        ['患者选择及与外科、肠内支架方案的边界', 'EPASS 与肠袢充盈两条路径不得混用', '旁路建立不等于原病变消失或临床结局保证'],
        [local('资料/eusge.txt；资料/穿墙引线.txt', '原始项目资料与术式语境。'), guideline('ASGE：胃十二指肠梗阻的内镜管理指南', giiObstruction), guideline('ESGE：治疗性 EUS 技术综述', esgeTechnical)]
      ),
      eus_pd: module(
        'EUS 引导胰管引流的教学路径：仅展示定位、穿刺、导丝、扩张和引流支架的概念性过程；不能据此判断胰管梗阻是否适合穿刺。',
        '治疗性 EUS / 胰腺内镜专科医生',
        ['ERCP 失败或不可行时的适应证边界', '胰管、血管与安全针道的图像表达', '并发症、替代方案与后续引流管理'],
        [local('资料/终稿-超声内镜引导下胆胰微创介入新技术申.pptx（胰胆 EUS 章节）'), guideline('ESGE：治疗性 EUS 技术综述', esgeTechnical), study('EUS 引导胰管引流综述（PubMed PMID: 32967409）', 'https://pubmed.ncbi.nlm.nih.gov/32967409/')]
      ),
      eus_hgs: module(
        'EUS 引导肝胃吻合引流的概念性教学：展示左肝内胆管定位、经胃通路与支架引流，不替代胆道梗阻分层或个体引流策略。',
        '治疗性 EUS / 肝胆胰内镜专科医生',
        ['胆道梗阻部位与 EUS-HGS 适用边界', '左肝内胆管、血管与经胃路径的准确性', '支架类型、引流范围及不良事件表述'],
        [local('资料/终稿-超声内镜引导下胆胰微创介入新技术申.pptx（HGS 章节）'), guideline('ASGE：治疗性 EUS 用于胆道疾病', therapeuticBiliaryEus), guideline('ESGE：治疗性 EUS 技术综述', esgeTechnical)]
      ),
      eus_cds: module(
        'EUS 引导胆总管十二指肠吻合引流的概念性教学：展示远端胆道梗阻情境下的定位与跨壁引流，不表示每例均应采用。',
        '治疗性 EUS / 肝胆胰内镜专科医生',
        ['远端恶性胆道梗阻与替代路径的适用边界', '胆总管、十二指肠壁和血管关系', '即刻引流示意与长期结局、感染风险的区分'],
        [local('资料/终稿-超声内镜引导下胆胰微创介入新技术申.pptx（CDS 章节）'), guideline('ASGE：治疗性 EUS 用于胆道疾病', therapeuticBiliaryEus), guideline('ESGE：治疗性 EUS 技术综述', esgeTechnical)]
      ),
      eus_pfc: module(
        '胰周液体积聚的 EUS 引导引流教学：展示导丝辅助与直接电切增强 LAMS 两条互斥分支，强调引流窗口、囊腔内容物和随访均需个体化。',
        '治疗性 EUS / 胰腺疾病多学科团队',
        ['急性胰腺炎后液体积聚的类型与介入时机', '两条器械分支不可混用', '感染、坏死清除与支架管理不得被图示简化为“治愈”'],
        [local('EUS_PFC_医学依据与验收记录.md'), guideline('ASGE：胰腺炎性液体积聚管理', pfcGuideline), guideline('AGA：胰腺坏死管理临床指导', pancreaticNecrosis), study('胰周液体积聚内镜治疗综述（PMC9081921）', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9081921/')]
      ),
      eus_rv: module(
        'EUS 引导顺行导丝并经 ERCP 接回的救援性教学路径；仅说明概念步骤，不提供导丝操作、插管或补救决策的参数。',
        '治疗性 EUS 与 ERCP 专科医生',
        ['ERCP 困难/失败后的救援情境', '导丝跨乳头与十二指肠镜接回的连续性', '何时停止或改用其他引流路径'],
        [local('资料/终稿-超声内镜引导下胆胰微创介入新技术申.pptx（RV 章节）'), guideline('ASGE：治疗性 EUS 用于胆道疾病', therapeuticBiliaryEus), guideline('ESGE：治疗性 EUS 技术综述', esgeTechnical)]
      ),
      ercp_eye: module(
        'ERCP 联合直视胆道镜辅助困难胆总管结石处理的教学：展示入路、直视、碎石和取石；不保证取净或替代感染与残石评估。',
        'ERCP / 胆胰内镜专科医生',
        ['困难结石的定义与常规 ERCP 方案边界', '碎石能量、次数与停止条件不得从图中推导', '取石后残石、感染和分期处理评估'],
        [local('资料/洞察胆胰、阑尾疾病直视化诊疗技术应用(1).pptx（困难胆总管结石章节）'), guideline('ASGE：胆总管结石内镜管理指南', 'https://www.asge.org/home/resources/publications/guidelines/asge-guideline-on-the-role-of-endoscopy-in-the-evaluation-and-management-of-choledocholithiasis')]
      ),
      poem: module(
        'POEM 的教学路径：展示下段食管定位、黏膜下注射、隧道内肌切开和入口夹闭，不替代贲门失弛缓症分型和治疗选择。',
        '食管动力 / 第三间隙内镜专科医生',
        ['诊断、分型及与气囊扩张/Heller 肌切开等方案的边界', '黏膜下隧道和肌切开范围的非参数化表达', '反流、穿孔等风险与疗效随访表述'],
        [guideline('ACG：贲门失弛缓症诊断与管理指南', achalasia), study('项目教学图帧与器械分步说明', '', '仅为界面素材说明，须由审核人复核。')]
      ),
      edat: module(
        '内镜下阑尾腔诊疗（EDAT）的选择性教学情境：示意未穿孔阑尾腔梗阻、直视处理和按需引流支持，不等同于急性阑尾炎的普遍替代治疗。',
        '结直肠内镜 / 普外科联合审核',
        ['非穿孔、感染控制及手术备选的患者选择边界', '粪石处理和按需塑料支架的条件性表达', '证据等级、复发与长期结局需避免过度外推'],
        [local('资料/洞察胆胰、阑尾疾病直视化诊疗技术应用(1).pptx（EDAT 章节）'), study('EDAT 与 ERAT 比较研究（PubMed PMID: 41278158）', 'https://pubmed.ncbi.nlm.nih.gov/41278158/'), study('EDAT 匹配队列研究（PubMed PMID: 40091236）', 'https://pubmed.ncbi.nlm.nih.gov/40091236/')]
      ),
      biliary_biopsy: module(
        '直视胆道镜下不明原因胆道狭窄评估与靶向活检的诊断性教学路径；取样不等于确诊、狭窄解除或治疗完成。',
        'ERCP / 胆胰内镜及病理联合审核',
        ['不明原因胆道狭窄的诊断流程与 ERCP 取样位置', '直视印象与病理诊断的边界', '取样不足时的补充评估与多学科决策'],
        [local('资料/洞察胆胰、阑尾疾病直视化诊疗技术应用(1).pptx（胆道狭窄直视取样章节）'), guideline('ASGE：不明原因胆道狭窄恶性诊断指南', biliaryStricture)]
      ),
      eus_ag: module(
        'EUS 引导顺行跨狭窄引流的概念性教学；示意从左肝内胆管建立通路并顺行支架，不作为具体置入策略。',
        '治疗性 EUS / 肝胆胰内镜专科医生',
        ['ERCP 失败或不可行时的路径选择', '跨狭窄方向、肝内胆管与血管关系', '支架、感染与替代引流方案的边界'],
        [local('资料/终稿-超声内镜引导下胆胰微创介入新技术申.pptx（顺行引流章节）'), guideline('ASGE：治疗性 EUS 用于胆道疾病', therapeuticBiliaryEus), guideline('ESGE：治疗性 EUS 技术综述', esgeTechnical)]
      ),
      eus_gbd: module(
        'EUS 引导胆囊引流的教学：展示导丝辅助与直接 EC-LAMS 两个互斥分支；不替代急性胆囊炎风险分层、手术评估与感染管理。',
        '治疗性 EUS / 肝胆外科联合审核',
        ['手术高风险或替代引流的适用边界', '两条器械分支不可混用', '胆囊位置、胆管与周围血管的图像准确性'],
        [local('EUS_GBD_医学依据与验收记录.md'), guideline('ESGE：治疗性 EUS 技术综述', esgeTechnical), guideline('ASGE：治疗性 EUS 用于胆道疾病', therapeuticBiliaryEus), study('EUS 引导胆囊引流综述（PMC6896434）', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6896434/')]
      ),
      eus_fnb: module(
        'EUS 引导胰腺实性占位 FNB 取样教学：强调定位、安全针道和标本送检；取样不治疗病灶，也不预设良恶性。',
        'EUS 诊断内镜 / 病理联合审核',
        ['取样适应证、禁忌证与病理目标', '血管回避、针道与取材范围的图像表达', '针型、抽吸、ROSE 与取材次数不得被界面定值化'],
        [local('资料/终稿-超声内镜引导下胆胰微创介入新技术申.pptx（FNB 章节）'), guideline('ASGE：胰腺实性肿块内镜诊断与管理', pancreasMass), guideline('ASGE：胰腺实性肿瘤 EUS 取样指南', 'https://www.asge.org/home/resources/publications/guidelines/2016_solid_pancreatic_neoplasia')]
      ),
      eus_cpn: module(
        'EUS 引导腹腔神经丛毁损（CPN）的疼痛姑息教学：展示神经丛靶区定位和注射扩散；不缩小、切除或治愈肿瘤。',
        '肿瘤疼痛 / 治疗性 EUS 联合审核',
        ['肿瘤相关疼痛的姑息定位与替代镇痛方案', '腹腔干、血管和神经丛靶区的安全表达', '腹泻、低血压等风险与镇痛持续时间的非保证性表达'],
        [guideline('ASGE：EUS 及 EUS 引导操作不良事件指南', cpnGuideline), guideline('ASGE：胰腺实性肿瘤 EUS 指南', 'https://www.asge.org/home/resources/publications/guidelines/2016_solid_pancreatic_neoplasia')]
      ),
      esd: module(
        '胃部 ESD 的教学路径：展示表浅病灶、边界操作、黏膜下注射、创面血管处理和标本回收；即时创面不等于愈合或治愈。',
        'ESD / 上消化道早癌内镜专科医生',
        ['病灶分层、适应证及与外科治疗的边界', '黏膜、黏膜下层与肌层保护的图像准确性', '病理、切除完整性和随访不能由教学画面替代'],
        [local('ESD_医学依据与验收记录.md'), guideline('ESGE：内镜黏膜下剥离术更新指南（2022）', esdGuideline), guideline('ESGE：ESD 技术与设备技术综述', 'https://www.esge.com/esd-techniques-and-technology-esge-technical-review')]
      )
    }
  };
})();
