// チェバの定理・メネラウスの定理 インタラクティブ・シミュレーター
// 高校数学A 幾何分野

class TheoremsSimulator {
  constructor() {
    this.svg = document.getElementById('thm-svg');
    this.rootLayer = document.getElementById('thm-root-layer') || this.svg;
    if (!this.svg) return;

    // 現在のモード: 'ceva' (チェバ) または 'menelaus' (メネラウス)
    this.currentMode = 'ceva';

    // 出発点の頂点 ('A', 'B', 'C')
    this.startVertex = 'A';

    // 三角形ABCの頂点初期座標
    this.vertices = {
      A: { x: 425, y: 80 },
      B: { x: 190, y: 390 },
      C: { x: 660, y: 390 }
    };

    // チェバ点 O の初期座標（三角形内部）
    this.pointO = { x: 425, y: 260 };

    // メネラウス直線上の2制御点（直線を通る2点）
    this.lineControls = {
      M1: { x: 260, y: 280 }, // AB上付近
      M2: { x: 520, y: 200 }  // AC上付近
    };

    // ドラッグ状態
    this.draggingTarget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.handleElements = {};

    // 表示設定
    this.options = {
      showRoute: true,         // 巡回ルート（A->R->B->P->C->Q->A）矢印
      showLengths: true,       // 線分長・比率表示
      showExtended: true,      // 延長線（点線）表示
      showLineHandles: true    // メネラウス直線ハンドル（L1, L2）表示
    };

    this.initDOM();
    this.initHandles();
    this.bindEvents();
    this.render();
  }

  initDOM() {
    this.btnModeCeva = document.getElementById('thm-mode-ceva');
    this.btnModeMene = document.getElementById('thm-mode-menelaus');

    // 出発点選択ボタン
    this.btnStartList = document.querySelectorAll('.btn-thm-start');

    // プリセットボタン
    this.presetButtons = document.querySelectorAll('.btn-thm-preset');

    // オプションチェックボックス
    this.chkRoute = document.getElementById('thm-show-route');
    this.chkLengths = document.getElementById('thm-show-lengths');
    this.chkExtended = document.getElementById('thm-show-extended');
    this.chkLineHandles = document.getElementById('thm-show-line-handles');
    this.rowLineHandles = document.getElementById('thm-opt-line-handles-row');

    // SVGレイヤー
    this.layerExtended = document.getElementById('thm-layer-extended');
    this.layerTriangle = document.getElementById('thm-poly-triangle');
    this.layerLines = document.getElementById('thm-layer-lines');
    this.layerPoints = document.getElementById('thm-layer-points');
    this.layerRoute = document.getElementById('thm-layer-route');
    this.layerHandles = document.getElementById('thm-layer-handles');

    // 数式バー要素
    this.barFraction1 = document.getElementById('thm-frac-1');
    this.barFraction2 = document.getElementById('thm-frac-2');
    this.barFraction3 = document.getElementById('thm-frac-3');
    this.barVal1 = document.getElementById('thm-val-1');
    this.barVal2 = document.getElementById('thm-val-2');
    this.barVal3 = document.getElementById('thm-val-3');
    this.barProduct = document.getElementById('thm-bar-product');
    this.barFormulaTitle = document.getElementById('thm-bar-title');
    this.thmExplanation = document.getElementById('thm-explanation');
  }

  // タブ切り替え時
  onActivate() {
    this.setMode(this.currentMode);
  }

