// 三角形の五心 インタラクティブ・シミュレーター（高精度座標変換＆ドラッグ追従版）

class TriangleSimulator {
  constructor() {
    this.svg = document.getElementById('sim-svg');
    this.rootLayer = document.getElementById('sim-root-layer') || this.svg;
    if (!this.svg) return;

    // 頂点初期座標 (外接円が上下左右にはみ出さず綺麗に収まる最適サイズ)
    this.vertices = {
      A: { x: 425, y: 45 },
      B: { x: 245, y: 395 },
      C: { x: 605, y: 395 }
    };

    // ドラッグ状態
    this.draggingVertex = null;
    this.dragOffset = { x: 0, y: 0 };
    this.handleElements = {}; // 頂点DOM要素キャッシュ

    // 表示設定フラグ
    this.options = {
      centroid: true,
      incenter: true,
      incenterDemo: false, // 内接円半径の求め方（3分割公式）
      circumcenter: true,
      orthocenter: false,
      excenter: false,
      euler: false
    };

    this.initDOM();
    this.initHandles();
    this.bindEvents();
    this.render();
  }

  initDOM() {
    this.layerGuides = document.getElementById('sim-layer-guides');
    this.layerCircles = document.getElementById('sim-layer-circles');
    this.layerEuler = document.getElementById('sim-layer-euler');
    this.polyTriangle = document.getElementById('sim-poly-triangle');
    this.layerIncenterDemo = document.getElementById('sim-layer-incenter-demo');
    this.layerCenters = document.getElementById('sim-layer-centers');
    this.layerHandles = document.getElementById('sim-layer-handles');

    this.chkCentroid = document.getElementById('sim-show-centroid');
    this.chkIncenter = document.getElementById('sim-show-incenter');
    this.chkIncenterDemo = document.getElementById('sim-show-incenter-demo');
    this.formulaRow = document.getElementById('sim-formula-row');
    this.chkCircumcenter = document.getElementById('sim-show-circumcenter');
    this.chkOrthocenter = document.getElementById('sim-show-orthocenter');
    this.chkExcenter = document.getElementById('sim-show-excenter');
    this.chkEuler = document.getElementById('sim-show-euler');

    this.typeBadge = document.getElementById('sim-triangle-type');
    this.angleA = document.getElementById('sim-angle-a');
    this.angleB = document.getElementById('sim-angle-b');
    this.angleC = document.getElementById('sim-angle-c');
    this.commentary = document.getElementById('sim-commentary');

    // 図の下の大きな公式バー
    this.formulaBar = document.getElementById('sim-formula-bar');
    this.barP = document.getElementById('sim-bar-p');
    this.barS = document.getElementById('sim-bar-s');
    this.barR = document.getElementById('sim-bar-r');
  }

  updateFormulaRowState() {
    if (!this.formulaRow) return;
    if (this.options.incenter) {
      this.formulaRow.classList.remove('is-disabled');
      if (this.chkIncenterDemo) this.chkIncenterDemo.disabled = false;
    } else {
      this.formulaRow.classList.add('is-disabled');
      if (this.chkIncenterDemo) {
        this.chkIncenterDemo.disabled = true;
      }
    }
  }

  // タブ表示時の再同期
  onActivate() {
    this.updateFormulaRowState();
    this.updateHandlesPosition();
    this.render();
  }

  // 頂点ハンドルを一度だけ初期化
  initHandles() {
    this.layerHandles.innerHTML = '';
    const keys = ['A', 'B', 'C'];

    keys.forEach(key => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'sim-handle-group');
      g.setAttribute('data-vertex', key);

      // 広めの当たり判定円（半径26px、透明でつかみやすい）
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hit.setAttribute('r', '26');
      hit.setAttribute('class', 'sim-handle-hit');

      // 見た目の円
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '9');
      circle.setAttribute('class', 'sim-handle-circle');

