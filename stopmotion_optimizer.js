(function () {
  'use strict';

  /* Keep the original 3D interface; only improve its entry flow and image-frame studios. */
  var ORGAN_META = {
    stomach: { name: '胃', en: 'Stomach', icon: '🫃', focus: '胃壁、胃腔与 EUS-GE 胃侧吻合靶区' },
    liver: { name: '肝脏', en: 'Liver', icon: '🩸', focus: '肝表面、肝门与毗邻血管关系' },
    biliary: { name: '胆道', en: 'Biliary system', icon: '🫒', focus: '胆囊、胆管走行及其与肝门的关系' },
    pancreas: { name: '胰腺', en: 'Pancreas', icon: '🟡', focus: '胰头、胰体、胰尾及胃后方毗邻关系' },
    jejunum: { name: '空肠', en: 'Jejunum', icon: '〰️', focus: '空肠袢、目标肠腔与 EUS-GE 肠侧吻合靶区' },
    esophagus: { name: '食管', en: 'Esophagus', icon: '🥢', focus: '食管腔道与超声胃镜进入路径' }
  };

  var organFrameCache = Object.create(null);
  var organPlayerTimer = null;
  var organPlayer = { key: null, frames: [], index: 0, playing: false, zoom: 1, x: 0, y: 0, marking: false, pin: 0 };
  var startupFinished = false;

  function installStylesheet() {
    if (document.getElementById('stopmotion-optimizer-css')) return;
    var link = document.createElement('link');
    link.id = 'stopmotion-optimizer-css';
    link.rel = 'stylesheet';
    link.href = 'stopmotion_optimizer.css?v=20260911-4';
    document.head.appendChild(link);
  }

  function hideVascularMeshes() {
    if (typeof portalVeinMesh !== 'undefined' && portalVeinMesh) portalVeinMesh.visible = false;
    if (typeof celiacArteryMesh !== 'undefined' && celiacArteryMesh) celiacArteryMesh.visible = false;
  }

  function forceEmptyStage() {
    if (window.__organUserInteracted) return;
    if (typeof activeOrgans === 'undefined' || typeof updateSceneVisibility !== 'function') return;
    activeOrgans.clear();
    hideVascularMeshes();
    updateSceneVisibility();
    startupFinished = true;
  }

  function markStageInteraction() {
    window.__organUserInteracted = true;
  }

  window.enterEusGeTargetMode = function () {
    markStageInteraction();
    if (typeof activeOrgans === 'undefined') return;
    activeOrgans.clear();
    activeOrgans.add('stomach');
    activeOrgans.add('jejunum');
    hideVascularMeshes();
    if (typeof currentSurgMode !== 'undefined') currentSurgMode = null;
    if (typeof updateSceneVisibility === 'function') updateSceneVisibility();
    if (typeof resetCameraView === 'function') resetCameraView();
    showTargetGuide();
  };

  function showTargetGuide() {
    var old = document.getElementById('eus-target-guide');
    if (old) old.remove();
    var stage = document.getElementById('stage-viewport');
    if (!stage) return;
    var guide = document.createElement('div');
    guide.id = 'eus-target-guide';
    guide.innerHTML = '<span class="target-guide-pulse"></span><div><b>请选择 EUS-GE 手术点位</b><span>点击胃壁或空肠上的珊瑚色靶点，进入对应部位的完整手术定格推演。</span></div><button type="button" aria-label="关闭提示">×</button>';
    guide.querySelector('button').onclick = function () { guide.remove(); };
    stage.appendChild(guide);
  }

  function configureEntryFlow() {
    window.__organUserInteracted = false;

    /* The original page schedules addAllOrgans twice; replace that delayed binding. */
    if (typeof initDefaultOrgansOnStage === 'function') {
      initDefaultOrgansOnStage = function () {
        if (!window.__organUserInteracted) forceEmptyStage();
      };
    }

    if (typeof toggleOrgan === 'function') {
      var originalToggleOrgan = toggleOrgan;
      toggleOrgan = function (organId) {
        markStageInteraction();
        return originalToggleOrgan(organId);
      };
    }

    if (typeof addAllOrgans === 'function') {
      var originalAddAllOrgans = addAllOrgans;
      addAllOrgans = function () {
        markStageInteraction();
        return originalAddAllOrgans();
      };
    }

    if (typeof clearAllOrgans === 'function') {
      var originalClearAllOrgans = clearAllOrgans;
      clearAllOrgans = function () {
        markStageInteraction();
        return originalClearAllOrgans();
      };
    }

    var prompt = document.getElementById('empty-stage-prompt');
    if (prompt) {
      var icon = prompt.querySelector('span');
      var title = prompt.querySelector('h3');
      var copy = prompt.querySelector('p');
      var button = prompt.querySelector('button');
      if (icon) icon.textContent = '🎯';
      if (title) title.textContent = '先选择讲解方式，不自动弹出器官';
      if (copy) copy.textContent = '可从左侧逐个查看器官；准备讲解 EUS-GE 时，仅加载胃与空肠，再点击真实手术靶点进入定格推演。';
      if (button) {
        button.innerHTML = '🎯 进入 EUS-GE 点位选择';
        button.onclick = window.enterEusGeTargetMode;
      }
    }

    var surgeryButton = document.querySelector('.bar-3d-controls .highlight-surg');
    if (surgeryButton) {
      surgeryButton.innerHTML = '🎯 选择 EUS-GE 手术点位 ➔';
      surgeryButton.onclick = window.enterEusGeTargetMode;
      surgeryButton.title = '先只展示胃与空肠，再从三维靶点进入完整手术推演';
    }

    forceEmptyStage();
    setTimeout(forceEmptyStage, 550);
    setTimeout(forceEmptyStage, 1650);
  }

  function numberedFrames(folder, count) {
    return Array.from({ length: count }, function (_, index) {
      return 'media/inst_sequences/' + folder + '/frame_' + String(index + 1).padStart(2, '0') + '.jpg';
    });
  }

  function clinicalStepFrames(folder, start, end, stride) {
    var frames = [];
    for (var sourceFrame = start; sourceFrame <= end; sourceFrame += stride || 1) {
      frames.push('02_手术推演连贯高清图片帧/' + folder + '/step_frame_' + String(sourceFrame).padStart(3, '0') + '.jpg');
    }
    if ((end - start) % (stride || 1) !== 0) {
      frames.push('02_手术推演连贯高清图片帧/' + folder + '/step_frame_' + String(end).padStart(3, '0') + '.jpg');
    }
    return frames;
  }

  function scaleStages(rawStages, outputCount) {
    var sourceMax = rawStages[rawStages.length - 1][1];
    return rawStages.map(function (stage, index) {
      var from = Math.floor((stage[0] - 1) / sourceMax * outputCount) + 1;
      var to = index === rawStages.length - 1 ? outputCount : Math.max(from, Math.floor(stage[1] / sourceMax * outputCount));
      return { from: from, to: to, name: stage[2], detail: stage[3] };
    });
  }

  function stagedCaptions(count, stages) {
    return Array.from({ length: count }, function (_, index) {
      var frame = index + 1;
      var stage = stages.find(function (item) { return frame >= item.from && frame <= item.to; }) || stages[stages.length - 1];
      return stage.name + ' · ' + stage.detail;
    });
  }

  function setInstrumentSequence(key, config) {
    if (typeof INSTRUMENT_CLOSEUP_SEQUENCES === 'undefined') return;
    var seq = INSTRUMENT_CLOSEUP_SEQUENCES[key] || {};
    Object.keys(config).forEach(function (prop) { seq[prop] = config[prop]; });
    INSTRUMENT_CLOSEUP_SEQUENCES[key] = seq;
  }

  function configureInstrumentSequences() {
    if (typeof INSTRUMENT_CLOSEUP_SEQUENCES === 'undefined') return;

    var common = {
      hotaxios: {
        source: ['步骤3_PureCut高频电切破壁开口送导丝', 1, 45, 2], name: 'Hot AXIOS 电切输送系统', icon: '⚡', instName: 'Boston Scientific Hot AXIOS · 10.8Fr 一体化电切输送系统', targetName: '胃后壁 → 充盈空肠壁', title: 'Hot AXIOS · 胃空肠靶区独立操作定格', desc: '在胃—空肠解剖靶区内独立演示 Hot AXIOS：对准穿刺轴线、PureCut 电切破壁、外鞘进入目标肠腔。这里呈现器械在组织上的作用，不再播放白底器械转台。',
        stages: [[1,4,'器械准备','确认鞘管、刻度与释放控制处于初始位'],[5,8,'同轴靶向','先端沿计划轴线接近胃—空肠靶区'],[9,12,'PureCut 破壁','电切环建立通道并稳定送入外鞘'],[13,16,'第一段释放','推进控制件，准备展开远端法兰'],[17,19,'远端锚定','远端法兰逐步展开并完成定位'],[20,22,'回拉贴壁','轻柔回拉，使远端法兰贴紧空肠壁'],[23,24,'近端释放','完成胃侧法兰释放与双壁固定']]
      },
      guidewire: {
        source: ['步骤3_PureCut高频电切破壁开口送导丝', 35, 75, 2], name: '0.035 英寸亲水导丝', icon: '🌀', instName: '0.035 英寸亲水超滑导丝 · 交换型', targetName: '胃壁通道 → 空肠腔', title: '亲水导丝 · 空肠腔内独立送入定格', desc: '在已建立的胃壁通道与空肠腔内独立演示导丝：软头出鞘、顺应组织方向进入目标腔并建立后续支架释放的安全轨道。',
        stages: [[1,4,'出鞘','柔软头端沿输送通道平顺送出'],[5,8,'接触肠壁','无创软头受力后顺应性偏转'],[9,13,'继续送入','沿空肠长轴保持低阻力前进'],[14,17,'安全盘曲','在肠腔内形成稳定盘曲'],[18,20,'轨道确认','保留足够长度并确认无打折']]
      },
      lams: {
        source: ['步骤4_LAMS双法兰展开回拉对夹双壁', 1, 116, 4], name: 'LAMS 双法兰支架', icon: '🔗', instName: 'AXIOS LAMS · 双法兰覆膜金属支架', targetName: '空肠壁 ↔ 胃壁', title: 'LAMS · 胃空肠双壁独立释放定格', desc: '在胃壁与空肠壁的局部剖面内独立演示 LAMS：远端法兰在空肠侧展开、回拉贴壁、近端法兰在胃侧展开，最终形成双壁对夹通道。',
        stages: [[1,3,'鞘内压缩','支架保持低外径收纳状态'],[4,7,'远端展开','空肠侧法兰逐步张开并锚定'],[8,11,'形态确认','确认法兰完整、位置稳定'],[12,15,'回拉贴壁','拉近空肠壁与胃壁'],[16,18,'近端展开','胃侧法兰释放并形成对夹'],[19,20,'通道成形','中央腰部开放，完成旁路']]
      },
      echoendoscope: {
        source: ['步骤2_超声胃镜贴壁发射声束锁定', 1, 66, 3], name: '凸阵超声胃镜', icon: '📡', instName: 'Olympus 凸阵超声胃镜 · 大钳道型', targetName: '胃腔 → 胃后壁声窗 → 目标空肠', title: '凸阵超声胃镜 · 胃壁贴附定位独立定格', desc: '在胃腔与邻近空肠的局部解剖中独立演示超声胃镜：贴壁建立声窗、扇形扫查、彩色多普勒避开血管并锁定安全穿刺轴线。',
        stages: [[1,4,'进入胃腔','先端保持中立位通过食管'],[5,8,'贴壁耦合','水囊与胃后壁建立稳定声学接触'],[9,12,'扇形扫查','辨认充盈空肠与周围结构'],[13,16,'多普勒避障','排除穿刺路径上的重要血管'],[17,20,'锁定轴线','固定无血管安全窗与出针方向']]
      },
      dilation_catheter: {
        source: ['步骤1_导管越过狭窄充盈目标空肠', 24, 92, 3], name: '刻度造影导管', icon: '💧', instName: '刻度造影 / 冲洗导管', targetName: '胃腔 → 狭窄远端目标空肠袢', title: '刻度造影导管 · 越过狭窄并充盈空肠独立定格', desc: '在上消化道解剖场景中独立演示导管：内镜引导下送入、越过狭窄、到达目标空肠，并分段注液形成可被 EUS 识别的声窗。',
        stages: [[1,3,'导管准备','冲洗管腔并确认刻度'],[4,7,'越过狭窄','沿导丝低阻力推进'],[8,11,'位置确认','侧孔位于计划空肠段'],[12,14,'分段注液','缓慢建立充盈声窗'],[15,16,'停止并固定','确认无反流与位置稳定']]
      },
      epass: {
        source: ['步骤1_导管越过狭窄充盈目标空肠', 68, 131, 3], name: 'EPASS 双气囊导管', icon: '🎈', instName: 'EPASS 双气囊肠道充盈导管', targetName: '目标空肠隔离充盈段', title: 'EPASS · 目标空肠隔离充盈路径演示', desc: '现有资料帧重点展示目标空肠的定位与充盈效果，因此这里按临床路径呈现“导管到位—目标肠袢扩张—声窗形成”；双气囊的具体结构仍在“器械结构”中单独核对，避免把资料中没有清晰呈现的动作画错。',
        stages: [[1,3,'导管到位','双气囊跨越计划目标段'],[4,6,'远端气囊','先充盈远端气囊形成阻断'],[7,9,'近端气囊','再充盈近端气囊完成隔离'],[10,13,'中段注液','经侧孔扩张目标肠段'],[14,16,'声窗确认','维持稳定形态等待 EUS 定位']]
      }
    };

    Object.keys(common).forEach(function (key) {
      var item = common[key];
      var frames = clinicalStepFrames(item.source[0], item.source[1], item.source[2], item.source[3]);
      var stages = scaleStages(item.stages, frames.length);
      setInstrumentSequence(key, {
        key: key, name: item.name, instName: item.instName, targetName: item.targetName,
        title: item.icon + ' ' + item.title, desc: '【器械专属过程】' + item.desc,
        badge: item.icon + ' ' + item.name + ' · 解剖部位独立操作', frames: frames,
        captions: stagedCaptions(frames.length, stages), stageEnds: stages.slice(0, -1).map(function (s) { return s.to; })
      });
    });
    installInstrumentPlaybackOverrides();
  }

  function installInstrumentPlaybackOverrides() {
    if (typeof renderCloseupFrame !== 'function') return;
    renderCloseupFrame = function (idx) {
      var seq = INSTRUMENT_CLOSEUP_SEQUENCES[currentCloseupInstKey] || INSTRUMENT_CLOSEUP_SEQUENCES.hotaxios;
      if (!seq || !seq.frames) return;
      idx = Math.max(0, Math.min(seq.frames.length - 1, Number(idx) || 0));
      currentCloseupFrameIdx = idx;
      var image = document.getElementById('studio-main-frame'); if (image) image.src = seq.frames[idx];
      var caption = seq.captions[idx] || '';
      var badge = document.getElementById('studio-action-badge'); if (badge) badge.textContent = caption;
      var display = document.getElementById('st-frame-display'); if (display) display.textContent = '专属帧 ' + String(idx + 1).padStart(2, '0') + ' / ' + String(seq.frames.length).padStart(2, '0');
      var time = document.getElementById('st-time-display'); if (time) time.textContent = '⏱ ' + (idx * 0.42).toFixed(1) + 's';
      var slider = document.getElementById('st-timeline-slider'); if (slider) slider.value = idx + 1;
    };

    playCloseupStudio = function () {
      closeupIsPlaying = true;
      var icon = document.getElementById('st-play-icon'); var copy = document.getElementById('st-play-text');
      if (icon) icon.textContent = '⏸'; if (copy) copy.textContent = '暂停器械过程';
      clearInterval(closeupPlayTimer); clearTimeout(closeupPlayTimer);
      function advance() {
        var seq = INSTRUMENT_CLOSEUP_SEQUENCES[currentCloseupInstKey];
        if (!seq || !closeupIsPlaying) return;
        if (currentCloseupFrameIdx >= seq.frames.length - 1) {
          pauseCloseupStudio();
          var badge = document.getElementById('studio-action-badge'); if (badge) badge.textContent = '✓ ' + seq.name + '独立过程播放完毕，可回看任意单帧';
          return;
        }
        currentCloseupFrameIdx += 1; renderCloseupFrame(currentCloseupFrameIdx);
        var pauseAtStage = Array.isArray(seq.stageEnds) && seq.stageEnds.indexOf(currentCloseupFrameIdx + 1) !== -1;
        closeupPlayTimer = setTimeout(advance, (pauseAtStage ? 920 : 400) / stPlaybackSpeed);
      }
      closeupPlayTimer = setTimeout(advance, 400 / stPlaybackSpeed);
    };

    pauseCloseupStudio = function () {
      closeupIsPlaying = false; clearInterval(closeupPlayTimer); clearTimeout(closeupPlayTimer);
      var icon = document.getElementById('st-play-icon'); var copy = document.getElementById('st-play-text');
      if (icon) icon.textContent = '▶'; if (copy) copy.textContent = '播放器械过程';
    };

    var originalLoad = loadCloseupSequence;
    loadCloseupSequence = function (instKey) {
      originalLoad(instKey);
      var tab = document.getElementById('tab-tier-closeup'); if (tab) tab.innerHTML = '🩺 器械独立过程';
      var sub = document.getElementById('st-modal-sub'); if (sub) sub.textContent = '器械专属图片帧 · 非整台手术截取 · 支持暂停、单帧、缩放与讲解标记';
    };
  }

  function addSurgeryPresentationControls() {
    var tabs = document.getElementById('studio-tier-tabs'); if (!tabs) return;
    var closeTab = document.getElementById('tab-tier-closeup'); var globalTab = document.getElementById('tab-tier-global');
    if (closeTab) closeTab.innerHTML = '🩺 器械独立过程';
    if (globalTab) globalTab.innerHTML = '🎬 EUS-GE 完整手术';

    document.querySelectorAll('.btn-turntable-inst span').forEach(function (label) {
      label.textContent = '🔬 器械结构与规格';
    });

    if (!document.getElementById('tab-tier-structure')) {
      var structure = document.createElement('button');
      structure.className = 'tier-tab'; structure.id = 'tab-tier-structure'; structure.textContent = '🔬 器械结构';
      structure.title = '查看器械外观、结构与规格，不进入手术动画';
      structure.onclick = function () { if (typeof pauseCloseupStudio === 'function') pauseCloseupStudio(); if (typeof openInstrument2DStudio === 'function') openInstrument2DStudio(currentCloseupInstKey || 'hotaxios'); };
      tabs.insertBefore(structure, globalTab);
    }

    var headerActions = document.querySelector('.studio-header-actions');
    if (headerActions && !document.getElementById('audience-mode-toggle')) {
      var audience = document.createElement('button');
      audience.id = 'audience-mode-toggle'; audience.className = 'btn-audience-mode'; audience.dataset.mode = 'family'; audience.innerHTML = '👨‍👩‍👧 家属讲解';
      audience.title = '切换患者家属可理解的讲解表达 / 专业术式表达'; audience.onclick = toggleAudienceMode;
      headerActions.insertBefore(audience, headerActions.firstChild);
    }

    document.addEventListener('click', function (event) {
      var hotspot = event.target.closest && event.target.closest('.surgical-hotspot'); if (!hotspot) return;
      var guide = document.getElementById('eus-target-guide'); if (guide) guide.remove();
      setTimeout(function () { var sub = document.getElementById('st-modal-sub'); if (sub) sub.textContent = '已从三维手术点位进入 · 图片帧可逐帧查看、放大、平移并标注'; }, 0);
    });

    if (typeof openInstrument2DStudio === 'function') {
      var originalOpenInstrument2DStudio = openInstrument2DStudio;
      openInstrument2DStudio = function (instKey) {
        originalOpenInstrument2DStudio(instKey);
        setTimeout(function () {
          var sub = document.getElementById('inst-2d-sub');
          var status = document.getElementById('inst-2d-play-status-pill');
          var apply = document.getElementById('btn-inst-2d-apply');
          if (sub) sub.textContent = '器械结构识别与规格核对 · 与解剖部位临床操作动画分开';
          if (status) status.textContent = '🔬 结构多角度查看';
          if (apply) apply.innerHTML = '<span>🩺 在解剖部位查看用法</span>';
        }, 0);
      };
    }
  }

  function toggleAudienceMode() {
    var button = document.getElementById('audience-mode-toggle'); if (!button) return;
    var family = button.dataset.mode !== 'family'; button.dataset.mode = family ? 'family' : 'clinical';
    button.innerHTML = family ? '👨‍👩‍👧 家属讲解' : '🩺 专业讲解';
    var card = document.getElementById('studio-step-card'); if (card) card.classList.toggle('family-language', family);
    var sub = document.getElementById('st-modal-sub');
    if (sub) sub.textContent = family ? '家属讲解模式 · 先说明为什么做、怎么绕开梗阻、术后食物如何通过' : '专业讲解模式 · 观察入路、声窗、无血管区、器械释放与吻合口形态';
  }

  function createOrganModal() {
    if (document.getElementById('organ-stopmotion-modal')) return;
    var modal = document.createElement('div');
    modal.id = 'organ-stopmotion-modal'; modal.className = 'organ-stopmotion-modal hidden';
    modal.innerHTML = [
      '<div class="organ-motion-dialog" role="dialog" aria-modal="true" aria-labelledby="organ-motion-title">',
      '<header class="organ-motion-header"><div class="organ-motion-heading"><span id="organ-motion-icon">🫀</span><div><h3 id="organ-motion-title">器官独立定格巡视</h3><p id="organ-motion-sub">由当前三维器官实时生成 18 张独立图片帧</p></div></div><div class="organ-motion-header-actions"><button type="button" id="organ-motion-full">⛶ 全屏</button><button type="button" id="organ-motion-close">✕ 关闭</button></div></header>',
      '<div class="organ-motion-stage" id="organ-motion-stage"><div class="organ-motion-loading" id="organ-motion-loading"><span></span><b>正在从三维标本生成独立图片帧…</b></div><div class="organ-motion-transform" id="organ-motion-transform"><img id="organ-motion-image" alt="器官定格帧"><div id="organ-motion-pins"></div></div><div class="organ-motion-toolbar"><button type="button" data-zoom="-0.25">−</button><button type="button" data-zoom="reset">1:1</button><button type="button" data-zoom="0.25">＋</button><button type="button" id="organ-motion-mark">📍 标记</button><button type="button" id="organ-motion-clear">清除标记</button></div><div class="organ-motion-caption" id="organ-motion-caption">前方视角</div></div>',
      '<footer class="organ-motion-footer"><div class="organ-motion-focus"><b>讲解重点</b><span id="organ-motion-focus"></span></div><div class="organ-motion-timeline"><button type="button" id="organ-motion-prev">◀ 单帧</button><button type="button" id="organ-motion-play">⏸ 暂停</button><input id="organ-motion-range" type="range" min="1" max="18" value="1"><span id="organ-motion-count">01 / 18</span><button type="button" id="organ-motion-next">单帧 ▶</button></div></footer>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) { if (e.target === modal) closeOrganStopMotion(); });
    document.getElementById('organ-motion-close').onclick = closeOrganStopMotion;
    document.getElementById('organ-motion-full').onclick = function () { modal.classList.toggle('fullscreen'); };
    document.getElementById('organ-motion-prev').onclick = function () { setOrganPlaying(false); showOrganFrame(organPlayer.index - 1); };
    document.getElementById('organ-motion-next').onclick = function () { setOrganPlaying(false); showOrganFrame(organPlayer.index + 1); };
    document.getElementById('organ-motion-play').onclick = function () { setOrganPlaying(!organPlayer.playing); };
    document.getElementById('organ-motion-range').oninput = function () { setOrganPlaying(false); showOrganFrame(Number(this.value) - 1); };
    document.getElementById('organ-motion-mark').onclick = function () { organPlayer.marking = !organPlayer.marking; this.classList.toggle('active', organPlayer.marking); this.textContent = organPlayer.marking ? '📍 点击画面落点' : '📍 标记'; };
    document.getElementById('organ-motion-clear').onclick = clearOrganPins;
    modal.querySelectorAll('[data-zoom]').forEach(function (button) {
      button.onclick = function () { if (this.dataset.zoom === 'reset') { organPlayer.zoom = 1; organPlayer.x = 0; organPlayer.y = 0; } else { organPlayer.zoom = Math.max(1, Math.min(4, organPlayer.zoom + Number(this.dataset.zoom))); } updateOrganTransform(); };
    });
    var stage = document.getElementById('organ-motion-stage');
    stage.addEventListener('wheel', function (e) { e.preventDefault(); organPlayer.zoom = Math.max(1, Math.min(4, organPlayer.zoom + (e.deltaY < 0 ? 0.18 : -0.18))); updateOrganTransform(); }, { passive: false });
    stage.addEventListener('click', function (e) { if (!organPlayer.marking || e.target.closest('.organ-motion-toolbar')) return; var rect = stage.getBoundingClientRect(); addOrganPin((e.clientX - rect.left) / rect.width * 100, (e.clientY - rect.top) / rect.height * 100); });
  }

  function addOrganButtons() {
    Object.keys(ORGAN_META).forEach(function (key) {
      var card = document.getElementById('card-' + key); if (!card || card.querySelector('.organ-motion-entry')) return;
      var button = document.createElement('button'); button.type = 'button'; button.className = 'organ-motion-entry'; button.innerHTML = '<span>▦</span> 器官定格';
      button.title = '打开' + ORGAN_META[key].name + '独立 360° 图片帧动画';
      button.onclick = function (event) { event.preventDefault(); event.stopPropagation(); openOrganStopMotion(key); };
      card.appendChild(button);
    });
  }

  function objectBelongsToOrgan(obj, key) {
    var name = ((obj && obj.name) || '').toLowerCase(); var parent = ((obj && obj.parent && obj.parent.name) || '').toLowerCase();
    if (key === 'stomach') return (name + parent).indexOf('stomach_full') !== -1;
    var patterns = (typeof ORGAN_MESH_MAP !== 'undefined' && ORGAN_MESH_MAP[key]) || [];
    return patterns.some(function (pattern) { var p = String(pattern).toLowerCase(); return name.indexOf(p) !== -1 || parent.indexOf(p) !== -1; });
  }

  function generateOrganFrames(key) {
    if (organFrameCache[key]) return organFrameCache[key];
    if (typeof THREE === 'undefined' || typeof allModelObjects === 'undefined' || !allModelObjects.length) return [];
    var selected = allModelObjects.filter(function (obj) { return objectBelongsToOrgan(obj, key); }); if (!selected.length) return [];
    var visibleState = allModelObjects.map(function (obj) { return obj.visible; });
    var cameraPosition = camera.position.clone(); var cameraQuaternion = camera.quaternion.clone(); var cameraZoom = camera.zoom; var controlsTarget = controls.target.clone();
    var plinthVisible = typeof plinth !== 'undefined' ? plinth.visible : true; var hotspotDisplay = hotspotOverlay ? hotspotOverlay.style.display : '';
    allModelObjects.forEach(function (obj) { obj.visible = selected.indexOf(obj) !== -1; });
    if (typeof plinth !== 'undefined') plinth.visible = false; if (hotspotOverlay) hotspotOverlay.style.display = 'none';
    var box = new THREE.Box3(); selected.forEach(function (obj) { box.expandByObject(obj); });
    var center = new THREE.Vector3(); var size = new THREE.Vector3(); box.getCenter(center); box.getSize(size);
    var maxDim = Math.max(size.x, size.y, size.z, 0.35); var dist = Math.max(maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.35, 1.3); var frames = [];
    for (var i = 0; i < 18; i += 1) {
      var angle = Math.PI * 2 * i / 18;
      camera.position.set(center.x + Math.sin(angle) * dist, center.y + size.y * 0.08, center.z + Math.cos(angle) * dist);
      camera.lookAt(center); camera.updateMatrixWorld(true); renderer.render(scene, camera); frames.push(renderer.domElement.toDataURL('image/png'));
    }
    allModelObjects.forEach(function (obj, index) { obj.visible = visibleState[index]; });
    if (typeof plinth !== 'undefined') plinth.visible = plinthVisible;
    camera.position.copy(cameraPosition); camera.quaternion.copy(cameraQuaternion); camera.zoom = cameraZoom; camera.updateProjectionMatrix(); controls.target.copy(controlsTarget); controls.update();
    if (hotspotOverlay) hotspotOverlay.style.display = hotspotDisplay; renderer.render(scene, camera);
    organFrameCache[key] = frames; return frames;
  }

  function openOrganStopMotion(key, retry) {
    markStageInteraction(); createOrganModal(); var modal = document.getElementById('organ-stopmotion-modal'); var meta = ORGAN_META[key]; if (!meta || !modal) return;
    modal.classList.remove('hidden'); document.getElementById('organ-motion-icon').textContent = meta.icon;
    document.getElementById('organ-motion-title').textContent = meta.name + ' · 独立定格巡视';
    document.getElementById('organ-motion-sub').textContent = meta.en + ' · 18 张实时三维图片帧 · 与手术全流程完全分开';
    document.getElementById('organ-motion-focus').textContent = meta.focus;
    document.getElementById('organ-motion-loading').classList.remove('hidden'); document.getElementById('organ-motion-image').classList.add('hidden'); clearOrganPins();
    organPlayer.key = key; organPlayer.index = 0; organPlayer.zoom = 1; organPlayer.x = 0; organPlayer.y = 0; updateOrganTransform();
    setTimeout(function () {
      var frames = generateOrganFrames(key);
      if (!frames.length && (retry || 0) < 12) { openOrganStopMotion(key, (retry || 0) + 1); return; }
      organPlayer.frames = frames; var loading = document.getElementById('organ-motion-loading'); var image = document.getElementById('organ-motion-image');
      if (loading) loading.classList.add('hidden');
      if (!frames.length) { if (loading) { loading.classList.remove('hidden'); loading.innerHTML = '<b>器官模型尚未加载完成，请稍后再试。</b>'; } return; }
      image.classList.remove('hidden'); showOrganFrame(0); setOrganPlaying(true);
    }, 60);
  }

  window.openOrganStopMotion = openOrganStopMotion;
  function closeOrganStopMotion() { setOrganPlaying(false); var modal = document.getElementById('organ-stopmotion-modal'); if (modal) { modal.classList.add('hidden'); modal.classList.remove('fullscreen'); } }
  function setOrganPlaying(playing) {
    organPlayer.playing = playing; clearInterval(organPlayerTimer); var button = document.getElementById('organ-motion-play'); if (button) button.textContent = playing ? '⏸ 暂停' : '▶ 播放';
    if (!playing || !organPlayer.frames.length) return; organPlayerTimer = setInterval(function () { showOrganFrame(organPlayer.index + 1); }, 480);
  }
  function showOrganFrame(index) {
    if (!organPlayer.frames.length) return; var count = organPlayer.frames.length; organPlayer.index = (index + count) % count;
    var image = document.getElementById('organ-motion-image'); if (image) image.src = organPlayer.frames[organPlayer.index];
    var range = document.getElementById('organ-motion-range'); if (range) { range.max = count; range.value = organPlayer.index + 1; }
    var counter = document.getElementById('organ-motion-count'); if (counter) counter.textContent = String(organPlayer.index + 1).padStart(2, '0') + ' / ' + String(count).padStart(2, '0');
    var names = ['正面','正面偏左','左前斜位','左侧','左后斜位','后方偏左','后方','后方偏右','右后斜位','右侧','右前斜位','正面偏右'];
    var caption = document.getElementById('organ-motion-caption'); if (caption) caption.textContent = '帧 ' + String(organPlayer.index + 1).padStart(2, '0') + ' · ' + names[Math.floor(organPlayer.index * names.length / count)] + ' · 可暂停放大并落点标记';
  }
  function updateOrganTransform() { var transform = document.getElementById('organ-motion-transform'); if (transform) transform.style.transform = 'translate(' + organPlayer.x + 'px,' + organPlayer.y + 'px) scale(' + organPlayer.zoom + ')'; }
  function addOrganPin(x, y) { var pins = document.getElementById('organ-motion-pins'); if (!pins) return; organPlayer.pin += 1; var pin = document.createElement('span'); pin.className = 'organ-motion-pin'; pin.textContent = organPlayer.pin; pin.style.left = x + '%'; pin.style.top = y + '%'; pin.title = '讲解标记 ' + organPlayer.pin; pins.appendChild(pin); }
  function clearOrganPins() { organPlayer.pin = 0; var pins = document.getElementById('organ-motion-pins'); if (pins) pins.innerHTML = ''; }

  /* -----------------------------------------------------------------------
   * Workspace contact interactions
   * Dragging a tool now changes the anatomy workspace first. The animation is
   * deliberately secondary: clinicians can demonstrate the contact moment,
   * then open its explanatory image-frame sequence if needed.
   * --------------------------------------------------------------------- */
  var workspaceContact = { instrument: null, last: null, marks: [] };
  var workspaceRaycaster = null;
  var workspacePointer = null;
  var CONTACT_RULES = {
    echoendoscope: { organs: ['stomach'], label: '贴附胃壁建立 EUS 声窗', effect: 'eus', sceneTime: 1.25 },
    dilation_catheter: { organs: ['stomach', 'jejunum'], label: '在目标肠段注液充盈', effect: 'fluid', sceneTime: 1.45 },
    epass: { organs: ['stomach', 'jejunum'], label: '在目标空肠建立充盈区', effect: 'balloon', sceneTime: 1.52 },
    hotaxios: { organs: ['stomach', 'jejunum'], label: '接触组织后建立切口', effect: 'incision', sceneTime: 2.55 },
    guidewire: { organs: ['stomach', 'jejunum'], label: '经切口送入导丝', effect: 'wire', sceneTime: 3.18 },
    lams: { organs: ['stomach', 'jejunum'], label: '释放支架并对夹双壁', effect: 'stent', sceneTime: 4.55 }
  };

  function ensureWorkspaceContactLayer() {
    var stage = document.getElementById('stage-viewport');
    if (!stage) return null;
    var layer = document.getElementById('workspace-contact-layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'workspace-contact-layer';
    layer.innerHTML = '<div id="workspace-contact-preview" class="workspace-contact-preview hidden"></div><div id="workspace-contact-hint" class="workspace-contact-hint hidden"></div>';
    stage.appendChild(layer);
    return layer;
  }

  function organKeyFromObject(object) {
    var current = object;
    while (current) {
      var source = ((current.name || '') + ' ' + ((current.parent && current.parent.name) || '')).toLowerCase();
      if (source.indexOf('stomach') !== -1) return 'stomach';
      if (source.indexOf('jejunum') !== -1) return 'jejunum';
      if (source.indexOf('pancreas') !== -1) return 'pancreas';
      if (source.indexOf('liver') !== -1) return 'liver';
      if (source.indexOf('gallbladder') !== -1 || source.indexOf('bile') !== -1) return 'biliary';
      if (source.indexOf('esophagus') !== -1) return 'esophagus';
      current = current.parent;
    }
    return null;
  }

  function resolveWorkspaceContact(clientX, clientY, instKey) {
    var rule = CONTACT_RULES[instKey];
    if (!rule || typeof THREE === 'undefined' || !renderer || !camera || !allModelObjects || !allModelObjects.length) return null;
    var canvasRect = renderer.domElement.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return null;
    if (!workspaceRaycaster) workspaceRaycaster = new THREE.Raycaster();
    if (!workspacePointer) workspacePointer = new THREE.Vector2();
    workspacePointer.x = ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    workspacePointer.y = -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
    workspaceRaycaster.setFromCamera(workspacePointer, camera);
    var candidates = allModelObjects.filter(function (item) {
      return item.visible && rule.organs.indexOf(organKeyFromObject(item)) !== -1;
    });
    var hits = workspaceRaycaster.intersectObjects(candidates, false);
    if (!hits.length) return null;
    var stage = document.getElementById('stage-viewport');
    var stageRect = stage.getBoundingClientRect();
    var hit = hits[0];
    return {
      instrument: instKey,
      organ: organKeyFromObject(hit.object),
      point: hit.point.clone(),
      x: clientX - stageRect.left,
      y: clientY - stageRect.top,
      valid: true
    };
  }

  function showWorkspacePreview(contact) {
    ensureWorkspaceContactLayer();
    var preview = document.getElementById('workspace-contact-preview');
    if (!preview) return;
    if (!contact) { preview.classList.add('hidden'); return; }
    var rule = CONTACT_RULES[contact.instrument];
    preview.className = 'workspace-contact-preview ' + rule.effect;
    preview.style.left = contact.x + 'px'; preview.style.top = contact.y + 'px';
    preview.innerHTML = '<span class="workspace-contact-preview-dot"></span><b>放开：' + rule.label + '</b><small>' + (contact.organ === 'stomach' ? '胃壁接触点' : '空肠接触点') + '</small>';
  }

  function showWorkspaceHint(message, type) {
    ensureWorkspaceContactLayer();
    var hint = document.getElementById('workspace-contact-hint');
    if (!hint) return;
    hint.className = 'workspace-contact-hint ' + (type || '') + ' active';
    hint.textContent = message;
    clearTimeout(hint._dismissTimer);
    hint._dismissTimer = setTimeout(function () { hint.classList.remove('active'); }, 3200);
  }

  function makeContactMark(contact) {
    var rule = CONTACT_RULES[contact.instrument];
    var mark = document.createElement('button');
    mark.type = 'button';
    mark.className = 'workspace-contact-mark ' + rule.effect;
    mark.style.left = contact.x + 'px'; mark.style.top = contact.y + 'px';
    mark.title = '查看 ' + rule.label + ' 的独立操作过程';
    mark.innerHTML = contactMarkMarkup(rule.effect, contact.organ);
    mark.onclick = function (event) {
      event.stopPropagation();
      if (typeof launchSurgeryStepFromInstrument === 'function') launchSurgeryStepFromInstrument(contact.instrument);
    };
    return mark;
  }

  function contactMarkMarkup(effect, organ) {
    var location = organ === 'stomach' ? '胃壁' : '空肠';
    if (effect === 'incision') return '<span class="mark-energy">⚡</span><span class="mark-incision"></span><span class="mark-label">' + location + '切口已建立</span><span class="mark-action">查看过程</span>';
    if (effect === 'eus') return '<span class="mark-eus-wave"></span><span class="mark-label">EUS 声窗</span><span class="mark-action">查看过程</span>';
    if (effect === 'wire') return '<span class="mark-wire-line"></span><span class="mark-label">导丝已进入</span><span class="mark-action">查看过程</span>';
    if (effect === 'stent') return '<span class="mark-stent-mesh"></span><span class="mark-label">双壁对夹</span><span class="mark-action">查看过程</span>';
    if (effect === 'balloon') return '<span class="mark-balloon-zone"></span><span class="mark-label">目标肠段充盈</span><span class="mark-action">查看过程</span>';
    return '<span class="mark-fluid-zone"></span><span class="mark-label">肠段已充盈</span><span class="mark-action">查看过程</span>';
  }

  function setWorkspaceSurgicalState(contact) {
    var rule = CONTACT_RULES[contact.instrument];
    if (!rule || typeof activeOrgans === 'undefined') return;
    activeOrgans.clear(); activeOrgans.add('stomach'); activeOrgans.add('jejunum');
    if (typeof currentSurgMode !== 'undefined') currentSurgMode = 'eus_ge';
    if (typeof isContinuousPlaying !== 'undefined') isContinuousPlaying = false;
    if (typeof targetAnimTime !== 'undefined') targetAnimTime = null;
    if (typeof updateSceneVisibility === 'function') updateSceneVisibility();
    if (typeof updateHotspotVisibility === 'function') updateHotspotVisibility();
    if (typeof updateSurgeryAnimation === 'function') updateSurgeryAnimation(rule.sceneTime);
    if (typeof animTime !== 'undefined') animTime = rule.sceneTime;
  }

  function applyWorkspaceContact(contact) {
    var layer = ensureWorkspaceContactLayer(); if (!layer || !contact) return;
    var preview = document.getElementById('workspace-contact-preview'); if (preview) preview.classList.add('hidden');
    layer.querySelectorAll('.workspace-contact-mark').forEach(function (mark) { mark.remove(); });
    var mark = makeContactMark(contact); layer.appendChild(mark);
    workspaceContact.last = contact; workspaceContact.marks = [mark];
    setWorkspaceSurgicalState(contact);
    showWorkspaceHint('已在' + (contact.organ === 'stomach' ? '胃壁' : '空肠') + '建立“' + CONTACT_RULES[contact.instrument].label + '”状态。点击标记可查看该器械的独立过程。', 'success');
  }

  function installWorkspaceContactInteractions() {
    ensureWorkspaceContactLayer();
    var oldDrag = window.onDragInstrument;
    var oldDrop = window.onDropStage;
    window.__originalOrganDropStage = oldDrop;
    window.onDragInstrument = function (event, instKey) {
      if (typeof oldDrag === 'function') oldDrag(event, instKey);
      workspaceContact.instrument = instKey;
      showWorkspaceHint('将器械拖到胃或空肠表面；接触成功后，工作区会直接显示器官反应。', 'instruction');
    };

    var oldDragOver = window.onDragOverStage;
    window.onDragOverStage = function (event) {
      if (typeof oldDragOver === 'function') oldDragOver(event);
      var instKey = workspaceContact.instrument || (typeof currentActiveInstrument !== 'undefined' && currentActiveInstrument);
      if (!instKey || !CONTACT_RULES[instKey]) return;
      event.preventDefault();
      var contact = resolveWorkspaceContact(event.clientX, event.clientY, instKey);
      showWorkspacePreview(contact);
    };

    window.onDropStage = function (event) {
      var raw = event.dataTransfer && event.dataTransfer.getData('text/plain');
      if (!raw || raw.indexOf('instrument:') !== 0) {
        if (typeof oldDrop === 'function') oldDrop(event);
        return;
      }
      event.preventDefault();
      var stage = document.getElementById('stage-viewport'); if (stage) stage.classList.remove('drag-over');
      var instKey = raw.split(':')[1];
      var contact = resolveWorkspaceContact(event.clientX, event.clientY, instKey);
      if (!contact) {
        showWorkspacePreview(null);
        showWorkspaceHint('请把器械放到可见的胃或空肠表面，而不是空白区域。', 'warning');
        return;
      }
      applyWorkspaceContact(contact);
    };

    /* Preserve a non-intrusive direct-action path: it tells the user to drag
       instead of bypassing the contact interaction with an immediate modal. */
    Object.keys(CONTACT_RULES).forEach(function (key) {
      var card = document.getElementById('card-inst-' + key); if (!card) return;
      var button = card.querySelector('.btn-apply-inst');
      if (!button) return;
      button.innerHTML = '<span>🖐 拖至器官操作</span>';
      button.onclick = function (event) {
        event.preventDefault(); event.stopPropagation(); workspaceContact.instrument = key;
        showWorkspaceHint('请从该器械卡片拖到工作区内的胃或空肠表面。接触成功后会立即出现对应器官反应。', 'instruction');
      };
    });
  }

  function initialize() {
    installStylesheet(); configureEntryFlow(); configureInstrumentSequences(); addSurgeryPresentationControls(); createOrganModal(); addOrganButtons(); installWorkspaceContactInteractions();
  }
  initialize();
  window.addEventListener('load', function () { if (!startupFinished && !window.__organUserInteracted) forceEmptyStage(); addOrganButtons(); });
})();
