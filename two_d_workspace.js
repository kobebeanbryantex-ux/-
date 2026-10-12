/*
 * 2D therapeutic-EUS interaction workspace
 *
 * The conversation begins with the existing 3D organ stage.  Once the clinician
 * has assembled the relevant organs and confirms the planned point, it changes
 * into a focused 2D surgical image.  Tool drops then create local effects only;
 * no tool action opens a video or a separate explanation window.
 */
(function () {
  'use strict';

  var SIMPLE_ANATOMY = 'media/two_d_surgery/eus_ge_obstruction_base_v1.png';
  var STATES = {
    initial: { image: SIMPLE_ANATOMY, title: '病变与术前解剖定位', note: '十二指肠梗阻病变使胃排空受阻；目标空肠段贴近胃壁。' },
    echoendoscope: { image: 'media/two_d_surgery/01_eus_localization_v1.png', title: '超声定位完成', note: '在胃壁后方锁定目标空肠段，避开非目标区域。', beats: ['镜体进入胃腔', '探头贴近胃壁', '声束锁定空肠'] },
    dilation_catheter: { image: 'media/two_d_surgery/02_contrast_filling_v1.png', title: '目标肠段已充盈（辅助分支）', note: '鼻胆管/鼻空肠管充盈属于肠袢准备方法之一；与 EPASS 双球囊法是不同的辅助分支，并非每例都同时使用。', beats: ['导管通过狭窄', '注入盐水与显影液', '靶肠段充盈'] },
    epass: { image: 'media/two_d_surgery/03_epass_balloon_v1.png', title: '双球囊辅助固定', note: '双球囊固定目标肠段，维持胃—空肠贴壁关系。', beats: ['导管进入空肠', '前后球囊充盈', '隔离肠段固定'] },
    hotaxios: { image: 'media/two_d_surgery/04_hotaxios_puncture_v1.png', title: '电切增强输送系统进入靶肠腔', note: '在实时超声控制下以设备相容的纯切设置进入目标肠腔；本教学模型不提供固定功率处方。', beats: ['电切头贴壁', '纯切模式进入', '确认位于目标空肠'] },
    guidewire: { image: 'media/two_d_surgery/05_guidewire_v1.png', title: '导丝辅助分支', note: '导丝可用于辅助置入肠道充盈装置，或用于部分针导丝辅助技术；无线自由手技术则不使用跨壁导丝。', beats: ['明确所选技术分支', '导丝在影像下推进', '确认位置与稳定性'] },
    lams: { image: 'media/two_d_surgery/06_lams_deployed_v1.png', title: '吻合支架释放完成', note: '新的胃—空肠通道建立，食物流绕过梗阻病变。', beats: ['远端法兰释放', '回拉贴合双壁', '近端法兰展开'] }
  };
  var PD_STATES = {
    initial: { image: 'media/two_d_surgery/eus_pd_00_pathology_v2.png', title: '主胰管病变与术前定位', note: '红色狭窄点阻断胰液排出，近端主胰管明显扩张并形成高压。' },
    pd_echoendoscope: { image: 'media/two_d_surgery/eus_pd_01_eus_localization_v2.png', title: '扩张主胰管已定位', note: '超声胃镜贴近胃后壁，只锁定扩张主胰管与安全穿刺窗。', beats: ['镜体进入胃腔', '探头贴近后壁', '声束锁定胰管'] },
    pd_needle: { image: 'media/two_d_surgery/eus_pd_02_needle_puncture_v2.png', title: '穿刺针进入主胰管', note: '细针经胃壁进入扩张主胰管，为导丝建立精确入口。', beats: ['针尖对准胰管', '经胃壁缓慢进针', '回抽确认管腔'] },
    pd_guidewire: { image: 'media/two_d_surgery/eus_pd_03_guidewire_v2.png', title: '导丝沿胰管到位', note: '亲水导丝在主胰管内安全延伸，形成稳定的器械交换轨道。', beats: ['导丝通过针腔', '沿胰管缓慢前行', '稳定位置确认'] },
    pd_dilator: { image: 'media/two_d_surgery/eus_pd_04_tract_dilation_v2.png', title: '跨壁通道已扩张', note: '扩张导管沿导丝扩大胃壁至胰管的工作通道，避免偏离原路径。', beats: ['导管套入导丝', '逐级扩张通道', '保持同轴路径'] },
    pd_stent: { image: 'media/two_d_surgery/eus_pd_05_stent_drainage_v2.png', title: '经胃胰管减压引流建立', note: '示意塑料支架连接扩张主胰管与胃腔；实际可选直形或猪尾等支架，需按胰管与入路条件决定。', beats: ['胰管端就位', '支架跨越胃壁', '胃腔端留置引流'] }
  };
  var HGS_STATES = {
    initial: { image: 'media/two_d_surgery/eus_hgs_00_pathology_v1.png', title: '肝内胆管梗阻与术前定位', note: '胆道远端梗阻使左肝内胆管明显扩张，胆汁淤积导致胆道高压与黄疸。' },
    hgs_echoendoscope: { image: 'media/two_d_surgery/eus_hgs_01_eus_localization_v1.png', title: '左肝内胆管已定位', note: '凸阵超声内镜贴近胃小弯上部，按解剖条件选择扩张的 B2 或 B3 胆管并使用多普勒避开血管。', beats: ['镜体进入胃腔', '探头贴近胃小弯', '锁定合适的 B2/B3 胆管'] },
    hgs_needle: { image: 'media/two_d_surgery/eus_hgs_02_needle_contrast_v1.png', title: '19G 穿刺与胆道造影完成', note: '细针经胃壁和肝实质通道进入所选左肝内胆管，回抽胆汁并造影确认管腔。', beats: ['针尖对准目标胆管', '经胃壁穿刺入胆管', '回抽胆汁并造影'] },
    hgs_guidewire: { image: 'media/two_d_surgery/eus_hgs_03_guidewire_v1.png', title: '导丝在肝内胆管盘曲到位', note: '亲水导丝沿左肝内胆管安全延伸，为后续扩张和支架释放建立轨道。', beats: ['导丝通过针腔', '沿胆管向肝门延伸', '安全盘曲确认'] },
    hgs_dilator: { image: 'media/two_d_surgery/eus_hgs_04_tract_dilation_v1.png', title: '肝胃跨壁通道已扩张', note: '扩张导管沿导丝准备胃壁至目标左肝内胆管的通道，具体扩张方式由所选支架系统决定。', beats: ['扩张器套入导丝', '准备肝胃通道', '维持稳定轴向'] },
    hgs_stent: { image: 'media/two_d_surgery/eus_hgs_05_stent_drainage_v1.png', title: '肝胃胆汁引流建立', note: '覆膜金属支架连接左肝内胆管与胃腔；仍需监测胆漏、出血、感染、移位或堵塞等风险。', beats: ['肝内端释放', '覆膜段跨越肝胃壁', '胃内端展开并确认引流'] }
  };
  var CDS_STATES = {
    initial: { image: 'media/two_d_surgery/eus_cds_00_pathology_v1.png', title: '胆总管远端梗阻与术前定位', note: '远端恶性狭窄阻断胆汁排出，上游胆总管显著扩张并出现胆汁淤积。' },
    cds_echoendoscope: { image: 'media/two_d_surgery/eus_cds_01_eus_localization_v1.png', title: '扩张胆总管已定位', note: '凸阵超声内镜进入十二指肠球部，锁定扩张胆总管并确认无血管穿行。', beats: ['镜体进入球部', '探头贴近肠壁', '声束锁定胆总管'] },
    cds_needle: { image: 'media/two_d_surgery/eus_cds_02_needle_contrast_v1.png', title: '19G 穿刺与胆道造影完成', note: '穿刺针经十二指肠壁进入扩张胆总管，回抽胆汁并造影确认管腔。', beats: ['针尖对准胆总管', '经球部肠壁穿刺', '回抽胆汁并造影'] },
    cds_guidewire: { image: 'media/two_d_surgery/eus_cds_03_guidewire_v1.png', title: '导丝在近端胆管盘曲到位', note: '亲水导丝沿胆总管向肝门方向安全延伸，为扩张和支架释放建立轨道。', beats: ['导丝通过针腔', '向近端胆管延伸', '安全盘曲确认'] },
    cds_dilator: { image: 'media/two_d_surgery/eus_cds_04_tract_dilation_v1.png', title: '胆总管—十二指肠通道已扩张', note: '扩张导管沿导丝扩大短程跨壁通道，同时保持稳定同轴路径。', beats: ['扩张器套入导丝', '逐级扩大跨壁通道', '维持稳定轴向'] },
    cds_stent: { image: 'media/two_d_surgery/eus_cds_05_stent_drainage_v1.png', title: '胆总管十二指肠引流建立', note: '全覆膜金属支架连接胆总管与十二指肠，淤积胆汁进入肠腔，上游胆管逐步减压。', beats: ['胆管端释放固定', '覆膜段跨越双壁', '肠腔端展开引流'] }
  };
  var PFC_STATES = {
    initial: { image: 'media/two_d_surgery/eus_pfc_00_pathology_v1.png', title: '胰腺假性囊肿与术前定位', note: '成熟液体积聚紧贴胃后壁并造成局部压迫；引流前需结合病因、症状、成熟囊壁并排除囊性肿瘤或假性动脉瘤。' },
    pfc_echoendoscope: { image: 'media/two_d_surgery/eus_pfc_01_eus_localization_v1.png', title: '囊腔与安全穿刺窗已定位', note: '超声内镜于胃内确认液体积聚、胃壁贴合关系，并以多普勒避开血管。', beats: ['镜体贴近胃后壁', '超声识别囊腔', '多普勒确认安全窗'] },
    pfc_needle: { image: 'media/two_d_surgery/eus_pfc_02_needle_puncture_v1.png', title: '19G 细针进入囊腔', note: '细针在实时超声下经胃壁进入囊腔；可回抽液体并按需要留取检测。', beats: ['针尖对准囊腔', '经胃壁缓慢进入', '回抽确认囊液'] },
    pfc_guidewire: { image: 'media/two_d_surgery/eus_pfc_03_guidewire_v1.png', title: '导丝在囊腔内盘曲到位', note: '这是导丝辅助引流分支：亲水导丝在囊腔内安全盘曲，为器械交换提供轨道。', beats: ['导丝通过针腔', '囊腔内轻柔盘曲', '确认稳定交换轨道'] },
    pfc_lams: { image: 'media/two_d_surgery/eus_pfc_04_lams_drainage_v1.png', title: '胃—囊肿引流通道建立', note: '双法兰覆膜支架使囊液向胃内引流并逐步减压；仍需根据病变性质和随访计划评估出血、感染、堵塞与移位风险。', beats: ['远端法兰在囊腔释放', '回拉贴合胃囊双壁', '近端法兰展开并开始引流'] },
    pfc_direct_lams: { image: 'media/two_d_surgery/eus_pfc_04_direct_ec_lams_v1.png', title: '直接电切增强 LAMS 引流建立', note: '一体化电切增强输送系统在实时超声下直接跨越胃壁与囊壁，不预先建立细针—导丝—扩张交换轨道；前提是成熟囊腔贴壁、足够安全窗和多普勒避血管。', beats: ['EUS 与多普勒确认安全窗', 'EC-LAMS 直接跨胃壁与囊壁', '囊腔内远端法兰释放', '回拉贴壁并展开近端法兰'] }
  };
  var PFC_BRANCHES = {
    wire: {
      label: '导丝辅助路径',
      shortLabel: '导丝辅助',
      order: ['pfc_echoendoscope', 'pfc_needle', 'pfc_guidewire', 'pfc_lams'],
      note: '细针进入囊腔后，以导丝建立器械交换轨道，再完成引流。此路径与直接电切增强路径不能混用。',
      flow: ['01 EUS / 多普勒', '02 细针入囊', '03 导丝盘曲', '04 LAMS 引流']
    },
    direct: {
      label: '直接电切增强 LAMS 路径',
      shortLabel: '直接 EC-LAMS',
      order: ['pfc_echoendoscope', 'pfc_direct_lams'],
      note: '先由 EUS 与多普勒确认成熟贴壁囊腔和安全窗；一体化 EC-LAMS 再直接跨壁。此路径不经过细针、导丝或通道交换。',
      flow: ['01 EUS / 多普勒', '02 直接跨壁', '03 远端法兰', '04 近端法兰']
    }
  };
  var RV_STATES = {
    initial: { image: 'media/two_d_surgery/eus_rv_00_pathology_v1.png', title: '困难 ERCP 的良性胆道梗阻定位', note: '示意胆总管末端结石伴上游扩张；会师术用于 ERCP 插管失败但乳头仍可到达的救援场景，需由治疗性 EUS 与 ERCP 团队实施。' },
    rv_echoendoscope: { image: 'media/two_d_surgery/eus_rv_01_eus_localization_v1.png', title: '十二指肠球部胆总管定位', note: '凸阵超声内镜在球部确认扩张胆总管、乳头方向与安全穿刺窗。', beats: ['球部贴近胆总管', '超声定位管腔', '多普勒避开血管'] },
    rv_needle: { image: 'media/two_d_surgery/eus_rv_02_needle_cholangiogram_v1.png', title: '细针入胆总管并造影确认', note: '在实时超声下经肠壁进入胆总管，胆道造影确认位置后才进入导丝步骤。', beats: ['针尖入胆管', '回抽胆汁', '造影确认腔内位置'] },
    rv_guidewire: { image: 'media/two_d_surgery/eus_rv_03_wire_rendezvous_v2.png', title: '导丝顺行越过乳头', note: '导丝由胆管顺行通过乳头进入十二指肠，这是会师术的核心；工作区的粉色轨迹专门标出这段导丝路径。若无法跨过乳头，则需重新评估替代方案。', beats: ['导丝进入胆总管', '顺行通过乳头', '在十二指肠端留出导丝'] },
    rv_duodenoscope: { image: 'media/two_d_surgery/eus_rv_04_ercp_capture_v1.png', title: '常规 ERCP 接回导丝通路', note: '撤出超声内镜后，以十二指肠镜在乳头端接回导丝并恢复逆行 ERCP 通路；后续取石、扩张或置管取决于病因。', beats: ['导丝留在乳头端', '十二指肠镜接回导丝', '进入常规 ERCP 治疗路径'] }
  };
  var AG_STATES = {
    initial: { image: 'media/two_d_surgery/eus_ag_00_pathology_v1.png', title: '胆道梗阻与顺行治疗路径定位', note: '示意远端胆道狭窄造成上游扩张；本教学分支选择经胃进入左肝内胆管，再沿胆道顺行跨越狭窄。' },
    ag_echoendoscope: { image: 'media/two_d_surgery/eus_ag_01_eus_localization_v1.png', title: '左肝内胆管与安全入路已定位', note: '凸阵超声内镜在胃内识别扩张左肝内胆管，并以多普勒评估安全穿刺窗。', beats: ['镜体贴近胃小弯', '声束锁定左肝胆管', '多普勒评估安全窗'] },
    ag_needle: { image: 'media/two_d_surgery/eus_ag_02_needle_cholangiogram_v1.png', title: '经胃入左肝内胆管并造影确认', note: '细针经胃壁与肝实质进入目标胆管；回抽胆汁、造影和路径判断是进入顺行治疗前的确认环节。', beats: ['针尖对准目标胆管', '经胃—肝实质入胆管', '造影确认胆道走行'] },
    ag_guidewire: { image: 'media/two_d_surgery/eus_ag_03_antegrade_wire_v1.png', title: '导丝顺行跨越狭窄至肠腔', note: '导丝沿胆道顺行跨过远端狭窄并进入肠腔；此处不设置 EUS-RV 的乳头端接回导丝步骤。', beats: ['导丝进入肝内胆管', '顺行跨越狭窄', '肠腔端留置导丝'] },
    ag_stent: { image: 'media/two_d_surgery/eus_ag_04_antegrade_stent_v1.png', title: '顺行跨狭窄引流建立', note: '示意支架以顺行方式跨越梗阻并向肠腔引流；是否置入、支架类型与具体策略须结合解剖、病因和团队经验确定。', beats: ['沿导丝到达狭窄段', '跨狭窄释放支架', '胆汁向肠腔恢复引流'] }
  };
  var GBD_STATES = {
    initial: { image: 'media/two_d_surgery/eus_gbd_00_pathology_v2.png', title: '结石性胆囊颈梗阻与高张力胆囊', note: '本教学病例固定为胆囊颈结石性梗阻伴壁增厚、胆汁淤积和张力升高；是否适合 EUS 引流须由高风险患者的多学科团队判断。' },
    gbd_echoendoscope: { image: 'media/two_d_surgery/eus_gbd_01_eus_localization_v2.png', title: '十二指肠球部—胆囊安全窗已定位', note: '凸阵超声内镜在十二指肠球部识别贴壁胆囊、颈部结石和邻近血管；多普勒确认安全窗后才可进入后续步骤。', beats: ['镜体稳定于十二指肠球部', '超声锁定胆囊与颈部结石', '多普勒确认无血管安全窗'] },
    gbd_needle: { image: 'media/two_d_surgery/eus_gbd_02_needle_confirm_v2.png', title: '细针经球部壁进入胆囊', note: '这是导丝辅助路径：细针在实时超声下经十二指肠球部壁进入胆囊腔，可按临床需要回抽胆汁或确认腔内位置。', beats: ['针尖对准胆囊腔', '经球部壁进入胆囊', '腔内位置确认'] },
    gbd_guidewire: { image: 'media/two_d_surgery/eus_gbd_03_guidewire_v2.png', title: '导丝在胆囊内形成稳定盘曲', note: '导丝沿细针进入胆囊腔并轻柔盘曲，为后续器械交换保留路径；本教学图不提供导丝规格或操作参数。', beats: ['导丝通过针腔', '胆囊内轻柔盘曲', '维持稳定交换轨道'] },
    gbd_lams: { image: 'media/two_d_surgery/eus_gbd_04_lams_drainage_v2.png', title: '经球部胆囊内引流通道建立', note: '导丝辅助路径中，双法兰支架连接十二指肠球部与胆囊，胆汁可流入肠腔以逐步减压；仍须监测出血、胆漏、感染、移位和堵塞。', beats: ['胆囊侧法兰释放', '回拉贴合球部与胆囊壁', '肠腔侧法兰展开并引流'] },
    gbd_direct_lams: { image: 'media/two_d_surgery/eus_gbd_04_direct_ec_lams_v2.png', title: '直接 EC-LAMS 胆囊内引流建立', note: '直接路径中，一体化电切增强输送系统在已确认的球部—胆囊安全窗直接跨壁并释放双法兰；不预先建立细针或导丝交换轨道。', beats: ['EUS / 多普勒确认贴壁安全窗', 'EC-LAMS 直接跨球部与胆囊壁', '胆囊侧法兰释放', '回拉后释放肠腔侧法兰'] }
  };
  var GBD_PATHS = {
    wire: { label: '导丝辅助路径', order: ['gbd_echoendoscope', 'gbd_needle', 'gbd_guidewire', 'gbd_lams'], note: '细针经十二指肠球部进入胆囊，再以导丝维持交换通道。它与直接 EC-LAMS 路径不能混用。', flow: ['01 EUS / 多普勒', '02 细针入胆囊', '03 胆囊内导丝', '04 LAMS 内引流'] },
    direct: { label: '直接 EC-LAMS 路径', order: ['gbd_echoendoscope', 'gbd_direct_lams'], note: '先在十二指肠球部以 EUS / 多普勒确认贴壁和安全窗；再由一体化 EC-LAMS 直接跨壁。此路径不使用细针、导丝或独立扩张。', flow: ['01 EUS / 多普勒', '02 直接跨壁', '03 胆囊侧法兰', '04 肠腔侧法兰'] }
  };
  // These are teaching recommendations, not interaction locks. A clinician can
  // jump to any frame to explain one device; mutually exclusive techniques keep
  // their branch boundary so the UI never invents a hybrid procedure.
  var GE_BRANCHES = {
    epass: { label: 'EPASS 双球囊准备', order: ['echoendoscope', 'epass', 'hotaxios', 'lams'], note: '推荐路径：先用 EUS / 多普勒定位，再以 EPASS 稳定并充盈目标肠袢，随后进行 EC-LAMS 跨壁和支架释放。导丝仅作辅助技术的单独查看，不并入本核心序列。', flow: ['01 EUS / 多普勒', '02 EPASS 双球囊', '03 EC-LAMS 跨壁', '04 LAMS 释放'] },
    filling: { label: '肠袢充盈准备', order: ['echoendoscope', 'dilation_catheter', 'hotaxios', 'lams'], note: '推荐路径：先用 EUS / 多普勒定位，再以导管充盈目标肠袢，随后进行 EC-LAMS 跨壁和支架释放。它与 EPASS 是不同准备分支。', flow: ['01 EUS / 多普勒', '02 肠袢充盈', '03 EC-LAMS 跨壁', '04 LAMS 释放'] }
  };
  var TEACHING_ORDERS = {
    eus_pd: ['pd_echoendoscope', 'pd_needle', 'pd_guidewire', 'pd_dilator', 'pd_stent'],
    eus_hgs: ['hgs_echoendoscope', 'hgs_needle', 'hgs_guidewire', 'hgs_dilator', 'hgs_stent'],
    eus_cds: ['cds_echoendoscope', 'cds_needle', 'cds_guidewire', 'cds_dilator', 'cds_stent'],
    eus_rv: ['rv_echoendoscope', 'rv_needle', 'rv_guidewire', 'rv_duodenoscope'],
    eus_ag: ['ag_echoendoscope', 'ag_needle', 'ag_guidewire', 'ag_stent'],
    ercp_eye: ['ercp_duodenoscope', 'ercp_cholangioscope', 'ercp_lithotripsy', 'ercp_basket'],
    poem: ['poem_endoscope', 'poem_injector', 'poem_knife', 'poem_clip'],
    edat: ['edat_colonoscope', 'edat_guidewire', 'edat_appendicoscope', 'edat_basket', 'edat_stent'],
    biliary_biopsy: ['bds_duodenoscope', 'bds_cholangioscope', 'bds_biopsy_forceps'],
    eus_fnb: ['fnb_echoendoscope', 'fnb_needle'],
    eus_cpn: ['cpn_echoendoscope', 'cpn_needle'],
    esd: ['esd_knife', 'esd_injector', 'esd_hemostasis', 'esd_retrieval']
  };
  // This is an ERCP teaching pathway, not an EUS-guided drainage pathway.
  // Every tool response uses a dedicated instrument-in-anatomy raster frame.
  var ERCP_EYE_STATES = {
    initial: { image: 'media/two_d_surgery/ercp_eye_00_stone_obstruction_v1.png', title: '困难胆总管结石与术前定位', note: '教学病例为下段胆总管嵌顿性结石伴上游扩张。是否需要 ERCP、直视胆道镜或碎石取决于结石、胆道解剖、感染风险和团队判断。' },
    ercp_duodenoscope: { image: 'media/two_d_surgery/ercp_eye_01_papilla_cannulation_v1.png', title: '经乳头进入胆总管', note: '十二指肠镜抵达大乳头后建立逆行胆道通路；本图只示意进入路径，不提供插管次数、导丝规格或切开参数。', beats: ['十二指肠镜抵达乳头', '导管进入胆总管', '结石仍完整存在'] },
    ercp_cholangioscope: { image: 'media/two_d_surgery/ercp_eye_02_cholangioscopy_v1.png', title: '直视子镜抵达结石前方', note: '直视胆道镜经既有 ERCP 通路进入胆总管，示意在结石前方观察；其作用是辅助观察与靶向处理，不替代完整胆道评估。', beats: ['子镜经乳头进入胆管', '直视定位结石', '评估碎石与取石路径'] },
    ercp_lithotripsy: { image: 'media/two_d_surgery/ercp_eye_03_lithotripsy_v1.png', title: '碎石纤维接触结石', note: '示意碎石纤维在直视辅助下接触结石并产生局部碎裂。具体碎石能量、次数、方式和停止条件必须由术者按设备与病情决定。', beats: ['碎石纤维抵达结石', '局部接触碎裂', '避免将能量作用于胆管壁'] },
    ercp_basket: { image: 'media/two_d_surgery/ercp_eye_04_basket_retrieval_v1.png', title: '网篮回收结石碎块', note: '碎裂后的结石可用网篮或其他取石器械处理；是否已取净、是否需要分期或额外引流不能仅凭此教学图判断。', beats: ['网篮展开包绕碎块', '碎块回收', '仍需评估残余结石'] }
  };
  // POEM is deliberately a localized esophagus–cardia view, rather than a
  // recycled biliary or EUS scene. Each response is a dedicated raster frame.
  var POEM_STATES = {
    initial: { image: 'media/two_d_surgery/poem_00_achalasia_v1.png', title: '贲门失弛缓症与术前定位', note: '教学图示意食管胃交界紧缩、食管腔内潴留和功能性排空受阻。诊断、分型与是否选择 POEM 须由专科团队结合完整评估决定。' },
    poem_endoscope: { image: 'media/two_d_surgery/poem_01_endoscope_position_v1.png', title: '内镜抵达下段食管并定位', note: '胃镜在下段食管观察黏膜与食管胃交界，为后续操作选择入路；本图不提供距门齿距离或其他个体化参数。', beats: ['镜体进入下段食管', '确认紧缩交界', '评估黏膜与入路'] },
    poem_injector: { image: 'media/two_d_surgery/poem_02_submucosal_lift_v1.png', title: '黏膜下注射形成局部垫层', note: '注射针在食管胃交界上方建立局部垫层，示意将黏膜与肌层分开；注射液配方、位置与用量均由术者按实际情况决定。', beats: ['针尖接触黏膜', '形成局部垫层', '准备黏膜入口'] },
    poem_knife: { image: 'media/two_d_surgery/poem_03_tunnel_myotomy_v1.png', title: '隧道内肌切开作用于紧缩肌层', note: '内镜刀经黏膜下隧道在直视下处理食管胃交界的肌层。教学卡将“隧道建立—肌切开”作为同类内镜刀的连续作用阶段，不表示每例必须更换器械。', beats: ['进入黏膜下隧道', '抵达紧缩肌层', '局部肌切开后交界开放'] },
    poem_clip: { image: 'media/two_d_surgery/poem_04_entry_closure_v1.png', title: '黏膜入口夹闭完成', note: '夹闭器关闭黏膜入口；交界较术前开放是即时解剖示意，不等于症状、反流风险或长期结局已获得保证。', beats: ['确认黏膜入口', '逐枚夹闭入口', '观察即时闭合状态'] }
  };
  // Diagnostic pathway only: targeted sampling is deliberately not depicted as
  // treating the stricture or establishing a malignant diagnosis.
  var BILIARY_BIOPSY_STATES = {
    initial: { image: 'media/two_d_surgery/biliary_biopsy_00_stricture_v1.png', title: '不明原因胆道狭窄与术前评估', note: '教学图示意短段不规则胆道狭窄。直视形态只能补充判断，病变性质仍需结合影像、引流情况、病理与多学科评估，不能凭本图预设诊断。' },
    bds_duodenoscope: { image: 'media/two_d_surgery/biliary_biopsy_01_ercp_access_v1.png', title: '经乳头建立 ERCP 胆道入路', note: '治疗性十二指肠镜抵达乳头并建立逆行胆道通路，为直视胆道镜评估创造路径；本图不表示每一例狭窄均应采用该方式。', beats: ['抵达十二指肠大乳头', '建立胆道入路', '狭窄仍待进一步判断'] },
    bds_cholangioscope: { image: 'media/two_d_surgery/biliary_biopsy_02_direct_visualization_v1.png', title: '直视胆道镜抵达狭窄段观察', note: '直视胆道镜经既有通路接近狭窄段，用于观察病变形态并选择可疑部位；直视印象并不等同于最终病理诊断。', beats: ['子镜进入胆道', '直视观察不规则狭窄', '确定靶向取样区域'] },
    bds_biopsy_forceps: { image: 'media/two_d_surgery/biliary_biopsy_03_targeted_forceps_v1.png', title: '微型活检钳靶向接触狭窄段取样', note: '微型钳在直视辅助下于狭窄可疑部位获取组织。取样敏感性、样本量、病理处理与是否需要补充检查均须按临床流程决定。', beats: ['微型钳经子镜通道到达', '接触可疑狭窄段', '取得组织送检'] }
  };
  // EDAT is represented as a selected, uncomplicated appendicitis teaching
  // pathway. The endpoint is immediate drainage support, never a cure claim.
  var EDAT_STATES = {
    initial: { image: 'media/two_d_surgery/edat_00_appendicolith_v1.png', title: '阑尾腔梗阻与术前定位', note: '教学图示意未穿孔的阑尾腔内粪石、局部黏膜水肿与潴留液体。是否适合内镜腔内诊疗需由专科团队结合病情、影像、感染控制与手术备选方案判断。' },
    edat_colonoscope: { image: 'media/two_d_surgery/edat_01_colonoscope_orifice_v1.png', title: '结肠镜抵达阑尾开口', note: '结肠镜在盲肠内识别阑尾开口并建立进入方向。教学图不提供插入深度、冲洗量或患者选择标准。', beats: ['抵达盲肠', '识别阑尾开口', '确认腔内进入方向'] },
    edat_guidewire: { image: 'media/two_d_surgery/edat_02_guidewire_v1.png', title: '斑马导丝引导进入阑尾腔', note: '导丝在直视下经阑尾开口沿腔内路径前行，为后续子镜进入建立导向。实际是否可通过、何时停止或改行手术须由术者判断。', beats: ['导丝通过阑尾开口', '沿腔内轻柔前行', '保留子镜进入方向'] },
    edat_appendicoscope: { image: 'media/two_d_surgery/edat_03_appendicoscope_v1.png', title: '9F 阑尾子镜进入腔内直视评估', note: '细径子镜沿导丝进入阑尾腔，在直视下观察腔内粪石、黏膜和潴留液体。图示为教学过程，不代表对所有急性阑尾炎的标准替代治疗。', beats: ['子镜沿导丝前进', '直视观察腔内状态', '规划结石处理与引流'] },
    edat_basket: { image: 'media/two_d_surgery/edat_04_basket_retrieval_v1.png', title: '网篮包绕并回收阑尾腔粪石', note: '网篮在直视下包绕粪石并向盲肠侧回收；是否能完整取出、是否适合继续腔内处理或改行其他方案均须结合实时情况决定。', beats: ['网篮抵达粪石', '包绕并固定粪石', '向盲肠侧回收'] },
    edat_stent: { image: 'media/two_d_surgery/edat_05_drainage_stent_v1.png', title: '按需留置塑料支架维持即时引流', note: '这是需要引流支持时的教学分支：示意塑料支架跨越阑尾开口维持腔内引流。并非每个 EDAT 病例都必然留置支架；组织炎症仍在，仍需抗感染、症状观察、复发风险评估及由团队决定的后续管理。', beats: ['如需引流支持，支架进入阑尾开口', '双端位置留置', '维持即时引流支持'] }
  };
  var FNB_STATES = {
    initial: { image: 'media/two_d_surgery/eus_fnb_00_mass_v1.png', title: '胰腺实性占位与术前评估', note: '示意胰腺体部实性占位；影像本身不能替代病理诊断，是否取样及取样方式需结合临床风险和诊断目标判断。' },
    fnb_echoendoscope: { image: 'media/two_d_surgery/eus_fnb_01_eus_localization_v1.png', title: '病灶、胃壁与邻近血管已定位', note: '凸阵超声内镜贴近胃后壁，识别胰腺占位、胃壁距离与邻近血管走行，为取样规划安全针道。', beats: ['镜体贴近胃后壁', '声束锁定胰腺占位', '评估进针路径'] },
    fnb_needle: { image: 'media/two_d_surgery/eus_fnb_02_fnb_sampling_v1.png', title: 'FNB 针进入病灶获取组织', note: '示意 FNB 针在实时超声下进入病灶并取得组织条；实际穿刺次数、针型、抽吸与是否采用 ROSE 需由术者决定。', beats: ['针尖对准病灶中心', '实时超声下进针', '取得组织条样本'] },
    fnb_specimen: { image: 'media/two_d_surgery/eus_fnb_03_specimen_v1.png', title: '组织样本已送检，病灶仍在', note: '取样本身不治疗或切除病灶；标本固定、病理处理和后续诊疗决策取决于最终病理及完整临床资料。', beats: ['撤针保留组织样本', '标本固定并送病理', '等待病理指导下一步'] }
  };
  var CPN_STATES = {
    initial: { image: 'media/two_d_surgery/eus_cpn_00_pain_v1.png', title: '胰腺肿瘤相关疼痛与术前定位', note: '示意胰腺占位相关内脏痛信号经腹腔神经丛传递；CPN 是疼痛姑息手段，不消除肿瘤或替代肿瘤治疗。' },
    cpn_echoendoscope: { image: 'media/two_d_surgery/eus_cpn_01_localization_v1.png', title: '腹腔干与腹腔神经丛靶区已定位', note: '凸阵超声内镜在胃内识别腹主动脉、腹腔干起始部、神经丛靶区与邻近血管，为注射规划安全路径。', beats: ['胃后壁贴近探查', '识别腹主动脉与腹腔干', '评估邻近血管与安全路径'] },
    cpn_needle: { image: 'media/two_d_surgery/eus_cpn_02_neurolysis_v1.png', title: '腹腔神经丛靶区注射完成', note: '示意针尖在实时超声下位于腹腔神经丛靶区，并出现局部注射扩散；疼痛缓解程度与持续时间存在个体差异，肿瘤仍在。', beats: ['针尖到达神经丛靶区', '确认避开血管', '局部注射扩散', '观察疼痛信号减弱'] }
  };
  // ESD deliberately follows the same focused-2D contract as the existing
  // procedures: one target zone and one independent visual response per tool.
  var ESD_STATES = {
    initial: { image: 'media/two_d_surgery/esd_00_gastric_section_v2.png', title: '胃黏膜表浅病灶与术前定位', note: '红色区域为教学病灶。点击点位后，将右侧器械拖到病灶区观察局部反馈。' },
    esd_knife: { image: 'media/two_d_surgery/esd_02_knife_contact_v3.png', title: 'ESD 电刀在病灶边界操作', note: '器械帧示意刀尖接触病灶边缘；具体电刀设置由术者决定。', beats: ['刀尖接触病灶边缘', '局部边界操作', '保留深层肌层示意'] },
    esd_injector: { image: 'media/two_d_surgery/esd_03_injector_contact_v3.png', title: '黏膜下注射形成局部液垫', note: '器械帧示意针尖接触病灶下方并形成局部液垫；药液选择与剂量由术者决定。', beats: ['针尖接触病灶下方', '局部液垫形成', '病灶与深层分离示意'] },
    esd_hemostasis: { image: 'media/two_d_surgery/esd_04_hemostasis_contact_v3.png', title: '剥离床可见血管处理示意', note: '器械帧示意止血钳头接触剥离床血管；即时创面不代表已经愈合或达到治愈标准。', beats: ['识别剥离床血管', '钳头局部接触', '观察即时创面'] },
    esd_retrieval: { image: 'media/two_d_surgery/esd_05_retrieval_contact_v3.png', title: '标本回收与病理送检', note: '器械帧示意回收网承接游离标本；病理结果与随访决定后续判断，创面并未显示为愈合。', beats: ['回收网接触标本', '完整标本取出', '固定并送病理'] }
  };
  var TOOL_LABELS = {
    echoendoscope: '超声胃镜定位',
    dilation_catheter: '肠段充盈',
    epass: '双球囊固定',
    hotaxios: 'Hot AXIOS 电切穿刺',
    guidewire: '导丝跨壁',
    lams: 'LAMS 支架释放',
    pd_echoendoscope: 'EUS 胰管定位', pd_needle: '19G 胰管穿刺',
    pd_guidewire: '胰管导丝置入', pd_dilator: '跨壁通道扩张', pd_stent: '塑料支架引流（示例）',
    hgs_echoendoscope: 'EUS 肝内胆管定位', hgs_needle: '19G 穿刺与胆道造影',
    hgs_guidewire: '肝内胆管导丝置入', hgs_dilator: '肝胃通道扩张', hgs_stent: '半覆膜支架引流',
    cds_echoendoscope: 'EUS 胆总管定位', cds_needle: '19G 胆总管穿刺造影',
    cds_guidewire: '胆总管导丝置入', cds_dilator: '胆肠通道扩张', cds_stent: '全覆膜支架引流',
    pfc_echoendoscope: 'EUS 囊腔定位', pfc_needle: '19G 囊腔穿刺',
    pfc_guidewire: '囊腔导丝置入', pfc_lams: '导丝辅助 LAMS 引流', pfc_direct_lams: '直接电切增强 LAMS 引流',
    rv_echoendoscope: 'EUS 胆总管定位', rv_needle: '19G 胆总管穿刺造影', rv_guidewire: '导丝顺行越乳头', rv_duodenoscope: 'ERCP 接回导丝',
    ag_echoendoscope: 'EUS 左肝内胆管定位', ag_needle: '19G 左肝内胆管穿刺造影', ag_guidewire: '导丝顺行跨狭窄', ag_stent: '顺行跨狭窄支架释放',
    gbd_echoendoscope: 'EUS 胆囊定位', gbd_needle: '胆囊穿刺确认', gbd_guidewire: '胆囊内导丝置入', gbd_lams: '导丝辅助胆囊 LAMS 引流', gbd_direct_lams: '直接 EC-LAMS 胆囊引流',
    ercp_duodenoscope: 'ERCP 经乳头进入胆总管', ercp_cholangioscope: '直视胆道镜抵达结石',
    ercp_lithotripsy: '直视碎石纤维接触结石', ercp_basket: '网篮回收结石碎块',
    poem_endoscope: '胃镜下段食管定位', poem_injector: '黏膜下注射形成垫层',
    poem_knife: '隧道内肌切开', poem_clip: '夹闭黏膜入口',
    bds_duodenoscope: 'ERCP 经乳头建立胆道入路', bds_cholangioscope: '直视胆道镜观察狭窄', bds_biopsy_forceps: '微型钳靶向组织取样',
    edat_colonoscope: '结肠镜定位阑尾开口', edat_guidewire: '斑马导丝进入阑尾腔', edat_appendicoscope: '9F 阑尾子镜直视评估', edat_basket: '网篮回收阑尾腔粪石', edat_stent: '塑料支架维持即时引流',
    fnb_echoendoscope: 'EUS 胰腺占位定位', fnb_needle: 'FNB 针组织获取',
    cpn_echoendoscope: 'EUS 腹腔神经丛定位', cpn_needle: '22G 神经丛靶区注射',
    esd_knife: 'ESD 电刀局部操作', esd_injector: '黏膜下注射隆起', esd_hemostasis: '剥离床可见血管处理', esd_retrieval: '完整标本回收'
  };
  var TOOL_EFFECTS = {
    echoendoscope: 'eus', dilation_catheter: 'fluid', epass: 'balloon',
    hotaxios: 'incision', guidewire: 'wire', lams: 'stent',
    pd_echoendoscope: 'eus', pd_needle: 'needle', pd_guidewire: 'wire',
    pd_dilator: 'dilator', pd_stent: 'pd-stent',
    hgs_echoendoscope: 'hgs-eus', hgs_needle: 'hgs-needle', hgs_guidewire: 'hgs-wire',
    hgs_dilator: 'hgs-dilator', hgs_stent: 'hgs-stent',
    cds_echoendoscope: 'cds-eus', cds_needle: 'cds-needle', cds_guidewire: 'cds-wire',
    cds_dilator: 'cds-dilator', cds_stent: 'cds-stent',
    pfc_echoendoscope: 'pfc-eus', pfc_needle: 'pfc-needle', pfc_guidewire: 'pfc-wire', pfc_lams: 'pfc-lams', pfc_direct_lams: 'pfc-lams',
    rv_echoendoscope: 'cds-eus', rv_needle: 'cds-needle', rv_guidewire: 'rv-wire', rv_duodenoscope: 'rv-catch',
    ag_echoendoscope: 'hgs-eus', ag_needle: 'hgs-needle', ag_guidewire: 'ag-wire', ag_stent: 'ag-stent',
    gbd_echoendoscope: 'pfc-eus', gbd_needle: 'pfc-needle', gbd_guidewire: 'pfc-wire', gbd_lams: 'gbd-lams', gbd_direct_lams: 'gbd-lams',
    ercp_duodenoscope: 'ercp-scope', ercp_cholangioscope: 'ercp-visual', ercp_lithotripsy: 'ercp-litho', ercp_basket: 'ercp-basket',
    poem_endoscope: 'poem-scope', poem_injector: 'poem-injector', poem_knife: 'poem-knife', poem_clip: 'poem-clip',
    bds_duodenoscope: 'bds-access', bds_cholangioscope: 'bds-visual', bds_biopsy_forceps: 'bds-forceps',
    edat_colonoscope: 'edat-scope', edat_guidewire: 'edat-wire', edat_appendicoscope: 'edat-direct-view', edat_basket: 'edat-basket', edat_stent: 'edat-stent',
    fnb_echoendoscope: 'fnb-eus', fnb_needle: 'fnb-needle',
    cpn_echoendoscope: 'cpn-eus', cpn_needle: 'cpn-needle',
    esd_knife: 'esd-knife', esd_injector: 'esd-injector', esd_hemostasis: 'esd-hemostasis', esd_retrieval: 'esd-retrieval'
  };
  var CARD_IDS = {
    hotaxios: 'card-inst-hotaxios', echoendoscope: 'card-inst-echoendoscope',
    lams: 'card-inst-lams', guidewire: 'card-inst-guidewire',
    dilation_catheter: 'card-inst-dilation', epass: 'card-inst-epass'
  };
  var PD_TOOL_CARDS = [
    { key: 'pd_echoendoscope', icon: '📡', color: '#0284c7', name: '凸阵超声内镜', tag: '凸阵声束定位胰管', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '胃后壁探查', '多普勒避血管'] },
    { key: 'pd_needle', icon: '💉', color: '#7c3aed', name: '19G EUS 穿刺针', tag: '细针建立胰管入口', image: 'media/official_photos/eus_pd_19g_needle_v1.png', source: 'AI 医学示意图', specs: ['19G EUS 穿刺', '针尖超声显影', '导丝交换通道'] },
    { key: 'pd_guidewire', icon: '🌀', color: '#d97706', name: '0.025\'\' 亲水导丝', tag: 'J 型软头防穿孔', image: 'media/official_photos/03_zebra_guidewire_full.jpg', specs: ['0.025\'\' 亲水涂层', '胰管内走行', '器械交换轨道'] },
    { key: 'pd_dilator', icon: '🔹', color: '#0891b2', name: '跨壁通道扩张导管', tag: '沿导丝同轴扩张', image: 'media/official_photos/05_contrast_catheter_macro.jpg', specs: ['逐级扩张', '同轴推进', '保持原穿刺路径'] },
    { key: 'pd_stent', icon: '〰', color: '#db2777', name: '塑料胰管引流支架', tag: '图示为双猪尾类型', image: 'media/official_photos/eus_pd_double_pigtail_stent_v1.png', source: 'AI 医学示意图', specs: ['经胃胰管引流', '实际型号因病例而异', '用于持续减压'] }
  ];
  var HGS_TOOL_CARDS = [
    { key: 'hgs_echoendoscope', icon: '📡', color: '#2f855a', name: '凸阵超声内镜', tag: '经胃定位左肝 B2/B3', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '胃小弯探查', '多普勒避血管'] },
    { key: 'hgs_needle', icon: '💉', color: '#8b5a2b', name: '19G EUS 穿刺针', tag: '穿刺并完成胆道造影', image: 'media/official_photos/eus_pd_19g_needle_v1.png', source: 'AI 医学示意图', specs: ['19G EUS 穿刺', '回抽胆汁确认', '造影与导丝通道'] },
    { key: 'hgs_guidewire', icon: '🌀', color: '#b7791f', name: '0.025\'\' 亲水导丝', tag: '肝内胆管安全盘曲', image: 'media/official_photos/03_zebra_guidewire_full.jpg', specs: ['J 型软头', '胆管内走行', '器械交换轨道'] },
    { key: 'hgs_dilator', icon: '🔹', color: '#4c7a70', name: '肝胃通道扩张导管', tag: '沿导丝同轴扩张', image: 'media/official_photos/05_contrast_catheter_macro.jpg', specs: ['逐级扩张', '短程肝胃通道', '保持原穿刺路径'] },
    { key: 'hgs_stent', icon: '🔗', color: '#a16207', name: 'HGS 覆膜胆道引流支架', tag: '部分覆膜类型示意', image: 'media/official_photos/eus_hgs_partially_covered_stent_v1.png', source: 'AI 医学示意图', specs: ['B2/B3—胃内引流', '覆膜降低胆漏风险', '不能完全排除移位或堵塞'] }
  ];
  var CDS_TOOL_CARDS = [
    { key: 'cds_echoendoscope', icon: '📡', color: '#c26b32', name: '凸阵超声内镜', tag: '球部锁定扩张胆总管', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '十二指肠球部探查', '多普勒避血管'] },
    { key: 'cds_needle', icon: '💉', color: '#9b5b32', name: '19G EUS 穿刺针', tag: '穿刺并完成胆道造影', image: 'media/official_photos/eus_pd_19g_needle_v1.png', source: 'AI 医学示意图', specs: ['19G EUS 穿刺', '回抽胆汁确认', '造影与导丝通道'] },
    { key: 'cds_guidewire', icon: '🌀', color: '#b88724', name: '0.025\'\' 亲水导丝', tag: '近端胆管安全盘曲', image: 'media/official_photos/03_zebra_guidewire_full.jpg', specs: ['J 型软头', '胆管内走行', '器械交换轨道'] },
    { key: 'cds_dilator', icon: '🔹', color: '#6f8c72', name: '胆总管十二指肠扩张导管', tag: '沿导丝同轴扩张', image: 'media/official_photos/05_contrast_catheter_macro.jpg', specs: ['逐级扩张', '短程胆肠通道', '保持原穿刺路径'] },
    { key: 'cds_stent', icon: '🔗', color: '#b56a18', name: 'CDS 覆膜支架 / LAMS', tag: '支架类型按解剖选择', image: 'media/official_photos/eus_cds_fully_covered_stent_v1.png', source: 'AI 医学示意图', specs: ['胆总管—十二指肠', '覆膜降低胆漏风险', '仍需监测移位与堵塞'] }
  ];
  var PFC_TOOL_CARDS = [
    { key: 'pfc_echoendoscope', icon: '📡', color: '#087f8c', name: '凸阵超声内镜', tag: '定位囊腔并多普勒避血管', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '胃后壁探查', '多普勒避血管'] },
    { key: 'pfc_needle', icon: '💉', color: '#a85c35', name: '19G EUS 穿刺针', tag: '进入囊腔并回抽确认', image: 'media/official_photos/eus_pd_19g_needle_v1.png', source: 'AI 医学示意图', specs: ['19G EUS 穿刺', '囊液回抽确认', '导丝交换通道'] },
    { key: 'pfc_guidewire', icon: '🌀', color: '#b7791f', name: '0.025\'\' 亲水导丝', tag: '导丝辅助分支：囊腔内盘曲', image: 'media/official_photos/03_zebra_guidewire_full.jpg', source: '器械照片参考', specs: ['0.025\'\' 亲水涂层', '囊腔内轻柔盘曲', '器械交换轨道'] },
    { key: 'pfc_lams', icon: '🔗', color: '#c2410c', name: '覆膜 LAMS 引流支架', tag: '建立胃—囊肿引流通道', image: 'media/official_photos/04_lams_stent_macro_side.jpg', source: '器械参考图', specs: ['尺寸与系统适配由团队决定', '双法兰组织对合', '仍需监测出血、移位、堵塞'] }
  ];
  var RV_TOOL_CARDS = [
    { key: 'rv_echoendoscope', icon: '📡', color: '#2563a8', name: '凸阵超声内镜', tag: '球部定位扩张胆总管', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '多普勒避血管', '会师术第一阶段'] },
    { key: 'rv_needle', icon: '💉', color: '#9b5b32', name: '19G EUS 穿刺针', tag: '胆总管穿刺与造影', image: 'media/official_photos/eus_pd_19g_needle_v1.png', source: 'AI 医学示意图', specs: ['19G 穿刺', '回抽胆汁', '导丝交换通道'] },
    { key: 'rv_guidewire', icon: '🌀', color: '#b7791f', name: '0.025\'\' 亲水导丝', tag: '顺行越过乳头', image: 'media/official_photos/03_zebra_guidewire_full.jpg', source: '器械照片参考', specs: ['顺行通过乳头', '十二指肠端留线', '会师关键步骤'] },
    { key: 'rv_duodenoscope', icon: '🔁', color: '#4f6b91', name: '十二指肠镜 / ERCP 导管', tag: '乳头端接回导丝', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['接回已留置导丝', '恢复逆行通路', '后续治疗按病因决定'] }
  ];
  var AG_TOOL_CARDS = [
    { key: 'ag_echoendoscope', icon: '📡', color: '#287c76', name: '凸阵超声内镜', tag: '经胃定位左肝内胆管', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '胃小弯探查', '多普勒评估安全窗'] },
    { key: 'ag_needle', icon: '💉', color: '#8b5a2b', name: '19G EUS 穿刺针', tag: '左肝内胆管穿刺与造影', image: 'media/official_photos/eus_pd_19g_needle_v1.png', source: 'AI 医学示意图', specs: ['19G EUS 穿刺', '回抽胆汁确认', '造影与导丝通道'] },
    { key: 'ag_guidewire', icon: '🌀', color: '#b7791f', name: '0.025\'\' 亲水导丝', tag: '顺行跨越胆道狭窄', image: 'media/official_photos/03_zebra_guidewire_full.jpg', source: '器械照片参考', specs: ['顺行通过狭窄', '肠腔端留线', '不执行乳头端接回'] },
    { key: 'ag_stent', icon: '🔗', color: '#a16207', name: '顺行胆道支架系统', tag: '跨狭窄恢复胆汁外流', image: 'media/official_photos/eus_cds_fully_covered_stent_v1.png', source: 'AI 医学示意图', specs: ['跨狭窄顺行引流', '具体类型按解剖选择', '临床方案须专家确认'] }
  ];
  var GBD_TOOL_CARDS = [
    { key: 'gbd_echoendoscope', icon: '📡', color: '#16756f', name: '凸阵超声内镜', tag: '球部定位胆囊与安全窗', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '十二指肠球部探查', '多普勒避血管'] },
    { key: 'gbd_needle', icon: '💉', color: '#9b6637', name: 'EUS 细针', tag: '导丝路径：进入胆囊确认', image: 'media/official_photos/eus_pd_19g_needle_v1.png', source: 'AI 医学示意图', specs: ['实时 EUS 下穿刺', '腔内位置确认', '导丝交换通道'] },
    { key: 'gbd_guidewire', icon: '🌀', color: '#b68a22', name: '亲水导丝', tag: '导丝路径：胆囊内盘曲', image: 'media/official_photos/03_zebra_guidewire_full.jpg', source: '器械照片参考', specs: ['胆囊内轻柔盘曲', '维持交换轨道', '仅导丝辅助路径使用'] },
    { key: 'gbd_lams', icon: '🔗', color: '#16756f', name: '覆膜 LAMS 胆囊引流支架', tag: '球部—胆囊内引流通道', image: 'media/official_photos/04_lams_stent_macro_side.jpg', source: '器械参考图', specs: ['双法兰组织对合', '内引流以逐步减压', '风险需持续监测'] }
  ];
  var ERCP_EYE_TOOL_CARDS = [
    { key: 'ercp_duodenoscope', icon: '↪', color: '#355c7d', name: '治疗性十二指肠镜 / ERCP 导管', tag: '经乳头建立逆行胆道通路', image: 'media/official_photos/ercp_duodenoscope_teaching_v1.png', source: 'AI 器械形态示意', specs: ['抵达十二指肠大乳头', '进入胆总管', '不提供插管参数'] },
    { key: 'ercp_cholangioscope', icon: '◉', color: '#407b8c', name: '直视胆道镜（eyeMAX 类）', tag: '在结石前方直视定位', image: 'media/official_photos/ercp_direct_cholangioscope_teaching_v1.png', source: 'AI 器械形态示意', specs: ['经 ERCP 通路进入', '辅助直视观察', '不是所有结石必需'] },
    { key: 'ercp_lithotripsy', icon: '✦', color: '#9a6a27', name: '直视碎石纤维', tag: '靶向接触结石并局部碎裂', image: 'media/official_photos/ercp_lithotripsy_fiber_teaching_v1.png', source: 'AI 器械形态示意', specs: ['仅示意碎石原理', '参数由术者决定', '避免作用于胆管壁'] },
    { key: 'ercp_basket', icon: '⌘', color: '#5f6673', name: '取石网篮', tag: '包绕并回收结石碎块', image: 'media/official_photos/ercp_stone_basket_teaching_v1.png', source: 'AI 器械形态示意', specs: ['回收已碎裂结石', '仍须评估残石', '可按情境分期处理'] }
  ];
  var POEM_TOOL_CARDS = [
    { key: 'poem_endoscope', icon: '🔭', color: '#48647b', name: '治疗性胃镜', tag: '抵达下段食管并直视定位', image: 'media/official_photos/poem_gastroscope_teaching_v1.png', source: 'AI 器械形态示意', specs: ['经口进入食管', '直视评估交界', '提供工作通道'] },
    { key: 'poem_injector', icon: '💧', color: '#397b9b', name: '内镜黏膜下注射针', tag: '形成局部黏膜下垫层', image: 'media/official_photos/poem_injection_needle_teaching_v1.png', source: 'AI 器械形态示意', specs: ['建立局部垫层', '准备黏膜入口', '配方与用量由术者决定'] },
    { key: 'poem_knife', icon: '〰', color: '#8a5f48', name: '隧道与肌切开内镜刀', tag: '在隧道内处理紧缩肌层', image: 'media/official_photos/poem_knife_teaching_v1.png', source: 'AI 器械形态示意', specs: ['黏膜下隧道操作', '食管胃交界肌切开', '不提供固定能量参数'] },
    { key: 'poem_clip', icon: '⊂', color: '#68727b', name: '内镜夹闭器', tag: '关闭黏膜入口', image: 'media/official_photos/poem_clip_teaching_v1.png', source: 'AI 器械形态示意', specs: ['逐枚夹闭入口', '确认即时闭合', '并非长期疗效结论'] }
  ];
  var BILIARY_BIOPSY_TOOL_CARDS = [
    { key: 'bds_duodenoscope', icon: '↪', color: '#566f89', name: '治疗性十二指肠镜 / ERCP 导管', tag: '经乳头建立胆道入路', image: 'media/official_photos/biliary_biopsy_duodenoscope_teaching_v1.png', source: 'AI 器械形态示意', specs: ['抵达十二指肠大乳头', '建立逆行胆道通路', '不提供插管参数'] },
    { key: 'bds_cholangioscope', icon: '◉', color: '#4c8d89', name: '直视胆道镜', tag: '抵达狭窄段观察形态', image: 'media/official_photos/biliary_biopsy_cholangioscope_teaching_v1.png', source: 'AI 器械形态示意', specs: ['经既有 ERCP 通路进入', '辅助直视观察', '不替代病理诊断'] },
    { key: 'bds_biopsy_forceps', icon: '⌑', color: '#8d5a56', name: '胆道微型活检钳', tag: '靶向接触狭窄段取样', image: 'media/official_photos/biliary_biopsy_forceps_teaching_v1.png', source: 'AI 器械形态示意', specs: ['直视辅助靶向取样', '标本送病理评估', '取样不等于治疗狭窄'] }
  ];
  var EDAT_TOOL_CARDS = [
    { key: 'edat_colonoscope', icon: '↪', color: '#455f78', name: '治疗性结肠镜', tag: '在盲肠定位阑尾开口', image: 'media/official_photos/edat_colonoscope_teaching_v1.png', source: 'AI 器械形态示意', specs: ['抵达盲肠', '识别阑尾开口', '提供工作通道'] },
    { key: 'edat_guidewire', icon: '〰', color: '#a87926', name: '斑马导丝', tag: '引导进入阑尾腔', image: 'media/official_photos/edat_zebra_guidewire_teaching_v1.png', source: 'AI 器械形态示意', specs: ['软头导向', '建立子镜进入路径', '不提供规格参数'] },
    { key: 'edat_appendicoscope', icon: '◉', color: '#70818b', name: '9F 阑尾子镜', tag: '沿导丝进入腔内直视评估', image: 'media/official_photos/edat_appendicoscope_teaching_v1.png', source: 'AI 器械形态示意', specs: ['细径腔内直视', '评估粪石与黏膜', '适应证需团队判断'] },
    { key: 'edat_basket', icon: '⌘', color: '#806a5d', name: '洞察取石网篮', tag: '包绕并回收腔内粪石', image: 'media/official_photos/edat_retrieval_basket_teaching_v1.png', source: 'AI 器械形态示意', specs: ['直视下包绕粪石', '回收至盲肠侧', '并非每例都可取净'] },
    { key: 'edat_stent', icon: '∽', color: '#86999b', name: '双猪尾塑料支架（按需）', tag: '需要时维持阑尾腔即时引流支持', image: 'media/official_photos/edat_plastic_pigtail_stent_teaching_v1.png', source: 'AI 器械形态示意', specs: ['是否留置需按腔内情况判断', '维持即时引流支持', '不代表已治愈'] }
  ];
  var FNB_TOOL_CARDS = [
    { key: 'fnb_echoendoscope', icon: '📡', color: '#2b6f9c', name: '凸阵超声内镜', tag: '定位病灶与安全针道', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '病灶与血管评估', '实时超声引导'] },
    { key: 'fnb_needle', icon: '🧫', color: '#8b4f79', name: '22G 端切型 EUS-FNB 针', tag: 'Franseen / fork-tip 类针尖示意', image: 'media/official_photos/eus_fnb_22g_endcutting_needle_v1.png', source: 'AI 器械形态示意', specs: ['22G 为本教学模型默认', '组织条取样', '实时超声下进针'] }
  ];
  var CPN_TOOL_CARDS = [
    { key: 'cpn_echoendoscope', icon: '📡', color: '#a5543c', name: '凸阵超声内镜', tag: '定位腹腔干与神经丛靶区', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['经胃后壁探查', '识别腹腔干起始部', '评估邻近血管'] },
    { key: 'cpn_needle', icon: '💉', color: '#b86a23', name: '22G EUS 注射针', tag: '腹腔神经丛靶区注射示意', image: 'media/official_photos/eus_cpn_22g_injection_needle_v1.png', source: 'AI 器械形态示意', specs: ['22G 为本教学模型默认', '实时超声下进针', '药液与剂量由术者决定'] }
  ];
  var GE_TOOL_CARDS = [
    { key: 'echoendoscope', icon: '📡', color: '#0284c7', name: '治疗型凸阵超声内镜', tag: '凸阵声束与多普勒定位', image: 'media/official_photos/02_eus_scope_angle1_full.jpg', source: '器械照片参考', specs: ['治疗性 EUS', '工作通道与器械兼容', '多普勒辅助避开血管'] },
    { key: 'dilation_catheter', icon: '💧', color: '#0891b2', name: '刻度造影冲洗导管', tag: '肠袢充盈辅助分支', image: 'media/official_photos/05_contrast_catheter_macro.jpg', source: '器械照片参考', specs: ['肠袢充盈辅助分支', '与 EPASS 为不同准备方式'] },
    { key: 'epass', icon: '🎈', color: '#e11d48', name: 'EPASS 鼻空肠双气囊导管', tag: '隔绝充盈靶区', image: 'media/official_photos/06_epass_double_balloon_macro.jpg', source: '器械照片参考', specs: ['双气囊前后密闭', '帮助充盈并稳定目标肠袢'] },
    { key: 'hotaxios', icon: '⚡', color: '#7c3aed', name: '电切增强 LAMS 输送系统', tag: '纯切模式 · 参数由术者设定', image: 'media/official_photos/01_hot_axios_angle1_full.jpg', source: '器械照片参考', specs: ['10.8Fr / 138cm', '四阶梯安全释放', '高频纯切电刀'] },
    { key: 'guidewire', icon: '🌀', color: '#d97706', name: '亲水导丝（辅助技术分支）', tag: '影像引导下置入', image: 'media/official_photos/03_zebra_guidewire_full.jpg', source: '器械照片参考', specs: ['规格依辅助装置选择', '用于器械交换或辅助定位', '并非自由手技术必需步骤'] },
    { key: 'lams', icon: '🔗', color: '#db2777', name: 'LAMS 腔内覆膜金属支架', tag: '双法兰腔道对合', image: 'media/official_photos/04_lams_stent_macro_side.jpg', source: '器械参考图', specs: ['内径与法兰尺寸因型号而异', '全覆膜降低渗漏风险', '双法兰组织对合'] }
  ];
  var ORGAN_META = {
    stomach: { icon: '胃', name: '胃', latin: 'Stomach' },
    appendix: { icon: '阑', name: '盲肠与阑尾', latin: 'Cecum & appendix' },
    jejunum: { icon: '肠', name: '目标空肠', latin: 'Jejunum' },
    pancreas: { icon: '胰', name: '胰腺', latin: 'Pancreas' },
    liver: { icon: '肝', name: '肝脏', latin: 'Liver' },
    biliary: { icon: '胆', name: '胆道', latin: 'Biliary tract' },
    esophagus: { icon: '食', name: '食管', latin: 'Esophagus' }
  };
  var ESD_TOOL_CARDS = window.ESDTeaching ? window.ESDTeaching.tools : [];
  var PROCEDURES = {
    eus_ge: {
      short: 'EUS-GE', group: '胃肠旁路', title: '胃空肠吻合术',
      disease: '十二指肠梗阻导致胃排空受阻',
      path: '胃后壁 → 近端空肠', required: ['stomach', 'jejunum'],
      variant: '教学分支：EPASS 双球囊辅助定位 + 电切增强 LAMS 释放；其他辅助器械为独立技术分支示意',
      roles: { stomach: '操作入口', jejunum: '旁路接收端' },
      point: '胃后壁—目标空肠贴壁区', readyLabel: '胃与目标空肠', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '55%', top: '49%' },
      tools: ['echoendoscope', 'dilation_catheter', 'epass', 'hotaxios', 'guidewire', 'lams']
    },
    eus_pd: {
      short: 'EUS-PD', group: '胰管引流', title: '主胰管引流术',
      disease: '主胰管梗阻、扩张与胰管高压',
      path: '胃下后壁 → 主胰管', required: ['stomach', 'pancreas'],
      variant: '教学分支：ERCP 失败或不可行后的经胃胰管引流；仅限治疗性 EUS 专家中心',
      roles: { stomach: '内镜操作入口', pancreas: '引流目标器官' },
      point: '胃下后壁—扩张主胰管邻近区', readyLabel: '胃与胰腺', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '65%', top: '43%' },
      tools: ['pd_echoendoscope', 'pd_needle', 'pd_guidewire', 'pd_dilator', 'pd_stent']
    },
    eus_hgs: {
      short: 'EUS-HGS', group: '肝内胆管引流', title: '肝胃吻合引流术',
      disease: '胆道远端梗阻导致肝内胆管扩张与胆汁淤积',
      path: '胃小弯上部 → 左肝 B2/B3 胆管', required: ['stomach', 'liver'],
      variant: '教学分支：ERCP 失败或不可行后的左肝内胆管—胃引流；靶胆管按解剖选择 B2 或 B3',
      roles: { stomach: '内镜操作入口', liver: '左肝内胆管引流目标器官' },
      point: '胃小弯—左肝 B2/B3 胆管邻近区', readyLabel: '胃与肝脏', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '43%', top: '30%' },
      tools: ['hgs_echoendoscope', 'hgs_needle', 'hgs_guidewire', 'hgs_dilator', 'hgs_stent']
    },
    eus_cds: {
      short: 'EUS-CDS', group: '胆总管引流', title: '胆总管十二指肠吻合术',
      disease: '胆总管远端恶性梗阻导致上游胆管扩张与胆汁淤积',
      path: '十二指肠球部 → 扩张胆总管', required: ['stomach', 'biliary'],
      variant: '教学分支：ERCP 失败或不可行后的胆总管—十二指肠引流；支架类型按胆管直径与解剖选择',
      roles: { stomach: '内镜经胃进入球部', biliary: '扩张胆总管目标器官' },
      point: '十二指肠球部—扩张胆总管邻近区', readyLabel: '胃肠入口与胆道', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '58%', top: '34%' },
      tools: ['cds_echoendoscope', 'cds_needle', 'cds_guidewire', 'cds_dilator', 'cds_stent']
    },
    eus_pfc: {
      short: 'EUS-PFC', group: '胰周液体积聚引流', title: '胰腺假性囊肿引流术',
      disease: '症状性胰腺假性囊肿造成压迫或持续不适',
      path: '胃后壁 → 成熟胰腺假性囊肿', required: ['stomach', 'pancreas'],
      variant: '教学分支：成熟胰腺假性囊肿的 EUS 引导经胃引流；图中导丝为导丝辅助技术分支，实际方案依病变与术者判断选择',
      roles: { stomach: '内镜操作入口', pancreas: '病变邻近器官' },
      point: '胃后壁—胰腺假性囊肿贴壁区', readyLabel: '胃与胰腺', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '55%', top: '55%' },
      tools: ['pfc_echoendoscope', 'pfc_needle', 'pfc_guidewire', 'pfc_lams']
    },
    eus_rv: {
      short: 'EUS-RV', group: '胆道会师 ERCP', title: '胆总管会师术', disease: '良性胆道梗阻且 ERCP 插管失败',
      path: '十二指肠球部 → 胆总管 → 乳头 → ERCP', required: ['stomach', 'biliary'],
      variant: '教学分支：乳头仍可到达时，EUS 穿刺入胆管并使导丝顺行越过乳头，随后接回常规 ERCP 通路', roles: { stomach: '内镜经胃进入球部', biliary: '扩张胆总管目标器官' },
      point: '十二指肠球部—胆总管会师穿刺区', readyLabel: '胃肠入口与胆道', twoDReady: true, status: '2D 教学交互 · 待临床审核', marker: { left: '46%', top: '46%' }, tools: ['rv_echoendoscope', 'rv_needle', 'rv_guidewire', 'rv_duodenoscope']
    },
    eus_ag: {
      short: 'EUS-AG', group: '顺行胆道治疗', title: 'EUS 引导顺行胆道治疗', disease: '胆道梗阻且常规 ERCP 不可行或无法抵达乳头的教学情境',
      path: '胃 → 左肝内胆管 → 跨越狭窄至肠腔', required: ['stomach', 'liver', 'biliary'],
      variant: '教学分支：经胃进入左肝内胆管，导丝顺行跨越病变后进行胆道治疗；不同于 EUS-RV，本流程不设置乳头端接回导丝。',
      roles: { stomach: 'EUS 操作入口', liver: '左肝内胆管入路', biliary: '跨越狭窄的胆道目标' },
      point: '胃小弯—左肝 B2/B3 胆管入路区', readyLabel: '胃、肝脏与胆道', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '38%', top: '35%' }, tools: ['ag_echoendoscope', 'ag_needle', 'ag_guidewire', 'ag_stent']
    },
    eus_gbd: {
      short: 'EUS-GBD', group: '胆囊引流', title: 'EUS 引导经球部胆囊引流术', disease: '高风险急性胆囊炎：胆囊颈结石性梗阻、壁增厚与高张力积液的教学情境',
      path: '十二指肠球部 → 贴壁胆囊体部', required: ['stomach', 'biliary'],
      variant: '教学分支固定为经十二指肠球部的 EUS-GBD；先确认胆囊贴壁与多普勒安全窗，再选择导丝辅助或直接 EC-LAMS 路径，不混用两条路径。',
      roles: { stomach: '内镜抵达十二指肠球部', biliary: '胆囊病变与内引流目标' },
      point: '十二指肠球部—胆囊贴壁引流区', readyLabel: '胃肠入口与胆囊胆道', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '51%', top: '27%' }, tools: ['gbd_echoendoscope', 'gbd_needle', 'gbd_guidewire', 'gbd_lams']
    },
    ercp_eye: {
      short: 'ERCP-DSOC', group: '直视碎石取石', title: '直视胆道镜辅助困难胆总管结石处理',
      disease: '嵌顿或困难胆总管结石造成胆汁引流受阻的教学情境',
      path: '十二指肠镜 → 大乳头 → 胆总管 → 结石', required: ['stomach', 'biliary'],
      variant: '教学分支：常规 ERCP 建立经乳头通路后，以直视胆道镜辅助观察结石，再以碎石纤维局部处理并回收碎块。它不是 EUS 穿刺、会师或胆道引流术。',
      roles: { stomach: '内镜经胃抵达十二指肠与乳头', biliary: '胆总管结石与操作目标' },
      point: '十二指肠乳头—下段胆总管结石区', readyLabel: '胃肠入口与胆道', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '67%', top: '55%' }, tools: ['ercp_duodenoscope', 'ercp_cholangioscope', 'ercp_lithotripsy', 'ercp_basket']
    },
    poem: {
      short: 'POEM', group: '食管胃交界肌切开', title: '经口内镜下肌切开术', disease: '贲门失弛缓症造成食管胃交界功能性紧缩与排空受阻的教学情境',
      path: '食管 → 食管胃交界 → 贲门侧肌层', required: ['esophagus', 'stomach'],
      variant: '教学分支：经口内镜进入下段食管，建立黏膜下隧道后在食管胃交界进行肌切开并夹闭入口。它不是胆道、胰腺或 EUS 穿刺术式。',
      roles: { esophagus: '经口内镜操作通路', stomach: '食管胃交界远端解剖参照' },
      point: '下段食管—食管胃交界紧缩区', readyLabel: '食管与胃', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '48%', top: '16%' }, tools: ['poem_endoscope', 'poem_injector', 'poem_knife', 'poem_clip']
    },
    edat: {
      short: 'EDAT', group: '直视阑尾腔诊疗', title: '直视化阑尾腔诊疗术', disease: '急性未穿孔阑尾炎伴阑尾腔粪石梗阻的教学情境',
      path: '结肠镜 → 阑尾开口 → 阑尾腔 → 直视处理与引流支持', required: ['appendix'],
      variant: '教学分支：结肠镜抵达盲肠后，经阑尾开口以导丝引导 9F 阑尾子镜进入腔内直视评估，示意网篮回收粪石；如腔内狭窄、潴留等情况需要即时引流支持，再选择塑料支架。该术式并非所有急性阑尾炎的标准替代方案，患者选择、抗感染、手术备选与随访须由专科团队决定。',
      roles: { appendix: '盲肠—阑尾开口与腔内操作目标' },
      point: '盲肠—阑尾开口与腔内梗阻评估区', readyLabel: '盲肠与阑尾', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '48%', top: '70%' }, tools: ['edat_colonoscope', 'edat_guidewire', 'edat_appendicoscope', 'edat_basket', 'edat_stent']
    },
    biliary_biopsy: {
      short: 'DSOC-Bx', group: '直视胆道诊断', title: '直视胆道镜下不明原因胆道狭窄评估与靶向活检', disease: '不明原因胆道狭窄，性质待影像、直视形态与病理综合判断的教学情境',
      path: '十二指肠镜 → 大乳头 → 胆总管狭窄 → 直视靶向活检', required: ['stomach', 'biliary'],
      variant: '教学分支：先建立 ERCP 经乳头入路，再以直视胆道镜观察狭窄形态并用微型钳靶向取样。取样不等于即时诊断或治疗狭窄；是否使用直视活检须结合狭窄部位、引流、既往取样、影像与经验中心条件判断。',
      roles: { stomach: '内镜经胃抵达十二指肠与乳头', biliary: '胆总管狭窄与靶向取样目标' },
      point: '十二指肠乳头—胆总管狭窄评估区', readyLabel: '胃肠入口与胆道', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '61%', top: '60%' }, tools: ['bds_duodenoscope', 'bds_cholangioscope', 'bds_biopsy_forceps']
    },
    eus_fnb: {
      short: 'EUS-FNB', group: '病灶组织获取', title: 'EUS 引导胰腺占位组织取样', disease: '胰腺实性占位需获得组织学诊断的教学情境',
      path: '胃后壁 → 胰腺体部占位', required: ['stomach', 'pancreas'],
      variant: '教学分支：以 FNB 组织条取样为例。FNA 细胞学抽吸与 FNB 组织获取的选择、针径、穿刺次数和标本处理应由诊断目标及团队流程决定。',
      roles: { stomach: '超声内镜操作入口', pancreas: '实性占位与取样目标' },
      point: '胃后壁—胰腺占位安全取样区', readyLabel: '胃与胰腺', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '69%', top: '55%' }, tools: ['fnb_echoendoscope', 'fnb_needle']
    },
    esd: {
      short: 'ESD', group: '内镜黏膜下剥离', title: '胃部内镜黏膜下剥离术',
      disease: '经内镜评估适合内镜切除的胃部表浅病灶教学情境',
      path: '胃腔 → 病灶黏膜外缘 → 黏膜下剥离层', required: ['stomach'],
      variant: '教学分支：常规胃部 ESD 的标记、黏膜下注射、切开、逐步剥离与标本回收；ESD 不是 EUS 引导术式。是否达到治愈标准需最终病理和完整临床评估。',
      roles: { stomach: '表浅黏膜病灶与操作入口' },
      point: '胃壁表浅黏膜病灶区', readyLabel: '胃', twoDReady: !!window.ESDTeaching,
      status: '2D 教学交互 · 待临床审核', marker: { left: '73%', top: '41%' },
      tools: ['esd_knife', 'esd_injector', 'esd_hemostasis', 'esd_retrieval']
    },
    eus_cpn: {
      short: 'EUS-CPN', group: '癌痛姑息', title: 'EUS 引导腹腔神经丛毁损术', disease: '胰腺恶性肿瘤相关顽固腹痛的教学情境',
      path: '胃后壁 → 腹腔干起始部周围神经丛', required: ['stomach', 'pancreas'],
      variant: '教学分支：示意经胃 EUS 引导的腹腔神经丛毁损（CPN）。它用于癌痛姑息，不治疗或切除肿瘤；药物、注射方式、适应证与风险评估须由治疗团队决定。',
      roles: { stomach: '超声内镜操作入口', pancreas: '肿瘤相关疼痛背景器官' },
      point: '胃后壁—腹腔干神经丛靶区', readyLabel: '胃与胰腺', twoDReady: true,
      status: '2D 教学交互 · 待临床审核', marker: { left: '57%', top: '33%' }, tools: ['cpn_echoendoscope', 'cpn_needle']
    }
  };
  var PROCEDURE_ORDER = ['eus_ge', 'eus_pd', 'eus_hgs', 'eus_cds', 'eus_pfc', 'eus_rv', 'ercp_eye', 'poem', 'edat', 'biliary_biopsy', 'eus_ag', 'eus_gbd', 'eus_fnb', 'eus_cpn', 'esd'];
  // Each gross-anatomy annotation is stored on its organ mesh, not in screen
  // percentages. The focused 2D scene continues to explain the puncture path.
  var PROCEDURE_POINTS = {
    eus_hgs: { mesh: 'Organ_Stomach_Full', xy: [.32, .71], color: '#7b8f4b' },
    eus_ag: { mesh: 'Organ_Stomach_Full', xy: [.40, .60], color: '#287c76' },
    eus_cpn: { mesh: 'Organ_Pancreas', xy: [.50, .82], color: '#a5543c' },
    eus_gbd: { mesh: 'Organ_Gallbladder', xy: [.57, .58], color: '#2e7d69' },
    eus_cds: { mesh: 'Organ_BileDuct', xy: [.68, .46], color: '#c87738' },
    eus_ge: { mesh: 'Organ_Stomach_Full', xy: [.68, .12], color: '#c86656' },
    eus_rv: { mesh: 'Organ_Jejunum', xy: [.20, .93], color: '#4f6b91' },
    ercp_eye: { mesh: 'Organ_BileDuct', xy: [.54, .62], color: '#355c7d' },
    poem: { mesh: 'Organ_Esophagus', xy: [.54, .28], color: '#7b536d' },
    edat: { mesh: 'Organ_Appendix', xy: [.54, .72], color: '#b4664e' },
    biliary_biopsy: { mesh: 'Organ_BileDuct', xy: [.43, .74], color: '#4c8d89' },
    eus_pd: { mesh: 'Organ_Pancreas', xy: [.60, .65], color: '#8170bc' },
    eus_pfc: { mesh: 'Organ_Pancreas', xy: [.35, .40], color: '#c46235' },
    eus_fnb: { mesh: 'Organ_Pancreas', xy: [.85, .77], color: '#8b4f79' },
    esd: { mesh: 'Organ_Stomach_Full', xy: [.80, .50], color: '#aa6850' }
  };
  var pointAnchors = {};
  var projectedPoints = {};
  var procedureListOrder = [];
  var pointFramePending = false;
  /*
   * Single source of truth for the right-hand instrument shelf.  Built-in
   * instruments stay in code for version control; additions and removals made
   * in the UI are saved in the browser and can be exported as a small JSON file.
   */
  var INSTRUMENT_CATALOG = {
    eus_ge: GE_TOOL_CARDS,
    eus_pd: PD_TOOL_CARDS,
    eus_hgs: HGS_TOOL_CARDS,
    eus_cds: CDS_TOOL_CARDS,
    eus_pfc: PFC_TOOL_CARDS,
    eus_rv: RV_TOOL_CARDS,
    eus_ag: AG_TOOL_CARDS,
    eus_gbd: GBD_TOOL_CARDS,
    ercp_eye: ERCP_EYE_TOOL_CARDS,
    poem: POEM_TOOL_CARDS,
    edat: EDAT_TOOL_CARDS,
    biliary_biopsy: BILIARY_BIOPSY_TOOL_CARDS,
    eus_fnb: FNB_TOOL_CARDS,
    eus_cpn: CPN_TOOL_CARDS,
    esd: ESD_TOOL_CARDS
  };
  var INSTRUMENT_SETTINGS_KEY = 'eus-surgical-tool-catalog-v1';

  function loadInstrumentSettings() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(INSTRUMENT_SETTINGS_KEY) || '{}');
      return {
        added: Array.isArray(saved.added) ? saved.added : [],
        hidden: Array.isArray(saved.hidden) ? saved.hidden : []
      };
    } catch (error) { return { added: [], hidden: [] }; }
  }
  var instrumentSettings = loadInstrumentSettings();

  // Medical review records are intentionally kept separate from the teaching
  // configuration.  The source register is versioned in
  // medical_review_registry.js; this browser-local layer stores only the
  // human review record and can be exported for the project archive.
  var MEDICAL_REVIEW_SETTINGS_KEY = 'eus-medical-review-records-v1';
  function loadMedicalReviewSettings() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(MEDICAL_REVIEW_SETTINGS_KEY) || '{}');
      return saved && typeof saved === 'object' && saved.records && typeof saved.records === 'object' ? saved : { records: {} };
    } catch (error) { return { records: {} }; }
  }
  var medicalReviewSettings = loadMedicalReviewSettings();
  if (!medicalReviewSettings.records) medicalReviewSettings.records = {};
  function saveMedicalReviewSettings() {
    try { window.localStorage.setItem(MEDICAL_REVIEW_SETTINGS_KEY, JSON.stringify(medicalReviewSettings)); }
    catch (error) { showMessage('当前浏览器无法保存审核记录；请及时导出台账。', 'warning'); }
  }
  function medicalRegistry() {
    return window.MedicalReviewRegistry && window.MedicalReviewRegistry.modules ? window.MedicalReviewRegistry : { modules: {} };
  }
  function medicalReviewDefinition(procedureKey) {
    var fallback = {
      scope: '该教学模块尚未载入完整医学依据台账。请在发布或演示前补齐并由专科审核。',
      reviewerRole: '待指定相关专科审核人',
      focus: ['确认适用边界', '确认图像、器械与文字表述', '确认风险、随访和替代方案提示'],
      sources: [{ type: '待补充', title: '医学依据台账未加载', href: '', note: '请检查 medical_review_registry.js 是否已随项目一同部署。' }]
    };
    return medicalRegistry().modules[procedureKey] || fallback;
  }
  function reviewRecordFor(procedureKey) {
    var record = medicalReviewSettings.records[procedureKey] || {};
    return {
      status: record.status || 'pending', reviewer: record.reviewer || '', reviewerRole: record.reviewerRole || medicalReviewDefinition(procedureKey).reviewerRole || '', reviewDate: record.reviewDate || '', note: record.note || '', evidenceVersion: record.evidenceVersion || '', updatedAt: record.updatedAt || ''
    };
  }
  function reviewStatusLabel(status) {
    return ({ pending: '待指定审核人', in_review: '审核中', revise: '需修订', recorded: '已记录 · 仍需机构流程确认' })[status] || '待指定审核人';
  }
  function medicalReviewProgress() {
    var complete = PROCEDURE_ORDER.filter(function (key) {
      var record = reviewRecordFor(key);
      return record.reviewer && record.reviewDate;
    }).length;
    return complete + ' / ' + PROCEDURE_ORDER.length + ' 已登记审核人和日期';
  }
  function syncMedicalReviewEntry() {
    document.querySelectorAll('[data-medical-review-progress]').forEach(function (node) { node.textContent = medicalReviewProgress(); });
  }

  function saveInstrumentSettings() {
    try { window.localStorage.setItem(INSTRUMENT_SETTINGS_KEY, JSON.stringify(instrumentSettings)); }
    catch (error) { showMessage('当前浏览器无法保存器械配置；本次修改仍会保留到刷新前。', 'warning'); }
  }
  function toolUid(procedureKey, toolKey) { return procedureKey + '::' + toolKey; }
  function isToolHidden(procedureKey, toolKey) { return instrumentSettings.hidden.indexOf(toolUid(procedureKey, toolKey)) !== -1; }
  function getCustomTool(toolKey) { return instrumentSettings.added.filter(function (tool) { return tool.key === toolKey; })[0] || null; }
  function getToolActionKey(toolKey) {
    var tool = getCustomTool(toolKey);
    var actionKey = tool && tool.actionKey ? tool.actionKey : toolKey;
    if (actionKey === 'pfc_lams' && state && state.pfcBranch === 'direct') return 'pfc_direct_lams';
    if (actionKey === 'gbd_lams' && state && state.gbdBranch === 'direct') return 'gbd_direct_lams';
    return actionKey;
  }
  function catalogTools(procedureKey, includeHidden) {
    var base = (INSTRUMENT_CATALOG[procedureKey] || []).map(function (tool) { return Object.assign({ builtin: true }, tool); });
    var custom = instrumentSettings.added.filter(function (tool) { return tool.procedure === procedureKey; });
    var all = base.concat(custom);
    return includeHidden ? all : all.filter(function (tool) { return !isToolHidden(procedureKey, tool.key); });
  }
  function registerCustomTools() {
    instrumentSettings.added.forEach(function (tool) {
      if (!tool || !tool.key || !tool.name || !tool.procedure || !tool.actionKey) return;
      TOOL_LABELS[tool.key] = tool.name;
      TOOL_EFFECTS[tool.key] = TOOL_EFFECTS[tool.actionKey] || 'stent';
    });
  }
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }
  var state = { phase: 'three-d', procedure: null, previewProcedure: null, instrument: null, geBranch: 'epass', pfcBranch: 'wire', gbdBranch: 'wire', marks: [], applied: {}, animationToken: 0 };
  var hidingLegacy = false;

  function stage() { return document.getElementById('stage-viewport'); }
  function workspace() { return document.getElementById('two-d-workspace'); }
  function image() { return document.getElementById('two-d-anatomy-image'); }

  function loadStyle() {
    if (document.getElementById('two-d-workspace-style')) return;
    var link = document.createElement('link');
    link.id = 'two-d-workspace-style'; link.rel = 'stylesheet';
    link.href = 'two_d_workspace.css?v=20260929-medical-ledger-2';
    document.head.appendChild(link);
  }

  function currentProcedure() { return PROCEDURES[state.procedure] || PROCEDURES.eus_ge; }
  function geBranch() { return GE_BRANCHES[state.geBranch] || GE_BRANCHES.epass; }
  function teachingOrderFor(procedureKey) {
    if (procedureKey === 'eus_ge') return geBranch().order;
    if (procedureKey === 'eus_pfc') return pfcBranch().order;
    if (procedureKey === 'eus_gbd') return gbdPath().order;
    return TEACHING_ORDERS[procedureKey] || [];
  }
  function teachingStepLabel(procedureKey, key) {
    if (procedureKey === 'eus_ge' && key === 'guidewire') return '选配 · 辅助画面';
    if (procedureKey === 'edat' && key === 'edat_stent') return '按需 · 引流支持';
    var order = teachingOrderFor(procedureKey);
    var index = order.indexOf(key);
    return index === -1 ? '扩展器械' : '建议第 ' + (index + 1) + ' 步 / ' + order.length;
  }
  function syncTeachingStepBadges(panel, procedureKey) {
    if (!panel) return;
    panel.querySelectorAll('.visual-inst-card[data-tool]').forEach(function (card) {
      var key = getToolActionKey(card.getAttribute('data-tool'));
      var badge = card.querySelector('.twod-recommended-step');
      if (!badge) return;
      var optional = (procedureKey === 'eus_ge' && key === 'guidewire') || (procedureKey === 'edat' && key === 'edat_stent');
      badge.textContent = teachingStepLabel(procedureKey, key);
      badge.classList.toggle('optional', optional);
    });
  }
  function currentStates() {
    if (state.procedure === 'esd') return ESD_STATES;
    if (state.procedure === 'eus_pd') return PD_STATES;
    if (state.procedure === 'eus_hgs') return HGS_STATES;
    if (state.procedure === 'eus_cds') return CDS_STATES;
    if (state.procedure === 'eus_pfc') return PFC_STATES;
    if (state.procedure === 'eus_rv') return RV_STATES;
    if (state.procedure === 'eus_ag') return AG_STATES;
    if (state.procedure === 'eus_gbd') return GBD_STATES;
    if (state.procedure === 'ercp_eye') return ERCP_EYE_STATES;
    if (state.procedure === 'poem') return POEM_STATES;
    if (state.procedure === 'edat') return EDAT_STATES;
    if (state.procedure === 'biliary_biopsy') return BILIARY_BIOPSY_STATES;
    if (state.procedure === 'eus_fnb') return FNB_STATES;
    if (state.procedure === 'eus_cpn') return CPN_STATES;
    return STATES;
  }

  function isOrganActive(key) {
    try { return typeof activeOrgans !== 'undefined' && activeOrgans.has(key); }
    catch (error) { return false; }
  }

  function clearActiveOrgans() {
    try {
      if (typeof activeOrgans !== 'undefined') activeOrgans.clear();
      if (typeof updateSceneVisibility === 'function') updateSceneVisibility();
      if (typeof updateHotspotVisibility === 'function') updateHotspotVisibility();
    } catch (error) { /* The base 3D scene may still be finishing its first render. */ }
  }

  function setSidebarMode(mode) {
    var sidebar = document.getElementById('sidebar-instruments'); if (!sidebar) return;
    sidebar.classList.remove('collapsed', 'twod-organ-mode', 'twod-instrument-mode', 'twod-pd-mode', 'twod-hgs-mode', 'twod-cds-mode', 'twod-pfc-mode', 'twod-rv-mode', 'twod-ag-mode', 'twod-gbd-mode', 'twod-ercp-mode', 'twod-poem-mode', 'twod-edat-mode', 'twod-biliary-biopsy-mode', 'twod-fnb-mode', 'twod-cpn-mode', 'twod-esd-mode', 'twod-preop-hidden', 'twod-procedure-list-mode');
    document.body.classList.remove('twod-guided-flow');
    if (mode === 'preop') {
      sidebar.classList.add('twod-procedure-list-mode');
      return;
    }
    sidebar.classList.add(mode === 'instruments' ? 'twod-instrument-mode' : 'twod-organ-mode');
    if (mode === 'instruments' && state.procedure === 'eus_pd') sidebar.classList.add('twod-pd-mode');
    if (mode === 'instruments' && state.procedure === 'eus_hgs') sidebar.classList.add('twod-hgs-mode');
    if (mode === 'instruments' && state.procedure === 'eus_cds') sidebar.classList.add('twod-cds-mode');
    if (mode === 'instruments' && state.procedure === 'eus_pfc') sidebar.classList.add('twod-pfc-mode');
    if (mode === 'instruments' && state.procedure === 'eus_rv') sidebar.classList.add('twod-rv-mode');
    if (mode === 'instruments' && state.procedure === 'eus_ag') sidebar.classList.add('twod-ag-mode');
    if (mode === 'instruments' && state.procedure === 'eus_gbd') sidebar.classList.add('twod-gbd-mode');
    if (mode === 'instruments' && state.procedure === 'ercp_eye') sidebar.classList.add('twod-ercp-mode');
    if (mode === 'instruments' && state.procedure === 'poem') sidebar.classList.add('twod-poem-mode');
    if (mode === 'instruments' && state.procedure === 'edat') sidebar.classList.add('twod-edat-mode');
    if (mode === 'instruments' && state.procedure === 'biliary_biopsy') sidebar.classList.add('twod-biliary-biopsy-mode');
    if (mode === 'instruments' && state.procedure === 'eus_fnb') sidebar.classList.add('twod-fnb-mode');
    if (mode === 'instruments' && state.procedure === 'eus_cpn') sidebar.classList.add('twod-cpn-mode');
    if (mode === 'instruments' && state.procedure === 'esd') sidebar.classList.add('twod-esd-mode');
    var headerTitle = sidebar.querySelector('.inst-shelf-header h2');
    var count = sidebar.querySelector('.inst-count-badge');
    if (mode === 'instruments' && state.procedure === 'eus_ge') {
      if (headerTitle) headerTitle.innerHTML = '<span>🔬</span> EUS-GE 专用器械';
      if (count) count.textContent = catalogTools('eus_ge').length + ' 件就绪';
    }
  }

  function organCardMarkup(key, procedure) {
    var organ = ORGAN_META[key] || { icon: '器', name: key, latin: key };
    var active = isOrganActive(key);
    var sourceCard = document.getElementById('card-' + key);
    var sourceImage = sourceCard && sourceCard.querySelector('img');
    var preview = sourceImage && sourceImage.getAttribute('src') ? '<img src="' + sourceImage.getAttribute('src') + '" alt="">' : organ.icon;
    return '<button type="button" class="twod-organ-card' + (active ? ' active' : '') + '" data-organ="' + key + '" draggable="true">' +
      '<span class="twod-organ-icon">' + preview + '</span>' +
      '<span class="twod-organ-copy"><b>' + organ.name + '</b><small>' + organ.latin + ' · ' + (procedure.roles[key] || '相关器官') + '</small></span>' +
      '<em>' + (active ? '已就位' : '拖入') + '</em></button>';
  }

  function renderRequiredOrgans() {
    var list = document.getElementById('twod-required-organ-list'); if (!list) return;
    var procedure = PROCEDURES[state.previewProcedure] || currentProcedure();
    var signature = state.procedure + ':' + procedure.required.map(function (key) { return key + '=' + (isOrganActive(key) ? '1' : '0'); }).join(',');
    if (list.getAttribute('data-signature') === signature) return;
    list.setAttribute('data-signature', signature);
    list.innerHTML = procedure.required.map(function (key) { return organCardMarkup(key, procedure); }).join('');
    list.querySelectorAll('.twod-organ-card').forEach(function (card) {
      var key = card.getAttribute('data-organ');
      card.addEventListener('dragstart', function (event) {
        if (event.dataTransfer) {
          event.dataTransfer.setData('text/plain', key);
          event.dataTransfer.effectAllowed = 'copy';
        }
      });
      card.addEventListener('click', function () {
        if (typeof toggleOrgan === 'function') toggleOrgan(key);
        renderRequiredOrgans();
        refreshGuide();
      });
    });
  }

  function updateProcedurePanel() {
    var procedure = currentProcedure();
    var title = document.getElementById('twod-case-title');
    var disease = document.getElementById('twod-case-disease');
    var path = document.getElementById('twod-case-path');
    var variant = document.getElementById('twod-case-variant');
    var status = document.getElementById('twod-case-status');
    if (title) title.textContent = procedure.short + ' · ' + procedure.title;
    if (disease) disease.textContent = procedure.disease;
    if (path) path.textContent = procedure.path;
    if (variant) variant.textContent = procedure.variant || '';
    if (status) {
      status.textContent = procedure.status;
      var reviewPending = procedure.status.indexOf('待临床审核') !== -1;
      status.classList.toggle('ready', procedure.twoDReady && !reviewPending);
      status.classList.toggle('review-pending', reviewPending);
    }
    document.querySelectorAll('.twod-procedure-button').forEach(function (button) {
      var key = button.getAttribute('data-procedure');
      var ready = procedureReady(key);
      button.classList.toggle('active', key === state.previewProcedure);
      button.classList.toggle('is-ready', ready);
      button.classList.toggle('is-unavailable', !ready);
      button.setAttribute('aria-disabled', ready ? 'false' : 'true');
      var statusLabel = button.querySelector('em');
      if (statusLabel) statusLabel.textContent = ready ? '点击进入' : '需拖入器官';
    });
    renderRequiredOrgans();
  }

  function previewProcedure(key) {
    if (!PROCEDURES[key] || state.phase !== 'three-d') return;
    state.previewProcedure = key;
    updateProcedurePanel();
    document.querySelectorAll('.twod-point-marker').forEach(function (point) {
      var active = point.getAttribute('data-procedure') === key;
      point.classList.toggle('active', active);
      point.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function highlightPointProcedure(key) {
    previewProcedure(key);
    var row = document.querySelector('.twod-procedure-button[data-procedure="' + key + '"]');
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function buildProcedureSidebar() {
    var sidebar = document.getElementById('sidebar-instruments');
    if (!sidebar || document.getElementById('twod-context-panel')) return;
    var panel = document.createElement('div');
    panel.id = 'twod-context-panel';
    panel.innerHTML =
      '<div class="twod-path-header"><span>手术点位 · 从上到下排列</span><b>点击器官上的小点或下方名称进入</b><small>每个术式有独立点位，随器官缩放、旋转和移动；悬停可对应高亮</small></div>' +
      '<div class="twod-review-entry"><div><b>医学依据 / 审核台账</b><small data-medical-review-progress>' + medicalReviewProgress() + '</small></div><button type="button" data-medical-review-ledger>📋 查看台账</button></div>' +
      '<div class="twod-procedure-grid">' + PROCEDURE_ORDER.map(function (key) {
        var item = PROCEDURES[key];
        return '<button type="button" class="twod-procedure-button" data-procedure="' + key + '" style="--point-color:' + PROCEDURE_POINTS[key].color + '"><i>' + String(PROCEDURE_ORDER.indexOf(key) + 1).padStart(2, '0') + '</i><span class="twod-procedure-copy"><b>' + item.short + ' 手术点位</b><small>' + item.point + '</small><span>' + item.title + '</span></span><em>需拖入器官</em></button>';
      }).join('') + '</div>' +
      '<div class="twod-path-foot"><span>1</span>拖入器官 <i></i><span>2</span>选择术式 <i></i><span>3</span>器械互动</div>';
    sidebar.insertBefore(panel, sidebar.firstChild);
    panel.querySelectorAll('.twod-procedure-button').forEach(function (button) {
      var key = button.getAttribute('data-procedure');
      button.onmouseenter = function () { previewProcedure(key); };
      button.onfocus = function () { previewProcedure(key); };
      button.onclick = function () {
        if (!procedureReady(key)) {
          var missing = PROCEDURES[key].required.filter(function (organ) { return !isOrganActive(organ); }).map(function (organ) { return ORGAN_META[organ].name; });
          var status = document.getElementById('twod-organ-status');
          if (status) status.textContent = itemRequiredMessage(key, missing);
          return;
        }
        requestPointSelection(key);
      };
    });
    buildPDInstrumentShelf(sidebar);
    buildHGSInstrumentShelf(sidebar);
    buildCDSInstrumentShelf(sidebar);
    buildPFCInstrumentShelf(sidebar);
    buildAGInstrumentShelf(sidebar);
    buildGBDInstrumentShelf(sidebar);
    buildERCPEyeInstrumentShelf(sidebar);
    buildPOEMInstrumentShelf(sidebar);
    buildEDATInstrumentShelf(sidebar);
    buildBiliaryBiopsyInstrumentShelf(sidebar);
    buildFNBInstrumentShelf(sidebar);
    buildCPNInstrumentShelf(sidebar);
    buildESDInstrumentShelf(sidebar);
    updateProcedurePanel();
    syncMedicalReviewEntry();
    setSidebarMode('preop');
  }

  function itemRequiredMessage(key, missing) {
    return PROCEDURES[key].short + '：请从左侧拖入' + missing.join('、') + '。';
  }

  function buildPDInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-pd-instruments', 'EUS-PD 专用器械', 'eus_pd', 'twod-pd-tool-card');
  }
  function buildESDInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-esd-instruments', 'ESD 胃部专用器械', 'esd', 'twod-esd-tool-card');
    var hint = document.querySelector('#twod-esd-instruments .twod-pd-tool-hint');
    if (hint) hint.textContent = '常规胃部 ESD 教学分支：拖入电刀标记边界，再用注射针形成液垫，继续切开与逐步剥离。器械接触才产生变化；不是视频播放，也不提供治疗参数。';
  }

  function buildHGSInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-hgs-instruments', 'EUS-HGS 专用器械', 'eus_hgs', 'twod-hgs-tool-card');
  }

  function buildCDSInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-cds-instruments', 'EUS-CDS 专用器械', 'eus_cds', 'twod-cds-tool-card');
  }

  function buildPFCInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-pfc-instruments', 'EUS-PFC 专用器械', 'eus_pfc', 'twod-pfc-tool-card');
    var panel = document.getElementById('twod-pfc-instruments');
    if (!panel || document.getElementById('twod-pfc-branch-selector')) return;
    var selector = document.createElement('div');
    selector.id = 'twod-pfc-branch-selector';
    selector.innerHTML = '<span>本病例技术路径 · 二选一</span><div><button type="button" data-pfc-branch="wire">导丝辅助<br><em>4 件核心器械</em></button><button type="button" data-pfc-branch="direct">直接 EC-LAMS<br><em>2 件核心器械</em></button></div><small id="twod-pfc-branch-note"></small><div class="twod-pfc-branch-flow" id="twod-pfc-branch-flow"></div><b class="twod-pfc-branch-status" id="twod-pfc-branch-status"></b>';
    var hint = panel.querySelector('.twod-pd-tool-hint');
    if (hint) hint.insertAdjacentElement('afterend', selector);
    selector.querySelectorAll('button').forEach(function (button) {
      button.onclick = function () { setPFCBranch(button.getAttribute('data-pfc-branch')); };
    });
    setPFCBranch(state.pfcBranch);
  }
  function buildRVInstrumentShelf(sidebar) { buildProcedureInstrumentShelf(sidebar, 'twod-rv-instruments', 'EUS-RV 专用器械', 'eus_rv', 'twod-rv-tool-card'); }
  function buildAGInstrumentShelf(sidebar) { buildProcedureInstrumentShelf(sidebar, 'twod-ag-instruments', 'EUS-AG 专用器械', 'eus_ag', 'twod-ag-tool-card'); }
  function buildGBDInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-gbd-instruments', 'EUS-GBD 专用器械', 'eus_gbd', 'twod-gbd-tool-card');
    var panel = document.getElementById('twod-gbd-instruments');
    if (!panel || document.getElementById('twod-gbd-branch-selector')) return;
    var selector = document.createElement('div');
    selector.id = 'twod-gbd-branch-selector';
    selector.innerHTML = '<span>固定入路 · 十二指肠球部 → 胆囊</span><p>高风险急性胆囊炎教学情境：胆囊颈结石梗阻。选择一种技术路径，不能混用。</p><div><button type="button" data-gbd-branch="wire">导丝辅助<br><em>4 件核心器械</em></button><button type="button" data-gbd-branch="direct">直接 EC-LAMS<br><em>2 件核心器械</em></button></div><small id="twod-gbd-branch-note"></small><div class="twod-gbd-branch-flow" id="twod-gbd-branch-flow"></div><b class="twod-gbd-path-status" id="twod-gbd-path-status"></b>';
    var hint = panel.querySelector('.twod-pd-tool-hint');
    if (hint) hint.insertAdjacentElement('afterend', selector);
    selector.querySelectorAll('button').forEach(function (button) { button.onclick = function () { setGBDBranch(button.getAttribute('data-gbd-branch')); }; });
    setGBDBranch(state.gbdBranch);
  }
  function buildERCPEyeInstrumentShelf(sidebar) { buildProcedureInstrumentShelf(sidebar, 'twod-ercp-instruments', 'ERCP 直视碎石专用器械', 'ercp_eye', 'twod-ercp-tool-card'); }
  function buildPOEMInstrumentShelf(sidebar) { buildProcedureInstrumentShelf(sidebar, 'twod-poem-instruments', 'POEM 专用器械', 'poem', 'twod-poem-tool-card'); }
  function buildEDATInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-edat-instruments', 'EDAT 直视阑尾腔诊疗器械', 'edat', 'twod-edat-tool-card');
    var hint = document.querySelector('#twod-edat-instruments .twod-pd-tool-hint');
    if (hint) hint.textContent = '推荐顺序：盲肠定位 → 导丝进入 → 阑尾子镜直视 → 网篮回收粪石；如存在引流需要，再查看“按需”的塑料支架分支。可直接打开任一步图帧，图示不替代患者选择、抗感染或手术决策。';
  }
  function buildBiliaryBiopsyInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-biliary-biopsy-instruments', '直视胆道狭窄评估与活检器械', 'biliary_biopsy', 'twod-biliary-biopsy-tool-card');
    var hint = document.querySelector('#twod-biliary-biopsy-instruments .twod-pd-tool-hint');
    if (hint) hint.textContent = '适用于经影像、狭窄部位、引流需求及既往/同期 ERCP 取样评估后选择直视活检的教学情境。推荐顺序：经乳头通路 → 直视观察 → 靶向取样；取样不等于狭窄被治疗或得到即时诊断。';
  }
  function buildFNBInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-fnb-instruments', 'EUS-FNB 诊断取样器械', 'eus_fnb', 'twod-fnb-tool-card');
    var panel = document.getElementById('twod-fnb-instruments');
    var list = panel && panel.querySelector('.twod-pd-tool-list');
    if (!list || document.getElementById('twod-fnb-specimen-status')) return;
    var result = document.createElement('div');
    result.id = 'twod-fnb-specimen-status';
    result.className = 'twod-fnb-specimen-status';
    result.innerHTML = '<span>结果状态 · 非器械</span><b>组织标本尚未获得</b><p>完成 FNB 取样后，此处显示“标本已送检”。取样不等于即时诊断，也不治疗或切除病灶。</p>';
    list.appendChild(result);
  }
  function buildCPNInstrumentShelf(sidebar) {
    buildProcedureInstrumentShelf(sidebar, 'twod-cpn-instruments', 'EUS-CPN 专用器械', 'eus_cpn', 'twod-cpn-tool-card');
    var hint = document.querySelector('#twod-cpn-instruments .twod-pd-tool-hint');
    if (hint) hint.textContent = '推荐顺序：先在胃后壁以 EUS 定位腹腔干与神经丛靶区，再进行注射示意。该模块用于癌痛姑息；缓解程度存在个体差异，并需由团队说明腹泻、低血压等风险与随访。';
  }

  function setGEBranch(branch) {
    state.geBranch = branch === 'filling' ? 'filling' : 'epass';
    var list = document.getElementById('inst-shelf-list');
    if (!list) return;
    list.classList.toggle('ge-filling-mode', state.geBranch === 'filling');
    list.querySelectorAll('[data-ge-branch]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-ge-branch') === state.geBranch);
    });
    var note = document.getElementById('twod-ge-branch-note');
    if (note) note.textContent = geBranch().note;
    var flow = document.getElementById('twod-ge-branch-flow');
    if (flow) flow.innerHTML = geBranch().flow.map(function (step, index) { return '<span>' + step + '</span>' + (index < geBranch().flow.length - 1 ? '<i>→</i>' : ''); }).join('');
    syncTeachingStepBadges(list, 'eus_ge');
  }

  function pfcBranch() { return PFC_BRANCHES[state.pfcBranch] || PFC_BRANCHES.wire; }

  function updatePFCStepUI() {
    var panel = document.getElementById('twod-pfc-instruments');
    if (!panel) return;
    var branch = pfcBranch();
    var next = branch.order.filter(function (key) { return !state.applied[key]; })[0] || null;
    panel.querySelectorAll('[data-tool]').forEach(function (card) {
      var cardKey = getToolActionKey(card.getAttribute('data-tool'));
      if (branch.order.indexOf(cardKey) === -1) return;
      var completed = !!state.applied[cardKey];
      var isNext = cardKey === next;
      card.classList.toggle('twod-step-complete', completed);
      card.classList.toggle('twod-step-next', isNext);
      card.classList.remove('twod-step-locked');
      var stateChip = card.querySelector('.twod-tool-step-state');
      if (!stateChip) {
        stateChip = document.createElement('small');
        stateChip.className = 'twod-tool-step-state';
        var controls = card.querySelector('.visual-inst-actions');
        if (controls) controls.insertAdjacentElement('beforebegin', stateChip);
      }
      if (stateChip) stateChip.textContent = completed ? '✓ 已查看 · 可再次演示' : isNext ? '推荐下一步 · 可直接查看' : teachingStepLabel('eus_pfc', cardKey) + ' · 可直接查看';
    });
    var status = document.getElementById('twod-pfc-branch-status');
    if (status) {
      status.textContent = next ? '推荐下一步：' + TOOL_LABELS[next] + '（仍可直接查看任一步）' : '✓ 本路径的推荐步骤均已查看';
      status.classList.toggle('complete', !next);
    }
    syncTeachingStepBadges(panel, 'eus_pfc');
  }

  function resetPFCBranchProgress() {
    if (state.procedure !== 'eus_pfc' || state.phase === 'three-d') return;
    state.applied = {};
    state.instrument = null;
    state.animationToken += 1;
    var layer = document.getElementById('twod-effect-layer'); if (layer) layer.innerHTML = '';
    var transition = document.getElementById('two-d-transition-image');
    if (transition) { transition.className = 'twod-transition-image'; transition.removeAttribute('src'); }
    var process = document.getElementById('twod-process'); if (process) process.className = 'twod-process hidden';
    var canvas = document.getElementById('twod-canvas'); if (canvas) canvas.classList.remove('is-processing', 'has-result');
    document.querySelectorAll('.twod-selected').forEach(function (card) { card.classList.remove('twod-selected'); });
    setFrame('initial');
  }

  function setPFCBranch(branch) {
    var previous = state.pfcBranch;
    state.pfcBranch = branch === 'direct' ? 'direct' : 'wire';
    var panel = document.getElementById('twod-pfc-instruments');
    if (!panel) return;
    panel.classList.toggle('pfc-direct-mode', state.pfcBranch === 'direct');
    panel.querySelectorAll('[data-pfc-branch]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-pfc-branch') === state.pfcBranch);
    });
    var note = document.getElementById('twod-pfc-branch-note');
    if (note) note.textContent = pfcBranch().note;
    var flow = document.getElementById('twod-pfc-branch-flow');
    if (flow) flow.innerHTML = pfcBranch().flow.map(function (step, index) { return '<span>' + step + '</span>' + (index < pfcBranch().flow.length - 1 ? '<i>→</i>' : ''); }).join('');
    var lamsCard = panel.querySelector('[data-tool="pfc_lams"]');
    if (lamsCard) {
      var lamsTitle = lamsCard.querySelector('.visual-inst-title');
      var lamsTag = lamsCard.querySelector('.visual-inst-tag');
      var lamsSpecs = lamsCard.querySelectorAll('.visual-spec-pill');
      if (state.pfcBranch === 'direct') {
        if (lamsTitle) lamsTitle.innerHTML = '<span style="color:#c46235;">⚡</span>电切增强一体化 LAMS 输送系统';
        if (lamsTag) lamsTag.textContent = '直接跨壁 · 双法兰依次释放';
        if (lamsSpecs[0]) lamsSpecs[0].textContent = '实时 EUS + 多普勒';
        if (lamsSpecs[1]) lamsSpecs[1].textContent = '不走导丝交换轨道';
        if (lamsSpecs[2]) lamsSpecs[2].textContent = '两端法兰分步释放';
      } else {
        if (lamsTitle) lamsTitle.innerHTML = '<span style="color:#b56a18;">🔗</span>覆膜 LAMS 引流支架';
        if (lamsTag) lamsTag.textContent = '建立胃—囊肿引流通道';
        if (lamsSpecs[0]) lamsSpecs[0].textContent = '尺寸与系统适配由团队决定';
        if (lamsSpecs[1]) lamsSpecs[1].textContent = '双法兰组织对合';
        if (lamsSpecs[2]) lamsSpecs[2].textContent = '仍需监测出血、移位、堵塞';
      }
    }
    var count = panel.querySelector('.inst-count-badge');
    if (count) count.textContent = state.pfcBranch === 'direct' ? '2 件核心器械' : '4 件核心器械';
    if (previous && previous !== state.pfcBranch) resetPFCBranchProgress();
    updatePFCStepUI();
    if (state.procedure === 'eus_pfc' && previous !== state.pfcBranch) {
      showMessage(state.pfcBranch === 'direct' ? '已切换为直接 EC-LAMS 路径；为防止路径混用，当前操作进度已重置。' : '已切换为导丝辅助路径；为防止路径混用，当前操作进度已重置。', 'instruction');
    }
  }

  function gbdPath() { return GBD_PATHS[state.gbdBranch] || GBD_PATHS.wire; }

  function updateGBDStepUI() {
    var panel = document.getElementById('twod-gbd-instruments');
    if (!panel) return;
    var path = gbdPath();
    var next = path.order.filter(function (key) { return !state.applied[key]; })[0] || null;
    panel.querySelectorAll('[data-tool]').forEach(function (card) {
      var cardKey = getToolActionKey(card.getAttribute('data-tool'));
      if (path.order.indexOf(cardKey) === -1) return;
      var completed = !!state.applied[cardKey];
      var isNext = cardKey === next;
      card.classList.toggle('twod-gbd-step-complete', completed);
      card.classList.toggle('twod-gbd-step-next', isNext);
      card.classList.remove('twod-gbd-step-locked');
      var stateChip = card.querySelector('.twod-gbd-step-state');
      if (!stateChip) {
        stateChip = document.createElement('small');
        stateChip.className = 'twod-gbd-step-state';
        var controls = card.querySelector('.visual-inst-actions');
        if (controls) controls.insertAdjacentElement('beforebegin', stateChip);
      }
      if (stateChip) stateChip.textContent = completed ? '✓ 已查看 · 可再次演示' : isNext ? '推荐下一步 · 可直接查看' : teachingStepLabel('eus_gbd', cardKey) + ' · 可直接查看';
    });
    var status = document.getElementById('twod-gbd-path-status');
    if (status) {
      status.textContent = next ? '推荐下一步：' + TOOL_LABELS[next] + '（仍可直接查看任一步）' : '✓ 本路径的推荐步骤均已查看';
      status.classList.toggle('complete', !next);
    }
    syncTeachingStepBadges(panel, 'eus_gbd');
  }

  function resetGBDPathProgress() {
    if (state.procedure !== 'eus_gbd' || state.phase === 'three-d') return;
    state.applied = {};
    state.instrument = null;
    state.animationToken += 1;
    var layer = document.getElementById('twod-effect-layer'); if (layer) layer.innerHTML = '';
    var transition = document.getElementById('two-d-transition-image');
    if (transition) { transition.className = 'twod-transition-image'; transition.removeAttribute('src'); }
    var process = document.getElementById('twod-process'); if (process) process.className = 'twod-process hidden';
    var canvas = document.getElementById('twod-canvas'); if (canvas) canvas.classList.remove('is-processing', 'has-result');
    document.querySelectorAll('.twod-selected').forEach(function (card) { card.classList.remove('twod-selected'); });
    setFrame('initial');
  }

  function setGBDBranch(branch) {
    var previous = state.gbdBranch;
    state.gbdBranch = branch === 'direct' ? 'direct' : 'wire';
    var panel = document.getElementById('twod-gbd-instruments');
    if (!panel) return;
    panel.classList.toggle('gbd-direct-mode', state.gbdBranch === 'direct');
    panel.querySelectorAll('[data-gbd-branch]').forEach(function (button) { button.classList.toggle('active', button.getAttribute('data-gbd-branch') === state.gbdBranch); });
    var note = document.getElementById('twod-gbd-branch-note');
    if (note) note.textContent = gbdPath().note;
    var flow = document.getElementById('twod-gbd-branch-flow');
    if (flow) flow.innerHTML = gbdPath().flow.map(function (step, index) { return '<span>' + step + '</span>' + (index < gbdPath().flow.length - 1 ? '<i>→</i>' : ''); }).join('');
    var lamsCard = panel.querySelector('[data-tool="gbd_lams"]');
    if (lamsCard) {
      var title = lamsCard.querySelector('.visual-inst-title'); var tag = lamsCard.querySelector('.visual-inst-tag'); var specs = lamsCard.querySelectorAll('.visual-spec-pill');
      if (state.gbdBranch === 'direct') {
        if (title) title.innerHTML = '<span style="color:#16756f;">⚡</span>电切增强一体化 LAMS 系统';
        if (tag) tag.textContent = '球部直接跨壁 · 双法兰释放';
        if (specs[0]) specs[0].textContent = '实时 EUS + 多普勒';
        if (specs[1]) specs[1].textContent = '不走导丝交换轨道';
        if (specs[2]) specs[2].textContent = '球部—胆囊内引流';
      } else {
        if (title) title.innerHTML = '<span style="color:#16756f;">🔗</span>覆膜 LAMS 胆囊引流支架';
        if (tag) tag.textContent = '导丝路径：球部—胆囊内引流';
        if (specs[0]) specs[0].textContent = '双法兰组织对合';
        if (specs[1]) specs[1].textContent = '胆囊减压引流';
        if (specs[2]) specs[2].textContent = '风险需持续监测';
      }
    }
    var count = panel.querySelector('.inst-count-badge');
    if (count) count.textContent = state.gbdBranch === 'direct' ? '2 件核心器械' : '4 件核心器械';
    if (previous && previous !== state.gbdBranch) resetGBDPathProgress();
    updateGBDStepUI();
    if (state.procedure === 'eus_gbd' && previous !== state.gbdBranch) showMessage(state.gbdBranch === 'direct' ? '已切换为直接 EC-LAMS 路径；为防止路径混用，当前进度已重置。' : '已切换为导丝辅助路径；为防止路径混用，当前进度已重置。', 'instruction');
  }

  function toolCardMarkup(tool, cardClass, procedureKey) {
    var specs = Array.isArray(tool.specs) ? tool.specs : [];
    var step = procedureKey ? teachingStepLabel(procedureKey, tool.key) : '教学器械';
    var isOptional = (procedureKey === 'eus_ge' && tool.key === 'guidewire') || (procedureKey === 'edat' && tool.key === 'edat_stent');
    var picture = tool.image
      ? '<img src="' + escapeHTML(tool.image) + '" alt="' + escapeHTML(tool.name) + '" class="visual-inst-img">'
      : '<div class="twod-tool-image-placeholder"><span>' + escapeHTML(tool.icon || '🧩') + '</span><small>待补充器械图片</small></div>';
    return '<div class="visual-inst-card ' + cardClass + (tool.builtin ? '' : ' twod-custom-tool-card') + '" data-tool="' + escapeHTML(tool.key) + '" draggable="true">' +
      '<div class="visual-inst-header"><span class="visual-inst-title"><span style="color:' + escapeHTML(tool.color || '#8b5a4c') + ';">' + escapeHTML(tool.icon || '🧩') + '</span>' + escapeHTML(tool.name) + '</span><span class="twod-recommended-step' + (isOptional ? ' optional' : '') + '">' + escapeHTML(step) + '</span><span class="visual-inst-drag-hint">⠿ 可拖拽至手术点位</span></div>' +
      '<div class="visual-inst-img-box">' + picture + '<span class="visual-inst-tag" style="background:' + escapeHTML(tool.color || '#8b5a4c') + ';">' + escapeHTML(tool.tag || '自定义教学器械') + '</span>' + (tool.source ? '<small class="twod-image-source">' + escapeHTML(tool.source) + '</small>' : '') + '</div>' +
      '<div class="visual-inst-specs">' + specs.map(function (spec, index) { return '<span class="visual-spec-pill' + (index === 0 ? ' highlight' : '') + '">' + escapeHTML(spec) + '</span>'; }).join('') + '</div>' +
      '<div class="visual-inst-actions"><button type="button" class="btn-apply-inst" style="background:linear-gradient(135deg,' + escapeHTML(tool.color || '#8b5a4c') + ',#5f554f);"><span>🖐 拖到点位操作</span></button><button type="button" class="btn-turntable-inst"><span>◎ 选为当前器械</span></button></div>' +
    '</div>';
  }

  function bindProcedureToolCards(panel) {
    if (!panel) return;
    panel.querySelectorAll('.visual-inst-card[data-tool]').forEach(function (card) {
      var key = card.getAttribute('data-tool');
      card.addEventListener('click', function () { selectInstrument(key); });
      card.querySelectorAll('button').forEach(function (button) {
        button.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); selectInstrument(key); });
      });
      card.addEventListener('dragstart', function (event) {
        state.instrument = key;
        if (event.dataTransfer) {
          event.dataTransfer.setData('application/x-eus-2d-tool', key);
          event.dataTransfer.effectAllowed = 'copy';
        }
        selectInstrument(key);
      });
    });
  }

  function instrumentManagerButton(procedureKey) {
    return '<button type="button" class="twod-manage-tools" data-manage-procedure="' + procedureKey + '" title="新增、删除或恢复本术式器械">⚙ 管理</button>';
  }

  function buildGEInstrumentShelf() {
    var list = document.getElementById('inst-shelf-list');
    if (!list) return;
    var tools = catalogTools('eus_ge');
    list.innerHTML = '<div id="twod-ge-branch-selector"><span>EUS-GE 肠袢准备分支 · 二选一</span><p>选择推荐准备路径后，卡片显示建议顺序；仍可直接拖任一可见器械查看独立画面。两条准备方式不混为一条流程。</p><div><button type="button" data-ge-branch="epass">EPASS 双球囊<br><em>目标肠袢稳定</em></button><button type="button" data-ge-branch="filling">肠袢充盈导管<br><em>充盈定位</em></button></div><small id="twod-ge-branch-note"></small><div class="twod-ge-branch-flow" id="twod-ge-branch-flow"></div></div>' +
      (tools.map(function (tool) { return toolCardMarkup(tool, 'twod-ge-tool-card', 'eus_ge'); }).join('') || '<div class="twod-empty-tool-list">当前术式没有显示中的器械。可在“管理”中恢复或新增。</div>');
    bindProcedureToolCards(list);
    list.querySelectorAll('[data-ge-branch]').forEach(function (button) { button.onclick = function () { setGEBranch(button.getAttribute('data-ge-branch')); }; });
    setGEBranch(state.geBranch);
    var header = document.querySelector('#sidebar-instruments > .inst-shelf-header');
    if (header) {
      var count = header.querySelector('.inst-count-badge'); if (count) count.textContent = tools.length + ' 件就绪';
      if (!header.querySelector('.twod-manage-tools')) header.insertAdjacentHTML('beforeend', instrumentManagerButton('eus_ge'));
    }
  }

  function buildProcedureInstrumentShelf(sidebar, panelId, title, procedureKey, cardClass) {
    if (!sidebar) return;
    var panel = document.getElementById(panelId);
    if (!panel) { panel = document.createElement('div'); panel.id = panelId; }
    var tools = catalogTools(procedureKey);
    panel.innerHTML = '<div class="inst-shelf-header twod-pd-tool-header"><h2><span>🔬</span> ' + title + '</h2><div class="twod-tool-head-actions"><span class="inst-count-badge">' + tools.length + ' 件就绪</span>' + instrumentManagerButton(procedureKey) + '</div></div>' +
      '<div class="twod-pd-tool-hint">确认手术点位后，将器械拖到高亮区域。每件器械是独立教学模块，不表示每位患者必须依次使用全部器械；示意图不等同于品牌实物。</div>' +
      '<div class="twod-pd-tool-list">' + (tools.map(function (tool) { return toolCardMarkup(tool, cardClass, procedureKey); }).join('') || '<div class="twod-empty-tool-list">当前术式没有显示中的器械。可在“管理”中恢复或新增。</div>') + '</div>';
    var originalHeader = sidebar.querySelector(':scope > .inst-shelf-header');
    if (!panel.parentNode) sidebar.insertBefore(panel, originalHeader || null);
    bindProcedureToolCards(panel);
    syncTeachingStepBadges(panel, procedureKey);
  }

  function refreshInstrumentShelves() {
    var sidebar = document.getElementById('sidebar-instruments');
    if (!sidebar) return;
    registerCustomTools();
    buildGEInstrumentShelf();
    buildPDInstrumentShelf(sidebar);
    buildHGSInstrumentShelf(sidebar);
    buildCDSInstrumentShelf(sidebar);
    buildPFCInstrumentShelf(sidebar);
    buildRVInstrumentShelf(sidebar);
    buildAGInstrumentShelf(sidebar);
    buildGBDInstrumentShelf(sidebar);
    buildERCPEyeInstrumentShelf(sidebar);
    buildPOEMInstrumentShelf(sidebar);
    buildEDATInstrumentShelf(sidebar);
    buildBiliaryBiopsyInstrumentShelf(sidebar);
    buildFNBInstrumentShelf(sidebar);
    buildCPNInstrumentShelf(sidebar);
    buildESDInstrumentShelf(sidebar);
    if (state.procedure === 'esd' && window.ESDTeaching) {
      if (!catalogTools('esd').some(function (tool) { return tool.key === state.instrument; })) state.instrument = null;
      window.ESDTeaching.setTool(state.instrument ? getToolActionKey(state.instrument) : null);
      document.querySelectorAll('#twod-esd-instruments [data-tool]').forEach(function (card) {
        card.classList.toggle('twod-selected', card.getAttribute('data-tool') === state.instrument);
      });
    }
  }

  function toolManagerProcedureOptions(selected) {
    return PROCEDURE_ORDER.map(function (key) {
      var procedure = PROCEDURES[key];
      return '<option value="' + key + '"' + (key === selected ? ' selected' : '') + '>' + escapeHTML(procedure.short + ' · ' + procedure.title) + '</option>';
    }).join('');
  }

  function renderInstrumentManager() {
    var modal = document.getElementById('twod-instrument-manager'); if (!modal) return;
    var procedureKey = PROCEDURES[modal.getAttribute('data-procedure')] ? modal.getAttribute('data-procedure') : (state.procedure || 'eus_ge');
    modal.setAttribute('data-procedure', procedureKey);
    var procedure = PROCEDURES[procedureKey];
    var processLabel = procedureKey === 'esd' ? '局部交互过程' : '过程图帧';
    var actionOptions = (INSTRUMENT_CATALOG[procedureKey] || []).map(function (tool) {
      return '<option value="' + escapeHTML(tool.key) + '">' + escapeHTML(TOOL_LABELS[tool.key] || tool.name) + ' → 复用该器械的' + processLabel + '</option>';
    }).join('');
    var rows = catalogTools(procedureKey, true).map(function (tool) {
      var hidden = isToolHidden(procedureKey, tool.key);
      var custom = !tool.builtin;
      return '<li class="twod-tool-manager-row' + (hidden ? ' is-hidden' : '') + '"><span class="twod-tool-manager-dot" style="background:' + escapeHTML(tool.color || '#8b5a4c') + '"></span><div><b>' + escapeHTML(tool.name) + '</b><small>' + (custom ? '自定义器械 · 复用“' + escapeHTML(TOOL_LABELS[tool.actionKey] || tool.actionKey) + '”' + processLabel : '内置器械') + '</small></div>' +
        (custom
          ? '<button type="button" data-delete-custom-tool="' + escapeHTML(tool.key) + '">删除</button>'
          : '<button type="button" data-toggle-built-in-tool="' + escapeHTML(tool.key) + '">' + (hidden ? '恢复' : '从本术式隐藏') + '</button>') + '</li>';
    }).join('') || '<li class="twod-tool-manager-empty">暂无器械。请新增一件并绑定' + processLabel + '。</li>';
    modal.innerHTML =
      '<div class="twod-tool-manager-dialog" role="dialog" aria-modal="true" aria-label="器械管理器">' +
        '<div class="twod-tool-manager-head"><div><span>器械配置中心</span><h2>右侧器械栏 · 可增删</h2></div><button type="button" class="twod-tool-manager-close" title="关闭">×</button></div>' +
        '<div class="twod-tool-manager-body">' +
          '<label class="twod-manager-field twod-manager-procedure">归属术式<select id="twod-manager-procedure">' + toolManagerProcedureOptions(procedureKey) + '</select></label>' +
          '<p class="twod-manager-note">新增卡片会保存到当前浏览器。请选择一个已有“' + processLabel + '”作为交互模板；若要新增独立临床过程，仍需补充经临床审核的素材与交互定义。</p>' +
          '<form id="twod-tool-manager-form" class="twod-tool-manager-form">' +
            '<h3>新增器械</h3>' +
            '<label class="twod-manager-field">器械名称<input id="twod-new-tool-name" required maxlength="36" placeholder="例如：扩张球囊导管"></label>' +
            '<label class="twod-manager-field">对应操作过程<select id="twod-new-tool-action" required>' + actionOptions + '</select></label>' +
            '<div class="twod-manager-inline"><label class="twod-manager-field">强调色<input id="twod-new-tool-color" type="color" value="#8b5a4c"></label><label class="twod-manager-field">图片相对路径（可选）<input id="twod-new-tool-image" maxlength="160" placeholder="media/official_photos/xxx.jpg"></label></div>' +
            '<label class="twod-manager-field">标签 / 说明<input id="twod-new-tool-tag" maxlength="48" placeholder="例如：沿导丝同轴推进"></label>' +
            '<label class="twod-manager-field">要点（用“/”分隔）<input id="twod-new-tool-specs" maxlength="120" placeholder="规格待确认 / 教学示意 / 需术者确认"></label>' +
            '<button type="submit" class="twod-manager-add">＋ 添加到 ' + escapeHTML(procedure.short) + ' 器械栏</button>' +
          '</form>' +
          '<div class="twod-tool-manager-list-head"><h3>现有器械</h3><button type="button" id="twod-reset-procedure-tools">恢复本术式默认器械</button></div>' +
          '<ul class="twod-tool-manager-list">' + rows + '</ul>' +
        '</div>' +
        '<div class="twod-tool-manager-footer"><button type="button" id="twod-export-tool-config">导出配置</button><label class="twod-import-tool-config">导入配置<input type="file" id="twod-import-tool-config" accept="application/json"></label><small>删除内置器械仅在本浏览器隐藏，可随时恢复。</small></div>' +
      '</div>';

    modal.querySelector('.twod-tool-manager-close').onclick = closeInstrumentManager;
    modal.querySelector('#twod-manager-procedure').onchange = function () { modal.setAttribute('data-procedure', this.value); renderInstrumentManager(); };
    modal.querySelector('#twod-tool-manager-form').onsubmit = function (event) {
      event.preventDefault();
      var name = modal.querySelector('#twod-new-tool-name').value.trim();
      var actionKey = modal.querySelector('#twod-new-tool-action').value;
      if (!name || !TOOL_LABELS[actionKey]) return;
      var specs = modal.querySelector('#twod-new-tool-specs').value.split('/').map(function (value) { return value.trim(); }).filter(Boolean);
      instrumentSettings.added.push({
        key: 'custom_' + procedureKey + '_' + Date.now().toString(36), procedure: procedureKey,
        name: name, icon: '🧩', color: modal.querySelector('#twod-new-tool-color').value || '#8b5a4c',
        image: modal.querySelector('#twod-new-tool-image').value.trim(), tag: modal.querySelector('#twod-new-tool-tag').value.trim() || '自定义教学器械',
        source: '自定义器械', specs: specs.length ? specs : ['需补充规格资料', '教学示意', '临床使用需术者确认'], actionKey: actionKey
      });
      saveInstrumentSettings(); refreshInstrumentShelves(); renderInstrumentManager();
      showMessage('已添加“' + name + '”。它将复用所选' + processLabel + '，不代表已创建新的临床过程。', 'success');
    };
    modal.querySelectorAll('[data-toggle-built-in-tool]').forEach(function (button) {
      button.onclick = function () {
        var key = button.getAttribute('data-toggle-built-in-tool'); var uid = toolUid(procedureKey, key); var index = instrumentSettings.hidden.indexOf(uid);
        if (index === -1) instrumentSettings.hidden.push(uid); else instrumentSettings.hidden.splice(index, 1);
        if (state.instrument === key) state.instrument = null;
        saveInstrumentSettings(); refreshInstrumentShelves(); renderInstrumentManager();
      };
    });
    modal.querySelectorAll('[data-delete-custom-tool]').forEach(function (button) {
      button.onclick = function () {
        var key = button.getAttribute('data-delete-custom-tool');
        instrumentSettings.added = instrumentSettings.added.filter(function (tool) { return tool.key !== key; });
        instrumentSettings.hidden = instrumentSettings.hidden.filter(function (uid) { return uid !== toolUid(procedureKey, key); });
        delete TOOL_LABELS[key]; delete TOOL_EFFECTS[key]; if (state.instrument === key) state.instrument = null;
        saveInstrumentSettings(); refreshInstrumentShelves(); renderInstrumentManager();
      };
    });
    modal.querySelector('#twod-reset-procedure-tools').onclick = function () {
      instrumentSettings.added = instrumentSettings.added.filter(function (tool) { return tool.procedure !== procedureKey; });
      instrumentSettings.hidden = instrumentSettings.hidden.filter(function (uid) { return uid.indexOf(procedureKey + '::') !== 0; });
      saveInstrumentSettings(); refreshInstrumentShelves(); renderInstrumentManager();
    };
    modal.querySelector('#twod-export-tool-config').onclick = exportInstrumentSettings;
    modal.querySelector('#twod-import-tool-config').onchange = importInstrumentSettings;
  }

  function openInstrumentManager(procedureKey) {
    var modal = document.getElementById('twod-instrument-manager'); if (!modal) return;
    modal.setAttribute('data-procedure', PROCEDURES[procedureKey] ? procedureKey : (state.procedure || 'eus_ge'));
    modal.classList.remove('hidden'); renderInstrumentManager();
  }
  function closeInstrumentManager() { var modal = document.getElementById('twod-instrument-manager'); if (modal) modal.classList.add('hidden'); }
  function exportInstrumentSettings() {
    var blob = new Blob([JSON.stringify(instrumentSettings, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a'); link.href = url; link.download = 'eus-instrument-catalog.json'; link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function importInstrumentSettings(event) {
    var file = event.target.files && event.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var incoming = JSON.parse(reader.result);
        if (!incoming || !Array.isArray(incoming.added) || !Array.isArray(incoming.hidden)) throw new Error('invalid');
        instrumentSettings.added = incoming.added.filter(function (tool) { return tool && tool.key && tool.name && PROCEDURES[tool.procedure] && TOOL_LABELS[tool.actionKey]; });
        instrumentSettings.hidden = incoming.hidden.filter(function (uid) { return typeof uid === 'string' && uid.indexOf('::') > 0; });
        saveInstrumentSettings(); refreshInstrumentShelves(); renderInstrumentManager(); showMessage('器械配置已导入。', 'success');
      } catch (error) { showMessage('配置文件格式不正确，未导入。', 'warning'); }
    };
    reader.readAsText(file);
  }
  function installInstrumentManager() {
    if (document.getElementById('twod-instrument-manager')) return;
    var modal = document.createElement('div'); modal.id = 'twod-instrument-manager'; modal.className = 'twod-instrument-manager hidden'; document.body.appendChild(modal);
    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-manage-procedure]');
      if (!button) return;
      event.preventDefault(); event.stopPropagation(); openInstrumentManager(button.getAttribute('data-manage-procedure'));
    });
    modal.addEventListener('click', function (event) { if (event.target === modal) closeInstrumentManager(); });
  }

  function medicalReviewProcedureOptions(selected) {
    return PROCEDURE_ORDER.map(function (key) {
      var procedure = PROCEDURES[key];
      return '<option value="' + key + '"' + (key === selected ? ' selected' : '') + '>' + escapeHTML(procedure.short + ' · ' + procedure.title) + '</option>';
    }).join('');
  }
  function medicalReviewSourcesMarkup(sources) {
    return (sources || []).map(function (item) {
      var link = item.href ? '<a href="' + escapeHTML(item.href) + '" target="_blank" rel="noopener noreferrer">打开来源 ↗</a>' : '<span class="twod-review-source-static">项目内资料</span>';
      return '<li><span>' + escapeHTML(item.type || '依据') + '</span><div><b>' + escapeHTML(item.title || '未命名来源') + '</b>' + (item.note ? '<small>' + escapeHTML(item.note) + '</small>' : '') + '</div>' + link + '</li>';
    }).join('') || '<li class="twod-review-empty">尚未登记来源；请先补齐后再进入审核。</li>';
  }
  function medicalReviewFocusMarkup(focus) {
    return (focus || []).map(function (item) { return '<li>' + escapeHTML(item) + '</li>'; }).join('');
  }
  function renderMedicalReviewLedger() {
    var modal = document.getElementById('twod-medical-review-ledger'); if (!modal) return;
    var procedureKey = modal.getAttribute('data-procedure') || state.procedure || state.previewProcedure || 'eus_ge';
    if (!PROCEDURES[procedureKey]) procedureKey = 'eus_ge';
    var definition = medicalReviewDefinition(procedureKey);
    var record = reviewRecordFor(procedureKey);
    var registry = medicalRegistry();
    var procedure = PROCEDURES[procedureKey];
    modal.innerHTML =
      '<section class="twod-review-dialog" role="dialog" aria-modal="true" aria-label="医学依据与审核台账">' +
        '<header class="twod-review-head"><div><span>MEDICAL TRACEABILITY · ' + escapeHTML((registry.evidenceVersion || '未载入版本')) + '</span><h2>医学依据 / 审核台账</h2><p>来源固定在版本化台账中；审核人、日期和意见只在实际审核后填写。</p></div><button type="button" class="twod-tool-manager-close" id="twod-medical-review-close" aria-label="关闭">×</button></header>' +
        '<div class="twod-review-body">' +
          '<div class="twod-review-picker"><label>当前教学模块<select id="twod-review-procedure">' + medicalReviewProcedureOptions(procedureKey) + '</select></label><div><b>' + escapeHTML(procedure.short) + ' · ' + escapeHTML(procedure.title) + '</b><small data-medical-review-progress>' + medicalReviewProgress() + '</small></div></div>' +
          '<section class="twod-review-scope"><span>医学使用边界</span><p>' + escapeHTML(definition.scope) + '</p></section>' +
          '<div class="twod-review-columns"><section><h3>医学依据 <small>v' + escapeHTML(registry.evidenceVersion || '待补充') + '</small></h3><ul class="twod-review-sources">' + medicalReviewSourcesMarkup(definition.sources) + '</ul></section><section><h3>本模块审核要点</h3><ul class="twod-review-focus">' + medicalReviewFocusMarkup(definition.focus) + '</ul></section></div>' +
          '<section class="twod-review-record"><div><h3>审核记录</h3><p>默认记录在本机浏览器；请导出并按医院/课题组流程归档。未填写审核人和日期即不视为已完成审核。</p></div>' +
            '<div class="twod-review-form">' +
              '<label>审核状态<select id="twod-review-status"><option value="pending"' + (record.status === 'pending' ? ' selected' : '') + '>待指定审核人</option><option value="in_review"' + (record.status === 'in_review' ? ' selected' : '') + '>审核中</option><option value="revise"' + (record.status === 'revise' ? ' selected' : '') + '>需修订</option><option value="recorded"' + (record.status === 'recorded' ? ' selected' : '') + '>已记录 · 仍需机构流程确认</option></select></label>' +
              '<label>审核人<input id="twod-review-reviewer" value="' + escapeHTML(record.reviewer) + '" placeholder="待指定"></label>' +
              '<label>审核角色 / 专业<input id="twod-review-role" value="' + escapeHTML(record.reviewerRole) + '" placeholder="' + escapeHTML(definition.reviewerRole || '待指定') + '"></label>' +
              '<label>审核日期<input id="twod-review-date" type="date" value="' + escapeHTML(record.reviewDate) + '"></label>' +
              '<label class="twod-review-note">审核意见 / 修改要求<textarea id="twod-review-note" placeholder="可记录需核对的图像、文字、器械流程或风险表述">' + escapeHTML(record.note) + '</textarea></label>' +
            '</div>' +
            '<div class="twod-review-record-meta"><span>当前状态：' + escapeHTML(reviewStatusLabel(record.status)) + '</span><small>' + (record.updatedAt ? '依据版本：' + escapeHTML(record.evidenceVersion || '未记录') + ' · 最后保存：' + escapeHTML(record.updatedAt.replace('T', ' ').slice(0, 19)) : '尚未填写审核记录') + '</small></div>' +
          '</section>' +
        '</div>' +
        '<footer class="twod-review-footer"><button type="button" id="twod-save-review-record">保存本模块记录</button><button type="button" id="twod-export-review-ledger">导出全模块台账 JSON</button><small>本工具不能替代正式电子签名或机构审核流程。</small></footer>' +
      '</section>';
    modal.querySelector('#twod-medical-review-close').onclick = closeMedicalReviewLedger;
    modal.querySelector('#twod-review-procedure').onchange = function (event) { modal.setAttribute('data-procedure', event.target.value); renderMedicalReviewLedger(); };
    modal.querySelector('#twod-save-review-record').onclick = function () {
      var date = modal.querySelector('#twod-review-date').value;
      var reviewer = modal.querySelector('#twod-review-reviewer').value.trim();
      medicalReviewSettings.records[procedureKey] = {
        status: modal.querySelector('#twod-review-status').value,
        reviewer: reviewer,
        reviewerRole: modal.querySelector('#twod-review-role').value.trim(),
        reviewDate: date,
        note: modal.querySelector('#twod-review-note').value.trim(),
        evidenceVersion: medicalRegistry().evidenceVersion || '未载入',
        updatedAt: new Date().toISOString()
      };
      saveMedicalReviewSettings(); syncMedicalReviewEntry(); renderMedicalReviewLedger();
      showMessage(reviewer && date ? '审核人和日期已保存；请按机构流程导出台账归档。' : '记录已保存，但尚未填写审核人或日期，状态仍不可视为完成审核。', reviewer && date ? 'success' : 'warning');
    };
    modal.querySelector('#twod-export-review-ledger').onclick = exportMedicalReviewLedger;
  }
  function openMedicalReviewLedger(procedureKey) {
    var modal = document.getElementById('twod-medical-review-ledger'); if (!modal) return;
    modal.setAttribute('data-procedure', PROCEDURES[procedureKey] ? procedureKey : (state.procedure || state.previewProcedure || 'eus_ge'));
    modal.classList.remove('hidden'); renderMedicalReviewLedger();
  }
  function closeMedicalReviewLedger() {
    var modal = document.getElementById('twod-medical-review-ledger'); if (modal) modal.classList.add('hidden');
  }
  function exportMedicalReviewLedger() {
    var registry = medicalRegistry();
    var payload = {
      schemaVersion: registry.schemaVersion || 'medical-review-register/v1',
      evidenceVersion: registry.evidenceVersion || '未载入',
      baselineDate: registry.baselineDate || '',
      exportedAt: new Date().toISOString(),
      notice: registry.purpose || '教学原型审核台账，不构成正式电子签名。',
      modules: PROCEDURE_ORDER.map(function (key) {
        var procedure = PROCEDURES[key];
        return { key: key, short: procedure.short, title: procedure.title, evidence: medicalReviewDefinition(key), reviewRecord: reviewRecordFor(key) };
      })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a'); link.href = url; link.download = 'medical-review-ledger-' + new Date().toISOString().slice(0, 10) + '.json'; link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    showMessage('已导出全模块医学依据与审核台账 JSON。', 'success');
  }
  function installMedicalReviewLedger() {
    if (document.getElementById('twod-medical-review-ledger')) return;
    var modal = document.createElement('div'); modal.id = 'twod-medical-review-ledger'; modal.className = 'twod-medical-review-ledger hidden'; document.body.appendChild(modal);
    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-medical-review-ledger]');
      if (!button) return;
      event.preventDefault(); event.stopPropagation(); openMedicalReviewLedger(button.getAttribute('data-procedure') || state.procedure || state.previewProcedure || 'eus_ge');
    });
    modal.addEventListener('click', function (event) { if (event.target === modal) closeMedicalReviewLedger(); });
  }

  function buildWorkspace() {
    var viewport = stage();
    if (!viewport) return;
    if (workspace()) { bindWorkspaceInteractions(); return; }
    var panel = document.createElement('div');
    panel.id = 'two-d-workspace'; panel.className = 'hidden';
    panel.innerHTML =
      '<div class="twod-toolbar">' +
        '<div><span class="twod-mode-pill">2D 互动讲解</span><b id="twod-toolbar-title">EUS-GE 术前沟通</b><small class="twod-medical-disclaimer">医学教学示意 · 不替代个体化诊疗与术者决策</small></div>' +
        '<div class="twod-toolbar-actions"><button type="button" id="twod-review-ledger" class="twod-review-ledger-button">📋 依据 / 审核</button><button type="button" id="twod-compare-toggle" class="twod-compare-toggle">病变 / 术后对比</button><button type="button" id="twod-reset" class="twod-reset hidden">↺ 返回 3D</button></div>' +
      '</div>' +
      '<div class="twod-canvas" id="twod-canvas">' +
        '<img id="two-d-anatomy-image" alt="EUS-GE 胃空肠吻合术 2D 解剖示意" draggable="false">' +
        '<img id="two-d-transition-image" class="twod-transition-image" alt="当前器械的临床操作状态" draggable="false">' +
        '<div id="twod-target-zone" class="twod-target-zone hidden" role="button" tabindex="0" aria-label="选择胃空肠吻合点"><span></span><b>胃—空肠吻合点</b><small>点击确认手术点位</small></div>' +
        '<div class="twod-lesion-label"><i></i><b>十二指肠梗阻病变</b><span>手术需绕过此处</span></div>' +
        '<div id="twod-effect-layer" class="twod-effect-layer"></div>' +
        '<div id="twod-caption" class="twod-caption hidden"><b></b><span></span></div>' +
        '<div id="twod-process" class="twod-process hidden"><strong></strong><div></div></div>' +
        '<div id="twod-message" class="twod-message hidden"></div>' +
        '<div id="twod-compare-view" class="twod-compare-view hidden"><div class="twod-compare-head"><div><b>病变与术后旁路对比</b><span>重点观察胃内容物去向：病变仍在，但食物改道通过</span></div><button type="button" id="twod-compare-close">返回操作画面</button></div><div class="twod-compare-summary"><span class="blocked">术前：胃内大量潴留</span><i>病变仍在</i><span class="restored">术后：新通道恢复流通</span></div><div class="twod-compare-grid"><figure class="is-preop"><div class="twod-compare-image"><img src="media/two_d_surgery/compare_preop_blocked_v2.png" alt="术前胃内容物在十二指肠梗阻处停止"><em class="twod-state-chip">梗阻 · 流动停止</em></div><figcaption><b>术前 · 胃潴留明显</b><span>十二指肠病变堵住出口，胃内容物在梗阻前积聚</span></figcaption></figure><figure class="is-postop"><div class="twod-compare-image"><img src="media/two_d_surgery/compare_postop_bypass_v2.png" alt="术后食物通过胃空肠支架绕过病变"><em class="twod-state-chip">旁路 · 流动恢复</em></div><figcaption><b>术后 · 胃潴留减轻</b><span>食物经胃—空肠新通道进入空肠，绕过仍然存在的病变</span></figcaption></figure></div></div>' +
      '</div>';
    viewport.appendChild(panel);
    bindWorkspaceInteractions();
  }

  function bindWorkspaceInteractions() {
    var reset = document.getElementById('twod-reset');
    var reviewLedger = document.getElementById('twod-review-ledger');
    var compareToggle = document.getElementById('twod-compare-toggle');
    var compareClose = document.getElementById('twod-compare-close');
    var target = document.getElementById('twod-target-zone');
    if (reset) reset.onclick = resetWorkspace;
    if (reviewLedger) reviewLedger.onclick = function () { openMedicalReviewLedger(state.procedure || state.previewProcedure || 'eus_ge'); };
    if (compareToggle) compareToggle.onclick = function () { toggleComparison(true); };
    if (compareClose) compareClose.onclick = function () { toggleComparison(false); };
    if (!target) return;
    target.onclick = activateTarget;
    target.onkeydown = function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateTarget(); } };
  }

  function configure2DProcedure() {
    var isPD = state.procedure === 'eus_pd';
    var isHGS = state.procedure === 'eus_hgs';
    var isCDS = state.procedure === 'eus_cds';
    var isPFC = state.procedure === 'eus_pfc';
    var isRV = state.procedure === 'eus_rv';
    var isAG = state.procedure === 'eus_ag';
    var isGBD = state.procedure === 'eus_gbd';
    var isERCPEye = state.procedure === 'ercp_eye';
    var isPOEM = state.procedure === 'poem';
    var isEDAT = state.procedure === 'edat';
    var isBiliaryBiopsy = state.procedure === 'biliary_biopsy';
    var isFNB = state.procedure === 'eus_fnb';
    var isCPN = state.procedure === 'eus_cpn';
    var isESD = state.procedure === 'esd';
    var panel = workspace(); if (!panel) return;
    panel.classList.toggle('twod-procedure-pd', isPD);
    panel.classList.toggle('twod-procedure-hgs', isHGS);
    panel.classList.toggle('twod-procedure-cds', isCDS);
    panel.classList.toggle('twod-procedure-pfc', isPFC);
    panel.classList.toggle('twod-procedure-rv', isRV);
    panel.classList.toggle('twod-procedure-ag', isAG);
    panel.classList.toggle('twod-procedure-gbd', isGBD);
    panel.classList.toggle('twod-procedure-ercp', isERCPEye);
    panel.classList.toggle('twod-procedure-poem', isPOEM);
    panel.classList.toggle('twod-procedure-edat', isEDAT);
    panel.classList.toggle('twod-procedure-biliary-biopsy', isBiliaryBiopsy);
    panel.classList.toggle('twod-procedure-fnb', isFNB);
    panel.classList.toggle('twod-procedure-cpn', isCPN);
    panel.classList.toggle('twod-procedure-esd', isESD);
    // Keep ESD inside the shared 2D procedure canvas, rather than mounting a
    // second interaction system with its own stepper and controls.
    if (window.ESDTeaching) window.ESDTeaching.unmount();
    var config = isEDAT ? {
      mode: 'EDAT · 2D 互动', title: '直视化阑尾腔诊疗术',
      targetLeft: '43%', targetTop: '44%', targetAria: '确认盲肠至阑尾开口及腔内梗阻操作区', targetLabel: '盲肠—阑尾开口与腔内梗阻区',
      lesionLeft: '61%', lesionTop: '45%', lesionTitle: '阑尾腔粪石梗阻与炎性水肿', lesionNote: '未穿孔教学情境，适应证须评估',
      anatomyAlt: 'EDAT 经盲肠阑尾开口进入阑尾腔，直视处理粪石并建立即时引流支持的 2D 解剖示意',
      compareTitle: '阑尾腔梗阻与即时引流支持对比', compareNote: '右图只示意粪石处理后支架维持阑尾腔即时引流支持；炎症并未消失，不代表已治愈或不再需要抗感染、手术备选和随访评估。',
      summary: '<span class="blocked">处理前：粪石梗阻、腔内潴留与炎性水肿</span><i>需严格患者选择</i><span class="restored">处理后：即时引流支持，炎症仍需管理</span>',
      preImage: EDAT_STATES.initial.image, postImage: EDAT_STATES.edat_stent.image,
      preChip: '粪石梗阻 · 潴留', postChip: '支架留置 · 即时引流支持',
      preTitle: '处理前 · 阑尾腔粪石梗阻', postTitle: '处理后 · 支架维持即时引流',
      preNote: '教学图示意未穿孔阑尾炎伴腔内粪石，不能据此替代影像与临床分型', postNote: '粪石已处理、支架留置以维持引流；局部炎症仍在，后续治疗与随访由团队决定',
      compareToggle: '梗阻 / 即时引流对比'
    } : isBiliaryBiopsy ? {
      mode: 'DSOC-Bx · 2D 互动', title: '直视胆道镜下狭窄评估与靶向活检',
      targetLeft: '54%', targetTop: '45%', targetAria: '确认乳头至胆总管狭窄靶向取样区', targetLabel: '乳头—胆总管狭窄取样区',
      lesionLeft: '62%', lesionTop: '48%', lesionTitle: '不明原因胆道狭窄', lesionNote: '性质待形态与病理综合评估',
      anatomyAlt: '经乳头直视胆道镜抵达胆总管狭窄段并靶向活检的 2D 解剖示意',
      compareTitle: '胆道狭窄与靶向取样后状态对比', compareNote: '右图只表示已在可疑处完成组织取样；狭窄本身仍存在，病变性质与下一步治疗必须等待病理并结合完整资料判断。',
      summary: '<span class="blocked">取样前：不明原因狭窄待进一步评估</span><i>不预设良恶性</i><span class="restored">取样后：标本已获取，等待病理</span>',
      preImage: BILIARY_BIOPSY_STATES.initial.image, postImage: 'media/two_d_surgery/biliary_biopsy_04_sampled_v1.png',
      preChip: '狭窄 · 待明确', postChip: '靶向取样后 · 等待病理',
      preTitle: '取样前 · 不明原因胆道狭窄', postTitle: '取样后 · 狭窄仍在，标本已获取',
      preNote: '狭窄形态不规则，但不能凭图像单独预设病因或良恶性', postNote: '示意取样点；并不表示狭窄已解除、病因已确定或后续方案已经决定',
      compareToggle: '狭窄 / 取样后对比'
    } : isPOEM ? {
      mode: 'POEM · 2D 互动', title: '经口内镜下肌切开术',
      targetLeft: '47%', targetTop: '49%', targetAria: '确认下段食管至食管胃交界操作区', targetLabel: '下段食管—贲门紧缩区',
      lesionLeft: '49%', lesionTop: '53%', lesionTitle: '食管胃交界功能性紧缩', lesionNote: '食管排空受阻的教学情境',
      anatomyAlt: 'POEM 经下段食管抵达食管胃交界，在黏膜下隧道内处理紧缩肌层的 2D 解剖示意',
      compareTitle: '贲门紧缩与即时交界开放对比', compareNote: '右图仅示意肌切开后交界的即时解剖变化和入口夹闭，不代表症状消失、反流风险消失或长期疗效已经确定。',
      summary: '<span class="blocked">术前：交界紧缩，食管排空受阻</span><i>诊断与分型需完整评估</i><span class="restored">操作后：交界即时开放，入口已夹闭</span>',
      preImage: POEM_STATES.initial.image, postImage: POEM_STATES.poem_clip.image,
      preChip: '贲门紧缩 · 潴留', postChip: '肌切开后 · 入口夹闭',
      preTitle: '术前 · 食管胃交界紧缩', postTitle: '操作后 · 即时解剖状态',
      preNote: '紧缩的食管胃交界阻碍排空，食管内可见潴留', postNote: '示意肌层处理后交界较术前开放、黏膜入口夹闭；仍需结合症状、反流评估与随访',
      compareToggle: '术前紧缩 / 操作后对比'
    } : isERCPEye ? {
      mode: 'ERCP-DSOC · 2D 互动', title: '直视胆道镜辅助困难胆总管结石处理',
      targetLeft: '55%', targetTop: '49%', targetAria: '确认大乳头至下段胆总管结石操作区', targetLabel: '乳头—下段胆总管结石区',
      lesionLeft: '66%', lesionTop: '43%', lesionTitle: '嵌顿性胆总管结石', lesionNote: '阻断胆汁引流，需专业团队评估',
      anatomyAlt: 'ERCP 经乳头进入下段胆总管，以直视胆道镜辅助处理嵌顿结石的 2D 解剖示意',
      compareTitle: '结石梗阻与取石后胆道通畅对比', compareNote: '右图仅示意本次结石梗阻解除后的通路变化，不代表胆石病病因、感染风险或复发风险已消失。',
      summary: '<span class="blocked">术前：结石嵌顿，胆汁引流受阻</span><i>病因与残石需评估</i><span class="restored">处理后：胆总管通路恢复</span>',
      preImage: ERCP_EYE_STATES.initial.image, postImage: 'media/two_d_surgery/ercp_eye_05_patent_duct_v1.png',
      preChip: '嵌顿结石 · 梗阻', postChip: '结石处理后 · 通路开放',
      preTitle: '术前 · 下段胆总管结石', postTitle: '处理后 · 胆道通路示意',
      preNote: '嵌顿结石阻碍胆汁向肠腔排出', postNote: '示意本次梗阻解除后的胆道腔通畅，不等于已排除残石、感染或复发风险',
      compareToggle: '结石 / 处理后对比'
    } : isESD ? {
      mode: 'ESD · 2D 互动', title: '胃部内镜黏膜下剥离术',
      targetLeft: '50%', targetTop: '44%', targetAria: '确认胃黏膜表浅病灶区', targetLabel: '胃黏膜表浅病灶',
      lesionLeft: '50%', lesionTop: '44%', lesionTitle: '胃黏膜表浅病灶', lesionNote: '适应证需经内镜与临床评估', anatomyAlt: '胃部 ESD 局部胃壁层次医学示意',
      compareTitle: '病灶与即时切除创面对比', compareNote: '右图为即时切除创面教学示意，不表示已愈合或达到治愈标准；最终判断需病理与随访。', summary: '<span class="blocked">术前：表浅病灶仍在</span><i>切除后待病理</i><span class="restored">术后：即时创面，肌层保持连续</span>',
      preImage: 'media/two_d_surgery/esd_00_gastric_section_v2.png', postImage: 'media/two_d_surgery/esd_01_gastric_resection_bed_v2.png',
      preChip: '术前 · 表浅病灶', postChip: '切除后 · 创面尚未愈合', preTitle: '术前 · 黏膜表浅病灶', postTitle: '即时切除创面示意',
      preNote: '病灶位于胃黏膜表面，适应证不能仅凭本图判断。', postNote: '保留深层肌层；病理判读与后续随访另行决定。', compareToggle: '操作前 / 当前对比'
    } : isCPN ? {
      mode: 'EUS-CPN · 2D 互动', title: 'EUS 引导腹腔神经丛毁损术',
      targetLeft: '57%', targetTop: '42%', targetAria: '选择胃后壁至腹腔干神经丛靶区', targetLabel: '胃后壁—腹腔干神经丛靶区',
      lesionLeft: '43%', lesionTop: '63%', lesionTitle: '胰腺实性占位相关疼痛', lesionNote: '疼痛信号经腹腔神经丛传递',
      anatomyAlt: 'EUS-CPN 经胃后壁对腹腔干周围神经丛进行疼痛姑息干预的 2D 解剖示意',
      compareTitle: '疼痛信号与注射后缓解评估对比', compareNote: 'CPN 以缓解癌痛为目的，不缩小、切除或治愈肿瘤；镇痛程度与持续时间存在个体差异，仍需联合肿瘤与疼痛管理团队持续评估。',
      summary: '<span class="blocked">干预前：肿瘤相关疼痛信号活跃</span><i>肿瘤仍在</i><span class="restored">干预后：疼痛信号可减弱</span>',
      preImage: CPN_STATES.initial.image, postImage: CPN_STATES.cpn_needle.image,
      preChip: '癌痛 · 信号活跃', postChip: '姑息 · 信号减弱',
      preTitle: '干预前 · 肿瘤相关疼痛', postTitle: '注射后 · 疼痛缓解评估',
      preNote: '胰腺肿瘤仍存在，疼痛信号经腹腔神经丛相关通路传递', postNote: '示意局部注射后疼痛信号减弱；不等于根治或替代其他镇痛、抗肿瘤治疗',
      compareToggle: '疼痛 / 注射后对比'
    } : isFNB ? {
      mode: 'EUS-FNB · 2D 互动', title: 'EUS 引导胰腺占位组织取样',
      targetLeft: '55%', targetTop: '55%', targetAria: '选择胃后壁至胰腺占位安全取样点', targetLabel: '胃后壁—胰腺占位取样点',
      lesionLeft: '61%', lesionTop: '55%', lesionTitle: '胰腺实性占位', lesionNote: '影像需结合组织学确认',
      anatomyAlt: 'EUS-FNB 经胃后壁对胰腺占位进行组织取样的 2D 解剖示意',
      compareTitle: '病灶影像与组织样本获取对比', compareNote: '取样只获得诊断所需组织，不等于治疗或切除病灶；后续方案应等待病理结果并结合完整临床资料决定。',
      summary: '<span class="blocked">取样前：存在待明确的胰腺占位</span><i>不预设诊断</i><span class="restored">取样后：获得组织，等待病理</span>',
      preImage: FNB_STATES.initial.image, postImage: FNB_STATES.fnb_specimen.image,
      preChip: '占位 · 待明确', postChip: '样本 · 等待病理',
      preTitle: '取样前 · 胰腺实性占位', postTitle: '取样后 · 标本已送检',
      preNote: '影像发现病灶，但不能仅凭外观确认其性质', postNote: '组织标本已获得，病灶仍存在；最终病理及临床资料将决定后续诊疗方案',
      compareToggle: '病灶 / 取样后对比'
    } : isGBD ? {
      mode: 'EUS-GBD · 经球部 2D 互动', title: 'EUS 引导经球部胆囊内引流',
      targetLeft: '49%', targetTop: '47%', targetAria: '选择十二指肠球部至贴壁胆囊的内引流点', targetLabel: '球部—胆囊内引流点',
      lesionLeft: '72%', lesionTop: '38%', lesionTitle: '胆囊颈结石性梗阻', lesionNote: '壁增厚、胆汁淤积与高张力',
      anatomyAlt: 'EUS-GBD 经十二指肠球部至胆囊内引流 2D 解剖示意',
      compareTitle: '胆囊高张力与内引流后减压对比', compareNote: '右图为胆囊内引流建立后的教学示意：结石与基础病因仍在，并不表示胆囊炎已治愈。',
      summary: '<span class="blocked">术前：颈部结石造成胆囊高张力</span><i>结石仍在</i><span class="restored">引流后：胆汁可进入十二指肠</span>',
      preImage: GBD_STATES.initial.image, postImage: 'media/two_d_surgery/eus_gbd_05_decompressed_v2.png',
      preChip: '结石梗阻 · 高张力', postChip: '内引流 · 逐步减压',
      preTitle: '术前 · 胆囊颈结石梗阻', postTitle: '引流后 · 胆囊张力降低',
      preNote: '颈部结石阻断胆囊排空，胆囊壁增厚并出现胆汁淤积', postNote: 'LAMS 建立球部—胆囊内引流，结石仍在；是否进一步治疗和随访由团队决定'
    } : isAG ? {
      mode: 'EUS-AG · 2D 互动', title: 'EUS 引导顺行胆道治疗',
      targetLeft: '51%', targetTop: '23%', targetAria: '选择胃小弯至左肝内胆管顺行治疗入路点', targetLabel: '胃小弯—左肝内胆管入路点',
      lesionLeft: '57%', lesionTop: '58%', lesionTitle: '胆道远端狭窄 / 梗阻', lesionNote: '上游胆管扩张、胆汁淤积',
      anatomyAlt: 'EUS-AG 经胃左肝内胆管顺行跨狭窄治疗 2D 解剖示意',
      compareTitle: '胆道梗阻与顺行跨狭窄引流对比', compareNote: '本教学分支强调顺行跨越狭窄至肠腔；不建立肝胃永久引流通道，也不执行 EUS-RV 的乳头端接回导丝。',
      summary: '<span class="blocked">术前：远端狭窄阻断胆汁外流</span><i>病因仍需处理</i><span class="restored">术后：顺行跨狭窄向肠腔引流</span>',
      preImage: AG_STATES.initial.image, postImage: AG_STATES.ag_stent.image,
      preChip: '梗阻 · 胆汁淤积', postChip: '顺行 · 跨狭窄引流',
      preTitle: '术前 · 上游胆管扩张', postTitle: '术后 · 顺行通路建立',
      preNote: '远端胆道狭窄使上游胆管扩张，胆汁排出受阻', postNote: '示意支架顺行跨过狭窄并将胆汁引向肠腔；实际适应证、支架策略和风险评估需由专家团队确定'
    } : isRV ? {
      mode: 'EUS-RV · 2D 互动', title: 'EUS 引导胆道会师 ERCP', targetLeft: '53%', targetTop: '49%', targetAria: '选择十二指肠球部至胆总管会师穿刺点', targetLabel: '球部—胆总管会师点', lesionLeft: '67%', lesionTop: '62%', lesionTitle: '胆总管末端结石', lesionNote: 'ERCP 插管失败的救援情境', anatomyAlt: 'EUS-RV 胆总管会师 ERCP 2D 解剖示意', compareTitle: '插管失败与经乳头通路恢复对比', compareNote: '会师术恢复的是 ERCP 进入胆管的路径；后续取石、扩张或置管需按病因完成', summary: '<span class="blocked">术前：常规 ERCP 插管失败</span><i>病因仍需处理</i><span class="restored">术后：导丝建立经乳头通路</span>', preImage: RV_STATES.initial.image, postImage: RV_STATES.rv_guidewire.image, preChip: '困难插管 · 胆汁淤积', postChip: '会师 · 通路恢复', preTitle: '术前 · 末端结石伴扩张', postTitle: '术后 · 导丝越乳头到位', preNote: '良性胆道梗阻且常规插管失败，胆总管上游扩张', postNote: '导丝从胆管顺行越过乳头后，由 ERCP 在肠腔端接回；病因治疗仍需继续'
    } : isPFC ? {
      mode: 'EUS-PFC · 2D 互动', title: 'EUS 引导胰腺假性囊肿引流术',
      targetLeft: '55%', targetTop: '58%', targetAria: '选择胃后壁至胰腺假性囊肿引流点', targetLabel: '胃后壁—囊肿引流点',
      lesionLeft: '54%', lesionTop: '68%', lesionTitle: '胰腺假性囊肿', lesionNote: '成熟囊腔积液压迫胃壁',
      anatomyAlt: 'EUS 引导胃后壁至胰腺假性囊肿引流 2D 解剖示意',
      compareTitle: '囊肿压迫与术后减压对比', compareNote: '重点观察囊腔体积与引流方向：囊液经支架进入胃内，病因仍需另行处理',
      summary: '<span class="blocked">术前：囊腔积液压迫胃壁</span><i>病因仍需处理</i><span class="restored">术后：囊液经胃内引流</span>',
      preImage: PFC_STATES.initial.image, postImage: 'media/two_d_surgery/eus_pfc_05_reduced_v1.png',
      preChip: '囊肿 · 压迫', postChip: '引流 · 囊腔减压',
      preTitle: '术前 · 假性囊肿明显', postTitle: '术后 · 囊腔减压缩小',
      preNote: '成熟液体积聚紧贴胃后壁，造成局部压迫', postNote: '胃—囊肿引流通道建立后，囊液逐步排入胃内，囊腔缩小；仍需依病因和随访计划管理'
    } : isCDS ? {
      mode: 'EUS-CDS · 2D 互动', title: 'EUS-CDS 胆总管十二指肠吻合术',
      targetLeft: '60%', targetTop: '43%', targetAria: '选择十二指肠球部至扩张胆总管穿刺点', targetLabel: '球部—胆总管穿刺点',
      lesionLeft: '67%', lesionTop: '54%', lesionTitle: '胆总管远端恶性梗阻', lesionNote: '上游胆管扩张并淤积',
      anatomyAlt: 'EUS-CDS 十二指肠球部至胆总管引流 2D 解剖示意',
      compareTitle: '胆总管高压与术后减压对比', compareNote: '重点观察扩张胆总管和胆汁流向：远端梗阻仍在，但胆汁经支架流入十二指肠',
      summary: '<span class="blocked">术前：胆总管明显扩张</span><i>远端梗阻仍在</i><span class="restored">术后：经十二指肠引流</span>',
      preImage: CDS_STATES.initial.image, postImage: CDS_STATES.cds_stent.image,
      preChip: '梗阻 · 胆汁淤积', postChip: '引流 · 胆道减压',
      preTitle: '术前 · 胆总管高压', postTitle: '术后 · 胆肠引流建立',
      preNote: '远端恶性狭窄阻断胆汁排出，上游胆总管持续扩张', postNote: '全覆膜支架把胆汁引入十二指肠，上游胆管压力逐步下降'
    } : isHGS ? {
      mode: 'EUS-HGS · 2D 互动', title: 'EUS-HGS 肝胃吻合引流术',
      targetLeft: '50%', targetTop: '40%', targetAria: '选择胃小弯至左肝 B2 或 B3 胆管穿刺点', targetLabel: '胃小弯—左肝 B2/B3 穿刺点',
      lesionLeft: '55%', lesionTop: '29%', lesionTitle: '胆道远端梗阻', lesionNote: '左肝胆管扩张并淤积',
      anatomyAlt: 'EUS-HGS 胃小弯至左肝 B2/B3 胆管引流 2D 解剖示意',
      compareTitle: '胆汁淤积与术后减压对比', compareNote: '重点观察扩张肝内胆管和胆汁流向：梗阻仍在，但胆汁经肝胃支架进入胃内',
      summary: '<span class="blocked">术前：肝内胆管扩张</span><i>远端梗阻仍在</i><span class="restored">术后：经胃持续引流</span>',
      preImage: HGS_STATES.initial.image, postImage: HGS_STATES.hgs_stent.image,
      preChip: '梗阻 · 胆汁淤积', postChip: '引流 · 胆道减压',
      preTitle: '术前 · 肝内胆管高压', postTitle: '术后 · 肝胃引流建立',
      preNote: '远端梗阻阻断胆汁排出，左肝内胆管持续扩张', postNote: '半覆膜支架把胆汁引入胃腔，肝内胆管压力逐步下降'
    } : isPD ? {
      mode: 'EUS-PD · 2D 互动', title: 'EUS-PD 主胰管引流术',
      targetLeft: '45%', targetTop: '65%', targetAria: '选择胃后壁至主胰管穿刺点', targetLabel: '胃后壁—主胰管穿刺点',
      lesionLeft: '54%', lesionTop: '64%', lesionTitle: '主胰管梗阻 / 狭窄', lesionNote: '近端胰管扩张高压',
      anatomyAlt: 'EUS-PD 胃后壁至主胰管引流 2D 解剖示意',
      compareTitle: '胰管高压与术后减压对比', compareNote: '重点观察扩张胰管和胰液流向：狭窄仍在，但压力经支架释放',
      summary: '<span class="blocked">术前：近端胰管扩张</span><i>狭窄仍在</i><span class="restored">术后：经胃持续减压</span>',
      preImage: PD_STATES.initial.image, postImage: PD_STATES.pd_stent.image,
      preChip: '梗阻 · 胰液淤积', postChip: '引流 · 压力下降',
      preTitle: '术前 · 主胰管扩张', postTitle: '术后 · 胰管减压引流',
      preNote: '红色狭窄阻断胰液排出，近端胰管持续扩张', postNote: '示意塑料支架把胰液引入胃腔，狭窄上游压力下降；实际支架类型因病例而异'
    } : {
      mode: 'EUS-GE · 2D 互动', title: 'EUS-GE 术前沟通',
      targetLeft: '50%', targetTop: '66%', targetAria: '选择胃空肠吻合点', targetLabel: '胃—空肠吻合点',
      lesionLeft: '22%', lesionTop: '43%', lesionTitle: '十二指肠梗阻病变', lesionNote: '手术需绕过此处',
      anatomyAlt: 'EUS-GE 胃空肠吻合术 2D 解剖示意',
      compareTitle: '病变与术后旁路对比', compareNote: '重点观察胃内容物去向：病变仍在，但食物改道通过',
      summary: '<span class="blocked">术前：胃内大量潴留</span><i>病变仍在</i><span class="restored">术后：新通道恢复流通</span>',
      preImage: 'media/two_d_surgery/compare_preop_blocked_v2.png', postImage: 'media/two_d_surgery/compare_postop_bypass_v2.png',
      preChip: '梗阻 · 流动停止', postChip: '旁路 · 流动恢复',
      preTitle: '术前 · 胃潴留明显', postTitle: '术后 · 胃潴留减轻',
      preNote: '十二指肠病变堵住出口，胃内容物在梗阻前积聚', postNote: '食物经胃—空肠新通道进入空肠，绕过仍然存在的病变'
    };
    var mode = panel.querySelector('.twod-mode-pill');
    var title = document.getElementById('twod-toolbar-title');
    var target = document.getElementById('twod-target-zone');
    var lesion = panel.querySelector('.twod-lesion-label');
    var anatomy = image();
    if (mode) mode.textContent = config.mode;
    if (title) title.textContent = config.title;
    if (target) {
      target.style.left = config.targetLeft;
      target.style.top = config.targetTop;
      target.setAttribute('aria-label', config.targetAria);
      target.querySelector('b').textContent = config.targetLabel;
      target.querySelector('small').textContent = '点击确认手术点位';
    }
    if (lesion) {
      lesion.style.left = config.lesionLeft;
      lesion.style.top = config.lesionTop;
      lesion.querySelector('b').textContent = config.lesionTitle;
      lesion.querySelector('span').textContent = config.lesionNote;
    }
    if (anatomy) anatomy.alt = config.anatomyAlt;
    var comparisonToggle = document.getElementById('twod-compare-toggle');
    if (comparisonToggle) comparisonToggle.textContent = config.compareToggle || '病变 / 术后对比';
    var specimenStatus = document.getElementById('twod-fnb-specimen-status');
    if (specimenStatus) {
      specimenStatus.classList.remove('complete');
      specimenStatus.innerHTML = '<span>结果状态 · 非器械</span><b>组织标本尚未获得</b><p>完成 FNB 取样后，此处显示“标本已送检”。取样不等于即时诊断，也不治疗或切除病灶。</p>';
    }

    // The shelf persists between visits while the workflow state is reset.
    // Re-apply the selected path so hidden cards, titles and the next-step cue
    // cannot accidentally retain the previous visit's direct-path layout.
    if (isPFC) setPFCBranch(state.pfcBranch);
    if (isGBD) setGBDBranch(state.gbdBranch);
    var comparison = document.getElementById('twod-compare-view');
    if (!comparison) return;
    var headTitle = comparison.querySelector('.twod-compare-head b');
    var headNote = comparison.querySelector('.twod-compare-head span');
    var summary = comparison.querySelector('.twod-compare-summary');
    var figures = comparison.querySelectorAll('figure');
    if (headTitle) headTitle.textContent = config.compareTitle;
    if (headNote) headNote.textContent = config.compareNote;
    if (summary) summary.innerHTML = config.summary;
    if (figures.length === 2) {
      var preImage = figures[0].querySelector('img'); var postImage = figures[1].querySelector('img');
      var preChip = figures[0].querySelector('.twod-state-chip'); var postChip = figures[1].querySelector('.twod-state-chip');
      var preTitle = figures[0].querySelector('figcaption b'); var postTitle = figures[1].querySelector('figcaption b');
      var preNote = figures[0].querySelector('figcaption span'); var postNote = figures[1].querySelector('figcaption span');
      if (preImage) { preImage.src = config.preImage; preImage.alt = config.preTitle; }
      if (postImage) { postImage.src = config.postImage; postImage.alt = config.postTitle; }
      if (preChip) preChip.textContent = config.preChip;
      if (postChip) postChip.textContent = config.postChip;
      if (preTitle) preTitle.textContent = config.preTitle;
      if (postTitle) postTitle.textContent = config.postTitle;
      if (preNote) preNote.textContent = config.preNote;
      if (postNote) postNote.textContent = config.postNote;
    }
  }

  function procedureReady(key) {
    try {
      var procedure = PROCEDURES[key];
      if (!procedure) return false;
      return typeof activeOrgans !== 'undefined' && procedure.required.every(function (key) { return activeOrgans.has(key); });
    }
    catch (error) { return false; }
  }

  function hasRequiredOrgans() { return state.procedure ? procedureReady(state.procedure) : false; }

  function toggleComparison(show) {
    var comparison = document.getElementById('twod-compare-view'); if (!comparison) return;
    comparison.classList.toggle('hidden', !show);
  }

  function refreshGuide() {
    var status = document.getElementById('twod-organ-status');
    var guideTitle = document.getElementById('twod-guide-title');
    var prompt = document.getElementById('empty-stage-prompt');
    if (!status) return;
    var readyProcedures = PROCEDURE_ORDER.filter(procedureReady);
    if (!state.previewProcedure || !procedureReady(state.previewProcedure)) state.previewProcedure = readyProcedures[0] || null;
    var preview = state.previewProcedure ? PROCEDURES[state.previewProcedure] : null;
    if (guideTitle) guideTitle.textContent = '拖入器官，点击对应点位或右侧手术名称';
    if (readyProcedures.length > 1) status.textContent = readyProcedures.length + ' 个手术点位已就绪。悬停小点可在右侧查看名称；滚轮可放大器官和点位。';
    else if (preview) status.textContent = preview.short + ' 所需器官已就位：点击器官上的小点或右侧名称进入。';
    else if (isOrganActive('stomach')) status.textContent = '胃已就位；继续从左侧加入目标空肠、胰腺、肝脏或胆道';
    else if (isOrganActive('jejunum') || isOrganActive('pancreas') || isOrganActive('liver') || isOrganActive('biliary')) status.textContent = '目标器官已就位；继续从左侧加入胃';
    else status.textContent = '未放入器官时不显示手术点位';
    updateProcedurePanel();
    sync3DPointPositions();
    if (prompt) {
      prompt.innerHTML = '<span class="twod-empty-icon">🫀</span><h3>3D 器官工作区</h3><p>从左侧器官架拖入器官。胃可选择 ESD；胃＋空肠对应 EUS-GE；胃＋胰腺可选择 EUS-PD、EUS-PFC、EUS-FNB 或 EUS-CPN；胃＋胆道可选择 EUS-CDS、EUS-RV、EUS-GBD 或 ERCP 直视碎石；胃＋肝脏对应 EUS-HGS；胃＋肝脏＋胆道可选择 EUS-AG。</p>';
    }
  }

  function anchorForProcedure(key) {
    if (pointAnchors[key]) return pointAnchors[key];
    if (typeof rootGroup === 'undefined' || typeof THREE === 'undefined') return null;
    var spec = PROCEDURE_POINTS[key];
    var mesh = rootGroup.getObjectByName(spec.mesh);
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes.position) return null;
    if (mesh.userData.procedureAnchor) {
      pointAnchors[key] = { mesh: mesh, local: new THREE.Vector3().fromArray(mesh.userData.procedureAnchor) };
      return pointAnchors[key];
    }
    mesh.updateWorldMatrix(true, false);
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    var box = mesh.geometry.boundingBox;
    var size = box.getSize(new THREE.Vector3());
    var local = new THREE.Vector3(box.min.x + size.x * spec.xy[0], box.min.y + size.y * spec.xy[1], box.max.z + .02);
    var ray = new THREE.Raycaster();
    ray.set(mesh.localToWorld(local.clone()), new THREE.Vector3(0, 0, -1).transformDirection(mesh.matrixWorld));
    var hits = ray.intersectObject(mesh, false);
    if (hits.length) local = mesh.worldToLocal(hits[0].point.clone());
    else {
      // Curved/hollow organs may have no triangle at the requested XY. Snap to
      // the nearest actual surface vertex rather than leave a floating label.
      var positions = mesh.geometry.attributes.position;
      var best = Infinity;
      var desiredX = local.x, desiredY = local.y;
      for (var i = 0; i < positions.count; i++) {
        var x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        var score = Math.pow((x - desiredX) / Math.max(size.x, .001), 2) + Math.pow((y - desiredY) / Math.max(size.y, .001), 2) + .002 * Math.pow((box.max.z - z) / Math.max(size.z, .001), 2);
        if (score < best) { best = score; local.set(x, y, z); }
      }
    }
    pointAnchors[key] = { mesh: mesh, local: local };
    return pointAnchors[key];
  }

  function sortProcedureRows() {
    var list = document.querySelector('#twod-context-panel .twod-procedure-grid');
    if (!list) return;
    var keys = PROCEDURE_ORDER.slice().sort(function (a, b) {
      var ay = projectedPoints[a] ? projectedPoints[a].y : parseFloat(PROCEDURES[a].marker.top);
      var by = projectedPoints[b] ? projectedPoints[b].y : parseFloat(PROCEDURES[b].marker.top);
      return ay - by || PROCEDURE_ORDER.indexOf(a) - PROCEDURE_ORDER.indexOf(b);
    });
    if (keys.join(',') === procedureListOrder.join(',')) return;
    procedureListOrder = keys;
    keys.forEach(function (key, index) {
      var row = list.querySelector('[data-procedure="' + key + '"]');
      if (row) { row.querySelector('i').textContent = String(index + 1).padStart(2, '0'); list.appendChild(row); }
      var dot = document.getElementById('twod-point-marker-' + key);
      if (dot) dot.setAttribute('data-point-order', String(index + 1));
    });
  }

  function sync3DPointPositions() {
    if (typeof camera === 'undefined' || typeof renderer === 'undefined' || typeof THREE === 'undefined') return;
    if (state.phase !== 'three-d') {
      document.querySelectorAll('.twod-point-marker').forEach(function (dot) { dot.classList.add('hidden'); });
      return;
    }
    var viewport = stage();
    if (!viewport) return;
    var rect = renderer.domElement.getBoundingClientRect();
    var stageRect = viewport.getBoundingClientRect();
    camera.updateMatrixWorld();
    var cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    PROCEDURE_ORDER.forEach(function (key) {
      var dot = document.getElementById('twod-point-marker-' + key);
      if (!dot) return;
      var anchor = anchorForProcedure(key);
      if (!anchor) { dot.classList.add('hidden'); return; }
      if (!dot.hasAttribute('data-organ-anchor')) {
        dot.setAttribute('data-organ-mesh', anchor.mesh.name);
        dot.setAttribute('data-organ-anchor', JSON.stringify(anchor.local.toArray()));
      }
      anchor.mesh.updateWorldMatrix(true, false);
      var world = anchor.mesh.localToWorld(anchor.local.clone());
      var projected = world.clone().project(camera);
      var x = (projected.x * .5 + .5) * rect.width + rect.left - stageRect.left;
      var y = (-projected.y * .5 + .5) * rect.height + rect.top - stageRect.top;
      var scale = anchor.mesh.getWorldScale(new THREE.Vector3());
      var radiusWorld = .010 * Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
      var edge = world.clone().addScaledVector(cameraRight, radiusWorld).project(camera);
      var diameter = Math.max(4, Math.abs(edge.x - projected.x) * rect.width);
      projectedPoints[key] = { x: x, y: y, diameter: diameter };
      dot.style.left = x + 'px'; dot.style.top = y + 'px';
      dot.style.setProperty('--dot-size', diameter + 'px');
      dot.setAttribute('data-point-y', y.toFixed(2));
      dot.classList.toggle('active', state.previewProcedure === key);
      var onScreen = projected.z >= -1 && projected.z <= 1 && x >= 0 && x <= stageRect.width && y >= 0 && y <= stageRect.height;
      dot.classList.toggle('hidden', state.phase !== 'three-d' || !procedureReady(key) || !onScreen);
    });
    if (state.phase === 'three-d') sortProcedureRows();
  }

  function fitAnatomyView() {
    if (state.phase !== 'three-d' || typeof camera === 'undefined' || typeof allModelObjects === 'undefined' || !activeOrgans.size) return;
    var box = new THREE.Box3();
    allModelObjects.forEach(function (mesh) {
      // Frame the abdominal organs rather than the long superior oesophageal
      // shaft; otherwise the operative anatomy shrinks to half the viewport.
      if (mesh.visible && /^Organ_/i.test(mesh.name) && !/Esophagus/i.test(mesh.name)) box.expandByObject(mesh);
    });
    if (box.isEmpty()) return;
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    // The 3D canvas is hidden in 2D. Resize it from its visible container on
    // return, rather than using a stale/zero-sized canvas after a window resize.
    var canvasContainer = document.getElementById('canvas-container');
    var width = canvasContainer ? canvasContainer.clientWidth : 0;
    var height = canvasContainer ? canvasContainer.clientHeight : 0;
    if (!width || !height) return;
    var rect = renderer.domElement.getBoundingClientRect();
    if (Math.abs(rect.width - width) > 1 || Math.abs(rect.height - height) > 1) renderer.setSize(width, height);
    var aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    var tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    var distance = Math.max(size.y / (2 * tangent * .83), size.x / (2 * tangent * aspect * .83)) + size.z * .5;
    targetLookAt.copy(center);
    targetCamPos.set(center.x, center.y + size.y * .025, center.z + distance);
    targetPlinthPos.set(center.x, box.min.y - .06, center.z);
    isAutoCentering = true;
  }

  function zoomAnatomy(factor) {
    if (state.phase !== 'three-d' || typeof camera === 'undefined' || typeof controls === 'undefined') return;
    isAutoCentering = false;
    camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
    controls.update();
    sync3DPointPositions();
  }

  function nearest3DPoint(event) {
    var rect = stage().getBoundingClientRect();
    var x = event.clientX - rect.left, y = event.clientY - rect.top;
    var nearest = null, bestDistance = Infinity;
    PROCEDURE_ORDER.forEach(function (key) {
      var dot = document.getElementById('twod-point-marker-' + key);
      var point = projectedPoints[key];
      if (!point || !dot || dot.classList.contains('hidden')) return;
      var distance = Math.hypot(point.x - x, point.y - y);
      if (distance <= Math.max(10, (point.diameter + 8) / 2) && distance < bestDistance) {
        nearest = key; bestDistance = distance;
      }
    });
    return nearest;
  }

  function install3DGuide() {
    var viewport = stage(); if (!viewport || document.getElementById('twod-three-d-guide')) return;
    var oldHotspots = document.getElementById('hotspot-overlay'); if (oldHotspots) oldHotspots.style.display = 'none';
    var guide = document.createElement('div');
    guide.id = 'twod-three-d-guide';
    guide.innerHTML = '<div><span class="twod-guide-step">01 · 3D 选器官</span><b id="twod-guide-title">从左侧器官架拖入器官</b><small id="twod-organ-status">未放入器官时不显示手术点位</small></div><div class="twod-anatomy-view-actions"><button type="button" data-anatomy-zoom="in" aria-label="放大器官与点位">＋</button><button type="button" data-anatomy-zoom="out" aria-label="缩小器官与点位">−</button><button type="button" data-anatomy-fit>适应视野</button></div>';
    viewport.appendChild(guide);
    viewport.querySelectorAll('[id^="twod-point-marker-"]').forEach(function (node) { node.remove(); });
    var oldEntry = document.getElementById('twod-procedure-entry-marker'); if (oldEntry) oldEntry.remove();
    PROCEDURE_ORDER.forEach(function (key) {
      var point = document.createElement('button');
      point.type = 'button'; point.id = 'twod-point-marker-' + key; point.className = 'twod-point-marker hidden';
      point.setAttribute('data-procedure', key);
      point.setAttribute('aria-label', PROCEDURES[key].short + ' 手术点位：' + PROCEDURES[key].point);
      point.style.setProperty('--point-color', PROCEDURE_POINTS[key].color);
      point.innerHTML = '<span class="twod-point-dot"></span>';
      point.onmouseenter = function () { highlightPointProcedure(key); };
      point.onfocus = function () { highlightPointProcedure(key); };
      point.onclick = function (event) { event.stopPropagation(); previewProcedure(key); requestPointSelection(key); };
      viewport.appendChild(point);
    });
    // Small visual dots retain usable hit areas. Resolve overlapping hit areas
    // by the actual projected centres, rather than whichever button is on top.
    viewport.addEventListener('pointermove', function (event) {
      if (state.phase !== 'three-d') return;
      var key = nearest3DPoint(event);
      if (key && state.previewProcedure !== key) highlightPointProcedure(key);
    });
    viewport.addEventListener('click', function (event) {
      if (state.phase !== 'three-d' || !event.detail || !event.target.closest('.twod-point-marker')) return;
      var key = nearest3DPoint(event);
      if (key) { event.preventDefault(); event.stopPropagation(); previewProcedure(key); requestPointSelection(key); }
    }, true);
    guide.querySelector('[data-anatomy-zoom="in"]').onclick = function () { zoomAnatomy(.82); };
    guide.querySelector('[data-anatomy-zoom="out"]').onclick = function () { zoomAnatomy(1.22); };
    guide.querySelector('[data-anatomy-fit]').onclick = fitAnatomyView;
    if (typeof fitCameraToActiveOrgans === 'function') {
      var originalFit = fitCameraToActiveOrgans;
      fitCameraToActiveOrgans = function () { originalFit(); fitAnatomyView(); };
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () { if (state.phase === 'three-d') fitAnatomyView(); }).observe(viewport);
    }
    function followAnatomy() {
      sync3DPointPositions();
      window.requestAnimationFrame(followAnatomy);
    }
    if (!pointFramePending) { pointFramePending = true; window.requestAnimationFrame(followAnatomy); }
    refreshGuide(); window.setInterval(refreshGuide, 600);
  }

  function forceManual3DEntry() {
    if (state.phase === 'three-d') clearActiveOrgans();
  }

  function showMessage(message, type) {
    var node = document.getElementById('twod-message'); if (!node) return;
    node.className = 'twod-message ' + (type || '');
    node.textContent = message;
    clearTimeout(node._timer);
    node._timer = setTimeout(function () { node.classList.add('hidden'); }, 2600);
  }

  function setFrame(key) {
    var frames = currentStates();
    var next = frames[key] || frames.initial;
    var img = image(); if (!img) return;
    img.src = next.image;
    img.classList.add('is-visible');
    var caption = document.getElementById('twod-caption');
    caption.classList.remove('hidden');
    caption.querySelector('b').textContent = next.title;
    caption.querySelector('span').textContent = next.note;
    var title = document.getElementById('twod-toolbar-title');
    if (title) title.textContent = next.title;
  }

  function playImageProcess(key) {
    var actionKey = getToolActionKey(key);
    var next = currentStates()[actionKey]; if (!next || !next.image) return;
    var token = ++state.animationToken;
    var current = image(); var transition = document.getElementById('two-d-transition-image'); var process = document.getElementById('twod-process');
    var canvas = document.getElementById('twod-canvas');
    process.innerHTML = '<strong>' + TOOL_LABELS[key] + '</strong><div>' + next.beats.map(function (beat) { return '<span>' + beat + '</span>'; }).join('') + '</div>';
    process.classList.remove('hidden');
    if (canvas) canvas.classList.add('is-processing');
    transition.className = 'twod-transition-image';
    transition.onload = function () {
      if (token !== state.animationToken) return;
      void transition.offsetWidth;
      transition.classList.add('is-playing');
      var beats = process.querySelectorAll('span');
      beats.forEach(function (beat, index) {
        window.setTimeout(function () { if (token === state.animationToken) beat.classList.add('active'); }, 250 + index * 480);
      });
      window.setTimeout(function () {
        if (token !== state.animationToken) return;
        current.src = next.image; current.classList.add('is-visible');
        transition.className = 'twod-transition-image'; transition.removeAttribute('src');
        if (canvas) { canvas.classList.remove('is-processing'); canvas.classList.add('has-result'); }
        process.classList.add('complete');
        var caption = document.getElementById('twod-caption');
        caption.classList.remove('hidden'); caption.querySelector('b').textContent = next.title; caption.querySelector('span').textContent = next.note;
        var title = document.getElementById('twod-toolbar-title'); if (title) title.textContent = next.title;
        window.setTimeout(function () { if (token === state.animationToken) { process.classList.add('hidden'); process.classList.remove('complete'); } }, 1000);
      }, 1850);
    };
    transition.src = next.image;
  }

  function requestPointSelection(procedureKey) {
    var key = PROCEDURES[procedureKey] ? procedureKey : null;
    if (!key) {
      var readyKeys = PROCEDURE_ORDER.filter(function (candidate) { return procedureReady(candidate); });
      key = readyKeys.length === 1 ? readyKeys[0] : null;
    }
    if (!key || !procedureReady(key)) {
      var guide = document.getElementById('twod-three-d-guide');
      if (guide) guide.classList.add('needs-organs');
      window.setTimeout(function () { if (guide) guide.classList.remove('needs-organs'); }, 700);
      return;
    }
    state.procedure = key;
    state.previewProcedure = key;
    try { if (typeof currentSurgMode !== 'undefined') currentSurgMode = key; } catch (error) { /* optional base-page state */ }
    var procedure = currentProcedure();
    if (!procedure.twoDReady) {
      var notice = document.getElementById('twod-procedure-notice');
      if (notice) {
        notice.innerHTML = '<b>' + procedure.short + ' 已接入 3D 流程</b><span>' + procedure.readyLabel + '、病变描述与手术点位逻辑已就绪；下一步单独制作它的 2D 病变图和器械过程图帧。</span>';
        notice.classList.remove('hidden');
      }
      var guideStatus = document.getElementById('twod-organ-status');
      if (guideStatus) guideStatus.textContent = procedure.short + ' 3D 点位已确认，2D 图帧将在下一阶段接入';
      return;
    }
    enter2DWorkspace();
  }

  function enter2DWorkspace() {
    state.phase = 'point';
    var viewport = stage(); if (viewport) viewport.classList.add('two-d-stage', 'two-d-active');
    ['canvas-container', 'hotspot-overlay', 'incision-target-reticle', 'electric-spark-effect', 'empty-stage-prompt', 'bar-3d-controls'].forEach(function (id) {
      var node = document.getElementById(id); if (node) node.style.display = 'none';
    });
    var guide = document.getElementById('twod-three-d-guide'); if (guide) guide.classList.add('hidden');
    document.querySelectorAll('.twod-point-marker').forEach(function (marker) { marker.classList.add('hidden'); });
    var entryMarker = document.getElementById('twod-procedure-entry-marker'); if (entryMarker) entryMarker.classList.add('hidden');
    setSidebarMode('instruments');
    // A collapsed shelf is useful in the 3D stage, but never as the initial
    // state of a 2D procedure: it would make the just-selected toolset appear
    // missing. Users can still collapse it again deliberately after entry.
    var instrumentShelf = document.getElementById('sidebar-instruments');
    if (instrumentShelf) {
      instrumentShelf.classList.remove('twod-sidebar-collapsed');
      var instrumentToggle = document.getElementById('twod-toggle-instrument-sidebar');
      if (instrumentToggle) updateSidebarToggle(instrumentShelf, instrumentToggle, 'instrument');
    }
    workspace().classList.remove('hidden');
    configure2DProcedure();
    setFrame('initial');
    document.getElementById('twod-target-zone').classList.remove('hidden');
    document.getElementById('twod-reset').classList.remove('hidden');
    var entryMessage = state.procedure === 'edat' ? '请先点击高亮的盲肠—阑尾开口与腔内梗阻区，再按结肠镜定位、导丝、阑尾子镜、网篮、塑料支架顺序拖入器械。' : state.procedure === 'biliary_biopsy' ? '请先点击高亮的乳头—胆总管狭窄取样区，再按 ERCP 入路、直视观察、微型钳靶向取样的顺序拖入器械。' : state.procedure === 'poem' ? '请先点击高亮的下段食管—贲门紧缩区，再按定位、注射、隧道内肌切开、夹闭入口顺序拖入器械。' : state.procedure === 'ercp_eye' ? '请先点击高亮的乳头—下段胆总管结石区，再按通路、直视、碎石、回收顺序拖入器械。' : state.procedure === 'eus_cpn' ? '请先点击高亮的胃后壁—腹腔干神经丛靶区，再拖入 EUS-CPN 器械。' : state.procedure === 'eus_fnb' ? '请先点击高亮的胃后壁—胰腺占位取样点，再拖入 EUS-FNB 器械。' : state.procedure === 'eus_gbd' ? '请先点击高亮的胃肠腔—胆囊引流点，再拖入 EUS-GBD 器械。' : state.procedure === 'eus_ag' ? '请先点击高亮的胃小弯—左肝内胆管入路点，再拖入 EUS-AG 器械。' : state.procedure === 'eus_rv' ? '请先点击高亮的十二指肠球部—胆总管会师点，再拖入 EUS-RV 器械。' : state.procedure === 'eus_pfc' ? '请先点击高亮的胃后壁—胰腺假性囊肿点位，再拖入 EUS-PFC 器械。' :
      state.procedure === 'eus_cds' ? '请先点击高亮的十二指肠球部—胆总管点位，再拖入 EUS-CDS 器械。' :
      state.procedure === 'eus_hgs' ? '请先点击高亮的胃小弯—左肝 B2/B3 胆管点位，再拖入 EUS-HGS 器械。' :
      state.procedure === 'eus_pd' ? '请先点击高亮的胃后壁—主胰管点位，再拖入 EUS-PD 器械。' :
      '请先点击高亮的胃—空肠吻合点，再进行器械操作。';
    showMessage(state.procedure === 'esd' ? '点击局部胃黏膜病灶确认操作区；再将右侧器械拖入对应部位。' : entryMessage, 'instruction');
  }

  function confirmTarget() {
    state.phase = 'active';
    var target = document.getElementById('twod-target-zone');
    target.classList.add('confirmed');
    target.classList.remove('hidden');
    var label = target.querySelector('small'); if (label) label.textContent = '拖入器械，或选中器械后再次点击';
    showMessage('点位已确认。将右侧器械拖到此处；也可以先选中器械，再点击点位观察局部反应。', 'success');
  }

  function targetCenter() {
    if (state.procedure === 'poem') return { x: 47, y: 49 };
    if (state.procedure === 'edat') return { x: 43, y: 44 };
    if (state.procedure === 'biliary_biopsy') return { x: 54, y: 45 };
    if (state.procedure === 'esd') return { x: 50, y: 44 };
    if (state.procedure === 'eus_cpn') return { x: 57, y: 42 };
    if (state.procedure === 'eus_fnb') return { x: 55, y: 55 };
    if (state.procedure === 'ercp_eye') return { x: 55, y: 49 };
    if (state.procedure === 'eus_gbd') return { x: 49, y: 47 };
    if (state.procedure === 'eus_ag') return { x: 51, y: 23 };
    if (state.procedure === 'eus_rv') return { x: 52, y: 48 };
    if (state.procedure === 'eus_pfc') return { x: 55, y: 60 };
    if (state.procedure === 'eus_cds') return { x: 60, y: 44 };
    if (state.procedure === 'eus_hgs') return { x: 50, y: 42 };
    if (state.procedure === 'eus_pd') return { x: 45, y: 67 };
    return { x: 52, y: 66 };
  }

  function activateTarget() {
    if (state.phase === 'point') { confirmTarget(); return; }
    if (state.phase === 'active') { performInteraction(state.instrument, targetCenter()); }
  }

  function resetWorkspace() {
    if (window.ESDTeaching) window.ESDTeaching.unmount();
    state = { phase: 'three-d', procedure: null, previewProcedure: null, instrument: null, geBranch: 'epass', pfcBranch: 'wire', gbdBranch: 'wire', marks: [], applied: {}, animationToken: state.animationToken + 1 };
    try { if (typeof currentSurgMode !== 'undefined') currentSurgMode = null; } catch (error) { /* optional base-page state */ }
    var img = image(); if (img) { img.removeAttribute('src'); img.classList.remove('is-visible'); }
    var layer = document.getElementById('twod-effect-layer'); if (layer) layer.innerHTML = '';
    var transition = document.getElementById('two-d-transition-image'); if (transition) { transition.className = 'twod-transition-image'; transition.removeAttribute('src'); }
    var process = document.getElementById('twod-process'); if (process) process.className = 'twod-process hidden';
    toggleComparison(false);
    var canvas = document.getElementById('twod-canvas'); if (canvas) canvas.classList.remove('is-processing', 'has-result');
    document.getElementById('twod-target-zone').className = 'twod-target-zone hidden';
    document.getElementById('twod-caption').classList.add('hidden');
    document.getElementById('twod-reset').classList.add('hidden');
    document.getElementById('twod-toolbar-title').textContent = '术前沟通';
    document.querySelectorAll('.twod-selected').forEach(function (card) { card.classList.remove('twod-selected'); });
    workspace().classList.add('hidden');
    var viewport = stage(); if (viewport) viewport.classList.remove('two-d-active');
    ['canvas-container', 'hotspot-overlay', 'empty-stage-prompt', 'bar-3d-controls'].forEach(function (id) {
      var node = document.getElementById(id); if (node) node.style.display = '';
    });
    var guide = document.getElementById('twod-three-d-guide'); if (guide) guide.classList.remove('hidden');
    setSidebarMode('preop');
    refreshGuide();
    if (typeof resetCameraView === 'function') resetCameraView();
  }

  function selectInstrument(key) {
    if (!TOOL_LABELS[key]) return;
    if (key === 'pfc_lams' && state.pfcBranch === 'direct') key = 'pfc_direct_lams';
    if (key === 'gbd_lams' && state.gbdBranch === 'direct') key = 'gbd_direct_lams';
    state.instrument = key;
    if (state.procedure === 'esd' && window.ESDTeaching) window.ESDTeaching.setTool(getToolActionKey(key));
    document.querySelectorAll('.visual-inst-card, .twod-pd-tool-card').forEach(function (card) {
      card.classList.toggle('twod-selected', card.id === CARD_IDS[key] || card.getAttribute('data-tool') === key || (key === 'pfc_direct_lams' && card.getAttribute('data-tool') === 'pfc_lams') || (key === 'gbd_direct_lams' && card.getAttribute('data-tool') === 'gbd_lams'));
    });
    if (state.phase === 'three-d') showMessage('请先在 3D 工作区将相关器官就位并确认手术点位。', 'instruction');
    else if (state.phase === 'point') showMessage('请先点击高亮点位确认操作区域。', 'instruction');
    else showMessage('已选择“' + TOOL_LABELS[key] + '”，拖到高亮点位即可操作。', 'instruction');
  }

  function targetCoordinates(event) {
    var canvas = document.getElementById('twod-canvas');
    var rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  }

  function isOnTarget(point) {
    if (state.procedure === 'poem') return point.x > 34 && point.x < 61 && point.y > 32 && point.y < 67;
    if (state.procedure === 'edat') return point.x > 25 && point.x < 61 && point.y > 25 && point.y < 68;
    if (state.procedure === 'biliary_biopsy') return point.x > 38 && point.x < 72 && point.y > 27 && point.y < 69;
    if (state.procedure === 'esd') return point.x > 34 && point.x < 67 && point.y > 27 && point.y < 61;
    if (state.procedure === 'eus_cpn') return point.x > 43 && point.x < 72 && point.y > 25 && point.y < 59;
    if (state.procedure === 'eus_fnb') return point.x > 42 && point.x < 70 && point.y > 38 && point.y < 74;
    if (state.procedure === 'ercp_eye') return point.x > 42 && point.x < 69 && point.y > 29 && point.y < 68;
    if (state.procedure === 'eus_gbd') return point.x > 38 && point.x < 67 && point.y > 31 && point.y < 68;
    if (state.procedure === 'eus_ag') return point.x > 39 && point.x < 64 && point.y > 10 && point.y < 39;
    if (state.procedure === 'eus_rv') return point.x > 39 && point.x < 66 && point.y > 32 && point.y < 62;
    if (state.procedure === 'eus_pfc') return point.x > 42 && point.x < 68 && point.y > 44 && point.y < 76;
    if (state.procedure === 'eus_cds') return point.x > 47 && point.x < 73 && point.y > 30 && point.y < 58;
    if (state.procedure === 'eus_hgs') return point.x > 37 && point.x < 63 && point.y > 27 && point.y < 57;
    if (state.procedure === 'eus_pd') return point.x > 33 && point.x < 57 && point.y > 52 && point.y < 82;
    return point.x > 39 && point.x < 65 && point.y > 51 && point.y < 80;
  }

  function effectMarkup(effect) {
    if (effect === 'eus') return '<i class="effect-ring ring-one"></i><i class="effect-ring ring-two"></i><b>超声定位</b>';
    if (effect === 'fluid') return '<i class="effect-catheter-line"></i><i class="effect-fluid"></i><b>造影液充盈靶肠段</b>';
    if (effect === 'balloon') return '<i class="effect-balloon-shaft"></i><i class="effect-balloon balloon-one"></i><i class="effect-balloon balloon-two"></i><b>EPASS 双球囊贴壁固定</b>';
    if (effect === 'incision') return '<i class="effect-incision"></i><i class="effect-energy">✦</i><b>切口建立</b>';
    if (effect === 'needle') return '<i class="effect-pd-needle"></i><b>细针进入主胰管</b>';
    if (effect === 'wire') return '<i class="effect-wire"></i><b>导丝到位</b>';
    if (effect === 'dilator') return '<i class="effect-pd-dilator"></i><b>同轴扩张通道</b>';
    if (effect === 'pd-stent') return '<i class="effect-pd-stent"></i><b>塑料支架引流（示意）</b>';
    if (effect === 'hgs-eus') return '<i class="effect-ring ring-one"></i><i class="effect-ring ring-two"></i><b>超声锁定左肝 B2/B3 胆管</b>';
    if (effect === 'hgs-needle') return '<i class="effect-pd-needle"></i><i class="effect-hgs-contrast"></i><b>穿刺并造影确认</b>';
    if (effect === 'hgs-wire') return '<i class="effect-wire"></i><b>导丝在胆管内盘曲</b>';
    if (effect === 'hgs-dilator') return '<i class="effect-pd-dilator"></i><b>肝胃通道同轴扩张</b>';
    if (effect === 'hgs-stent') return '<i class="effect-stent effect-hgs-stent"></i><i class="effect-hgs-flow"></i><b>半覆膜支架引流胆汁</b>';
    if (effect === 'cds-eus') return '<i class="effect-ring ring-one"></i><i class="effect-ring ring-two"></i><b>超声锁定扩张胆总管</b>';
    if (effect === 'cds-needle') return '<i class="effect-pd-needle"></i><i class="effect-cds-contrast"></i><b>穿刺并造影确认</b>';
    if (effect === 'cds-wire') return '<i class="effect-wire"></i><b>导丝向近端胆管盘曲</b>';
    if (effect === 'cds-dilator') return '<i class="effect-pd-dilator"></i><b>胆肠通道同轴扩张</b>';
    if (effect === 'cds-stent') return '<i class="effect-stent effect-cds-stent"></i><i class="effect-cds-flow"></i><b>全覆膜支架引流胆汁</b>';
    if (effect === 'pfc-eus') return '<i class="effect-ring ring-one"></i><i class="effect-ring ring-two"></i><b>超声锁定囊腔并避开血管</b>';
    if (effect === 'pfc-needle') return '<i class="effect-pd-needle"></i><b>19G 细针进入囊腔</b>';
    if (effect === 'pfc-wire') return '<i class="effect-wire"></i><b>导丝在囊腔内盘曲</b>';
    if (effect === 'pfc-lams') return '<i class="effect-stent effect-cds-stent"></i><i class="effect-cds-flow"></i><b>LAMS 建立胃—囊肿引流</b>';
    if (effect === 'rv-wire') return '<i class="effect-wire"></i><b>导丝顺行通过乳头</b>';
    if (effect === 'rv-catch') return '<i class="effect-wire"></i><i class="effect-ring ring-one"></i><b>ERCP 在乳头端接回导丝</b>';
    if (effect === 'ag-wire') return '<i class="effect-wire"></i><b>导丝顺行跨越狭窄</b>';
    if (effect === 'ag-stent') return '<i class="effect-stent effect-cds-stent"></i><i class="effect-cds-flow"></i><b>顺行支架跨越狭窄</b>';
    if (effect === 'gbd-lams') return '<i class="effect-stent effect-cds-stent"></i><i class="effect-cds-flow"></i><b>双法兰支架建立胆囊引流</b>';
    if (effect === 'fnb-eus') return '<i class="effect-ring ring-one"></i><i class="effect-ring ring-two"></i><b>超声锁定病灶并评估针道</b>';
    if (effect === 'fnb-needle') return '<i class="effect-pd-needle"></i><b>FNB 针进入病灶取样</b>';
    if (effect === 'fnb-specimen') return '<i class="effect-ring ring-one"></i><b>组织样本固定送检</b>';
    if (effect === 'cpn-eus') return '<i class="effect-ring ring-one"></i><i class="effect-ring ring-two"></i><b>超声定位腹腔干与神经丛靶区</b>';
    if (effect === 'cpn-needle') return '<i class="effect-pd-needle"></i><i class="effect-energy">✦</i><b>针尖到位，局部注射扩散</b>';
    if (effect === 'esd-knife' || effect === 'esd-injector' || effect === 'esd-hemostasis' || effect === 'esd-retrieval') return '';
    return '<i class="effect-stent"></i><b>支架展开</b>';
  }

  function addEffect(key, point) {
    var layer = document.getElementById('twod-effect-layer'); if (!layer) return;
    layer.innerHTML = '';
    var actionKey = getToolActionKey(key);
    var effect = document.createElement('div');
    effect.className = 'twod-effect twod-effect-' + TOOL_EFFECTS[actionKey];
    effect.style.left = point.x + '%'; effect.style.top = point.y + '%';
    effect.innerHTML = effectMarkup(TOOL_EFFECTS[actionKey]);
    layer.appendChild(effect);
    state.marks = [effect];
  }

  function completeFNBSpecimen(token) {
    if (state.procedure !== 'eus_fnb' || state.animationToken !== token) return;
    setFrame('fnb_specimen');
    var result = document.getElementById('twod-fnb-specimen-status');
    if (result) {
      result.classList.add('complete');
      result.innerHTML = '<span>结果状态 · 非器械</span><b>组织标本已获得，待病理判读</b><p>图示为 FNB 组织条标本送检。病灶仍在，不能据此即时判定良恶性或直接决定治疗方案。</p>';
    }
    showMessage('组织样本已获得并送检；请等待最终病理与完整临床资料决定后续方案。', 'success');
  }

  function validatePFCSequence(key) {
    if (state.procedure !== 'eus_pfc') return true;
    var branch = pfcBranch();
    var stepIndex = branch.order.indexOf(key);
    if (stepIndex === -1) {
      showMessage('当前为“' + branch.label + '”，请使用本路径列出的器械；两条路径不能混用。', 'warning');
      return false;
    }
    if (state.applied[key]) {
      showMessage('“' + TOOL_LABELS[key] + '”已完成。请继续下一步，或切换路径后从头演示。', 'instruction');
      return false;
    }
    var missing = branch.order.slice(0, stepIndex).filter(function (step) { return !state.applied[step]; });
    if (missing.length) {
      showMessage('当前路径需先完成“' + TOOL_LABELS[missing[0]] + '”，再进行“' + TOOL_LABELS[key] + '”。', 'warning');
      return false;
    }
    return true;
  }

  function validateGBDSequence(key) {
    if (state.procedure !== 'eus_gbd') return true;
    var path = gbdPath();
    var stepIndex = path.order.indexOf(key);
    if (stepIndex === -1) {
      showMessage('当前为“' + path.label + '”，请使用本路径列出的器械；两条路径不能混用。', 'warning');
      return false;
    }
    if (state.applied[key]) {
      showMessage('“' + TOOL_LABELS[key] + '”已完成。请继续下一步，或切换路径后从头演示。', 'instruction');
      return false;
    }
    var missing = path.order.slice(0, stepIndex).filter(function (step) { return !state.applied[step]; });
    if (missing.length) {
      showMessage('经球部胆囊引流需先完成“' + TOOL_LABELS[missing[0]] + '”，再进行“' + TOOL_LABELS[key] + '”。', 'warning');
      return false;
    }
    return true;
  }

  function validateERCPEyeSequence(key) {
    if (state.procedure !== 'ercp_eye') return true;
    var order = ['ercp_duodenoscope', 'ercp_cholangioscope', 'ercp_lithotripsy', 'ercp_basket'];
    var index = order.indexOf(key);
    if (index === -1) {
      showMessage('请使用本病例右侧的 ERCP 直视碎石器械。', 'warning');
      return false;
    }
    if (state.applied[key]) {
      showMessage('“' + TOOL_LABELS[key] + '”已完成。请继续下一步。', 'instruction');
      return false;
    }
    var missing = order.slice(0, index).filter(function (step) { return !state.applied[step]; });
    if (missing.length) {
      showMessage('请先完成“' + TOOL_LABELS[missing[0]] + '”，再进行“' + TOOL_LABELS[key] + '”。', 'warning');
      return false;
    }
    return true;
  }

  function validatePOEMSequence(key) {
    if (state.procedure !== 'poem') return true;
    var order = ['poem_endoscope', 'poem_injector', 'poem_knife', 'poem_clip'];
    var index = order.indexOf(key);
    if (index === -1) {
      showMessage('请使用本病例右侧的 POEM 专用器械。', 'warning');
      return false;
    }
    if (state.applied[key]) {
      showMessage('“' + TOOL_LABELS[key] + '”已完成。请继续下一步。', 'instruction');
      return false;
    }
    var missing = order.slice(0, index).filter(function (step) { return !state.applied[step]; });
    if (missing.length) {
      showMessage('请先完成“' + TOOL_LABELS[missing[0]] + '”，再进行“' + TOOL_LABELS[key] + '”。', 'warning');
      return false;
    }
    return true;
  }

  function validateBiliaryBiopsySequence(key) {
    if (state.procedure !== 'biliary_biopsy') return true;
    var order = ['bds_duodenoscope', 'bds_cholangioscope', 'bds_biopsy_forceps'];
    var index = order.indexOf(key);
    if (index === -1) {
      showMessage('请使用本病例右侧的直视胆道狭窄评估与活检器械。', 'warning');
      return false;
    }
    if (state.applied[key]) {
      showMessage('“' + TOOL_LABELS[key] + '”已完成。请继续下一步。', 'instruction');
      return false;
    }
    var missing = order.slice(0, index).filter(function (step) { return !state.applied[step]; });
    if (missing.length) {
      showMessage('请先完成“' + TOOL_LABELS[missing[0]] + '”，再进行“' + TOOL_LABELS[key] + '”。', 'warning');
      return false;
    }
    return true;
  }

  function validateEDATSequence(key) {
    if (state.procedure !== 'edat') return true;
    var order = ['edat_colonoscope', 'edat_guidewire', 'edat_appendicoscope', 'edat_basket', 'edat_stent'];
    var index = order.indexOf(key);
    if (index === -1) {
      showMessage('请使用本病例右侧的 EDAT 直视阑尾腔诊疗器械。', 'warning');
      return false;
    }
    if (state.applied[key]) {
      showMessage('“' + TOOL_LABELS[key] + '”已完成。请继续下一步。', 'instruction');
      return false;
    }
    var missing = order.slice(0, index).filter(function (step) { return !state.applied[step]; });
    if (missing.length) {
      showMessage('请先完成“' + TOOL_LABELS[missing[0]] + '”，再进行“' + TOOL_LABELS[key] + '”。', 'warning');
      return false;
    }
    return true;
  }

  function isCompatibleWithSelectedBranch(key) {
    if (state.procedure === 'eus_pfc' && pfcBranch().order.indexOf(key) === -1) {
      showMessage('当前显示的是“' + pfcBranch().label + '”。为避免把两种技术混为一条手术，请切换路径后再查看该器械画面。', 'warning');
      return false;
    }
    if (state.procedure === 'eus_gbd' && gbdPath().order.indexOf(key) === -1) {
      showMessage('当前显示的是“' + gbdPath().label + '”。为避免把两种技术混为一条手术，请切换路径后再查看该器械画面。', 'warning');
      return false;
    }
    return true;
  }

  function sequenceAdvisory(key) {
    var procedureKey = state.procedure;
    var order = teachingOrderFor(procedureKey);
    var index = order.indexOf(key);
    if (index === -1) {
      if (procedureKey === 'eus_ge' && key === 'guidewire') return '这是辅助技术的独立教学画面，不属于当前准备分支的固定核心步骤；可直接查看。';
      return '这是可独立查看的扩展教学器械，不代表每例都必须使用。';
    }
    var missing = order.slice(0, index).filter(function (step) { return !state.applied[step]; });
    if (state.applied[key]) return '已重新打开“' + TOOL_LABELS[key] + '”的独立操作画面；推荐顺序不限制重复查看。';
    if (missing.length) return '已跳转查看“' + TOOL_LABELS[key] + '”（' + teachingStepLabel(procedureKey, key) + '）。推荐先了解“' + TOOL_LABELS[missing[0]] + '”，但本次仍会直接展示此器械的局部操作。';
    return '正在展示“' + TOOL_LABELS[key] + '”（' + teachingStepLabel(procedureKey, key) + '）的独立局部操作。';
  }

  function performInteraction(key, point) {
    if (key === 'pfc_lams' && state.pfcBranch === 'direct') key = 'pfc_direct_lams';
    if (key === 'gbd_lams' && state.gbdBranch === 'direct') key = 'gbd_direct_lams';
    if (!key || !TOOL_LABELS[key]) { showMessage('请先从右侧选择一件器械。', 'warning'); return; }
    if (state.phase !== 'active') { showMessage(state.phase === 'point' ? '请先确认手术点位。' : '请先选择当前术式手术点位。', 'warning'); return; }
    if (!isOnTarget(point)) {
      var warning = state.procedure === 'edat' ? '请将器械放在高亮的盲肠—阑尾开口与腔内梗阻区内。' : state.procedure === 'biliary_biopsy' ? '请将器械放在高亮的乳头—胆总管狭窄取样区内。' : state.procedure === 'poem' ? '请将器械放在高亮的下段食管—贲门紧缩操作区内。' : state.procedure === 'ercp_eye' ? '请将器械放在高亮的乳头—下段胆总管结石操作区内。' : state.procedure === 'eus_cpn' ? '请将器械放在高亮的胃后壁—腹腔干神经丛靶区内。' : state.procedure === 'eus_fnb' ? '请将器械放在高亮的胃后壁—胰腺占位取样区内。' : state.procedure === 'eus_gbd' ? '请将器械放在高亮的十二指肠球部—胆囊贴壁操作区内。' : state.procedure === 'eus_ag' ? '请将器械放在高亮的胃小弯—左肝内胆管顺行治疗入路区内。' : state.procedure === 'eus_rv' ? '请将器械放在高亮的十二指肠球部—胆总管会师操作区内。' : state.procedure === 'eus_pfc' ? '请将器械放在高亮的胃后壁—胰腺假性囊肿操作区内。' :
        state.procedure === 'eus_cds' ? '请将器械放在高亮的十二指肠球部—胆总管操作区内。' :
        state.procedure === 'eus_hgs' ? '请将器械放在高亮的胃小弯—左肝 B2/B3 胆管操作区内。' :
        state.procedure === 'eus_pd' ? '请将器械放在高亮的胃后壁—主胰管操作区内。' :
        '请将器械放在高亮的胃—空肠吻合区内。';
      showMessage(warning, 'warning'); return;
    }
    if (!isCompatibleWithSelectedBranch(key)) return;
    var advisory = sequenceAdvisory(key);
    state.applied[key] = true;
    // These pathways have every instrument contact drawn into dedicated medical
    // raster frames; never cover them with a low-fidelity vector pseudo-tool.
    if (state.procedure !== 'eus_ge' && state.procedure !== 'eus_pfc' && state.procedure !== 'eus_gbd' && state.procedure !== 'ercp_eye' && state.procedure !== 'poem' && state.procedure !== 'biliary_biopsy' && state.procedure !== 'edat') addEffect(key, point);
    playImageProcess(key);
    if (state.procedure === 'eus_pfc') updatePFCStepUI();
    if (state.procedure === 'eus_gbd') updateGBDStepUI();
    if (state.procedure === 'eus_fnb' && getToolActionKey(key) === 'fnb_needle') {
      var fnbToken = state.animationToken;
      window.setTimeout(function () { completeFNBSpecimen(fnbToken); }, 3150);
    }
    showMessage(advisory, 'success');
  }

  function installToolCards() {
    document.querySelectorAll('button[onclick*="openSurgicalStudioModal"]').forEach(function (button) {
      button.innerHTML = '<span>🎯</span> 进入手术交互工作区';
      button.setAttribute('title', '选择手术点位并进入 2D 器械交互');
    });
    Object.keys(CARD_IDS).forEach(function (key) {
      var card = document.getElementById(CARD_IDS[key]); if (!card) return;
      var imageBox = card.querySelector('.visual-inst-img-box');
      if (imageBox && !imageBox.querySelector('.twod-image-source')) {
        var source = document.createElement('small');
        source.className = 'twod-image-source';
        source.textContent = '器械参考图';
        imageBox.appendChild(source);
      }
      card.addEventListener('click', function (event) {
        if (event.target.closest('button')) return;
        selectInstrument(key);
      }, true);
      var action = card.querySelector('.btn-apply-inst');
      if (action) {
        action.removeAttribute('onclick');
        action.innerHTML = '<span>🖐 拖到手术点位操作</span>';
        action.onclick = function (event) { event.preventDefault(); event.stopPropagation(); selectInstrument(key); };
      }
      var details = card.querySelector('.btn-turntable-inst');
      if (details) {
        details.removeAttribute('onclick');
        details.innerHTML = '<span>◎ 选为当前器械</span>';
        details.onclick = function (event) { event.preventDefault(); event.stopPropagation(); selectInstrument(key); };
      }
    });
  }

  /* The original prototype contains several image-frame studios.  They are
     intentionally kept out of this interaction path: tool actions belong in
     the 2D canvas, never in a pop-up presentation window. */
  function hideLegacyPresentation() {
    if (hidingLegacy) return;
    hidingLegacy = true;
    ['surgery-studio-modal', 'inst-2d-modal', 'organ-stopmotion-modal', 'macro-lightbox-modal'].forEach(function (id) {
      var modal = document.getElementById(id); if (!modal) return;
      if (!modal.classList.contains('hidden')) modal.classList.add('hidden');
      ['active', 'pip-mode', 'fullscreen-mode', 'fullscreen'].forEach(function (name) { if (modal.classList.contains(name)) modal.classList.remove(name); });
      if (modal.style.display !== 'none') modal.style.display = 'none';
    });
    hidingLegacy = false;
  }

  function redirectLegacyToolAction(key) {
    hideLegacyPresentation();
    if (key && TOOL_LABELS[key]) selectInstrument(key);
    if (state.phase === 'active' && key && TOOL_LABELS[key]) showMessage('已选择“' + TOOL_LABELS[key] + '”；请拖到高亮吻合点触发操作。', 'instruction');
  }

  function disableLegacyPresentation() {
    hideLegacyPresentation();
    window.openSurgicalStudioModal = function () { hideLegacyPresentation(); requestPointSelection(); };
    window.openInstrument2DStudio = function (key) { redirectLegacyToolAction(key); };
    window.launchSurgeryStepFromInstrument = function (key) { redirectLegacyToolAction(key); };
    window.openOrganStopMotion = function () { hideLegacyPresentation(); };
    document.addEventListener('click', function (event) {
      var hotspot = event.target.closest && event.target.closest('.surgical-hotspot');
      if (!hotspot) return;
      event.preventDefault(); event.stopPropagation();
      requestPointSelection();
    }, true);
    var observer = new MutationObserver(function () { hideLegacyPresentation(); });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }

  function installDragDrop() {
    var previousDrag = window.onDragInstrument;
    var previousOver = window.onDragOverStage;
    var previousLeave = window.onDragLeaveStage;
    var previousDrop = window.onDropStage;
    window.onDragInstrument = function (event, key) {
      if (typeof previousDrag === 'function') previousDrag(event, key);
      state.instrument = key;
      if (event.dataTransfer) event.dataTransfer.setData('application/x-eus-2d-tool', key);
      var reticle = document.getElementById('incision-target-reticle'); if (reticle) reticle.classList.remove('active');
      selectInstrument(key);
    };
    window.onDragOverStage = function (event) {
      if (state.phase === 'three-d') { if (typeof previousOver === 'function') previousOver(event); return; }
      event.preventDefault();
      var point = targetCoordinates(event);
      var canvas = document.getElementById('twod-canvas');
      if (canvas) canvas.classList.toggle('is-targeting', state.phase === 'active' && isOnTarget(point));
      if (event.dataTransfer) event.dataTransfer.dropEffect = state.phase === 'active' && isOnTarget(point) ? 'copy' : 'none';
    };
    window.onDragLeaveStage = function (event) {
      if (state.phase === 'three-d') { if (typeof previousLeave === 'function') previousLeave(event); return; }
      var canvas = document.getElementById('twod-canvas'); if (canvas) canvas.classList.remove('is-targeting');
    };
    window.onDropStage = function (event) {
      if (state.phase === 'three-d') {
        var organKey = event.dataTransfer && event.dataTransfer.getData('text/plain');
        // The legacy startup timer must not erase organs the user just dragged.
        if (organKey && ORGAN_META[organKey]) window.__organUserInteracted = true;
        if (typeof previousDrop === 'function') previousDrop(event);
        return;
      }
      event.preventDefault();
      var canvas = document.getElementById('twod-canvas'); if (canvas) canvas.classList.remove('is-targeting');
      var key = event.dataTransfer && (event.dataTransfer.getData('application/x-eus-2d-tool') || event.dataTransfer.getData('instrument:'));
      performInteraction(key || state.instrument, targetCoordinates(event));
    };
    var canvas = document.getElementById('twod-canvas');
    if (canvas && !canvas.getAttribute('data-twod-canvas-click')) {
      canvas.setAttribute('data-twod-canvas-click', 'ready');
      canvas.addEventListener('click', function (event) {
        if (state.phase !== 'point' && state.phase !== 'active') return;
        if (event.target.closest && event.target.closest('#twod-target-zone')) return;
        var point = targetCoordinates(event);
        if (!isOnTarget(point)) return;
        if (state.phase === 'point') confirmTarget();
        else performInteraction(state.instrument, point);
      });
    }
  }

  function installTargetClickDelegate() {
    if (document.documentElement.getAttribute('data-twod-target-delegate') === 'ready') return;
    document.documentElement.setAttribute('data-twod-target-delegate', 'ready');
    document.addEventListener('click', function (event) {
      var target = event.target.closest && event.target.closest('#twod-target-zone');
      if (!target || !workspace() || workspace().classList.contains('hidden')) return;
      event.preventDefault();
      event.stopPropagation();
      activateTarget();
    }, true);
    document.addEventListener('keydown', function (event) {
      var target = event.target.closest && event.target.closest('#twod-target-zone');
      if (!target || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopPropagation();
      activateTarget();
    }, true);
  }

  function updateSidebarToggle(panel, button, side) {
    var collapsed = panel.classList.contains('twod-sidebar-collapsed');
    var noun = side === 'organ' ? '器官栏' : '器械栏';
    button.textContent = side === 'organ' ? (collapsed ? '›' : '‹') : (collapsed ? '‹' : '›');
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('title', (collapsed ? '展开' : '收起') + noun);
    button.setAttribute('aria-label', (collapsed ? '展开' : '收起') + noun);
  }

  function installSidebarCollapse() {
    var organPanel = document.querySelector('.sidebar-shelf');
    var instrumentPanel = document.getElementById('sidebar-instruments');

    function addToggle(panel, side, id) {
      if (!panel) return null;
      var button = document.getElementById(id);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button'; button.id = id;
        button.className = 'twod-sidebar-toggle';
        panel.appendChild(button);
      }
      button.onclick = function (event) {
        event.preventDefault(); event.stopPropagation();
        panel.classList.toggle('twod-sidebar-collapsed');
        updateSidebarToggle(panel, button, side);
        window.setTimeout(function () { if (typeof window.onWindowResize === 'function') window.onWindowResize(); }, 330);
      };
      updateSidebarToggle(panel, button, side);
      return button;
    }

    if (organPanel) {
      organPanel.id = 'sidebar-organs';
      addToggle(organPanel, 'organ', 'twod-toggle-organ-sidebar');
      window.toggleOrganShelf = function () {
        var button = document.getElementById('twod-toggle-organ-sidebar'); if (button) button.click();
      };
    }
    if (instrumentPanel) {
      addToggle(instrumentPanel, 'instrument', 'twod-toggle-instrument-sidebar');
      var legacyButton = document.getElementById('btn-toggle-inst-shelf');
      if (legacyButton) legacyButton.onclick = function (event) {
        event.preventDefault(); event.stopPropagation();
        var button = document.getElementById('twod-toggle-instrument-sidebar'); if (button) button.click();
      };
      window.toggleInstrumentShelf = function () {
        var button = document.getElementById('twod-toggle-instrument-sidebar'); if (button) button.click();
      };
    }
  }

  // Native Z-Anatomy meshes, aligned with the exact source-to-atlas transform
  // measured from the existing stomach. The embedded asset also supports
  // opening index.html directly, where fetching a local GLB can fail.
  var appendixAssetParsing = false;
  function installAppendixSpecimen() {
    if (document.getElementById('card-appendix')) return true;
    try {
      if (typeof THREE === 'undefined' || typeof rootGroup === 'undefined' || typeof allModelObjects === 'undefined' || typeof ORGAN_MESH_MAP === 'undefined') return false;
      if (!allModelObjects.some(function (mesh) { return mesh.name === 'Organ_Stomach_Full'; })) return false;
      var reference = document.getElementById('card-esophagus') || document.getElementById('card-biliary');
      var shelf = reference && reference.parentElement;
      if (!shelf) return false;
      if (!window.CecumAppendixAsset) {
        if (!document.getElementById('cecum-appendix-asset')) {
          var script = document.createElement('script');
          script.id = 'cecum-appendix-asset';
          script.src = 'media/models/cecum_appendix/cecum_appendix.data.js?v=20260928-native-1';
          script.onload = installAppendixSpecimen;
          script.onerror = function () { console.warn('盲肠与阑尾模型文件未加载，请确认 media/models/cecum_appendix 文件夹完整。'); };
          document.head.appendChild(script);
        }
        return false;
      }
      if (appendixAssetParsing) return false;
      appendixAssetParsing = true;
      var asset = window.CecumAppendixAsset;
      var binary = window.atob(asset.base64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      new THREE.GLTFLoader().parse(bytes.buffer, '', function (gltf) {
        var appendicealGroup = gltf.scene;
        appendicealGroup.name = 'Organ_Cecum_Appendix_Group';
        var appendix = appendicealGroup.getObjectByName('Organ_Appendix');
        if (!appendix || !appendicealGroup.getObjectByName('Organ_Cecum')) {
          console.warn('盲肠与阑尾模型缺少必要网格。'); return;
        }
        ORGAN_MESH_MAP.appendix = ['Organ_Cecum', 'Organ_Appendix', 'Organ_Mesoappendix'];
        appendix.userData.procedureAnchor = asset.anchor.slice();
        appendicealGroup.traverse(function (mesh) {
          if (!mesh.isMesh) return;
          mesh.visible = false;
          mesh.material.roughness = .43;
          mesh.material.metalness = .01;
          allModelObjects.push(mesh);
        });
        rootGroup.add(appendicealGroup);
        var card = document.createElement('div');
        card.className = 'specimen-card'; card.id = 'card-appendix'; card.draggable = true;
        card.innerHTML = '<div class="specimen-3d-stage"><img draggable="false" src="media/models/cecum_appendix/preview.png?v=20260928-native-1" alt="盲肠与阑尾原始解剖网格的 3D 预览"></div><div class="specimen-footer"><span class="specimen-name">🔻 盲肠与阑尾 (Cecum &amp; Appendix)</span><span class="specimen-status">未加入</span></div>';
        card.addEventListener('dragstart', function (event) {
          if (typeof window.onDragOrgan === 'function') window.onDragOrgan(event, 'appendix');
          else if (event.dataTransfer) event.dataTransfer.setData('text/plain', 'appendix');
        });
        card.addEventListener('click', function () {
          if (typeof window.toggleOrgan === 'function') window.toggleOrgan('appendix');
          window.setTimeout(function () { renderRequiredOrgans(); refreshGuide(); }, 0);
        });
        shelf.appendChild(card);
        if (typeof updateSceneVisibility === 'function') updateSceneVisibility();
        refreshGuide();
      }, function (error) { console.warn('盲肠与阑尾模型无法解析。', error); });
      return false;
    } catch (error) { console.warn('盲肠与阑尾模型初始化失败。', error); return false; }
  }

  function waitForAppendixSpecimen() {
    if (installAppendixSpecimen()) return;
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (installAppendixSpecimen() || attempts > 100) window.clearInterval(timer);
    }, 150);
  }

  function initialize() {
    loadStyle(); registerCustomTools(); buildWorkspace(); forceManual3DEntry(); buildGEInstrumentShelf(); buildProcedureSidebar(); buildRVInstrumentShelf(document.getElementById('sidebar-instruments')); setSidebarMode('preop'); install3DGuide(); installToolCards(); installDragDrop(); installTargetClickDelegate(); installSidebarCollapse(); installInstrumentManager(); installMedicalReviewLedger(); disableLegacyPresentation(); waitForAppendixSpecimen();
    window.open2DPointSelection = requestPointSelection;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