      // ラベル文字
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'sim-handle-label');
      text.textContent = key;

      g.appendChild(hit);
      g.appendChild(circle);
      g.appendChild(text);

      // ドラッグ開始ハンドラ
      const onStart = (e) => {
        this.draggingVertex = key;
        const pt = this.getSvgPoint(e);
        // ドラッグ開始時のオフセット（頂点中心とマウス位置の差）を記録
        this.dragOffset = {
          x: pt.x - this.vertices[key].x,
          y: pt.y - this.vertices[key].y
        };
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        e.preventDefault();
        e.stopPropagation();
      };

      hit.addEventListener('mousedown', onStart);
      hit.addEventListener('touchstart', onStart, { passive: false });

      this.layerHandles.appendChild(g);
      this.handleElements[key] = { g, hit, circle, text };
    });

    this.updateHandlesPosition();
  }

  bindEvents() {
    // チェックボックス切り替え
    const checkMap = [
      { el: this.chkCentroid, key: 'centroid' },
      { el: this.chkIncenter, key: 'incenter' },
      { el: this.chkCircumcenter, key: 'circumcenter' },
      { el: this.chkOrthocenter, key: 'orthocenter' },
      { el: this.chkExcenter, key: 'excenter' },
      { el: this.chkEuler, key: 'euler' }
    ];

    checkMap.forEach(item => {
      if (item.el) {
        item.el.addEventListener('change', () => {
          this.options[item.key] = item.el.checked;
          if (item.key === 'incenter') {
            this.updateFormulaRowState();
          }
          this.render();
        });
      }
    });

    // 内接円半径の求め方チェックボックス
    if (this.chkIncenterDemo) {
      this.chkIncenterDemo.addEventListener('change', () => {
        this.options.incenterDemo = this.chkIncenterDemo.checked;
        if (this.options.incenterDemo && !this.options.incenter) {
          // 求め方をONにした際、内心がOFFなら自動で内心もONにする
          this.options.incenter = true;
          this.chkIncenter.checked = true;
          this.updateFormulaRowState();
        }
        this.render();
      });
    }

    this.updateFormulaRowState();

    // プリセットボタン
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-preset');
        this.applyPreset(type);
      });
    });

    // window全体でマウス・タッチの移動と解除を確実に補足
    const onMove = (e) => {
      if (!this.draggingVertex) return;

      const pt = this.getSvgPoint(e);
      // オフセットを差し引いて頂点中心の目標座標を算出
      const targetX = pt.x - (this.dragOffset ? this.dragOffset.x : 0);
      const targetY = pt.y - (this.dragOffset ? this.dragOffset.y : 0);

      // キャンバス範囲制限 (viewBox 0 0 850 500)
      const x = Math.max(25, Math.min(825, targetX));
      const y = Math.max(25, Math.min(475, targetY));

      this.vertices[this.draggingVertex] = { x, y };
      this.render();

      if (e.cancelable) e.preventDefault();
    };

    const stopDrag = () => {
      if (this.draggingVertex) {
        this.draggingVertex = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);

    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchcancel', stopDrag);
  }

  // スクリーン座標 -> SVG viewBox内部座標への高精度変換
  getSvgPoint(e) {
    const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;

    // sim-root-layer を介して CTM を取得することで、viewBox やレターボックス余白も完全に補正
    const targetLayer = this.rootLayer || this.svg;
    const ctm = targetLayer.getScreenCTM();

    if (ctm) {
      const p = this.svg.createSVGPoint();
      p.x = clientX;
      p.y = clientY;
      const transformed = p.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    }

    // フォールバック計算
    const rect = this.svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / (rect.width || 850)) * 850,
      y: ((clientY - rect.top) / (rect.height || 500)) * 500
    };
  }

  applyPreset(preset) {
    switch (preset) {
      case 'acute': // 鋭角三角形（外接円が綺麗に収まるサイズ）
        this.vertices = {
          A: { x: 425, y: 45 },
          B: { x: 245, y: 395 },
          C: { x: 605, y: 395 }
        };
        break;
      case 'right': // 直角三角形（∠B = 90°、外接円が斜辺中点Oを中心に美しく収まる）
        this.vertices = {
          A: { x: 255, y: 80 },
          B: { x: 255, y: 410 },
          C: { x: 525, y: 410 }
        };
        break;
      case 'obtuse': // 鈍角三角形（外心Oが外部に出て外接円も収まる）
        this.vertices = {
          A: { x: 400, y: 190 },
          B: { x: 290, y: 280 },
          C: { x: 560, y: 280 }
        };
        break;
      case 'equilateral': // 正三角形（外接円半径約205px、完全フィット）
        this.vertices = {
          A: { x: 425, y: 45 },
          B: { x: 247, y: 353 },
          C: { x: 603, y: 353 }
        };
        break;
    }
    this.render();
  }

  render() {
    const { A, B, C } = this.vertices;

    // 辺の長さ
    const a = Math.hypot(C.x - B.x, C.y - B.y); // BC
    const b = Math.hypot(A.x - C.x, A.y - C.y); // CA
    const c = Math.hypot(B.x - A.x, B.y - A.y); // AB

    // 三角形ポリゴンの更新
    this.polyTriangle.setAttribute('points', `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`);

    // 各レイヤーをクリア
    this.layerGuides.innerHTML = '';
    this.layerCircles.innerHTML = '';
    this.layerEuler.innerHTML = '';
    this.layerCenters.innerHTML = '';
    if (this.layerIncenterDemo) this.layerIncenterDemo.innerHTML = '';

    // ハンドルの位置を更新
    this.updateHandlesPosition();

    // 面積 (外積)
    const areaSigned = ((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
    const area = Math.abs(areaSigned);
    if (area < 0.5) return; // 1直線上のときはスキップ

    // 1. 重心 (G)
    const G = {
      x: (A.x + B.x + C.x) / 3,
      y: (A.y + B.y + C.y) / 3
    };

    if (this.options.centroid) {
      const D = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
      const E = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
      const F = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

      this.layerGuides.innerHTML += `
        <line x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}" class="sim-guide-centroid" />
        <line x1="${B.x}" y1="${B.y}" x2="${E.x}" y2="${E.y}" class="sim-guide-centroid" />
        <line x1="${C.x}" y1="${C.y}" x2="${F.x}" y2="${F.y}" class="sim-guide-centroid" />
        <circle cx="${D.x}" cy="${D.y}" r="3" fill="#f97316" />
        <circle cx="${E.x}" cy="${E.y}" r="3" fill="#f97316" />
        <circle cx="${F.x}" cy="${F.y}" r="3" fill="#f97316" />
      `;
      this.addCenterPoint(G.x, G.y, '重心 G', '#ea580c');
    }

    // 2. 内心 (I)
    const p = a + b + c;
    const I = {
      x: (a * A.x + b * B.x + c * C.x) / p,
      y: (a * A.y + b * B.y + c * C.y) / p
    };
    const rIncenter = area / (p / 2);

    // 内接円の半径の求め方（3分割と公式）を表示するか判定
    const showFormula = this.options.incenter && this.options.incenterDemo;

    if (this.options.incenter) {
      // 3辺への垂線の足（内接円の接点）
      const footBC = this.getPerpendicularFoot(I, B, C);
      const footCA = this.getPerpendicularFoot(I, C, A);
      const footAB = this.getPerpendicularFoot(I, A, B);

      // 半径の求め方ON時：3つの分割三角形（IBC, ICA, IAB）の色分けハイライトと底辺ラベル
      if (showFormula && this.layerIncenterDemo) {
        this.layerIncenterDemo.innerHTML = `
          <!-- △IBC (底辺 a, 高さ r) -->
          <polygon points="${I.x},${I.y} ${B.x},${B.y} ${C.x},${C.y}" class="sim-tri-ibc" />
          <!-- △ICA (底辺 b, 高さ r) -->
          <polygon points="${I.x},${I.y} ${C.x},${C.y} ${A.x},${A.y}" class="sim-tri-ica" />
          <!-- △IAB (底辺 c, 高さ r) -->
          <polygon points="${I.x},${I.y} ${A.x},${A.y} ${B.x},${B.y}" class="sim-tri-iab" />
        `;

        // 3辺の中点
        const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
        const midCA = { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 };
        const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

        const normBC = this.getOutwardNormal(midBC, I, 16);
        const normCA = this.getOutwardNormal(midCA, I, 16);
        const normAB = this.getOutwardNormal(midAB, I, 16);

        this.layerGuides.innerHTML += `
          <!-- 3辺の底辺ラベル a, b, c -->
          <text x="${normBC.x}" y="${normBC.y + 4}" class="sim-side-label sim-label-a">底辺 a</text>
          <text x="${normCA.x}" y="${normCA.y + 4}" class="sim-side-label sim-label-b">底辺 b</text>
          <text x="${normAB.x}" y="${normAB.y + 4}" class="sim-side-label sim-label-c">底辺 c</text>
        `;
      }

      // 角の二等分線（内心と3頂点を結ぶ線）
      this.layerGuides.innerHTML += `
        <line x1="${A.x}" y1="${A.y}" x2="${I.x}" y2="${I.y}" class="sim-guide-incenter ${showFormula ? 'sim-split-line' : ''}" />
        <line x1="${B.x}" y1="${B.y}" x2="${I.x}" y2="${I.y}" class="sim-guide-incenter ${showFormula ? 'sim-split-line' : ''}" />
        <line x1="${C.x}" y1="${C.y}" x2="${I.x}" y2="${I.y}" class="sim-guide-incenter ${showFormula ? 'sim-split-line' : ''}" />
      `;

      // 半径線（3辺への垂線）の中点
      const midBC_r = { x: (I.x + footBC.x) / 2, y: (I.y + footBC.y) / 2 };
      const midCA_r = { x: (I.x + footCA.x) / 2, y: (I.y + footCA.y) / 2 };
      const midAB_r = { x: (I.x + footAB.x) / 2, y: (I.y + footAB.y) / 2 };

      // 内接円の半径を表す線・接点・直角記号・ラベル
      this.layerGuides.innerHTML += `
        <!-- 内接円の半径を表す線 -->
        <line x1="${I.x}" y1="${I.y}" x2="${footBC.x}" y2="${footBC.y}" class="sim-radius-incenter sim-radius-main" />
        <line x1="${I.x}" y1="${I.y}" x2="${footCA.x}" y2="${footCA.y}" class="sim-radius-incenter ${showFormula ? 'sim-radius-main' : ''}" />
        <line x1="${I.x}" y1="${I.y}" x2="${footAB.x}" y2="${footAB.y}" class="sim-radius-incenter ${showFormula ? 'sim-radius-main' : ''}" />

        <!-- 接点マーク -->
        <circle cx="${footBC.x}" cy="${footBC.y}" r="3.5" class="sim-radius-foot" />
        <circle cx="${footCA.x}" cy="${footCA.y}" r="3" class="sim-radius-foot" />
        <circle cx="${footAB.x}" cy="${footAB.y}" r="3" class="sim-radius-foot" />

        <!-- 直角マーク -->
        <path d="${this.getRightAnglePath(footBC, I, C, 7)}" class="sim-right-angle" />
        ${showFormula ? `<path d="${this.getRightAnglePath(footCA, I, A, 7)}" class="sim-right-angle" />` : ''}
        ${showFormula ? `<path d="${this.getRightAnglePath(footAB, I, B, 7)}" class="sim-right-angle" />` : ''}

        <!-- 半径 r のラベル -->
        <text x="${midBC_r.x + 8}" y="${midBC_r.y + 4}" class="sim-radius-label">高さ r</text>
        ${showFormula ? `<text x="${midCA_r.x + 8}" y="${midCA_r.y + 4}" class="sim-radius-label">高さ r</text>` : ''}
        ${showFormula ? `<text x="${midAB_r.x + 8}" y="${midAB_r.y + 4}" class="sim-radius-label">高さ r</text>` : ''}
      `;

      // 内接円
      this.layerCircles.innerHTML += `
        <circle cx="${I.x}" cy="${I.y}" r="${rIncenter}" class="sim-circle-incenter" />
      `;
      this.addCenterPoint(I.x, I.y, '内心 I', '#2563eb');
    }

    // 3. 外心 (O)
    const dO = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    let O = { x: 425, y: 250 };
    let RCircum = 120;
    if (Math.abs(dO) > 1e-4) {
      O.x = ((A.x * A.x + A.y * A.y) * (B.y - C.y) + (B.x * B.x + B.y * B.y) * (C.y - A.y) + (C.x * C.x + C.y * C.y) * (A.y - B.y)) / dO;
      O.y = ((A.x * A.x + A.y * A.y) * (C.x - B.x) + (B.x * B.x + B.y * B.y) * (A.x - C.x) + (C.x * C.x + C.y * C.y) * (B.x - A.x)) / dO;
      RCircum = Math.hypot(A.x - O.x, A.y - O.y);
    }

    if (this.options.circumcenter) {
      const D = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
      const E = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
      const F = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

      this.layerGuides.innerHTML += `
        <line x1="${D.x}" y1="${D.y}" x2="${O.x}" y2="${O.y}" class="sim-guide-circumcenter" />
        <line x1="${E.x}" y1="${E.y}" x2="${O.x}" y2="${O.y}" class="sim-guide-circumcenter" />
        <line x1="${F.x}" y1="${F.y}" x2="${O.x}" y2="${O.y}" class="sim-guide-circumcenter" />
      `;
      if (RCircum < 1200) {
        this.layerCircles.innerHTML += `
          <circle cx="${O.x}" cy="${O.y}" r="${RCircum}" class="sim-circle-circumcenter" />
        `;
      }
      this.addCenterPoint(O.x, O.y, '外心 O', '#059669');
    }

    // 4. 垂心 (H)
    const H = {
      x: 3 * G.x - 2 * O.x,
      y: 3 * G.y - 2 * O.y
    };

    if (this.options.orthocenter) {
      // 3頂点から対辺（直線BC, CA, AB）に下ろした垂線の足
      const footA = this.getPerpendicularFoot(A, B, C);
      const footB = this.getPerpendicularFoot(B, C, A);
      const footC = this.getPerpendicularFoot(C, A, B);

      // 対辺の延長線（鈍角三角形などで足が辺の外側にある場合）
      const extA = this.getSideExtension(B, C, footA);
      const extB = this.getSideExtension(C, A, footB);
      const extC = this.getSideExtension(A, B, footC);

      // 各頂点・垂線の足・垂心を貫く3本の垂線
      const altA = this.drawAltitudeLine(A, footA, H);
      const altB = this.drawAltitudeLine(B, footB, H);
      const altC = this.drawAltitudeLine(C, footC, H);

      this.layerGuides.innerHTML += `
        <!-- 対辺の延長線（鈍角時） -->
        ${extA}
        ${extB}
        ${extC}

        <!-- 3本の垂線（各頂点から対辺へ下ろした垂線） -->
        ${altA}
        ${altB}
        ${altC}

        <!-- 垂線の足における直角マーク -->
        <path d="${this.getRightAnglePath(footA, A, C, 8)}" class="sim-right-angle-ortho" />
        <path d="${this.getRightAnglePath(footB, B, A, 8)}" class="sim-right-angle-ortho" />
        <path d="${this.getRightAnglePath(footC, C, B, 8)}" class="sim-right-angle-ortho" />

        <!-- 垂線の足マーク -->
        <circle cx="${footA.x}" cy="${footA.y}" r="3" class="sim-ortho-foot" />
        <circle cx="${footB.x}" cy="${footB.y}" r="3" class="sim-ortho-foot" />
        <circle cx="${footC.x}" cy="${footC.y}" r="3" class="sim-ortho-foot" />
      `;

      this.addCenterPoint(H.x, H.y, '垂心 H', '#9333ea');
    }

    // 5. 傍心 (I_A)
    const denomA = -a + b + c;
    if (Math.abs(denomA) > 1e-3) {
      const ExA = (-a * A.x + b * B.x + c * C.x) / denomA;
      const EyA = (-a * A.y + b * B.y + c * C.y) / denomA;
      const rExA = area / (denomA / 2);

      if (this.options.excenter && rExA > 0 && rExA < 500) {
        this.layerCircles.innerHTML += `
          <circle cx="${ExA}" cy="${EyA}" r="${rExA}" class="sim-circle-excenter" />
        `;
        this.addCenterPoint(ExA, EyA, '傍心 I_A', '#ca8a04');
      }
    }

    // 6. オイラー線 (O - G - H)
    if (this.options.euler) {
      const dx = H.x - O.x;
      const dy = H.y - O.y;
      const len = Math.hypot(dx, dy);
      if (len > 2) {
        const ext1 = { x: O.x - (dx / len) * 70, y: O.y - (dy / len) * 70 };
        const ext2 = { x: H.x + (dx / len) * 70, y: H.y + (dy / len) * 70 };
        this.layerEuler.innerHTML = `
          <line x1="${ext1.x}" y1="${ext1.y}" x2="${ext2.x}" y2="${ext2.y}" class="sim-euler-line" />
        `;
      }
    }

    // 形状分析と情報表示
    this.updateAnalysis(a, b, c, O, G, H, I, rIncenter, area, p, showFormula);
  }

  updateHandlesPosition() {
    ['A', 'B', 'C'].forEach(key => {
      const pt = this.vertices[key];
      const handle = this.handleElements[key];
      if (handle) {
        handle.hit.setAttribute('cx', pt.x);
        handle.hit.setAttribute('cy', pt.y);
        handle.circle.setAttribute('cx', pt.x);
        handle.circle.setAttribute('cy', pt.y);
        handle.text.setAttribute('x', pt.x);
        handle.text.setAttribute('y', pt.y - 13);
      }
    });
  }

  addCenterPoint(x, y, label, color) {
    this.layerCenters.innerHTML += `
      <circle cx="${x}" cy="${y}" r="6" fill="${color}" stroke="#ffffff" stroke-width="2" class="sim-center-dot" />
      <text x="${x + 8}" y="${y - 8}" fill="${color}" class="sim-center-text">${label}</text>
    `;
  }

  updateAnalysis(a, b, c, O, G, H, I, rIncenter, area, p, showFormula) {
    const radToDeg = rad => Math.round(rad * (180 / Math.PI));
    const clampCos = val => Math.max(-1, Math.min(1, val));

    const degA = radToDeg(Math.acos(clampCos((b * b + c * c - a * a) / (2 * b * c))));
    const degB = radToDeg(Math.acos(clampCos((a * a + c * c - b * b) / (2 * a * c))));
    const degC = 180 - degA - degB;

    this.angleA.textContent = `${degA}°`;
    this.angleB.textContent = `${degB}°`;
    this.angleC.textContent = `${degC}°`;

    const maxAngle = Math.max(degA, degB, degC);
    let typeText = '';
    let badgeClass = 'sim-type-badge';
    let commentary = '';

    // 図の下の大きな公式バーの制御
    if (this.formulaBar) {
      if (showFormula) {
        this.formulaBar.classList.remove('hidden');
        if (this.barP) this.barP.textContent = Math.round(p);
        if (this.barS) this.barS.textContent = Math.round(area);
        if (this.barR) this.barR.textContent = rIncenter.toFixed(1);
      } else {
        this.formulaBar.classList.add('hidden');
      }
    }

    if (Math.abs(maxAngle - 90) <= 2) {
      typeText = '直角三角形';
      badgeClass += ' badge-right';
      commentary = '外心Oは斜辺の中点に、垂心Hは直角の頂点に一致します。';
    } else if (maxAngle > 90) {
      typeText = '鈍角三角形';
      badgeClass += ' badge-obtuse';
      commentary = '外心Oと垂心Hが外部に飛び出します。内心Iと重心Gは常に内部です。';
    } else {
      if (Math.abs(degA - 60) <= 3 && Math.abs(degB - 60) <= 3) {
        typeText = '正三角形';
        badgeClass += ' badge-equilateral';
        commentary = '重心G・内心I・外心O・垂心Hがすべて同じ1点に一致します。';
      } else {
        typeText = '鋭角三角形';
        badgeClass += ' badge-acute';
        commentary = '重心・内心・外心・垂心はすべて内部に収まります。';
      }
    }

    if (showFormula) {
      badgeClass += ' badge-formula-on';
    }

    this.typeBadge.textContent = showFormula ? `${typeText}・公式` : typeText;
    this.typeBadge.className = badgeClass;
    this.commentary.textContent = commentary;
  }

  // 中点から内心とは逆方向（外側）へ dist だけ離れた座標を返す
  getOutwardNormal(midPt, incenterPt, dist = 16) {
    const dx = midPt.x - incenterPt.x;
    const dy = midPt.y - incenterPt.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-4) return { x: midPt.x, y: midPt.y };
    return {
      x: midPt.x + (dx / len) * dist,
      y: midPt.y + (dy / len) * dist
    };
  }

  // 点Pから線分P1-P2への垂線の足
  getPerpendicularFoot(P, P1, P2) {
    const dx = P2.x - P1.x;
    const dy = P2.y - P1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) return { x: P1.x, y: P1.y };
    const t = ((P.x - P1.x) * dx + (P.y - P1.y) * dy) / lenSq;
    return {
      x: P1.x + t * dx,
      y: P1.y + t * dy
    };
  }

  // 垂線の足における直角記号パス (SVG d属性)
  getRightAnglePath(P, fromPt, toPt, size = 7) {
    const v1 = { x: fromPt.x - P.x, y: fromPt.y - P.y };
    const len1 = Math.hypot(v1.x, v1.y) || 1;
    const u1 = { x: (v1.x / len1) * size, y: (v1.y / len1) * size };

    const v2 = { x: toPt.x - P.x, y: toPt.y - P.y };
    const len2 = Math.hypot(v2.x, v2.y) || 1;
    const u2 = { x: (v2.x / len2) * size, y: (v2.y / len2) * size };

    const p1 = { x: P.x + u1.x, y: P.y + u1.y };
    const p2 = { x: P.x + u1.x + u2.x, y: P.y + u1.y + u2.y };
    const p3 = { x: P.x + u2.x, y: P.y + u2.y };

    return `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y}`;
  }

  // 頂点V、垂線の足F、垂心Hを貫く一本の垂線を描画
  drawAltitudeLine(V, F, H) {
    const pts = [V, F, H];
    const dx = F.x - V.x;
    const dy = F.y - V.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return '';
    const ux = dx / len;
    const uy = dy / len;

    // 3点の直線上のスカラー位置
    const ts = pts.map(p => (p.x - V.x) * ux + (p.y - V.y) * uy);
    const minT = Math.min(...ts) - 8;
    const maxT = Math.max(...ts) + 8;

    const start = { x: V.x + ux * minT, y: V.y + uy * minT };
    const end = { x: V.x + ux * maxT, y: V.y + uy * maxT };

    return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" class="sim-guide-orthocenter" />`;
  }

  // 垂線の足が辺の外側にあるときの辺の延長線
  getSideExtension(P1, P2, F) {
    const dx = P2.x - P1.x;
    const dy = P2.y - P1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) return '';
    const t = ((F.x - P1.x) * dx + (F.y - P1.y) * dy) / lenSq;

    if (t < -0.01) {
      // P1の外側
      return `<line x1="${P1.x}" y1="${P1.y}" x2="${F.x}" y2="${F.y}" class="sim-side-extension" />`;
    } else if (t > 1.01) {
      // P2の外側
      return `<line x1="${P2.x}" y1="${P2.y}" x2="${F.x}" y2="${F.y}" class="sim-side-extension" />`;
    }
    return '';
  }
}

window.TriangleSimulator = TriangleSimulator;