  // 2直線の交点計算
  intersectLines(p1, p2, p3, p4) {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 1e-6) return null; // 平行
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
      t: t
    };
  }

  // 2点間のユークリッド距離
  dist(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  // 頂点ハンドル初期化
  initHandles() {
    this.layerHandles.innerHTML = '';
    const targets = ['A', 'B', 'C', 'O', 'M1', 'M2'];

    targets.forEach(key => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'sim-handle-group');
      g.setAttribute('data-target', key);

      // 当たり判定用（広め）
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hit.setAttribute('r', '26');
      hit.setAttribute('class', 'sim-handle-hitarea');
      hit.style.cursor = 'grab';

      // 表示用リング
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '8.5');
      circle.setAttribute('class', `thm-handle thm-handle-${key.toLowerCase()}`);

      // ラベル
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'sim-handle-label');
      text.setAttribute('dy', '-13');
      text.textContent = key === 'M1' ? 'L1' : key === 'M2' ? 'L2' : key;

      g.appendChild(hit);
      g.appendChild(circle);
      g.appendChild(text);
      this.layerHandles.appendChild(g);

      this.handleElements[key] = { g, circle, text };
    });
  }

  updateHandlesPosition() {
    const isCeva = this.currentMode === 'ceva';

    // A, B, C
    ['A', 'B', 'C'].forEach(key => {
      const p = this.vertices[key];
      const el = this.handleElements[key];
      if (el && p) {
        el.g.setAttribute('transform', `translate(${p.x}, ${p.y})`);
        el.g.style.display = 'block';

        // 出発点の頂点には旗マークと太枠ハイライト
        if (key === this.startVertex) {
          el.text.textContent = `${key} (🏁始点)`;
          el.text.setAttribute('fill', '#f59e0b');
          el.circle.setAttribute('stroke', '#f59e0b');
          el.circle.setAttribute('stroke-width', '4');
        } else {
          el.text.textContent = key;
          el.text.setAttribute('fill', 'var(--text-main)');
          el.circle.setAttribute('stroke', '#ffffff');
          el.circle.setAttribute('stroke-width', '2.5');
        }
      }
    });

    // O（チェバのみ表示）
    if (this.handleElements['O']) {
      if (isCeva) {
        this.handleElements['O'].g.setAttribute('transform', `translate(${this.pointO.x}, ${this.pointO.y})`);
        this.handleElements['O'].g.style.display = 'block';
      } else {
        this.handleElements['O'].g.style.display = 'none';
      }
    }

    // M1, M2（メネラウスのみ表示。showLineHandlesがtrueの時のみ可視）
    ['M1', 'M2'].forEach(key => {
      const el = this.handleElements[key];
      if (el) {
        if (!isCeva && this.options.showLineHandles) {
          const p = this.lineControls[key];
          el.g.setAttribute('transform', `translate(${p.x}, ${p.y})`);
          el.g.style.display = 'block';
        } else {
          el.g.style.display = 'none';
        }
      }
    });
  }

  bindEvents() {
    // モード切り替え
    if (this.btnModeCeva && this.btnModeMene) {
      this.btnModeCeva.addEventListener('click', () => this.setMode('ceva'));
      this.btnModeMene.addEventListener('click', () => this.setMode('menelaus'));
    }

    // 出発点切り替え
    this.btnStartList.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const start = e.currentTarget.dataset.start;
        this.setStartVertex(start);
      });
    });

    // プリセット
    this.presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.dataset.preset;
        this.applyPreset(preset);
      });
    });

    // オプション
    if (this.chkRoute) {
      this.chkRoute.addEventListener('change', (e) => {
        this.options.showRoute = e.target.checked;
        this.render();
      });
    }
    if (this.chkLengths) {
      this.chkLengths.addEventListener('change', (e) => {
        this.options.showLengths = e.target.checked;
        this.render();
      });
    }
    if (this.chkExtended) {
      this.chkExtended.addEventListener('change', (e) => {
        this.options.showExtended = e.target.checked;
        this.render();
      });
    }
    if (this.chkLineHandles) {
      this.chkLineHandles.addEventListener('change', (e) => {
        this.options.showLineHandles = e.target.checked;
        this.updateHandlesPosition();
      });
    }

    // ドラッグイベント
    this.bindDragEvents();
  }

  setStartVertex(vertex) {
    this.startVertex = vertex;
    this.btnStartList.forEach(btn => {
      if (btn.dataset.start === vertex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    this.updateHandlesPosition();
    this.render();
  }

  setMode(mode) {
    this.currentMode = mode;
    if (this.btnModeCeva && this.btnModeMene) {
      if (mode === 'ceva') {
        this.btnModeCeva.classList.add('active');
        this.btnModeMene.classList.remove('active');
      } else {
        this.btnModeMene.classList.add('active');
        this.btnModeCeva.classList.remove('active');
      }
    }
    if (this.rowLineHandles) {
      if (mode === 'ceva') {
        this.rowLineHandles.style.opacity = '0.4';
        this.rowLineHandles.style.pointerEvents = 'none';
      } else {
        this.rowLineHandles.style.opacity = '1';
        this.rowLineHandles.style.pointerEvents = 'auto';
      }
    }
    this.updateHandlesPosition();
    this.render();
  }

  applyPreset(type) {
    if (this.currentMode === 'ceva') {
      switch (type) {
        case 'centroid': // 重心（各辺の中点で交わる比1:1:1）
          this.vertices = { A: { x: 425, y: 80 }, B: { x: 190, y: 390 }, C: { x: 660, y: 390 } };
          this.pointO = {
            x: (this.vertices.A.x + this.vertices.B.x + this.vertices.C.x) / 3,
            y: (this.vertices.A.y + this.vertices.B.y + this.vertices.C.y) / 3
          };
          break;
        case 'incenter': // 内心
          this.vertices = { A: { x: 425, y: 80 }, B: { x: 190, y: 390 }, C: { x: 660, y: 390 } };
          const a = this.dist(this.vertices.B, this.vertices.C);
          const b = this.dist(this.vertices.C, this.vertices.A);
          const c = this.dist(this.vertices.A, this.vertices.B);
          const p = a + b + c;
          this.pointO = {
            x: (a * this.vertices.A.x + b * this.vertices.B.x + c * this.vertices.C.x) / p,
            y: (a * this.vertices.A.y + b * this.vertices.B.y + c * this.vertices.C.y) / p
          };
          break;
        case 'custom1': // 2:1など比率が綺麗な位置
          this.vertices = { A: { x: 425, y: 80 }, B: { x: 190, y: 390 }, C: { x: 660, y: 390 } };
          this.pointO = { x: 380, y: 260 };
          break;
        default: // 標準
          this.vertices = { A: { x: 425, y: 80 }, B: { x: 190, y: 390 }, C: { x: 660, y: 390 } };
          this.pointO = { x: 425, y: 250 };
          break;
      }
    } else {
      // メネラウスプリセット
      switch (type) {
        case 'fox': // キツネ型（基本・辺ABとACを内分、BCの延長と交差）
          this.vertices = { A: { x: 425, y: 80 }, B: { x: 220, y: 380 }, C: { x: 580, y: 380 } };
          this.lineControls = {
            M1: { x: 280, y: 300 }, // AB上
            M2: { x: 490, y: 200 }  // AC上
          };
          break;
        case 'midpoint': // 中点交差
          this.vertices = { A: { x: 425, y: 80 }, B: { x: 220, y: 380 }, C: { x: 580, y: 380 } };
          this.lineControls = {
            M1: { x: (425 + 220) / 2, y: (80 + 380) / 2 },
            M2: { x: (425 + 580) / 2 + 30, y: (80 + 380) / 2 - 20 }
          };
          break;
        default:
          this.vertices = { A: { x: 425, y: 80 }, B: { x: 220, y: 380 }, C: { x: 580, y: 380 } };
          this.lineControls = { M1: { x: 300, y: 260 }, M2: { x: 510, y: 220 } };
          break;
      }
    }
    this.updateHandlesPosition();
    this.render();
  }

  // ドラッグ操作の実装
  getSVGPoint(evt) {
    const pt = this.svg.createSVGPoint();
    if (evt.touches && evt.touches.length > 0) {
      pt.x = evt.touches[0].clientX;
      pt.y = evt.touches[0].clientY;
    } else {
      pt.x = evt.clientX;
      pt.y = evt.clientY;
    }
    const screenCTM = this.svg.getScreenCTM();
    if (screenCTM) {
      return pt.matrixTransform(screenCTM.inverse());
    }
    const rect = this.svg.getBoundingClientRect();
    return {
      x: ((pt.x - rect.left) / rect.width) * 850,
      y: ((pt.y - rect.top) / rect.height) * 500
    };
  }

  bindDragEvents() {
    const onStart = (e) => {
      const handleGroup = e.target.closest('.sim-handle-group');
      if (!handleGroup) return;

      e.preventDefault();
      const target = handleGroup.getAttribute('data-target');
      if (!target) return;

      this.draggingTarget = target;
      const pt = this.getSVGPoint(e);

      let currentPos;
      if (['A', 'B', 'C'].includes(target)) {
        currentPos = this.vertices[target];
      } else if (target === 'O') {
        currentPos = this.pointO;
      } else if (['M1', 'M2'].includes(target)) {
        currentPos = this.lineControls[target];
      }

      if (currentPos) {
        this.dragOffset = {
          x: pt.x - currentPos.x,
          y: pt.y - currentPos.y
        };
      }

      const hit = handleGroup.querySelector('.sim-handle-hitarea');
      if (hit) hit.style.cursor = 'grabbing';
      this.svg.classList.add('is-dragging');
    };

    const onMove = (e) => {
      if (!this.draggingTarget) return;
      e.preventDefault();

      const pt = this.getSVGPoint(e);
      let newX = Math.max(30, Math.min(820, pt.x - this.dragOffset.x));
      let newY = Math.max(30, Math.min(470, pt.y - this.dragOffset.y));

      if (['A', 'B', 'C'].includes(this.draggingTarget)) {
        this.vertices[this.draggingTarget] = { x: newX, y: newY };
      } else if (this.draggingTarget === 'O') {
        this.pointO = { x: newX, y: newY };
      } else if (['M1', 'M2'].includes(this.draggingTarget)) {
        this.lineControls[this.draggingTarget] = { x: newX, y: newY };
      }

      this.updateHandlesPosition();
      this.render();
    };

    const onEnd = () => {
      if (!this.draggingTarget) return;
      const el = this.handleElements[this.draggingTarget];
      if (el) {
        const hit = el.g.querySelector('.sim-handle-hitarea');
        if (hit) hit.style.cursor = 'grab';
      }
      this.draggingTarget = null;
      this.svg.classList.remove('is-dragging');
    };

    // マウス
    this.svg.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);

    // タッチ
    this.svg.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  // メイン描画
  render() {
    const { A, B, C } = this.vertices;

    // 三角形ABC
    this.layerTriangle.setAttribute('points', `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`);

    if (this.currentMode === 'ceva') {
      this.renderCeva();
    } else {
      this.renderMenelaus();
    }
  }

  // チェバの定理の描画
  renderCeva() {
    const { A, B, C } = this.vertices;
    const O = this.pointO;

    // 直線AOと直線BCの交点 P
    const P = this.intersectLines(A, O, B, C);
    // 直線BOと直線CAの交点 Q
    const Q = this.intersectLines(B, O, C, A);
    // 直線COと直線ABの交点 R
    const R = this.intersectLines(C, O, A, B);

    this.layerExtended.innerHTML = '';
    this.layerLines.innerHTML = '';
    this.layerPoints.innerHTML = '';
    this.layerRoute.innerHTML = '';

    if (!P || !Q || !R) return;

    // チェバ線 AP, BQ, CR の描画
    this.layerLines.innerHTML = `
      <line x1="${A.x}" y1="${A.y}" x2="${P.x}" y2="${P.y}" class="thm-line-ceva" />
      <line x1="${B.x}" y1="${B.y}" x2="${Q.x}" y2="${Q.y}" class="thm-line-ceva" />
      <line x1="${C.x}" y1="${C.y}" x2="${R.x}" y2="${R.y}" class="thm-line-ceva" />
    `;

    // 分点マーカー P, Q, R
    const pointsMarkup = `
      <!-- P -->
      <g transform="translate(${P.x}, ${P.y})">
        <circle r="6" class="thm-point-marker thm-point-p" />
        <text dy="18" class="thm-point-label">P</text>
      </g>
      <!-- Q -->
      <g transform="translate(${Q.x}, ${Q.y})">
        <circle r="6" class="thm-point-marker thm-point-q" />
        <text dx="12" dy="5" class="thm-point-label">Q</text>
      </g>
      <!-- R -->
      <g transform="translate(${R.x}, ${R.y})">
        <circle r="6" class="thm-point-marker thm-point-r" />
        <text dx="-14" dy="5" class="thm-point-label">R</text>
      </g>
      <!-- O (チェバ点) -->
      <g transform="translate(${O.x}, ${O.y})">
        <circle r="5" class="thm-point-o" />
        <text dx="10" dy="-8" class="thm-label-o">交点 O</text>
      </g>
    `;
    this.layerPoints.innerHTML = pointsMarkup;

    // 線分比セグメントの取得（出発点 A, B, C に応じて並び替え）
    const segments = this.getSegments(P, Q, R);

    // 巡回ルート描画
    if (this.options.showRoute) {
      this.drawRoute(segments);
    }

    // 長さ・比率テキスト表示
    if (this.options.showLengths) {
      this.drawLengthBadges([
        { p1: B, p2: P, text: segments.find(s => s.num === 'BP').valNum.toFixed(0), color: '#ef4444' },
        { p1: P, p2: C, text: segments.find(s => s.den === 'PC').valDen.toFixed(0), color: '#ef4444' },
        { p1: C, p2: Q, text: segments.find(s => s.num === 'CQ').valNum.toFixed(0), color: '#3b82f6' },
        { p1: Q, p2: A, text: segments.find(s => s.den === 'QA').valDen.toFixed(0), color: '#3b82f6' },
        { p1: A, p2: R, text: segments.find(s => s.num === 'AR').valNum.toFixed(0), color: '#10b981' },
        { p1: R, p2: B, text: segments.find(s => s.den === 'RB').valDen.toFixed(0), color: '#10b981' }
      ]);
    }

    // 数式バーの更新
    this.updateFormulaBar({
      title: 'チェバの定理',
      symbol1: segments[0],
      symbol2: segments[1],
      symbol3: segments[2]
    });

    if (this.thmExplanation) {
      this.thmExplanation.innerHTML = `
        <strong>💡 チェバの定理の覚え方</strong>:<br>
        頂点 <b>${this.startVertex}</b> からスタートして、
        ${segments[0].desc} →
        ${segments[1].desc} →
        ${segments[2].desc}<br>
        と一筆書きで一周すると、分数の積は必ず <b>1</b> になります！
      `;
    }
  }

  // メネラウスの定理の描画
  renderMenelaus() {
    const { A, B, C } = this.vertices;
    const { M1, M2 } = this.lineControls;

    // メネラウス直線 L (M1-M2) と各直線との交点
    // BCとの交点 P
    const P = this.intersectLines(M1, M2, B, C);
    // CAとの交点 Q
    const Q = this.intersectLines(M1, M2, C, A);
    // ABとの交点 R
    const R = this.intersectLines(M1, M2, A, B);

    this.layerExtended.innerHTML = '';
    this.layerLines.innerHTML = '';
    this.layerPoints.innerHTML = '';
    this.layerRoute.innerHTML = '';

    if (!P || !Q || !R) {
      if (this.thmExplanation) {
        this.thmExplanation.innerHTML = `
          <strong style="color: #ef4444;">⚠️ 直線が辺と平行です</strong><br>
          直線が三角形のいずれかの辺と平行な場合、交点が無限遠となり比が定義できません。<br>
          ピンク色の直線ハンドル（<b>L1</b> または <b>L2</b>）を少しドラッグして傾きを変えてみてください。
        `;
      }
      return;
    }

    // メネラウス直線（キャンバス端まで延長）
    const lineDir = { x: M2.x - M1.x, y: M2.y - M1.y };
    const lineLen = Math.hypot(lineDir.x, lineDir.y);
    const normDir = { x: lineDir.x / lineLen, y: lineDir.y / lineLen };
    const extStart = { x: M1.x - normDir.x * 900, y: M1.y - normDir.y * 900 };
    const extEnd = { x: M1.x + normDir.x * 900, y: M1.y + normDir.y * 900 };

    this.layerLines.innerHTML = `
      <line x1="${extStart.x}" y1="${extStart.y}" x2="${extEnd.x}" y2="${extEnd.y}" class="thm-line-menelaus" />
    `;

    // 辺の延長線描画（三角形の外に交点がある場合）
    if (this.options.showExtended) {
      let extLinesSvg = '';
      // BCとP
      if (P.t < 0 || P.t > 1) {
        const farP = P.t < 0 ? B : C;
        extLinesSvg += `<line x1="${farP.x}" y1="${farP.y}" x2="${P.x}" y2="${P.y}" class="thm-line-dash-ext" />`;
      }
      // CAとQ
      if (Q.t < 0 || Q.t > 1) {
        const farQ = Q.t < 0 ? C : A;
        extLinesSvg += `<line x1="${farQ.x}" y1="${farQ.y}" x2="${Q.x}" y2="${Q.y}" class="thm-line-dash-ext" />`;
      }
      // ABとR
      if (R.t < 0 || R.t > 1) {
        const farR = R.t < 0 ? A : B;
        extLinesSvg += `<line x1="${farR.x}" y1="${farR.y}" x2="${R.x}" y2="${R.y}" class="thm-line-dash-ext" />`;
      }
      this.layerExtended.innerHTML = extLinesSvg;
    }

    // 分点マーカー P, Q, R
    const pointsMarkup = `
      <!-- P (BCまたは延長線) -->
      <g transform="translate(${P.x}, ${P.y})">
        <circle r="6" class="thm-point-marker thm-point-p" />
        <text dy="${P.y > B.y ? 20 : -12}" class="thm-point-label">P</text>
      </g>
      <!-- Q (CAまたは延長線) -->
      <g transform="translate(${Q.x}, ${Q.y})">
        <circle r="6" class="thm-point-marker thm-point-q" />
        <text dx="12" dy="5" class="thm-point-label">Q</text>
      </g>
      <!-- R (ABまたは延長線) -->
      <g transform="translate(${R.x}, ${R.y})">
        <circle r="6" class="thm-point-marker thm-point-r" />
        <text dx="-14" dy="5" class="thm-point-label">R</text>
      </g>
    `;
    this.layerPoints.innerHTML = pointsMarkup;

    // 線分比セグメントの取得（出発点 A, B, C に応じて並び替え）
    const segments = this.getSegments(P, Q, R);

    // 巡回ルート描画
    if (this.options.showRoute) {
      this.drawRoute(segments);
    }

    if (this.options.showLengths) {
      this.drawLengthBadges([
        { p1: B, p2: P, text: segments.find(s => s.num === 'BP').valNum.toFixed(0), color: '#ef4444' },
        { p1: P, p2: C, text: segments.find(s => s.den === 'PC').valDen.toFixed(0), color: '#ef4444' },
        { p1: C, p2: Q, text: segments.find(s => s.num === 'CQ').valNum.toFixed(0), color: '#3b82f6' },
        { p1: Q, p2: A, text: segments.find(s => s.den === 'QA').valDen.toFixed(0), color: '#3b82f6' },
        { p1: A, p2: R, text: segments.find(s => s.num === 'AR').valNum.toFixed(0), color: '#10b981' },
        { p1: R, p2: B, text: segments.find(s => s.den === 'RB').valDen.toFixed(0), color: '#10b981' }
      ]);
    }

    // 数式バー更新
    this.updateFormulaBar({
      title: 'メネラウスの定理',
      symbol1: segments[0],
      symbol2: segments[1],
      symbol3: segments[2]
    });

    if (this.thmExplanation) {
      this.thmExplanation.innerHTML = `
        <strong>💡 メネラウスの定理（キツネ型）の暗記法</strong>:<br>
        頂点 <b>${this.startVertex}</b> からスタートして、
        ${segments[0].desc} →
        ${segments[1].desc} →
        ${segments[2].desc}<br>
        外分点へは「一度通り越して戻る」と覚えると絶対に迷いません！
      `;
    }
  }

  // 出発点（A, B, C）に応じた巡回セグメント定義
  getSegments(P, Q, R) {
    const { A, B, C } = this.vertices;
    const lenBP = this.dist(B, P);
    const lenPC = this.dist(P, C);
    const lenCQ = this.dist(C, Q);
    const lenQA = this.dist(Q, A);
    const lenAR = this.dist(A, R);
    const lenRB = this.dist(R, B);

    const segAR_RB = {
      from: A, mid: R, to: B,
      num: 'AR', den: 'RB',
      valNum: lenAR, valDen: lenRB,
      color: '#10b981',
      desc: `<span style="color:#10b981"><b>A</b> → <b>R</b> → <b>B</b></span>`
    };

    const segBP_PC = {
      from: B, mid: P, to: C,
      num: 'BP', den: 'PC',
      valNum: lenBP, valDen: lenPC,
      color: '#ef4444',
      desc: `<span style="color:#ef4444"><b>B</b> → <b>P</b> → <b>C</b></span>`
    };

    const segCQ_QA = {
      from: C, mid: Q, to: A,
      num: 'CQ', den: 'QA',
      valNum: lenCQ, valDen: lenQA,
      color: '#3b82f6',
      desc: `<span style="color:#3b82f6"><b>C</b> → <b>Q</b> → <b>A</b></span>`
    };

    if (this.startVertex === 'A') {
      return [segAR_RB, segBP_PC, segCQ_QA];
    } else if (this.startVertex === 'B') {
      return [segBP_PC, segCQ_QA, segAR_RB];
    } else {
      return [segCQ_QA, segAR_RB, segBP_PC];
    }
  }

  // 巡回ルート（3セグメント）の矢印描画
  drawRoute(segments) {
    const arrow = (from, to, color) => {
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
      return `
        <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${color}" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.85" />
        <polygon points="-5,-4 5,0 -5,4" fill="${color}" transform="translate(${mx}, ${my}) rotate(${angle})" />
      `;
    };

    let svg = '';
    segments.forEach(seg => {
      svg += arrow(seg.from, seg.mid, seg.color);
      svg += arrow(seg.mid, seg.to, seg.color);
    });
    this.layerRoute.innerHTML = svg;
  }

  // 線分の長さ・比バッジの描画
  drawLengthBadges(badges) {
    let svg = '';
    badges.forEach(b => {
      const mx = (b.p1.x + b.p2.x) / 2;
      const my = (b.p1.y + b.p2.y) / 2;
      svg += `
        <g transform="translate(${mx}, ${my})">
          <rect x="-16" y="-10" width="32" height="18" rx="4" fill="var(--card-bg, #ffffff)" stroke="${b.color}" stroke-width="1.5" />
          <text text-anchor="middle" dy="3.5" font-size="11" font-weight="700" fill="${b.color}">${b.text}</text>
        </g>
      `;
    });
    this.layerRoute.innerHTML += svg;
  }

  // 数式バーの更新
  updateFormulaBar(data) {
    if (this.barFormulaTitle) {
      this.barFormulaTitle.textContent = data.title;
    }

    const r1 = data.symbol1.valNum / data.symbol1.valDen;
    const r2 = data.symbol2.valNum / data.symbol2.valDen;
    const r3 = data.symbol3.valNum / data.symbol3.valDen;
    const product = r1 * r2 * r3;

    if (this.barFraction1) {
      this.barFraction1.innerHTML = `
        <div class="thm-formula-frac" style="color: ${data.symbol1.color}">
          <span class="thm-fn">${data.symbol1.num}</span>
          <span class="thm-fd">${data.symbol1.den}</span>
        </div>
      `;
    }
    if (this.barVal1) {
      this.barVal1.innerHTML = `
        <div class="thm-val-frac">
          <span class="thm-fn">${data.symbol1.valNum.toFixed(0)}</span>
          <span class="thm-fd">${data.symbol1.valDen.toFixed(0)}</span>
        </div>
      `;
    }

    if (this.barFraction2) {
      this.barFraction2.innerHTML = `
        <div class="thm-formula-frac" style="color: ${data.symbol2.color}">
          <span class="thm-fn">${data.symbol2.num}</span>
          <span class="thm-fd">${data.symbol2.den}</span>
        </div>
      `;
    }
    if (this.barVal2) {
      this.barVal2.innerHTML = `
        <div class="thm-val-frac">
          <span class="thm-fn">${data.symbol2.valNum.toFixed(0)}</span>
          <span class="thm-fd">${data.symbol2.valDen.toFixed(0)}</span>
        </div>
      `;
    }

    if (this.barFraction3) {
      this.barFraction3.innerHTML = `
        <div class="thm-formula-frac" style="color: ${data.symbol3.color}">
          <span class="thm-fn">${data.symbol3.num}</span>
          <span class="thm-fd">${data.symbol3.den}</span>
        </div>
      `;
    }
    if (this.barVal3) {
      this.barVal3.innerHTML = `
        <div class="thm-val-frac">
          <span class="thm-fn">${data.symbol3.valNum.toFixed(0)}</span>
          <span class="thm-fd">${data.symbol3.valDen.toFixed(0)}</span>
        </div>
      `;
    }

    if (this.barProduct) {
      // 幾何学的に常に1になる
      this.barProduct.textContent = isFinite(product) ? product.toFixed(2) : '1.00';
    }
  }
}

// グローバル公開
window.TheoremsSimulator = TheoremsSimulator;
