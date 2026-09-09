/* 共享音效引擎 —— 供「教学小游戏」统一使用
 * 用法：本文件随游戏页面自动加载。
 *   · 自动为按钮/卡片等可点元素加上清脆的“嗒”声（pointerdown 捕获）
 *   · 游戏逻辑里可直接调用 window.SFX.correct() / wrong() / win() / flip() / tick()
 * 全部音效由 Web Audio 实时合成，不依赖任何音频文件，双击打开也能用。 */
(function () {
  if (window.__teachingSfx) return;
  window.__teachingSfx = true;

  var ctx = null, enabled = true;

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function now() { return ctx ? ctx.currentTime : 0; }

  function tone(freq, t0, dur, type, vol) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.14, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  var S = {
    /* 轻微点击 */
    click:   function () { tone(540, now(), .06, "triangle", .09); },
    /* 翻牌 / 选中 */
    flip:    function () { tone(760, now(), .05, "sine", .09); tone(1120, now() + .055, .07, "sine", .08); },
    /* 选择确认 */
    tick:    function () { tone(920, now(), .045, "square", .045); },
    /* 答对：上行双音 */
    correct: function () { var t = now(); tone(660, t, .12, "sine", .15); tone(880, t + .11, .16, "sine", .14); tone(1180, t + .22, .2, "sine", .10); },
    /* 答错：低沉两下 */
    wrong:   function () { var t = now(); tone(196, t, .2, "sawtooth", .10); tone(148, t + .13, .3, "sawtooth", .10); },
    /* 胜利：上行琶音 */
    win:     function () { var t = now(), n = [523, 659, 784, 1047]; for (var i = 0; i < n.length; i++) tone(n[i], t + i * .13, .3, "triangle", .13); },
    /* 提示音 */
    hint:    function () { tone(1300, now(), .06, "sine", .06); },
    /* 切换开关：返回是否开启 */
    toggle:  function () { enabled = !enabled; return enabled; },
    isOn:    function () { return enabled; }
  };
  window.SFX = S;
  window.playSfx = function (k) { if (S[k]) S[k](); };

  var MATCH = /(^|[\s_\-])(btn|button|card|opt|option|tile|cell|key|letter|word|chip|item|flip|flash|play|start|next|answer|choice|menu|poker|slot|dice|unit|over|head|box|check|again|replay)([\s_\-]|$)/i;

  function isInteract(el) {
    if (!el || el === document) return false;
    var t = el.tagName;
    if (t === "BUTTON" || t === "A") return true;
    if (t === "INPUT") { var ty = el.type; return ty === "button" || ty === "checkbox" || ty === "radio"; }
    if (t === "SELECT" || t === "LABEL") return true;
    return MATCH.test(el.className || "");
  }

  function onDown(e) {
    ac();                                   // 任意首次按下即解锁音频
    if (!enabled) return;
    var el = e.target;
    for (var n = 0; el && el !== document && n < 6; n++, el = el.parentNode) {
      if (isInteract(el)) { S.click(); return; }
    }
  }
  document.addEventListener("pointerdown", onDown, true);
  if (!window.PointerEvent) document.addEventListener("mousedown", onDown, true);

  /* 防止重复注入时被覆盖 */
  var _log = console && console.log;
})();
