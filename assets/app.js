/* ============================================================
   SEECMD 模组文档站 — 共享脚本
   包含：目录滚动高亮、代码块复制、6 个交互式代码预览
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- 基础工具 ---------------- */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function btn(text, cls, onClick) {
    var b = el("button", "btn" + (cls ? " " + cls : ""), text);
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }

  function fmt(n, digits) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: digits == null ? 0 : digits,
      maximumFractionDigits: digits == null ? 0 : digits,
    });
  }

  /* ---------------- 语法高亮 ---------------- */

  var HL_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  function hlEsc(s) {
    return s.replace(/[&<>"]/g, function (c) { return HL_ESC[c]; });
  }

  var JAVA_KW = "abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|var|record|sealed|permits|yield|null|true|false";

  var HL = {
    java: [
      ["comment", /\/\*[\s\S]*?\*\/|\/\/[^\n]*/],
      ["string", /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/],
      ["annotation", /@\w+/],
      ["keyword", new RegExp("\\b(?:" + JAVA_KW + ")\\b")],
      ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
      ["number", /\b\d[\d_]*\.?\d*[fFdDlL]?\b/],
      ["method", /[a-z][a-zA-Z0-9_]*(?=\s*\()/],
    ],
    kotlin: [
      ["comment", /\/\*[\s\S]*?\*\/|\/\/[^\n]*/],
      ["string", /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/],
      ["annotation", /@\w+/],
      ["keyword", /\b(?:fun|val|var|class|object|interface|enum|sealed|data|override|private|public|protected|internal|companion|import|package|return|if|else|when|for|while|do|in|is|as|null|true|false|this|super|by|lateinit|init|constructor|abstract|open|final|const|inline|suspend|typealias|where|reified|vararg|out|break|continue|throw|try|catch|finally)\b/],
      ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
      ["number", /\b\d[\d_]*\.?\d*[fFdDlL]?\b/],
      ["method", /[a-z][a-zA-Z0-9_]*(?=\s*\()/],
    ],
    xml: [
      ["comment", /<!--[\s\S]*?-->/],
      ["string", /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/],
      ["tag", /<\/?[a-zA-Z][a-zA-Z0-9:_.-]*/],
      ["tag-end", /\/?>/],
      ["attr", /\b[a-zA-Z:][a-zA-Z0-9:._-]*(?=\s*=)/],
    ],
    json: [
      ["string-key", /"(?:[^"\\]|\\.)*"(?=\s*:)/],
      ["string", /"(?:[^"\\]|\\.)*"/],
      ["keyword", /\b(?:true|false|null)\b/],
      ["number", /\b-?\d+\.?\d*(?:[eE][+-]?\d+)?\b/],
    ],
    groovy: [
      ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
      ["string", /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/],
      ["annotation", /@\w+/],
      ["keyword", /\b(?:def|class|interface|extends|implements|public|private|protected|static|void|return|if|else|for|while|new|import|package|dependencies|repositories|true|false|null)\b/],
      ["type", /\b[A-Z][a-zA-Z0-9_]*\b/],
      ["number", /\b\d[\d_]*\.?\d*[fFdDlL]?\b/],
      ["method", /[a-z][a-zA-Z0-9_]*(?=\s*\()/],
    ],
    manifest: [
      ["comment", /#[^\n]*/],
      ["attr", /^[A-Za-z][A-Za-z0-9-]*(?=\s*:)/m],
      ["string", /"(?:[^"\\]|\\.)*"/],
      ["number", /\b\d+(?:\.\d+)*\b/],
    ],
    bash: [
      ["comment", /#[^\n]*/],
      ["string", /"(?:[^"\\]|\\.)*"|'[^']*'/],
      ["keyword", /\b(?:java|jar|mvn|gradle|cd|mkdir|cp|mv|rm|echo|export|node|npm)\b/],
    ],
  };

  function highlight(code, lang) {
    if (!lang) return null;
    lang = lang.toLowerCase().trim();
    var rules = HL[lang];
    if (!rules) return null;
    var combined = new RegExp(
      rules.map(function (r) { return "(" + r[1].source + ")"; }).join("|"),
      "gm"
    );
    var out = "";
    var last = 0;
    var m;
    while ((m = combined.exec(code))) {
      out += hlEsc(code.slice(last, m.index));
      for (var i = 0; i < rules.length; i++) {
        if (m[i + 1] !== undefined) {
          out += '<span class="hl-' + rules[i][0] + '">' + hlEsc(m[0]) + '</span>';
          break;
        }
      }
      last = m.index + m[0].length;
      if (m[0].length === 0) combined.lastIndex++;
    }
    out += hlEsc(code.slice(last));
    return out;
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".code-wrap").forEach(function (wrap) {
      var code = wrap.querySelector("pre code");
      if (!code) return;
      var langEl = wrap.querySelector(".code-lang");
      var lang = langEl ? langEl.textContent.trim() : "";
      var highlighted = highlight(code.textContent, lang);
      if (highlighted) code.innerHTML = highlighted;
    });
  });

  /* ---------------- 复制按钮 ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".code-wrap").forEach(function (wrap) {
      var code = wrap.querySelector("pre code");
      if (!code) return;
      var head = wrap.querySelector(".code-head");
      if (head) {
        var copy = el("button", "copy-btn", "复制");
        copy.addEventListener("click", function () {
          var text = code.textContent;
          (navigator.clipboard
            ? navigator.clipboard.writeText(text)
            : Promise.reject()
          )
            .catch(function () {
              var ta = document.createElement("textarea");
              ta.value = text;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
            })
            .then(function () {
              copy.textContent = "已复制 ✓";
              copy.classList.add("copied");
              setTimeout(function () {
                copy.textContent = "复制";
                copy.classList.remove("copied");
              }, 1400);
            });
        });
        head.appendChild(copy);
      }
    });
  });

  /* ---------------- 目录滚动高亮 ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    var toc = document.querySelector(".sidebar nav.toc");
    if (!toc) return;
    var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").replace(/^#/, "");
      if (id) map[id] = a;
    });
    var headings = Array.prototype.slice
      .call(document.querySelectorAll(".content h2[id], .content h3[id]"))
      .filter(function (h) { return map[h.id]; });

    function update() {
      var pos = window.scrollY + 90;
      var current = null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].offsetTop <= pos) current = headings[i].id;
        else break;
      }
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  });

  /* ============================================================
     预览组件注册表
     ============================================================ */

  var demos = {};
  function register(id, fn) { demos[id] = fn; }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-demo]").forEach(function (box) {
      var id = box.getAttribute("data-demo");
      var fn = demos[id];
      if (!fn) return;
      try {
        fn(box);
      } catch (e) {
        box.innerHTML =
          '<div class="demo-body"><p style="color:#b42318">预览加载失败：' +
          (e && e.message ? e.message : e) + "</p></div>";
      }
    });
  });

  /* ------------------------------------------------------------
     Demo 1 · 判定窗口可视化
     默认窗口 70/150/150/150/50；Wide Judge ×1.5 放大；拖拽指针看判定
     ------------------------------------------------------------ */

  register("judgment-window", function (box) {
    var W = 760, H = 118, PAD = 14, RANGE = 260;
    var canvas = el("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    var ratio = 1; // 设备像素比，避免高分屏模糊
    function fit() {
      ratio = Math.max(1, (window.devicePixelRatio || 1));
      canvas.width = W * ratio;
      canvas.height = H * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    fit();

    var wide = false;
    var drag = null;

    function wins() {
      var base = { p: 70, g: 150, m: 150, h: 150, late: 50 };
      if (!wide) return base;
      return { p: 105, g: 225, m: 225, h: 225, late: 75 };
    }

    function xOf(ms) { return W / 2 + (ms / RANGE) * (W / 2 - PAD); }
    function msOf(x) {
      return Math.round(((x - W / 2) / (W / 2 - PAD)) * RANGE);
    }

    function judgeFor(ms, w) {
      var d = Math.abs(ms);
      if (d <= w.p) return { key: "perfect", name: "PERFECT", color: "#1f8a4c", score: 100, acc: 1.0 };
      if (d <= w.g) return { key: "great", name: "GREAT", color: "#c07a12", score: 60, acc: 0.6 };
      if (d <= w.m) return { key: "miss", name: "MISS", color: "#c0392b", score: 0, acc: 0 };
      return { key: "none", name: "未判定", color: "#8a919c", score: 0, acc: 0 };
    }

    var pointer = 30;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var w = wins();
      var yTop = 24, yBot = 96, bandH = 30;

      // 时间轴
      ctx.strokeStyle = "#c8ccd3";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, yBot); ctx.lineTo(W - PAD, yBot);
      ctx.stroke();
      // 判定线（音符时间 0）
      ctx.strokeStyle = "#1c1e22";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 10); ctx.lineTo(W / 2, yBot);
      ctx.stroke();

      function band(lo, hi, color, alpha) {
        if (lo === hi) return;
        var x1 = Math.max(PAD, xOf(lo));
        var x2 = Math.min(W - PAD, xOf(hi));
        if (x2 <= x1) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(x1, yTop, x2 - x1, bandH);
        ctx.globalAlpha = 1;
      }

      // 三层带：perfect ⊂ great ⊂ miss（自外向内绘制，内层覆盖）
      band(-w.m, w.m, "#e7b6b0", 0.55);      // miss 外带
      band(-w.g, w.g, "#f4d9a2", 0.6);       // great 中带
      band(-w.p, w.p, "#b7e0c8", 0.85);      // perfect 内带

      // 迟到截断区（判定线右侧 +w.m .. +w.m+w.late）
      band(w.m, w.m + w.late, "#c8ccd3", 0.5);

      // 边界标签
      ctx.fillStyle = "#5b626c";
      ctx.font = "10px monospace";
      ctx.fillText("-" + w.m, xOf(-w.m) - 14, yTop + bandH + 12);
      ctx.fillText("+" + w.m, xOf(w.m) + 2, yTop + bandH + 12);
      ctx.fillText("±" + w.p, xOf(w.p) - 10, yTop - 4);
      ctx.fillText("±" + w.g, xOf(w.g) - 10, yTop - 4);
      ctx.fillText("note", W / 2 + 4, 8);
      if (wide) {
        ctx.fillStyle = "#a16207";
        ctx.fillText("截断 +" + (w.m + w.late), xOf(w.m + w.late) + 2, yBot + 12);
      }

      // 指针
      var px = xOf(pointer);
      ctx.strokeStyle = "#1c1e22";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 6); ctx.lineTo(px, yBot + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, yBot + 8, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#1c1e22";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText((pointer > 0 ? "+" : "") + pointer, px, yBot + 22);
      ctx.textAlign = "left";
    }

    function setPointer(ms) {
      pointer = Math.max(-RANGE + 10, Math.min(RANGE - 10, ms));
      updateResult();
      draw();
    }

    function updateResult() {
      var w = wins();
      var j = judgeFor(pointer, w);
      var badge = box.querySelector(".dw-badge");
      badge.style.background = j.color;
      badge.textContent = j.name;
      var det = box.querySelector(".dw-detail");
      det.innerHTML =
        "偏移 <b>" + (pointer > 0 ? "+" : "") + pointer + " ms</b>"
        + "（" + (pointer <= 0 ? "提前" : "迟到") + "）　|　分数 <b>" + j.score + "</b>　|　"
        + "准度权重 <b>" + j.acc + "</b>";
      var winsEl = box.querySelector(".dw-wins");
      winsEl.innerHTML =
        cell("PERFECT", w.p, "ms") +
        cell("GREAT", w.g, "ms") +
        cell("MISS", w.m, "ms") +
        cell("长按结尾", w.h, "ms") +
        cell("迟到截断", w.late, "ms");
      function cell(t, v, u) {
        return '<div class="cell"><b>' + v + '</b><span>' + t + '（' + u + '）</span></div>';
      }
    }

    // 交互：拖拽指针
    function posX(e) {
      var r = canvas.getBoundingClientRect();
      return (e.clientX - r.left) * (W / r.width);
    }
    canvas.addEventListener("pointerdown", function (e) {
      var y = e.clientY - canvas.getBoundingClientRect().top;
      if (y > 8 && y < 100) { drag = true; setPointer(msOf(posX(e))); canvas.setPointerCapture(e.pointerId); }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (drag) setPointer(msOf(posX(e)));
    });
    canvas.addEventListener("pointerup", function () { drag = false; });

    // 控件
    var body = el("div", "demo-body");
    var row1 = el("div", "row");
    row1.appendChild(btn("PERFECT +30ms", "", function () { setPointer(30); }));
    row1.appendChild(btn("GREAT +90ms", "", function () { setPointer(90); }));
    row1.appendChild(btn("MISS +140ms", "", function () { setPointer(140); }));
    row1.appendChild(btn("迟到截断 +180ms", "", function () { setPointer(180); }));
    row1.appendChild(el("span", "", "&nbsp;"));
    row1.appendChild(btn("默认窗口", "on", function () {
      wide = false;
      box.querySelectorAll(".btn").forEach(function (b) { b.classList.remove("on"); });
      this.classList.add("on");
      updateResult(); draw();
    }));
    row1.appendChild(btn("宽松判定 ×1.5", "", function () {
      wide = true;
      box.querySelectorAll(".btn").forEach(function (b) { b.classList.remove("on"); });
      this.classList.add("on");
      updateResult(); draw();
    }));

    var result = el("div", "dw-result");
    result.appendChild(el("span", "dw-badge", "PERFECT"));
    result.appendChild(el("span", "dw-detail", ""));
    result.appendChild(el("div", "dw-wins"));

    var axis = el("div", "dw-axis");
    axis.appendChild(canvas);
    var tickL = el("div", "dw-tick", "-260ms");
    tickL.style.left = PAD + "px";
    var tickR = el("div", "dw-tick", "+260ms");
    tickR.style.left = (W - PAD) + "px";
    axis.appendChild(tickL);
    axis.appendChild(tickR);

    body.appendChild(axis);
    body.appendChild(row1);
    body.appendChild(result);
    box.appendChild(body);
    updateResult();
    draw();

    // 说明行
    var note = el("p", "", '<span style="color:#8a919c;font-size:12px">拖动上方指针即可查看不同时间偏移对应的判定结果；切到「宽松判定 ×1.5」可观察窗口放大后判定如何变宽松（多个 policy 取最大值，见判定修改章节）。</span>');
    box.appendChild(note);
  });

  /* ------------------------------------------------------------
     Demo 2 · HUD 覆盖预览（霓虹进度条）
     模拟 NeonProgressMod.renderOverlay 的绘制结果
     ------------------------------------------------------------ */

  register("neon-progress", function (box) {
    var body = el("div", "demo-body");

    var screen = el("div", "screen");
    screen.style.height = "170px";
    // 轨道背景
    var bars = el("div", "bars");
    for (var i = 0; i < 5; i++) {
      var lane = el("div", "lane");
      lane.style.left = (i * 20) + "%";
      lane.style.width = "20%";
      bars.appendChild(lane);
    }
    screen.appendChild(bars);
    // 判断线
    screen.appendChild(el("div", "jl"));
    // 进度条（模拟 renderOverlay 绘制：底槽 + 霓虹填充 + 半透明描边）
    var bar = el("div", "bar");
    var fill = el("div", "fill");
    fill.style.width = "0%";
    bar.appendChild(fill);
    bar.appendChild(el("div", "edge"));
    screen.appendChild(bar);
    // 一个移动中的音符装饰
    var note = el("div", "note");
    note.style.width = "34px";
    note.style.height = "10px";
    note.style.left = "20%";
    note.style.top = "30px";
    screen.appendChild(note);

    body.appendChild(screen);

    var logEl = el("div", "log");
    body.appendChild(logEl);

    var hud = el("div", "hud");
    hud.innerHTML =
      '<div class="cell"><b class="pct">0%</b><span>progress()</span></div>' +
      '<div class="cell"><b class="wpx">0 px</b><span>已填充宽度</span></div>' +
      '<div class="cell"><b class="orig">隐藏</b><span>原版进度条</span></div>';
    body.insertBefore(hud, body.firstChild);

    var playing = false;
    var t = 0;
    var DUR = 14000;

    function log(line, cls) {
      var d = document.createElement("div");
      d.className = cls || "";
      d.textContent = line;
      logEl.appendChild(d);
      while (logEl.children.length > 14) logEl.removeChild(logEl.firstChild);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function tick() {
      if (!playing) return;
      t = Math.min(t + 40, DUR);
      var p = t / DUR;
      fill.style.width = (p * 100).toFixed(1) + "%";
      note.style.top = (150 - p * 115) + "px";
      box.querySelector(".pct").textContent = (p * 100).toFixed(1) + "%";
      box.querySelector(".wpx").textContent = Math.round(p * 600) + " px";
      if (t >= DUR) {
        playing = false;
        playBtn.textContent = "重播";
      }
      if (playing || t >= DUR) requestAnimationFrame(tick);
    }

    var playBtn = btn("播放", "on", function () {
      if (t >= DUR) { t = 0; }
      playing = true;
      log("setProgressVisible(false) —— 原版进度条不再绘制", "lg-warn");
      log("renderOverlay(canvas, hudCtx) 每帧被调用", "lg-info");
      playBtn.textContent = "暂停";
      tick();
    });
    var pauseBtn = btn("暂停", "", function () { playing = false; playBtn.textContent = "继续"; });
    var clearBtn = btn("清空日志", "", function () { logEl.innerHTML = ""; });

    // 每 10% 记录一次绘制调用
    var lastLog = 0;
    var origTick = null;

    var row = el("div", "row");
    row.appendChild(playBtn);
    row.appendChild(pauseBtn);
    row.appendChild(clearBtn);
    row.appendChild(el("span", "", "&nbsp;进度 0-100%"));
    var slider = el("input");
    slider.type = "range"; slider.min = 0; slider.max = 100; slider.value = 0;
    slider.style.width = "180px";
    slider.addEventListener("input", function () {
      var v = +slider.value;
      t = (v / 100) * DUR;
      var p = t / DUR;
      fill.style.width = (p * 100).toFixed(1) + "%";
      note.style.top = (150 - p * 115) + "px";
      box.querySelector(".pct").textContent = (p * 100).toFixed(1) + "%";
      box.querySelector(".wpx").textContent = Math.round(p * 600) + " px";
    });
    row.appendChild(slider);
    body.appendChild(row);

    // 用 setInterval 记录绘制调用（简单实现）
    setInterval(function () {
      if (!playing) return;
      var p = t / DUR;
      var bucket = Math.floor(p * 100);
      if (bucket > lastLog) {
        lastLog = bucket;
        log("setColor(BLACK); fillRect(40,700,600,8)      // 底槽", "lg-dim");
        log("setColor(0,255,200); fillRect(40,700," + Math.round(p * 600) + ",8)  // 霓虹填充", "lg-ok");
        log("setAlpha(0.5); drawRect(40,700,600,8)        // 半透明描边", "lg-info");
        log("setAlpha(1.0)", "lg-dim");
      }
    }, 40);
  });

  /* ------------------------------------------------------------
     Demo 3 · 谱面 JSON 解析（滑键音符）
     模拟 NoteTypeRegistry.bySerializationKey("slide") → deserialize
     ------------------------------------------------------------ */

  register("chart-json-parse", function (box) {
    var notes = [
      { type: "slide", time: 5000, lane: 1, endLane: 3 },
      { type: "slide", time: 5200, lane: 2, endLane: 0 },
    ];
    var body = el("div", "demo-body");

    var screen = el("div", "screen");
    screen.style.height = "200px";
    var bars = el("div", "bars");
    for (var i = 0; i < 4; i++) {
      var lane = el("div", "lane");
      lane.style.left = (i * 25) + "%";
      lane.style.width = "25%";
      bars.appendChild(lane);
    }
    screen.appendChild(bars);
    screen.appendChild(el("div", "jl"));
    var mk = [];
    notes.forEach(function (n) {
      var d = el("div", "note slide");
      d.style.width = "82%";
      d.style.height = "12px";
      d.style.left = (n.lane * 25 + 9) + "%";
      mk.push(d);
      screen.appendChild(d);
    });
    body.appendChild(screen);

    var logEl = el("div", "log");
    body.appendChild(logEl);

    var jsonShow = el("pre");
    jsonShow.style.cssText = "font-family:var(--mono);font-size:12px;background:#101216;color:#c8cdd5;padding:10px 12px;border-radius:5px;overflow-x:auto;margin:10px 0 0";
    jsonShow.textContent =
      '{\n  "title": "Slide Demo",\n  "bpm": 140,\n  "lanes": 4,\n  "notes": [\n' +
      '    { "type": "slide", "time": 5000, "lane": 1, "endLane": 3 },\n' +
      '    { "type": "slide", "time": 5200, "lane": 2, "endLane": 0 }\n' +
      '  ]\n}';
    body.appendChild(jsonShow);

    var playing = false;
    var t = 4200; // 起始时间（音符出现前）
    var DUR = 5600;

    function yOf(time) {
      // 音符在 (time-2400) 时从顶部出现，在 time 时到判定线
      var p = (time - t) / 2400;
      p = Math.max(0, Math.min(1, p));
      return 20 + p * (200 - 40 - 22 - 20);
    }

    function draw() {
      notes.forEach(function (n, i) {
        mk[i].style.top = yOf(n.time) + "px";
      });
    }

    var parsed = [];

    function log(line, cls) {
      var d = document.createElement("div");
      d.className = cls || "";
      d.textContent = line;
      logEl.appendChild(d);
      while (logEl.children.length > 16) logEl.removeChild(logEl.firstChild);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function tick() {
      if (!playing) return;
      t += 40;
      if (t >= 5050 && !parsed[0]) {
        parsed[0] = true;
        log('bySerializationKey("slide") → 找到 SlideNoteDefinition', "lg-info");
        log('deserialize(json, ctx) → SlideNote{time=5000, lane=1, endLane=3, typeKey="slide"}', "lg-ok");
      }
      if (t >= 5250 && !parsed[1]) {
        parsed[1] = true;
        log('deserialize(json, ctx) → SlideNote{time=5200, lane=2, endLane=0, typeKey="slide"}', "lg-ok");
      }
      if (t >= DUR) {
        playing = false;
        playBtn.textContent = "重播";
        log("谱面加载完成 → ChartLoadedEvent（musicTimeMs 为负，入场过渡期）", "lg-warn");
      }
      draw();
      if (playing || t < DUR) requestAnimationFrame(tick);
    }

    var playBtn = btn("播放", "on", function () {
      if (t >= DUR) { t = 4200; parsed = [false, false]; logEl.innerHTML = ""; }
      playing = true;
      log('加载 slide 谱面：noteTypes().bySerializationKey("slide")', "lg-info");
      playBtn.textContent = "暂停";
      tick();
    });
    var pauseBtn = btn("暂停", "", function () { playing = false; playBtn.textContent = "继续"; });

    var row = el("div", "row");
    row.appendChild(playBtn);
    row.appendChild(pauseBtn);
    row.appendChild(el("span", "", "&nbsp;时间（ms）"));
    var slider = el("input");
    slider.type = "range"; slider.min = 4200; slider.max = DUR; slider.value = 4200;
    slider.style.width = "180px";
    slider.addEventListener("input", function () {
      t = +slider.value;
      draw();
    });
    row.appendChild(slider);
    body.insertBefore(row, body.firstChild);

    box.appendChild(body);
    draw();
  });

  /* ------------------------------------------------------------
     Demo 4 · 事件日志模拟（一场游玩）
     演示模组订阅后收到的事件序列与数据
     ------------------------------------------------------------ */

  register("event-timeline", function (box) {
    var script = [
      { t: 1000, r: "PERFECT", p: 0.11, score: 1200 },
      { t: 1400, r: "PERFECT", p: 0.15, score: 2400 },
      { t: 1800, r: "GREAT", p: 0.19, score: 3300 },
      { t: 2200, r: "MISS", p: 0.23, score: 3300 },
      { t: 2600, r: "PERFECT", p: 0.28, score: 4500 },
      { t: 3000, r: "PERFECT", p: 0.32, score: 5700 },
      { t: 3400, r: "GREAT", p: 0.36, score: 6600 },
      { t: 3800, r: "MISS", p: 0.40, score: 6600 },
      { t: 4200, r: "PERFECT", p: 0.45, score: 7800 },
      { t: 4600, r: "PERFECT", p: 0.49, score: 9000 },
    ];
    var TOTAL = 10;
    var DUR = 5000;

    var body = el("div", "demo-body");

    var hud = el("div", "hud");
    hud.innerHTML =
      '<div class="cell"><b class="combo">0</b><span>combo</span></div>' +
      '<div class="cell"><b class="maxcombo">0</b><span>maxCombo</span></div>' +
      '<div class="cell"><b class="score">0</b><span>score</span></div>' +
      '<div class="cell"><b class="perf">0</b><span>perfects</span></div>' +
      '<div class="cell"><b class="great">0</b><span>greats</span></div>' +
      '<div class="cell"><b class="miss">0</b><span>misses</span></div>';
    body.appendChild(hud);

    var feed = el("div", "feed");
    body.appendChild(feed);

    function emit(cls, tag, text) {
      var row = el("div", "ev");
      var tagEl = el("span", "tag " + cls, tag);
      var txt = el("span", "", text);
      row.appendChild(tagEl);
      row.appendChild(txt);
      feed.appendChild(row);
      while (feed.children.length > 30) feed.removeChild(feed.firstChild);
      feed.scrollTop = feed.scrollHeight;
    }

    var playing = false;
    var t = 0;
    var idx = 0;
    var combo = 0, maxCombo = 0, score = 0, perf = 0, great = 0, miss = 0;
    var started = false;

    function tick() {
      if (!playing) return;
      t += 40;
      if (!started && t >= 500) {
        started = true;
        emit("lg-ok", "[GameplayStartEvent]", '游玩正式开始 musicTimeMs=0');
      }
      while (idx < script.length && t >= script[idx].t) {
        var s = script[idx];
        idx++;
        if (s.r === "PERFECT") { combo++; perf++; score = s.score; }
        else if (s.r === "GREAT") { combo++; great++; score = s.score; }
        else {
          if (combo > 0) {
            emit("lg-miss", "[ComboBreakEvent]", 'combo 中断！最高连击 ' + maxCombo);
          }
          combo = 0; miss++; score = s.score;
        }
        maxCombo = Math.max(maxCombo, combo);
        emit("lg-info", "[NoteJudgedEvent]", s.r + ' combo=' + combo + ' score=' + s.score + ' progress=' + s.p);
        updateHud();
      }
      if (t >= DUR) {
        playing = false;
        emit("lg-warn", "[GameplayEndEvent]", '游玩结束，进入结算 musicTimeMs=' + DUR);
        playBtn.textContent = "重播";
      }
      if (playing || t < DUR) requestAnimationFrame(tick);
    }

    function updateHud() {
      box.querySelector(".combo").textContent = combo;
      box.querySelector(".maxcombo").textContent = maxCombo;
      box.querySelector(".score").textContent = fmt(score);
      box.querySelector(".perf").textContent = perf;
      box.querySelector(".great").textContent = great;
      box.querySelector(".miss").textContent = miss;
    }

    var playBtn = btn("播放", "on", function () {
      if (t >= DUR || idx >= script.length) {
        t = 0; idx = 0; combo = 0; maxCombo = 0; score = 0; perf = 0; great = 0; miss = 0; started = false;
        feed.innerHTML = "";
        updateHud();
      }
      playing = true;
      playBtn.textContent = "暂停";
      emit("lg-ok", "[ChartLoadedEvent]", '谱面加载完成 title="Demo" totalNoteCount=10 musicTimeMs 为负');
      tick();
    });
    var pauseBtn = btn("暂停", "", function () { playing = false; playBtn.textContent = "继续"; });

    var row = el("div", "row");
    row.appendChild(playBtn);
    row.appendChild(pauseBtn);
    row.appendChild(el("span", "", "&nbsp;速度"));
    var speed = el("input");
    speed.type = "range"; speed.min = 1; speed.max = 4; speed.value = 2; speed.style.width = "120px";
    row.appendChild(speed);
    body.insertBefore(row, body.firstChild);

    box.appendChild(body);
    updateHud();
  });

  /* ------------------------------------------------------------
     Demo 5 · 连击行为（INCREMENT / RESET / NONE）
     ------------------------------------------------------------ */

  register("combo-behavior", function (box) {
    var kinds = {
      PERFECT: { color: "#1f8a4c", cb: "INCREMENT" },
      GREAT: { color: "#c07a12", cb: "INCREMENT" },
      GOOD: { color: "#3f5f90", cb: "INCREMENT" },
      BAD: { color: "#c0392b", cb: "RESET" },
      TOUCH: { color: "#6b7280", cb: "NONE" },
    };

    var body = el("div", "demo-body");

    // 判定序列编辑器
    var seqRow = el("div", "row");
    seqRow.appendChild(el("span", "", "点击追加判定："));
    Object.keys(kinds).forEach(function (k) {
      seqRow.appendChild(btn(k, "", function () {
        seq.push(k);
        renderSeq();
        run();
      }));
    });
    seqRow.appendChild(btn("清空", "", function () {
      seq = [];
      renderSeq();
      run();
    }));
    body.appendChild(seqRow);

    var seq = ["PERFECT", "GREAT", "GREAT", "BAD", "PERFECT", "TOUCH", "PERFECT"];

    var chips = el("div", "row");
    chips.style.gap = "6px";
    body.appendChild(chips);

    var table = el("table", "tiny");
    table.style.width = "100%";
    body.appendChild(table);

    function renderSeq() {
      chips.innerHTML = "";
      seq.forEach(function (k, i) {
        var c = el("span", "chip", k);
        c.style.background = kinds[k].color;
        c.addEventListener("click", function () {
          seq.splice(i, 1);
          renderSeq();
          run();
        });
        chips.appendChild(c);
      });
    }

    function run() {
      var combo = 0, rows = [];
      seq.forEach(function (k, i) {
        var before = combo;
        var showTxt = true;
        if (kinds[k].cb === "INCREMENT") combo++;
        else if (kinds[k].cb === "RESET") { combo = 0; showTxt = false; }
        // NONE：combo 不变，显示文字
        rows.push({
          i: i + 1, k: k, color: kinds[k].color, cb: kinds[k].cb,
          before: before, after: combo, showTxt: showTxt, logged: true,
        });
      });
      table.innerHTML =
        "<thead><tr><th>序号</th><th>判定</th><th>comboBehavior</th><th>判定前 combo</th>" +
        "<th>判定后 combo</th><th>显示连击文字</th><th>计入日志/计分</th></tr></thead>";
      var tb = el("tbody");
      rows.forEach(function (r) {
        var tr = el("tr");
        tr.innerHTML =
          "<td>" + r.i + "</td>" +
          '<td><span class="chip" style="background:' + r.color + '">' + r.k + "</span></td>" +
          "<td>" + r.cb + "</td>" +
          "<td>" + r.before + "</td>" +
          "<td><b>" + r.after + "</b></td>" +
          "<td>" + (r.showTxt ? "✔ 显示" : '<span style="color:#b42318">✘ 不显示</span>') + "</td>" +
          "<td>✔ 是</td>";
        tb.appendChild(tr);
      });
      table.appendChild(tb);
    }

    // 预设
    var preset = el("div", "row");
    preset.appendChild(btn("预设：普通游玩（含一次 MISS）", "", function () {
      seq = ["PERFECT", "PERFECT", "GREAT", "BAD", "PERFECT"];
      renderSeq(); run();
    }));
    preset.appendChild(btn("预设：自定义判定 RESET", "", function () {
      seq = ["PERFECT", "GOOD", "BAD", "GOOD", "BAD"];
      renderSeq(); run();
    }));
    preset.appendChild(btn("预设：含 TOUCH（NONE）", "", function () {
      seq = ["PERFECT", "TOUCH", "PERFECT", "TOUCH", "GREAT"];
      renderSeq(); run();
    }));
    body.appendChild(preset);

    var note = el("p", "", '<span style="color:#8a919c;font-size:12px">观察 RESET 类判定：combo 归零且<b>不显示连击文字</b>（与内置 MISS 同语义），但依旧写入日志与统计；NONE 类不影响 combo。点击判定徽章可删除。</span>');
    body.appendChild(note);

    box.appendChild(body);
    renderSeq();
    run();
  });

  /* ------------------------------------------------------------
     Demo 6 · RenderCanvas 绘制沙盒
     ------------------------------------------------------------ */

  register("render-canvas", function (box) {
    var body = el("div", "demo-body");
    var W = 760, H = 300;

    var canvas = el("canvas");
    canvas.style.cssText = "border:1px solid #e2e4e8;border-radius:5px;background:#fff;cursor:crosshair;display:block;width:100%";
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    var dpr = 1;
    function fit() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();

    var mode = "fillRect";
    var color = "#1c1e22";
    var alpha = 1;
    var dragStart = null;

    var logEl = el("div", "log");
    logEl.style.maxHeight = "130px";

    function logLine(txt, cls) {
      var d = document.createElement("div");
      d.className = cls || "";
      d.textContent = txt;
      logEl.appendChild(d);
      while (logEl.children.length > 18) logEl.removeChild(logEl.firstChild);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function drawPrim(m, x1, y1, x2, y2) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      var code = "";
      switch (m) {
        case "fillRect": {
          var fw = Math.abs(x2 - x1) || 8, fh = Math.abs(y2 - y1) || 8;
          ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), fw, fh);
          code = "canvas.fillRect(" + r1(Math.min(x1, x2)) + ", " + r1(Math.min(y1, y2)) + ", " + r1(fw) + ", " + r1(fh) + ")";
          break;
        }
        case "drawRect": {
          var dw = Math.abs(x2 - x1) || 8, dh = Math.abs(y2 - y1) || 8;
          ctx.strokeRect(Math.min(x1, x2) + 0.5, Math.min(y1, y2) + 0.5, dw, dh);
          code = "canvas.drawRect(" + r1(Math.min(x1, x2)) + ", " + r1(Math.min(y1, y2)) + ", " + r1(dw) + ", " + r1(dh) + ")";
          break;
        }
        case "drawLine":
          ctx.beginPath();
          ctx.moveTo(x1 + 0.5, y1 + 0.5);
          ctx.lineTo(x2 + 0.5, y2 + 0.5);
          ctx.stroke();
          code = "canvas.drawLine(" + r1(x1) + ", " + r1(y1) + ", " + r1(x2) + ", " + r1(y2) + ")";
          break;
        case "drawText":
          ctx.font = "16px system-ui, sans-serif";
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.fillText("SEECMD", x1, y1);
          code = "canvas.drawText(\"SEECMD\", " + r1(x1) + ", " + r1(y1) + ", style)";
          break;
      }
      ctx.restore();
      logLine("setColor(" + color + "); setAlpha(" + alpha + ");", "lg-dim");
      logLine(code, "lg-ok");
    }

    function r1(v) { return Math.round(v * 10) / 10; }

    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
    }

    canvas.addEventListener("pointerdown", function (e) {
      var p = pos(e);
      dragStart = p;
      if (mode === "drawText") {
        drawPrim(mode, p.x, p.y, p.x, p.y);
        dragStart = null;
      }
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragStart) return;
      var p = pos(e);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#3f5f90";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(0, 0, W - 1, H - 1);
      ctx.setLineDash([]);
      if (mode === "drawLine") {
        ctx.beginPath();
        ctx.moveTo(dragStart.x + 0.5, dragStart.y + 0.5);
        ctx.lineTo(p.x + 0.5, p.y + 0.5);
        ctx.stroke();
      } else if (mode === "fillRect" || mode === "drawRect") {
        ctx.strokeRect(Math.min(dragStart.x, p.x), Math.min(dragStart.y, p.y), Math.abs(p.x - dragStart.x), Math.abs(p.y - dragStart.y));
      }
      ctx.restore();
    });
    canvas.addEventListener("pointerup", function (e) {
      if (!dragStart) return;
      var p = pos(e);
      drawPrim(mode, dragStart.x, dragStart.y, p.x, p.y);
      dragStart = null;
    });

    // 控件
    var row = el("div", "row");
    row.appendChild(el("span", "", "绘制："));
    [["fillRect", "fillRect"], ["drawRect", "drawRect"], ["drawLine", "drawLine"], ["drawText", "drawText"]].forEach(function (m) {
      var b = btn(m[1], m[0] === "fillRect" ? "on" : "", function () {
        mode = m[0];
        row.querySelectorAll(".btn").forEach(function (x) { x.classList.remove("on"); });
        this.classList.add("on");
      });
      row.appendChild(b);
    });
    row.appendChild(el("span", "", "&nbsp;颜色："));
    [["#1c1e22", "黑"], ["#5b626c", "灰"], ["#00c2a0", "青"], ["#c0392b", "红"]].forEach(function (c) {
      var b = btn("", "", function () {
        color = c[0];
        row.querySelectorAll(".btn.color").forEach(function (x) { x.style.background = ""; x.style.color = ""; });
        this.style.background = c[0];
        this.style.color = "#fff";
      });
      b.className = "btn color";
      b.style.cssText += "background:" + c[0] + ";width:22px;height:22px;padding:0;border-radius:50%;border-color:" + c[0];
      if (c[0] === "#1c1e22") b.style.color = "#fff";
      row.appendChild(b);
    });
    row.appendChild(el("span", "", "&nbsp;透明度"));
    var alphaSlider = el("input");
    alphaSlider.type = "range"; alphaSlider.min = 10; alphaSlider.max = 100; alphaSlider.value = 100;
    alphaSlider.style.width = "100px";
    alphaSlider.addEventListener("input", function () { alpha = (+alphaSlider.value) / 100; });
    row.appendChild(alphaSlider);
    row.appendChild(btn("清空", "", function () {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      logEl.innerHTML = "";
    }));

    body.appendChild(row);
    body.appendChild(canvas);
    body.appendChild(logEl);

    box.appendChild(body);
  });

  /* ---------------- 首页快速上手折叠 ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".step-head").forEach(function (head) {
      head.addEventListener("click", function () {
        var step = head.parentNode;
        var open = step.classList.toggle("open");
        // 手风琴：同一容器内其它关闭
        step.parentNode.querySelectorAll(".step.open").forEach(function (o) {
          if (o !== step) o.classList.remove("open");
        });
        if (open && window.__openStep) window.__openStep(step);
      });
    });
  });

  /* ---------------- 暴露给外部 ---------------- */
  window.SeecmdDocs = {
    registerDemo: register,
    renderAll: function () {
      document.querySelectorAll("[data-demo]").forEach(function (box) {
        if (!box.__rendered) {
          box.__rendered = true;
          var fn = demos[box.getAttribute("data-demo")];
          if (fn) try { fn(box); } catch (e) {}
        }
      });
    },
  };
})();
