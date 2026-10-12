/* Gastric ESD teaching interaction. No autoplay, video or fixed clinical settings.
 * The raster anatomy stays registered; only local tissue layers respond to input.
 * Sources and limits: ESD_医学依据与验收记录.md.
 */
(function () {
  'use strict';
  var BASE = 'media/two_d_surgery/esd_00_gastric_section_v2.png';
  var BED = 'media/two_d_surgery/esd_01_gastric_resection_bed_v2.png';
  var CX = 768, CY = 453, RX = 280, RY = 140;
  var root, svg, api, model, history = [], zoom = 1, pan = { x: 0, y: 0 }, panning = false, drag;

  function instrumentDiagram(kind) {
    var tip = kind === 'injector' ? '<path d="M250 93L282 69" stroke="#8fa5b0" stroke-width="4"/><path d="M281 69L293 59" stroke="#586a75" stroke-width="2"/>'
      : kind === 'knife' ? '<path d="M250 93L277 73" stroke="#f3eee3" stroke-width="9"/><path d="M277 73L288 64" stroke="#8d9ba6" stroke-width="3"/><path d="M284 62L291 68" stroke="#546674" stroke-width="3"/>'
      : kind === 'forceps' ? '<path d="M251 92L278 76L294 60M251 92L278 83L301 81" fill="none" stroke="#708390" stroke-width="4"/><path d="M289 63L294 60L298 64M295 81L301 81L301 75" stroke="#4f6572" stroke-width="3" fill="none"/>'
      : '<ellipse cx="280" cy="70" rx="38" ry="25" transform="rotate(-28 280 70)" fill="#e7f1f199" stroke="#7d9fa5" stroke-width="2"/><path d="M247 79L295 48M252 87L302 55M261 91L309 64M253 57L293 84M262 48L302 76" stroke="#a2b8ba" stroke-width="1"/>';
    var markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 170"><defs><linearGradient id="m"><stop stop-color="#a7b2bb"/><stop offset=".5" stop-color="#edf1f1"/><stop offset="1" stop-color="#61737c"/></linearGradient></defs><rect width="340" height="170" rx="14" fill="#f6f3ed"/><path d="M38 133Q115 160 162 123L254 91" fill="none" stroke="#6d7e89" stroke-width="7"/><path d="M38 132Q115 156 162 121L253 89" fill="none" stroke="url(#m)" stroke-width="4"/><rect x="22" y="105" width="66" height="17" rx="6" fill="#e7ecec" stroke="#70828d" transform="rotate(22 22 105)"/><path d="M36 108L22 140M72 120L58 152" stroke="#758a94" stroke-width="5"/>' + tip + '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
  }
  var tools = [
    { key: 'esd_knife', icon: '✂', color: '#a95c4b', name: 'ESD 专用电刀', tag: '同一电刀：标记、切开与逐步剥离', image: 'media/two_d_surgery/esd_instrument_knife_v2.png', source: 'AI 器械形态示意 · 非品牌实物', specs: ['先标记病灶边界', '在黏膜下层逐步剥离', '不提供电刀参数处方'] },
    { key: 'esd_injector', icon: '💧', color: '#338b99', name: '内镜黏膜下注射针', tag: '注射形成局部液垫与隆起', image: 'media/two_d_surgery/esd_instrument_injector_v2.png', source: 'AI 器械形态示意 · 非品牌实物', specs: ['黏膜下注射', '保护深层肌层', '药液和剂量由术者决定'] },
    { key: 'esd_hemostasis', icon: '◎', color: '#80634d', name: '内镜止血钳', tag: '处理剥离床可见血管', image: 'media/two_d_surgery/esd_instrument_hemostasis_v2.png', source: 'AI 器械形态示意 · 非品牌实物', specs: ['创面血管处理示意', '不等于必须夹闭整个创面', '方法依临床情况选择'] },
    { key: 'esd_retrieval', icon: '▧', color: '#54796e', name: '内镜标本回收网', tag: '完整回收已游离的病灶标本', image: 'media/two_d_surgery/esd_instrument_retrieval_v2.png', source: 'AI 器械形态示意 · 非品牌实物', specs: ['用于标本回收，不是切除器械', '标本固定并送病理', '切除不等于即时确诊或治愈'] }
  ];

  function fresh() { return { marks: [], lift: 0, cuts: [], dissection: 0, vessel: false, retrieved: false, confirmed: false, connected: false, tool: null, mode: 'auto', tip: null }; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function tell(message, type) { if (api) api.message(message, type || 'instruction'); }
  function knifeMode() {
    if (model.mode !== 'auto') return model.mode;
    if (model.marks.length < 6) return 'mark';
    if (model.cuts.length < 4) return 'incise';
    return 'dissect';
  }
  function activeStep() {
    if (model.retrieved) return 6;
    if (model.dissection === 5) return model.vessel ? 5 : 4;
    if (model.cuts.length === 4) return 3;
    if (model.lift > 0) return 2;
    if (model.marks.length === 6) return 1;
    return 0;
  }
  function recommendedLocal() {
    var kind = model.tool;
    if (kind === 'esd_knife') {
      var mode = knifeMode(), index = 0, count = mode === 'mark' ? 6 : 4;
      var completed = mode === 'mark' ? model.marks : model.cuts;
      while (completed.indexOf(index) !== -1 && index < count - 1) index++;
      var angle = -Math.PI / 2 + index * Math.PI * 2 / count;
      if (mode === 'dissect') return { x: CX, y: CY + 35 };
      return { x: CX + (RX + 5) * Math.cos(angle), y: CY + (RY + 5) * Math.sin(angle) };
    }
    if (kind === 'esd_hemostasis') return { x: CX + 48, y: CY + 18 };
    if (kind === 'esd_retrieval') return { x: CX, y: CY - 115 };
    return { x: CX - 185, y: CY + 55 };
  }
  function fromClient(clientX, clientY) {
    if (!svg || !svg.getScreenCTM()) return null;
    var screen = new DOMPoint(clientX, clientY).matrixTransform(svg.getScreenCTM().inverse());
    return { x: (screen.x - CX - pan.x) / zoom + CX, y: (screen.y - CY - pan.y) / zoom + CY };
  }
  function fromPercent(point) {
    if (!api || !api.canvas) return null;
    var rect = api.canvas.getBoundingClientRect();
    return fromClient(rect.left + point.x * rect.width / 100, rect.top + point.y * rect.height / 100);
  }
  function normalized(local) { return Math.hypot((local.x - CX) / RX, (local.y - CY) / RY); }
  function isOnTarget(point) {
    var local = fromPercent(point);
    // Include a freed specimen above the wound for retrieval, not blank canvas.
    return !!local && (normalized(local) < 1.45 || (model && model.tool === 'esd_retrieval' && Math.hypot((local.x - CX) / RX, (local.y - CY + 115) / RY) < 1.15));
  }
  function record() { history.push(clone(model)); if (history.length > 45) history.shift(); }

  function operate(actionKey, local, useNext) {
    if (!model || !model.confirmed) { tell('请先点击局部病灶，确认这次讲解的操作部位。', 'warning'); return false; }
    if (!tools.some(function (tool) { return tool.key === actionKey; })) { tell('这件器械不属于当前 ESD 教学模块。', 'warning'); return false; }
    if (model.retrieved) { tell('标本已回收，等待病理判读。可以撤回一步或重新操作。'); return false; }
    var radius = normalized(local), mode = knifeMode(), index;
    if (actionKey === 'esd_knife' && mode !== 'dissect' && !useNext && (radius < .62 || radius > 1.4)) {
      if (radius < .62) {
        var dx = (local.x - CX) / RX, dy = (local.y - CY) / RY;
        var magnitude = Math.hypot(dx, dy) || 1;
        local = { x: CX + (RX + 5) * dx / magnitude, y: CY + (RY + 5) * dy / magnitude };
        if (!dx && !dy) local = recommendedLocal();
        radius = normalized(local);
        tell('已将电刀接触点吸附到病灶边界，开始建立标记。', 'instruction');
      } else {
        tell('请把刀尖放在红色病灶或其虚线边界内。', 'warning'); return false;
      }
    }
    if (actionKey === 'esd_injector' && model.marks.length < 6) { tell('本教学分支先用电刀标记病灶外缘，再进行黏膜下注射。', 'warning'); return false; }
    if (actionKey === 'esd_knife' && mode === 'incise' && (model.marks.length < 6 || model.lift === 0)) { tell('请先完成边界标记并用注射针形成液垫，再进行黏膜切开。', 'warning'); return false; }
    if (actionKey === 'esd_knife' && mode === 'dissect' && (model.cuts.length < 4 || model.lift === 0)) { tell('请先建立液垫并完成这一教学分支的环周切开，再进入黏膜下剥离。', 'warning'); return false; }
    if (actionKey === 'esd_hemostasis' && model.dissection < 1) { tell('止血钳用于处理剥离后显露的血管；当前尚未显露剥离床。', 'warning'); return false; }
    if (actionKey === 'esd_retrieval' && model.dissection < 5) { tell('标本尚未完全游离。回收网不能代替电刀剥离。', 'warning'); return false; }
    if (actionKey === 'esd_retrieval' && !model.vessel) { tell('这个教学创面有可见血管；先处理显露的血管，再回收标本。实际操作次序由临床团队判断。', 'warning'); return false; }
    if (actionKey === 'esd_hemostasis' && !useNext && Math.hypot(local.x - CX - 48, local.y - CY - 18) > 100) { tell('请将止血钳对准剥离床中央偏右的可见血管，不要夹持未处理的病灶表面。', 'warning'); return false; }
    if (actionKey === 'esd_injector' && model.cuts.length > 0) { tell('本示意已形成液垫；实际是否补充注射由术者按剥离条件决定。'); return false; }
    if (actionKey === 'esd_injector' && model.lift === 3 || actionKey === 'esd_hemostasis' && model.vessel || actionKey === 'esd_knife' && mode === 'dissect' && model.dissection === 5) {
      tell('这一操作阶段已完成，请选择下一件相关器械。'); return false;
    }
    if (actionKey === 'esd_knife' && mode !== 'dissect') {
      var count = mode === 'mark' ? 6 : 4;
      var completed = mode === 'mark' ? model.marks : model.cuts;
      var angle = Math.atan2((local.y - CY) / RY, (local.x - CX) / RX) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;
      index = Math.round(angle / (Math.PI * 2) * count) % count;
      if (completed.indexOf(index) !== -1) { tell('这一段已处理；沿边缘换一个位置，或点“操作一步”继续。'); return false; }
    }
    record(); model.connected = true; model.tool = actionKey; model.tip = local;
    if (actionKey === 'esd_knife') {
      if (mode === 'mark') model.marks.push(index);
      else if (mode === 'incise') model.cuts.push(index);
      else model.dissection++;
    } else if (actionKey === 'esd_injector') model.lift++;
    else if (actionKey === 'esd_hemostasis') model.vessel = true;
    else if (actionKey === 'esd_retrieval') model.retrieved = true;
    render();
    tell(model.retrieved ? '病灶标本已完整回收并送检。创面尚未愈合，是否达到治愈标准需要最终病理判断。' : statusText(), 'success');
    return true;
  }

  function statusText() {
    if (model.retrieved) return '标本已回收 · 待病理判读；局部仍是即时切除创面。';
    if (model.dissection === 5) return model.vessel ? '病灶已游离，可见血管已处理；用回收网取出标本。' : '病灶已游离；观察剥离床可见血管，并用回收网取出标本。';
    if (model.dissection) return '黏膜下剥离 ' + model.dissection + '/5：只分离病灶下方组织，深层肌层保持完整。';
    if (model.cuts.length) return '环周切开 ' + model.cuts.length + '/4：沿标记外侧切开，不切穿胃壁。';
    if (model.lift) return '局部隆起 ' + model.lift + '/3：液垫进入黏膜下层，病灶与深层肌层分开。';
    if (model.marks.length) return '边界标记 ' + model.marks.length + '/6：教学点数仅用于交互进度，不是临床固定数量。';
    return model.confirmed ? '先将 ESD 电刀拖到病灶外缘，建立边界标记。' : '点击红色表浅病灶确认操作区；未接触器械前不发生手术变化。';
  }

  function tissueMarkup(snapshot, prefix, showTool) {
    var id = prefix + '-';
    var lift = snapshot.lift / 3, separation = snapshot.dissection / 5;
    var offset = lift * 36 + separation * 105;
    var transform = snapshot.retrieved
      ? 'translate(1110 724) scale(.52) translate(-' + CX + ' -' + CY + ')'
      : 'translate(' + CX + ' ' + (CY - offset) + ') rotate(' + (-12 * separation) + ') translate(-' + CX + ' -' + CY + ')';
    var markup = '<defs><clipPath id="' + id + 'patch"><ellipse cx="' + CX + '" cy="' + CY + '" rx="' + RX + '" ry="' + RY + '"/></clipPath><radialGradient id="' + id + 'fluid"><stop stop-color="#9acbd7" stop-opacity=".8"/><stop offset="1" stop-color="#4a9aab" stop-opacity=".25"/></radialGradient><filter id="' + id + 'shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#6c3527" flood-opacity=".3"/></filter></defs>';
    markup += '<image href="' + BASE + '" width="1536" height="1024"/>';
    if (snapshot.lift) {
      markup += '<image href="' + BED + '" width="1536" height="1024" clip-path="url(#' + id + 'patch)"/>';
      if (separation < 1) markup += '<ellipse cx="' + CX + '" cy="' + (CY + 20) + '" rx="' + RX + '" ry="' + (RY * .76) + '" fill="url(#' + id + 'fluid)" opacity="' + ((1 - separation) * .85) + '"/>';
      if (snapshot.dissection && !snapshot.retrieved) {
        for (var strand = 0; strand < 5 - snapshot.dissection; strand++) {
          var sx = CX - 105 + strand * 43;
          markup += '<path d="M' + sx + ' ' + (CY - offset + 100) + 'Q' + (sx + 15) + ' ' + (CY - 12) + ' ' + (sx + 20) + ' ' + (CY + 65) + '" fill="none" stroke="#f5efe2" stroke-width="7" opacity=".8"/>';
        }
      }
    }
    if (!snapshot.retrieved && !snapshot.confirmed) markup += '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + (RX + 28) + '" ry="' + (RY + 23) + '" fill="none" stroke="#bd6b52" stroke-width="4" stroke-dasharray="10 8" opacity=".92"/><circle cx="' + (CX - RX - 35) + '" cy="' + CY + '" r="17" fill="#bd6b52"/><text x="' + (CX - RX - 35) + '" y="' + (CY + 7) + '" text-anchor="middle" fill="#fffaf3" font-size="20" font-weight="700">1</text>';
    if (!snapshot.retrieved && snapshot.confirmed && !snapshot.connected) markup += '<ellipse cx="' + CX + '" cy="' + CY + '" rx="' + (RX + 22) + '" ry="' + (RY + 18) + '" fill="none" stroke="#bd6b52" stroke-width="3" stroke-dasharray="8 8" opacity=".7"/>';
    if (snapshot.retrieved) markup += '<rect x="925" y="610" width="375" height="225" rx="28" fill="#fffaf3" stroke="#d4bba8" stroke-width="3"/><text x="1110" y="858" text-anchor="middle" fill="#70534a" font-size="26">完整标本 · 待病理判读</text>';
    markup += '<g transform="' + transform + '"' + (snapshot.lift ? ' filter="url(#' + id + 'shadow)"' : '') + '>';
    if (snapshot.lift) markup += '<image href="' + BASE + '" width="1536" height="1024" clip-path="url(#' + id + 'patch)"/>';
    snapshot.marks.forEach(function (index) {
      var a = -Math.PI / 2 + index * Math.PI * 2 / 6;
      markup += '<circle cx="' + (CX + (RX - 16) * Math.cos(a)) + '" cy="' + (CY + (RY - 12) * Math.sin(a)) + '" r="7" fill="#663e30" stroke="#f6ce9f" stroke-width="3"/>';
    });
    snapshot.cuts.forEach(function (index) {
      var a1 = -Math.PI / 2 + index * Math.PI / 2, a2 = a1 + Math.PI / 2;
      markup += '<path d="M' + (CX + (RX + 2) * Math.cos(a1)) + ' ' + (CY + (RY + 2) * Math.sin(a1)) + 'A' + (RX + 2) + ' ' + (RY + 2) + ' 0 0 1 ' + (CX + (RX + 2) * Math.cos(a2)) + ' ' + (CY + (RY + 2) * Math.sin(a2)) + '" fill="none" stroke="#7c302b" stroke-width="9"/><path d="M' + (CX + (RX + 9) * Math.cos(a1)) + ' ' + (CY + (RY + 9) * Math.sin(a1)) + 'A' + (RX + 9) + ' ' + (RY + 9) + ' 0 0 1 ' + (CX + (RX + 9) * Math.cos(a2)) + ' ' + (CY + (RY + 9) * Math.sin(a2)) + '" fill="none" stroke="#f3b18c" stroke-width="3"/>';
    });
    markup += '</g>';
    if (snapshot.dissection) {
      markup += '<path d="M796 488q16 -22 34 -7" fill="none" stroke="' + (snapshot.vessel ? '#c4a493' : '#bb6654') + '" stroke-width="7"/>';
      if (snapshot.vessel) markup += '<ellipse cx="817" cy="484" rx="18" ry="11" fill="#f3eadc" opacity=".85"/>';
    }
    if (showTool && snapshot.tip && snapshot.connected && !snapshot.retrieved) {
      var tx = snapshot.tip.x, ty = snapshot.tip.y;
      markup += '<g class="esd-live-instrument"><path d="M' + (tx - 190) + ' ' + (ty - 170) + 'L' + (tx - 12) + ' ' + (ty - 8) + '" stroke="#5d7782" stroke-width="10"/><path d="M' + (tx - 189) + ' ' + (ty - 170) + 'L' + (tx - 12) + ' ' + (ty - 8) + '" stroke="#dbe5e7" stroke-width="4"/>';
      if (snapshot.tool === 'esd_hemostasis') markup += '<path d="M' + (tx - 12) + ' ' + (ty - 8) + 'L' + (tx + 11) + ' ' + (ty - 4) + 'M' + (tx - 12) + ' ' + (ty - 8) + 'L' + (tx + 4) + ' ' + (ty + 13) + '" stroke="#768b95" stroke-width="5"/>';
      else markup += '<path d="M' + (tx - 12) + ' ' + (ty - 8) + 'L' + tx + ' ' + ty + '" stroke="#708792" stroke-width="3"/>';
      markup += '</g>';
    }
    return markup;
  }

  function render() {
    if (!root || !model) return;
    var steps = ['边界标记', '黏膜下注射', '环周切开', '逐步剥离', '血管处理', '标本回收'];
    var active = activeStep();
    svg.innerHTML = '<g transform="translate(' + (CX + pan.x) + ' ' + (CY + pan.y) + ') scale(' + zoom + ') translate(-' + CX + ' -' + CY + ')">' + tissueMarkup(model, 'esd-live', true) + '</g>';
    root.querySelector('.esd-stage-list').innerHTML = steps.map(function (step, index) { return '<span class="' + (index < active ? 'done' : index === active ? 'current' : '') + '"><i>' + (index + 1) + '</i>' + step + '</span>'; }).join('');
    root.querySelector('[data-esd-status]').textContent = statusText();
    root.querySelector('[data-esd-selected]').textContent = model.tool ? tools.filter(function (tool) { return tool.key === model.tool; })[0].name + (model.connected ? ' · 已接触操作区' : ' · 请拖入对应部位') : '器械尚未进入 · 先确认病灶';
    root.querySelector('[data-esd-action="step"]').disabled = !model.confirmed || !model.connected || model.retrieved;
    root.querySelector('.esd-confirm-spot').classList.toggle('hidden', model.confirmed);
    root.querySelector('[data-esd-action="undo"]').disabled = history.length === 0;
    root.querySelector('[data-esd-zoom]').textContent = zoom.toFixed(1) + '×';
    root.querySelector('.esd-knife-modes').classList.toggle('hidden', model.tool !== 'esd_knife');
    root.querySelectorAll('[data-esd-mode]').forEach(function (button) { button.classList.toggle('active', button.dataset.esdMode === (model.mode === 'auto' ? knifeMode() : model.mode)); });
    root.dataset.esdState = JSON.stringify({ marks: model.marks.length, lift: model.lift, incision: model.cuts.length, dissection: model.dissection, vessel: model.vessel, retrieved: model.retrieved, confirmed: model.confirmed, connected: model.connected });
    if (api && api.caption) api.caption('胃部 ESD · 局部操作', statusText());
  }
  function mount(options) {
    unmount(); api = options; model = fresh(); history = []; zoom = 1; pan = { x: 0, y: 0 }; panning = false;
    var link = document.getElementById('esd-interaction-style');
    if (!link) { link = document.createElement('link'); link.id = 'esd-interaction-style'; link.rel = 'stylesheet'; link.href = 'esd_interaction.css?v=20260927-esd-4'; document.head.appendChild(link); }
    root = document.createElement('section'); root.id = 'esd-workspace';
    root.innerHTML = '<div class="esd-context"><div><span>胃部表浅病灶 · 教学分支</span><b>只处理黏膜与黏膜下层，保留深层肌层</b></div><small>AI 医学示意 · 未经临床签审</small></div>' +
      '<div class="esd-scene"><svg id="esd-anatomy" viewBox="0 0 1536 1024" role="img" aria-label="可交互的胃壁局部与黏膜表浅病灶" tabindex="0"></svg><button type="button" class="esd-confirm-spot" data-esd-action="confirm"><i>1</i> 点击红色病灶确认操作区</button><div class="esd-view-tools"><button type="button" data-esd-action="zoom-out" aria-label="缩小局部画面">−</button><span data-esd-zoom>1.0×</span><button type="button" data-esd-action="zoom-in" aria-label="放大局部画面">＋</button><button type="button" data-esd-action="pan" aria-pressed="false">平移</button><button type="button" data-esd-action="fit">复位</button></div><div class="esd-layer-key"><span>黏膜 · 表浅病灶</span><span>黏膜下层 · 液垫 / 剥离层</span><span>肌层 · 保持完整</span></div></div>' +
      '<div class="esd-interaction-panel"><div class="esd-stage-list"></div><div class="esd-action-head"><b data-esd-selected></b><div><button type="button" data-esd-action="undo">撤回一步</button><button type="button" data-esd-action="restart">重新操作</button></div></div><div class="esd-knife-modes hidden"><span>电刀作用</span><button type="button" data-esd-mode="mark">标记边界</button><button type="button" data-esd-mode="incise">环周切开</button><button type="button" data-esd-mode="dissect">黏膜下剥离</button><button type="button" data-esd-mode="auto">自动衔接</button></div><div class="esd-action-bottom"><p data-esd-status aria-live="polite"></p><button type="button" data-esd-action="step">操作一步 →</button></div><small>拖入器械才开始；之后可继续在局部操作，或点“操作一步”。示意进度不对应真实次数、剂量或治疗参数。</small></div><div class="esd-comparison hidden"></div>';
    api.canvas.appendChild(root); svg = root.querySelector('#esd-anatomy');
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button'); if (!button) return;
      event.preventDefault(); event.stopPropagation();
      if (button.hasAttribute('data-esd-mode')) { model.mode = button.dataset.esdMode; render(); return; }
      var action = button.dataset.esdAction;
      if (action === 'confirm') { api.confirmTarget(); return; }
      if (action === 'step' && model.connected) operate(model.tool, recommendedLocal(), true);
      if (action === 'undo' && history.length) {
        var selected = model.tool;
        model = history.pop();
        if (model.tool !== selected) { model.tool = selected; model.connected = false; model.tip = null; }
        render();
      }
      if (action === 'restart') { var selectedTool = model.tool; model = fresh(); model.tool = selectedTool; history = []; render(); tell('局部操作已重置；重新确认病灶，再拖入器械。'); }
      if (action === 'zoom-in' || action === 'zoom-out') { zoom = Math.max(.7, Math.min(2.5, zoom * (action === 'zoom-in' ? 1.2 : 1 / 1.2))); render(); }
      if (action === 'fit') { zoom = 1; pan = { x: 0, y: 0 }; render(); }
      if (action === 'pan') { panning = !panning; button.setAttribute('aria-pressed', String(panning)); svg.classList.toggle('is-panning', panning); }
      if (action === 'close-compare') compare(false);
    });
    svg.addEventListener('wheel', function (event) { event.preventDefault(); event.stopPropagation(); zoom = Math.max(.7, Math.min(2.5, zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1))); render(); }, { passive: false });
    svg.addEventListener('click', function (event) { event.stopPropagation(); });
    svg.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return; event.preventDefault(); event.stopPropagation();
      var local = fromClient(event.clientX, event.clientY); if (!local) return;
      if (panning) { drag = { x: event.clientX, y: event.clientY, pan: clone(pan), panning: true }; }
      else if (normalized(local) < 1.45 || model.tool === 'esd_retrieval') {
        if (!model.confirmed) { api.confirmTarget(); return; }
        if (!model.tool || !model.connected) { tell('先从右侧把器械拖进操作区；选择器械本身不会开始手术。'); return; }
        operate(model.tool, local, false); drag = { panning: false, lastX: local.x, lastY: local.y };
      }
      if (drag) svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener('pointermove', function (event) {
      if (!drag) return;
      if (drag.panning) {
        var matrix = svg.getScreenCTM();
        var scale = 1 / Math.max(matrix ? matrix.a : 1, .001);
        pan.x = drag.pan.x + (event.clientX - drag.x) * scale; pan.y = drag.pan.y + (event.clientY - drag.y) * scale; render();
      } else if (model.tool === 'esd_knife') {
        var local = fromClient(event.clientX, event.clientY);
        if (local && normalized(local) < 1.45 && Math.hypot(local.x - drag.lastX, local.y - drag.lastY) > 75) { operate(model.tool, local, false); drag.lastX = local.x; drag.lastY = local.y; }
      }
    });
    function endDrag() { drag = null; }
    svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag); svg.addEventListener('lostpointercapture', endDrag);
    svg.addEventListener('keydown', function (event) { if ((event.key === 'Enter' || event.key === ' ') && !model.confirmed) { event.preventDefault(); api.confirmTarget(); } });
    render();
  }
  function unmount() { if (root) root.remove(); root = null; svg = null; api = null; model = null; history = []; drag = null; }
  function confirm() { if (model) { model.confirmed = true; render(); } }
  function isConfirmed() { return !!(model && model.confirmed); }
  function setTool(actionKey) {
    if (!model || (actionKey !== null && !tools.some(function (tool) { return tool.key === actionKey; }))) return;
    if (model.tool !== actionKey) { model.tool = actionKey; model.connected = false; model.tip = null; model.mode = 'auto'; render(); }
  }
  function contact(actionKey, point) {
    setTool(actionKey); var local = fromPercent(point);
    if (!local || !isOnTarget(point)) { tell('请把器械拖到胃壁病灶操作区，而不是空白区域。', 'warning'); return false; }
    return operate(actionKey, local, false);
  }
  function targetCenter() {
    if (!svg || !api) return { x: 50, y: 44 };
    var local = recommendedLocal();
    var pixel = new DOMPoint((local.x - CX) * zoom + CX + pan.x, (local.y - CY) * zoom + CY + pan.y).matrixTransform(svg.getScreenCTM());
    var rect = api.canvas.getBoundingClientRect();
    return { x: (pixel.x - rect.left) / rect.width * 100, y: (pixel.y - rect.top) / rect.height * 100 };
  }
  function compare(show) {
    if (!root) return;
    var view = root.querySelector('.esd-comparison');
    view.classList.toggle('hidden', !show); if (!show) return;
    var untouched = !model.marks.length && !model.lift && !model.cuts.length && !model.dissection && !model.vessel && !model.retrieved;
    var current = untouched
      ? '<g opacity=".24">' + tissueMarkup(fresh(), 'esd-current-empty', false) + '</g><rect x="0" y="0" width="1536" height="1024" fill="#f8eee4" fill-opacity=".42"/><text x="768" y="460" text-anchor="middle" fill="#895b4b" font-size="46" font-weight="700">尚未执行局部操作</text><text x="768" y="518" text-anchor="middle" fill="#9e7b69" font-size="27">请先确认病灶并拖入器械；不会预先伪造“术后结果”</text>'
      : tissueMarkup(model, 'esd-current', false);
    view.innerHTML = '<header><div><b>操作前 / 当前状态</b><small>只比较实际完成的教学操作。未开始时不会把同一张术前图冒充术后图；创面愈合与治愈判定需随访及最终病理。</small></div><button type="button" data-esd-action="close-compare">返回操作</button></header><div class="esd-comparison-grid"><figure><svg viewBox="0 0 1536 1024" role="img" aria-label="未操作的黏膜表浅病灶">' + tissueMarkup(fresh(), 'esd-pre', false) + '</svg><figcaption><b>操作前 · 病灶仍在黏膜表面</b><span>深层肌层连续，尚未发生标记、注射或剥离。</span></figcaption></figure><figure><svg viewBox="0 0 1536 1024" role="img" aria-label="当前教学操作状态">' + current + '</svg><figcaption><b>当前 · ' + (untouched ? '尚未开始，不显示虚假的术后图' : model.retrieved ? '标本已回收，创面尚未愈合' : model.dissection === 5 ? '病灶已游离，尚待回收' : '仍在操作过程中') + '</b><span>' + statusText() + '</span></figcaption></figure></div>';
  }
  window.ESDTeaching = { mount: mount, unmount: unmount, confirm: confirm, isConfirmed: isConfirmed, setTool: setTool, contact: contact, isOnTarget: isOnTarget, targetCenter: targetCenter, compare: compare, tools: tools, frames: { initial: { image: BASE, title: '胃黏膜表浅病灶与术前定位', note: '展示拟行胃部 ESD 的表浅病灶；适应证与是否治愈不能仅凭本示意图判断。' } } };
})();
