// 三角形の五心 4択クイズ アプリケーションロジック

// SVG生成ユーティリティ
const SVG_GENERATOR = {
  // 基準三角形の頂点座標
  triangle: {
    A: { x: 150, y: 35 },
    B: { x: 45, y: 225 },
    C: { x: 255, y: 225 }
  },

  generate(type) {
    const { A, B, C } = this.triangle;
    let extraSvg = '';
    let centerPoint = { x: 0, y: 0, label: '', color: '' };

    switch (type) {
      case 'centroid': {
        // 重心: 中線
        const D = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }; // BCの中点
        const E = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 }; // ACの中点
        const F = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }; // ABの中点
        const G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };

        extraSvg = `
          <!-- 中線 -->
          <line x1="${A.x}" y1="${A.y}" x2="${D.x}" y2="${D.y}" class="svg-line-guide" />
          <line x1="${B.x}" y1="${B.y}" x2="${E.x}" y2="${E.y}" class="svg-line-guide" />
          <line x1="${C.x}" y1="${C.y}" x2="${F.x}" y2="${F.y}" class="svg-line-guide" />
          <!-- 中点マーク -->
          <circle cx="${D.x}" cy="${D.y}" r="3" class="svg-sub-point" />
          <circle cx="${E.x}" cy="${E.y}" r="3" class="svg-sub-point" />
          <circle cx="${F.x}" cy="${F.y}" r="3" class="svg-sub-point" />
          <text x="${D.x}" y="${D.y + 15}" class="svg-sub-text">中点</text>
          <!-- 2:1 ラベル -->
          <text x="${(A.x + G.x) / 2 + 10}" y="${(A.y + G.y) / 2}" class="svg-ratio-text">2</text>
          <text x="${(D.x + G.x) / 2 + 10}" y="${(D.y + G.y) / 2}" class="svg-ratio-text">1</text>
        `;
        centerPoint = { x: G.x, y: G.y, label: '重心 G', color: '#ff6b6b' };
        break;
      }

      case 'incenter': {
        // 内心: 内接円と角の二等分線
        // a=|BC|=210, b=|CA|~=216.4, c=|AB|~=216.4 (二等辺に近い)
        const a = Math.hypot(C.x - B.x, C.y - B.y);
        const b = Math.hypot(A.x - C.x, A.y - C.y);
        const c = Math.hypot(A.x - B.x, A.y - B.y);
        const p = a + b + c;
        const Ix = (a * A.x + b * B.x + c * C.x) / p;
        const Iy = (a * A.y + b * B.y + c * C.y) / p;
        // 半径 r = 面積 / s
        const s = p / 2;
        const area = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
        const r = area / s;

        extraSvg = `
          <!-- 角の二等分線 -->
          <line x1="${A.x}" y1="${A.y}" x2="${Ix}" y2="${Iy}" class="svg-line-guide" />
          <line x1="${B.x}" y1="${B.y}" x2="${Ix}" y2="${Iy}" class="svg-line-guide" />
          <line x1="${C.x}" y1="${C.y}" x2="${Ix}" y2="${Iy}" class="svg-line-guide" />
          <!-- 内接円 -->
          <circle cx="${Ix}" cy="${Iy}" r="${r}" class="svg-circle incenter-circle" />
          <!-- 辺への垂線 (半径r) -->
          <line x1="${Ix}" y1="${Iy}" x2="${Ix}" y2="${B.y}" stroke="#4dabf7" stroke-dasharray="3,3" />
          <text x="${Ix + 6}" y="${Iy + r / 2}" class="svg-sub-text">半径r</text>
        `;
        centerPoint = { x: Ix, y: Iy, label: '内心 I', color: '#4dabf7' };
        break;
      }

      case 'circumcenter': {
        // 外心: 3辺の垂直二等分線と外接円
        // A(150, 35), B(45, 225), C(255, 225)
        // 外心座標
        const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
        const Ox = ((A.x * A.x + A.y * A.y) * (B.y - C.y) + (B.x * B.x + B.y * B.y) * (C.y - A.y) + (C.x * C.x + C.y * C.y) * (A.y - B.y)) / d;
        const Oy = ((A.x * A.x + A.y * A.y) * (C.x - B.x) + (B.x * B.x + B.y * B.y) * (A.x - C.x) + (C.x * C.x + C.y * C.y) * (B.x - A.x)) / d;
        const R = Math.hypot(A.x - Ox, A.y - Oy);

        const D = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
        const E = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };

        extraSvg = `
          <!-- 外接円 -->
          <circle cx="${Ox}" cy="${Oy}" r="${R}" class="svg-circle circumcenter-circle" />
          <!-- 垂直二等分線 -->
          <line x1="${D.x}" y1="235" x2="${D.x}" y2="${Oy - 15}" class="svg-line-guide" />
          <line x1="${E.x - 40}" y1="${E.y - 30}" x2="${Ox}" y2="${Oy}" class="svg-line-guide" />
          <!-- 頂点への距離（半径R） -->
          <line x1="${Ox}" y1="${Oy}" x2="${A.x}" y2="${A.y}" stroke="#38d9a9" stroke-dasharray="3,3" />
          <line x1="${Ox}" y1="${Oy}" x2="${B.x}" y2="${B.y}" stroke="#38d9a9" stroke-dasharray="3,3" />
          <line x1="${Ox}" y1="${Oy}" x2="${C.x}" y2="${C.y}" stroke="#38d9a9" stroke-dasharray="3,3" />
        `;
        centerPoint = { x: Ox, y: Oy, label: '外心 O', color: '#38d9a9' };
        break;
      }

      case 'orthocenter': {
        // 垂心: 各頂点からの垂線
        // B(45, 225), C(255, 225) -> BCは水平線 y=225。Aからの垂線は x=150
        // ACの傾き: (225 - 35)/(255 - 150) = 190/105 = 38/21
        // Bからの垂線の傾き: -21/38
        // y - 225 = -21/38 * (x - 45)
        // x = 150 を代入: y = 225 - 21/38 * 105 = 225 - 58 = 167
        const Hx = 150;
        const Hy = 225 - (21 / 38) * (150 - 45);

        // Aから対辺BCへの足
        const Ha = { x: 150, y: 225 };
        // Bから対辺ACへの足 (概算)
        const Hb = { x: 195, y: 115 };
        // Cから対辺ABへの足
        const Hc = { x: 105, y: 115 };

        extraSvg = `
          <!-- 垂線 -->
          <line x1="${A.x}" y1="${A.y}" x2="${Ha.x}" y2="${Ha.y}" class="svg-line-guide" />
          <line x1="${B.x}" y1="${B.y}" x2="${Hb.x}" y2="${Hb.y}" class="svg-line-guide" />
          <line x1="${C.x}" y1="${C.y}" x2="${Hc.x}" y2="${Hc.y}" class="svg-line-guide" />
          <!-- 直角マーク -->
          <path d="M 140,225 L 140,215 L 150,215" fill="none" stroke="#fa5252" stroke-width="1.5" />
        `;
        centerPoint = { x: Hx, y: Hy, label: '垂心 H', color: '#f783ac' };
        break;
      }

      case 'excenter': {
        // 傍心: 辺の延長と傍接円
        const Ex = 150;
        const Ey = 300;
        const rEx = 75;

        extraSvg = `
          <!-- 辺の延長線 -->
          <line x1="${A.x}" y1="${A.y}" x2="${B.x - 40}" y2="${225 + 72}" stroke="#adb5bd" stroke-dasharray="3,3" />
          <line x1="${A.x}" y1="${A.y}" x2="${C.x + 40}" y2="${225 + 72}" stroke="#adb5bd" stroke-dasharray="3,3" />
          <!-- 傍接円 -->
          <circle cx="${Ex}" cy="${Ey}" r="${rEx}" class="svg-circle excenter-circle" />
          <!-- 外角二等分線 -->
          <line x1="${B.x}" y1="${B.y}" x2="${Ex}" y2="${Ey}" class="svg-line-guide" />
          <line x1="${C.x}" y1="${C.y}" x2="${Ex}" y2="${Ey}" class="svg-line-guide" />
          <line x1="${A.x}" y1="${A.y}" x2="${Ex}" y2="${Ey}" class="svg-line-guide" />
          <text x="${Ex + 80}" y="${Ey}" class="svg-sub-text">傍接円</text>
        `;
        centerPoint = { x: Ex, y: Ey, label: '傍心 I_A', color: '#be4bdb' };
        break;
      }
    }

    const viewBox = type === 'excenter' ? '0 0 300 390' : '0 0 300 270';
    const height = type === 'excenter' ? 240 : 200;

    return `
      <svg viewBox="${viewBox}" style="max-height: ${height}px; width: 100%;" class="geometry-svg">
        <!-- 背景グリッド（薄め） -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f3f5" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" rx="8" />

        ${extraSvg}

        <!-- 三角形 ABC -->
        <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}" class="svg-triangle" />

        <!-- 頂点ラベル -->
        <circle cx="${A.x}" cy="${A.y}" r="4" class="svg-vertex" />
        <circle cx="${B.x}" cy="${B.y}" r="4" class="svg-vertex" />
        <circle cx="${C.x}" cy="${C.y}" r="4" class="svg-vertex" />
        <text x="${A.x - 4}" y="${A.y - 10}" class="svg-vertex-label">A</text>
        <text x="${B.x - 18}" y="${B.y + 5}" class="svg-vertex-label">B</text>
        <text x="${C.x + 8}" y="${C.y + 5}" class="svg-vertex-label">C</text>

        <!-- 中心点とラベル -->
        <circle cx="${centerPoint.x}" cy="${centerPoint.y}" r="6" fill="${centerPoint.color}" stroke="#fff" stroke-width="2" class="svg-center-point" />
        <text x="${centerPoint.x + 8}" y="${centerPoint.y - 8}" class="svg-center-label" fill="${centerPoint.color}">${centerPoint.label}</text>
      </svg>
    `;
  }
};

// Web Audio API による効果音マネージャー
class SoundManager {
  constructor() {
    this.ctx = null;
    const saved = localStorage.getItem('triangle_app_sound');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 明るく軽快なピンポン・チャイム (C5 -> E5 -> G5)
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.22 }, // C5
        { freq: 659.25, time: 0.08, dur: 0.25 }, // E5
        { freq: 783.99, time: 0.16, dur: 0.42 }  // G5
      ];

      notes.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0.001, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.2, now + note.time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  playWrong() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 低めの「ブブー」音（2パルス）
      const pulses = [
        { freq: 155, time: 0.0, dur: 0.13 },
        { freq: 135, time: 0.16, dur: 0.24 }
      ];

      pulses.forEach(p => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(p.freq, now + p.time);

        gain.gain.setValueAtTime(0.16, now + p.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.time + p.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + p.time);
        osc.stop(now + p.time + p.dur);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

// クイズアプリ本体
class TriangleQuizApp {
  constructor() {
    this.sound = new SoundManager();
    this.includeOrthocenter = false; // 垂心を含むか
    this.includeExcenter = false;     // 傍心を含むか
    this.currentQuestions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.answersHistory = []; // 回答履歴
    this.isAnswered = false;

    // 連続正解管理 & 自動遷移タイマー
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.autoNextTimer = null;

    this.initDOM();
    this.initTheme();
    this.initSound();
    this.bindEvents();
    this.renderEncyclopedia();
  }

  initSound() {
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.soundIcon = document.getElementById('sound-icon');
    this.soundText = document.getElementById('sound-text');

    this.updateSoundButtonUI();

    if (this.btnSoundToggle) {
      this.btnSoundToggle.addEventListener('click', () => {
        this.sound.enabled = !this.sound.enabled;
        localStorage.setItem('triangle_app_sound', this.sound.enabled);
        this.updateSoundButtonUI();
        if (this.sound.enabled) {
          this.sound.playCorrect();
        }
      });
    }
  }

  updateSoundButtonUI() {
    if (this.soundIcon && this.soundText) {
      if (this.sound.enabled) {
        this.soundIcon.textContent = '🔊';
        this.soundText.textContent = '音 ON';
        if (this.btnSoundToggle) this.btnSoundToggle.classList.remove('muted');
      } else {
        this.soundIcon.textContent = '🔇';
        this.soundText.textContent = '音 OFF';
        if (this.btnSoundToggle) this.btnSoundToggle.classList.add('muted');
      }
    }
  }

  initTheme() {
    this.btnThemeToggle = document.getElementById('btn-theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    this.themeText = document.getElementById('theme-text');

    const savedTheme = localStorage.getItem('triangle_app_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    this.setTheme(initialTheme);

    if (this.btnThemeToggle) {
      this.btnThemeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(nextTheme);
      });
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('triangle_app_theme', theme);

    if (this.themeIcon && this.themeText) {
      if (theme === 'dark') {
        this.themeIcon.textContent = '☀️';
        this.themeText.textContent = 'ライト';
      } else {
        this.themeIcon.textContent = '🌙';
        this.themeText.textContent = 'ダーク';
      }
    }

    if (this.simulator) {
      this.simulator.render();
    }
  }

  initDOM() {
    // ボタンやコンテナの参照
    this.btnOrthocenter = document.getElementById('toggle-orthocenter');
    this.btnExcenter = document.getElementById('toggle-excenter');
    this.badgeOrthocenter = document.getElementById('badge-orthocenter');
    this.badgeExcenter = document.getElementById('badge-excenter');

    this.viewStart = document.getElementById('view-start');
    this.viewQuiz = document.getElementById('view-quiz');
    this.viewResult = document.getElementById('view-result');
    this.viewEncyclopedia = document.getElementById('view-encyclopedia');

    this.btnStart = document.getElementById('btn-start');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnNext = document.getElementById('btn-next');
    this.tabQuiz = document.getElementById('tab-quiz');
    this.tabHistory = document.getElementById('tab-history');
    this.tabSimulator = document.getElementById('tab-simulator');
    this.tabTheorems = document.getElementById('tab-theorems');
    this.tabEncyclopedia = document.getElementById('tab-encyclopedia');
    this.viewHistory = document.getElementById('view-history');
    this.viewSimulator = document.getElementById('view-simulator');
    this.viewTheorems = document.getElementById('view-theorems');

    // シミュレーター初期化
    if (window.TriangleSimulator) {
      this.simulator = new TriangleSimulator();
    }
    if (window.TheoremsSimulator) {
      this.theoremsSimulator = new TheoremsSimulator();
    }

    // クイズ要素
    this.qIndexEl = document.getElementById('q-current-index');
    this.qTotalEl = document.getElementById('q-total');
    this.progressBar = document.getElementById('quiz-progress-bar');
    this.scopeBadge = document.getElementById('scope-badge');
    this.qCategoryEl = document.getElementById('q-category');
    this.qTitleEl = document.getElementById('q-title');
    this.qTextEl = document.getElementById('q-text');
    this.optionsContainer = document.getElementById('options-container');

    // 解説要素
    this.feedbackCard = document.getElementById('feedback-card');
    this.feedbackPlaceholder = document.getElementById('feedback-placeholder');
    this.feedbackIcon = document.getElementById('feedback-icon');
    this.feedbackTitle = document.getElementById('feedback-title');
    this.feedbackCorrectAnswer = document.getElementById('feedback-correct-answer');
    this.feedbackCorrectText = document.getElementById('feedback-correct-text');
    this.feedbackExp = document.getElementById('feedback-explanation');
    this.feedbackTip = document.getElementById('feedback-tip');
    this.svgContainer = document.getElementById('quiz-svg-container');

    // 結果要素
    this.resultScoreEl = document.getElementById('result-score');
    this.resultTotalEl = document.getElementById('result-total');
    this.resultPercentEl = document.getElementById('result-percentage');
    this.resultMessageEl = document.getElementById('result-message');
    this.resultReviewList = document.getElementById('result-review-list');

    // 連続正解＆自動遷移要素
    this.streakCountEl = document.getElementById('streak-count');
    this.streakBadgeEl = document.getElementById('quiz-streak-badge');
    this.autoNextIndicator = document.getElementById('auto-next-indicator');
    this.resultMaxStreakEl = document.getElementById('result-max-streak');

    // 出題数選択要素
    this.questionCount = '10';
    this.btnCountList = document.querySelectorAll('.btn-quiz-count');

    // 挑戦履歴（タブ画面 ＆ モーダル）要素
    this.btnOpenHistory = document.getElementById('btn-open-history');
    this.btnQuizHistory = document.getElementById('btn-quiz-history');
    this.btnResultHistory = document.getElementById('btn-result-history');
    this.btnCloseHistory = document.getElementById('btn-close-history');
    this.btnClearHistory = document.getElementById('btn-clear-history');
    this.btnViewClearHistory = document.getElementById('btn-view-clear-history');
    this.modalHistory = document.getElementById('modal-history');
    this.historyCountBadge = document.getElementById('history-count-badge');
    this.historyListContainer = document.getElementById('history-list-container');
    this.statTotalPlays = document.getElementById('stat-total-plays');
    this.statAvgAccuracy = document.getElementById('stat-avg-accuracy');
    this.statBestStreak = document.getElementById('stat-best-streak');
    this.quizAnswerTracker = document.getElementById('quiz-answer-tracker');

    // 挑戦履歴タブ画面用要素
    this.historyViewList = document.getElementById('history-view-list');
    this.statViewTotalPlays = document.getElementById('stat-view-total-plays');
    this.statViewAvgAccuracy = document.getElementById('stat-view-avg-accuracy');
    this.statViewBestStreak = document.getElementById('stat-view-best-streak');

    // 履歴件数バッジを初期化
    this.updateHistoryBadge();
  }

  updateStreakDisplay(isSuccess) {
    if (this.streakCountEl) {
      this.streakCountEl.textContent = this.currentStreak;
    }
    if (this.streakBadgeEl) {
      if (this.currentStreak > 0) {
        this.streakBadgeEl.classList.add('has-streak');
      } else {
        this.streakBadgeEl.classList.remove('has-streak');
      }

      if (isSuccess && this.currentStreak > 0) {
        this.streakBadgeEl.classList.remove('streak-pop');
        void this.streakBadgeEl.offsetWidth; // リフロー発生
        this.streakBadgeEl.classList.add('streak-pop');
      }
    }
  }

  bindEvents() {
    // 垂心トグルボタン
    this.btnOrthocenter.addEventListener('click', () => {
      this.includeOrthocenter = !this.includeOrthocenter;
      this.updateToggleButtons();
    });

    // 傍心トグルボタン
    this.btnExcenter.addEventListener('click', () => {
      this.includeExcenter = !this.includeExcenter;
      this.updateToggleButtons();
    });

    // 出題数選択ボタン
    this.btnCountList.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.btnCountList.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.questionCount = e.currentTarget.dataset.count;
      });
    });

    // クイズ開始
    this.btnStart.addEventListener('click', () => this.startQuiz());
    this.btnRestart.addEventListener('click', () => this.showStartView());
    this.btnNext.addEventListener('click', () => this.nextQuestion());

    // 挑戦履歴関連イベント（タブ画面へ直接遷移）
    if (this.btnOpenHistory) {
      this.btnOpenHistory.addEventListener('click', () => this.showHistoryView());
    }
    if (this.btnQuizHistory) {
      this.btnQuizHistory.addEventListener('click', () => this.showHistoryView());
    }
    if (this.btnResultHistory) {
      this.btnResultHistory.addEventListener('click', () => this.showHistoryView());
    }
    if (this.btnCloseHistory) {
      this.btnCloseHistory.addEventListener('click', () => this.closeHistoryModal());
    }
    if (this.btnClearHistory) {
      this.btnClearHistory.addEventListener('click', () => this.clearQuizHistory());
    }
    if (this.btnViewClearHistory) {
      this.btnViewClearHistory.addEventListener('click', () => this.clearQuizHistory());
    }
    if (this.modalHistory) {
      this.modalHistory.addEventListener('click', (e) => {
        if (e.target === this.modalHistory) this.closeHistoryModal();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modalHistory.classList.contains('hidden')) {
          this.closeHistoryModal();
        }
      });
    }

    // タブ切り替え
    this.tabQuiz.addEventListener('click', () => {
      this.setActiveTab(this.tabQuiz);
      this.viewHistory.classList.add('hidden');
      this.viewEncyclopedia.classList.add('hidden');
      this.viewSimulator.classList.add('hidden');
      this.viewTheorems.classList.add('hidden');
      if (this.currentQuestions.length > 0 && this.currentIndex < this.currentQuestions.length && !this.viewResult.classList.contains('active')) {
        this.viewQuiz.classList.remove('hidden');
      } else if (!this.viewResult.classList.contains('hidden')) {
        this.viewResult.classList.remove('hidden');
      } else {
        this.viewStart.classList.remove('hidden');
      }
    });

    if (this.tabHistory) {
      this.tabHistory.addEventListener('click', () => {
        this.showHistoryView();
      });
    }

    this.tabSimulator.addEventListener('click', () => {
      this.setActiveTab(this.tabSimulator);
      this.viewStart.classList.add('hidden');
      this.viewQuiz.classList.add('hidden');
      this.viewResult.classList.add('hidden');
      this.viewHistory.classList.add('hidden');
      this.viewEncyclopedia.classList.add('hidden');
      this.viewTheorems.classList.add('hidden');
      this.viewSimulator.classList.remove('hidden');
      if (this.simulator) {
        this.simulator.onActivate();
      }
    });

    this.tabTheorems.addEventListener('click', () => {
      this.setActiveTab(this.tabTheorems);
      this.viewStart.classList.add('hidden');
      this.viewQuiz.classList.add('hidden');
      this.viewResult.classList.add('hidden');
      this.viewHistory.classList.add('hidden');
      this.viewSimulator.classList.add('hidden');
      this.viewEncyclopedia.classList.add('hidden');
      this.viewTheorems.classList.remove('hidden');
      if (this.theoremsSimulator) {
        this.theoremsSimulator.onActivate();
      }
    });

    this.tabEncyclopedia.addEventListener('click', () => {
      this.setActiveTab(this.tabEncyclopedia);
      this.viewStart.classList.add('hidden');
      this.viewQuiz.classList.add('hidden');
      this.viewResult.classList.add('hidden');
      this.viewHistory.classList.add('hidden');
      this.viewSimulator.classList.add('hidden');
      this.viewTheorems.classList.add('hidden');
      this.viewEncyclopedia.classList.remove('hidden');
    });
  }

  setActiveTab(activeTabBtn) {
    [this.tabQuiz, this.tabHistory, this.tabSimulator, this.tabTheorems, this.tabEncyclopedia].forEach(tab => {
      if (tab) tab.classList.remove('active');
    });
    if (activeTabBtn) activeTabBtn.classList.add('active');

    if (activeTabBtn === this.tabSimulator || activeTabBtn === this.tabTheorems) {
      document.body.classList.add('mode-simulator');
    } else {
      document.body.classList.remove('mode-simulator');
    }
  }

  updateToggleButtons() {
    if (this.includeOrthocenter) {
      this.btnOrthocenter.classList.add('active');
      this.badgeOrthocenter.textContent = 'ON（出題する）';
      this.badgeOrthocenter.className = 'status-badge badge-on';
    } else {
      this.btnOrthocenter.classList.remove('active');
      this.badgeOrthocenter.textContent = 'OFF（高校範囲）';
      this.badgeOrthocenter.className = 'status-badge badge-off';
    }

    if (this.includeExcenter) {
      this.btnExcenter.classList.add('active');
      this.badgeExcenter.textContent = 'ON（出題する）';
      this.badgeExcenter.className = 'status-badge badge-on';
    } else {
      this.btnExcenter.classList.remove('active');
      this.badgeExcenter.textContent = 'OFF（高校範囲）';
      this.badgeExcenter.className = 'status-badge badge-off';
    }
  }

  showStartView() {
    this.viewResult.classList.add('hidden');
    this.viewQuiz.classList.add('hidden');
    this.viewEncyclopedia.classList.add('hidden');
    this.viewSimulator.classList.add('hidden');
    this.viewTheorems.classList.add('hidden');
    this.viewHistory.classList.add('hidden');
    this.viewStart.classList.remove('hidden');
    this.setActiveTab(this.tabQuiz);
    this.updateHistoryBadge();
  }

  showHistoryView() {
    this.setActiveTab(this.tabHistory);
    this.viewStart.classList.add('hidden');
    this.viewQuiz.classList.add('hidden');
    this.viewResult.classList.add('hidden');
    this.viewSimulator.classList.add('hidden');
    this.viewTheorems.classList.add('hidden');
    this.viewEncyclopedia.classList.add('hidden');
    if (this.modalHistory) this.modalHistory.classList.add('hidden');
    this.viewHistory.classList.remove('hidden');
    this.renderHistoryView();
  }

  // クイズ問題リストの構築（ランダム出題 ＆ 3回に1回は重心・内心・外心の定義）
  buildQuizQuestions(pool, countSetting) {
    const defQuestions = pool.filter(q => q.isDefinition);
    const generalQuestions = pool.filter(q => !q.isDefinition);

    // 出題数
    let targetTotal = countSetting === 'all' ? pool.length : parseInt(countSetting, 10);
    if (isNaN(targetTotal) || targetTotal <= 0) targetTotal = 10;
    targetTotal = Math.min(targetTotal, pool.length);

    // 重心・内心・外心の定義問題を分類
    const defByCategory = {
      centroid: this.shuffleArray(defQuestions.filter(q => q.category === 'centroid')),
      incenter: this.shuffleArray(defQuestions.filter(q => q.category === 'incenter')),
      circumcenter: this.shuffleArray(defQuestions.filter(q => q.category === 'circumcenter'))
    };

    // 出題順ローテーション（重心・内心・外心をランダムな順序で開始）
    const catCycle = this.shuffleArray(['centroid', 'incenter', 'circumcenter']);
    let catCycleIdx = 0;

    // 一般問題をシャッフル
    const shuffledGeneral = this.shuffleArray([...generalQuestions]);
    let generalIdx = 0;

    // 定義問題全体のシャッフル（フォールバック用）
    const allShuffledDef = this.shuffleArray([...defQuestions]);
    let defIdx = 0;

    const result = [];

    for (let i = 0; i < targetTotal; i++) {
      // 3回に1回（3問目 i=2, 6問目 i=5, 9問目 i=8...）は必ず定義問題！
      const isDefinitionTurn = (i + 1) % 3 === 0;

      if (isDefinitionTurn) {
        const targetCat = catCycle[catCycleIdx % catCycle.length];
        catCycleIdx++;

        let pickedDef = null;
        if (defByCategory[targetCat] && defByCategory[targetCat].length > 0) {
          pickedDef = defByCategory[targetCat].pop();
        } else if (defIdx < allShuffledDef.length) {
          pickedDef = allShuffledDef[defIdx++];
        } else {
          // 定義プールを再シャッフルして再利用
          pickedDef = this.shuffleArray([...defQuestions])[0];
        }
        result.push(pickedDef);
      } else {
        // 一般問題
        if (generalIdx < shuffledGeneral.length) {
          result.push(shuffledGeneral[generalIdx++]);
        } else if (defIdx < allShuffledDef.length) {
          result.push(allShuffledDef[defIdx++]);
        } else {
          result.push(this.shuffleArray([...pool])[0]);
        }
      }
    }

    return result;
  }

  // クイズのフィルタリングと出題
  startQuiz() {
    const pool = QUIZ_QUESTIONS.filter(q => {
      if (q.category === 'orthocenter') return this.includeOrthocenter;
      if (q.category === 'excenter') return this.includeExcenter;
      return true; // 重心・内心・外心は常に含む
    });

    // ランダム出題＆3回に1回定義問題を挿入した問題リストを作成
    this.currentQuestions = this.buildQuizQuestions(pool, this.questionCount);
    this.currentIndex = 0;
    this.score = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.answersHistory = [];
    this.isAnswered = false;

    if (this.autoNextTimer) {
      clearTimeout(this.autoNextTimer);
      this.autoNextTimer = null;
    }
    this.updateStreakDisplay(false);

    this.viewStart.classList.add('hidden');
    this.viewResult.classList.add('hidden');
    this.viewQuiz.classList.remove('hidden');

    this.initAnswerTracker();
    this.renderQuestion();
  }

  // 回答状況トラッカーの初期化
  initAnswerTracker() {
    if (!this.quizAnswerTracker) return;
    this.quizAnswerTracker.innerHTML = '';
    for (let i = 0; i < this.currentQuestions.length; i++) {
      const pill = document.createElement('div');
      pill.className = `tracker-pill ${i === 0 ? 'current' : ''}`;
      pill.id = `tracker-pill-${i}`;
      pill.textContent = `Q${i + 1}`;
      this.quizAnswerTracker.appendChild(pill);
    }
  }

  renderQuestion() {
    this.isAnswered = false;
    if (this.autoNextTimer) {
      clearTimeout(this.autoNextTimer);
      this.autoNextTimer = null;
    }
    if (this.autoNextIndicator) {
      this.autoNextIndicator.classList.add('hidden');
    }

    const q = this.currentQuestions[this.currentIndex];

    // トラッカーのカレント表示を更新
    if (this.quizAnswerTracker) {
      const pills = this.quizAnswerTracker.querySelectorAll('.tracker-pill');
      pills.forEach((p, idx) => {
        if (idx === this.currentIndex) {
          p.classList.add('current');
        } else {
          p.classList.remove('current');
        }
      });
    }

    // 進捗表示
    this.qIndexEl.textContent = this.currentIndex + 1;
    this.qTotalEl.textContent = this.currentQuestions.length;
    const progressPercent = ((this.currentIndex) / this.currentQuestions.length) * 100;
    this.progressBar.style.width = `${progressPercent}%`;

    // 範囲バッジ
    if (q.scope === 'junior') {
      this.scopeBadge.textContent = '中学範囲';
      this.scopeBadge.className = 'badge badge-junior';
    } else {
      this.scopeBadge.textContent = '高校発展';
      this.scopeBadge.className = 'badge badge-high';
    }

    // 問題文の表示（カテゴリやタイトルのネタバレ・ヒントは表示しない）
    if (this.qCategoryEl) this.qCategoryEl.textContent = '';
    if (this.qTitleEl) this.qTitleEl.textContent = '';
    this.qTextEl.textContent = q.question;

    // 選択肢のシャッフル
    // 正解インデックスを追跡するためオブジェクト化
    const indexedOptions = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.answer }));
    const shuffledOptions = this.shuffleArray(indexedOptions);

    this.optionsContainer.innerHTML = '';
    shuffledOptions.forEach((optObj, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span class="opt-label">${String.fromCharCode(65 + idx)}</span> <span class="opt-text">${optObj.text}</span>`;
      btn.addEventListener('click', () => this.handleAnswer(optObj, shuffledOptions, btn));
      this.optionsContainer.appendChild(btn);
    });

    // 解説カードを隠し、プレースホルダーを表示
    this.feedbackCard.classList.add('hidden');
    if (this.feedbackPlaceholder) {
      this.feedbackPlaceholder.classList.remove('hidden');
    }
    if (this.feedbackCorrectAnswer) {
      this.feedbackCorrectAnswer.classList.add('hidden');
    }
    if (this.feedbackTip) {
      this.feedbackTip.classList.add('hidden');
    }
    if (this.svgContainer) {
      this.svgContainer.innerHTML = '';
    }
  }

  handleAnswer(selectedOpt, allOptions, selectedBtn) {
    if (this.isAnswered) return;
    this.isAnswered = true;

    const q = this.currentQuestions[this.currentIndex];
    const isCorrect = selectedOpt.isCorrect;
    const correctChoiceText = q.options[q.answer];

    // トラッカーを更新（正誤マークを付与）
    const curPill = document.getElementById(`tracker-pill-${this.currentIndex}`);
    if (curPill) {
      curPill.classList.remove('current');
      curPill.classList.add(isCorrect ? 'correct' : 'wrong');
      curPill.textContent = `Q${this.currentIndex + 1} ${isCorrect ? '⭕' : '❌'}`;
    }

    // 全ての選択肢ボタンのクリックを無効化し、正解ボタンを緑色にハイライト（選択後に正解を表示）
    const allButtons = this.optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach((btn, idx) => {
      btn.style.pointerEvents = 'none';
      if (allOptions[idx].isCorrect) {
        btn.classList.add('correct');
      }
    });

    if (isCorrect) {
      this.score++;
      this.currentStreak++;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
      this.updateStreakDisplay(true);

      // 正解音を再生♫
      this.sound.playCorrect();

      this.feedbackIcon.innerHTML = '⭕ 正解！';
      this.feedbackCard.className = 'feedback-card feedback-correct';
      this.feedbackTitle.textContent = this.currentStreak >= 3 
        ? `見事！${this.currentStreak}問連続正解中！🔥` 
        : '素晴らしい！大正解です。';

      // 正解の時は自動的に次の問題へ進む（1.6秒後）
      if (this.autoNextIndicator) {
        this.autoNextIndicator.classList.remove('hidden');
      }
      this.autoNextTimer = setTimeout(() => {
        this.nextQuestion();
      }, 1600);
    } else {
      this.currentStreak = 0;
      this.updateStreakDisplay(false);

      // 不正解音を再生
      this.sound.playWrong();

      selectedBtn.classList.add('wrong');
      this.feedbackIcon.innerHTML = '❌ 不正解...';
      this.feedbackCard.className = 'feedback-card feedback-wrong';
      this.feedbackTitle.textContent = 'ざんねん！不正解です。';

      // 不正解時は自動遷移せず、手動で次の問題へ
      if (this.autoNextIndicator) {
        this.autoNextIndicator.classList.add('hidden');
      }
    }

    // 正解の明示表示（選択後に表示）
    if (this.feedbackCorrectAnswer) {
      this.feedbackCorrectAnswer.classList.remove('hidden');
      if (this.feedbackCorrectText) {
        this.feedbackCorrectText.textContent = correctChoiceText;
      }
    }

    // 解説テキスト
    if (this.feedbackExp) {
      this.feedbackExp.textContent = q.explanation;
    }

    // 覚え方のヒント
    if (this.feedbackTip) {
      if (q.tip) {
        this.feedbackTip.textContent = `💡 ヒント: ${q.tip}`;
        this.feedbackTip.classList.remove('hidden');
      } else {
        this.feedbackTip.classList.add('hidden');
      }
    }

    // SVG図解（視覚的理解）
    if (this.svgContainer) {
      this.svgContainer.innerHTML = GeometryIllustrator.renderSvg(q.category);
    }

    // 回答履歴に保存（結果画面で正解や解説を表示するため）
    this.answersHistory.push({
      question: q,
      isCorrect: isCorrect,
      userChoice: selectedOpt.text,
      correctChoice: correctChoiceText
    });

    // プレースホルダーを非表示にし、判定カードを表示
    if (this.feedbackPlaceholder) {
      this.feedbackPlaceholder.classList.add('hidden');
    }
    this.feedbackCard.classList.remove('hidden');
  }

  nextQuestion() {
    if (this.autoNextTimer) {
      clearTimeout(this.autoNextTimer);
      this.autoNextTimer = null;
    }
    if (this.autoNextIndicator) {
      this.autoNextIndicator.classList.add('hidden');
    }

    this.currentIndex++;
    if (this.currentIndex < this.currentQuestions.length) {
      this.renderQuestion();
    } else {
      this.showResult();
    }
  }

  showResult() {
    if (this.autoNextTimer) {
      clearTimeout(this.autoNextTimer);
      this.autoNextTimer = null;
    }

    this.viewQuiz.classList.add('hidden');
    this.viewResult.classList.remove('hidden');

    const total = this.currentQuestions.length;
    const percent = Math.round((this.score / total) * 100);

    this.resultScoreEl.textContent = this.score;
    this.resultTotalEl.textContent = total;
    this.resultPercentEl.textContent = `正答率: ${percent}%`;
    if (this.resultMaxStreakEl) {
      this.resultMaxStreakEl.textContent = this.maxStreak;
    }

    let msg = '';
    if (percent === 100) {
      msg = '🎉 パーフェクト達成！三角形の心を完全にマスターしています！高校受験・大学受験でもバッチリです！';
    } else if (percent >= 80) {
      msg = '🌟 素晴らしい成績です！基本性質はバッチリ。間違えた問題を復習して満点を目指しましょう！';
    } else if (percent >= 60) {
      msg = '👍 よく頑張りました！重心・内心・外心の定義や性質の「違い（中線、二等分線、垂直二等分線）」をもう一度整理してみましょう。';
    } else {
      msg = '📖 お疲れ様でした！まずは「まとめ図鑑」タブで各心の名前と作図の仕方を復習してみるのがおすすめです！';
    }
    this.resultMessageEl.textContent = msg;

    // 復習リストの表示
    this.resultReviewList.innerHTML = '';
    this.answersHistory.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = `review-item ${item.isCorrect ? 'review-correct' : 'review-wrong'}`;
      div.innerHTML = `
        <div class="review-header">
          <span class="review-mark">${item.isCorrect ? '⭕' : '❌'} Q${idx + 1}. ${item.question.title}</span>
          <span class="badge ${item.question.scope === 'junior' ? 'badge-junior' : 'badge-high'}">${item.question.scope === 'junior' ? '中学' : '高校'}</span>
        </div>
        <p class="review-qtext">${item.question.question}</p>
        <p class="review-ans"><strong>あなたの回答:</strong> ${item.userChoice}</p>
        ${!item.isCorrect ? `<p class="review-correct-ans"><strong>正解:</strong> ${item.correctChoice}</p>` : ''}
        <div class="review-tip">💡 ${item.question.tip}</div>
      `;
      this.resultReviewList.appendChild(div);
    });

    // 挑戦結果を永続履歴に自動保存
    this.saveQuizResult(total, percent);
  }

  // ==========================================================
  // 挑戦履歴（localStorage）マネージャー
  // ==========================================================
  getQuizHistory() {
    try {
      const data = localStorage.getItem('triangle_quiz_history');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse quiz history:', e);
      return [];
    }
  }

  saveQuizResult(total, percent) {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const dateStr = `${month}/${date} ${hours}:${mins}`;

      const record = {
        id: 'qh_' + Date.now(),
        dateStr: dateStr,
        total: total,
        score: this.score,
        percent: percent,
        maxStreak: this.maxStreak,
        answers: this.answersHistory.map(a => ({
          title: a.question.title,
          question: a.question.question,
          isCorrect: a.isCorrect,
          userChoice: a.userChoice,
          correctChoice: a.correctChoice,
          tip: a.question.tip,
          scope: a.question.scope
        }))
      };

      const histories = this.getQuizHistory();
      histories.unshift(record); // 最新順
      if (histories.length > 50) histories.pop(); // 最大50件保持

      localStorage.setItem('triangle_quiz_history', JSON.stringify(histories));
      this.updateHistoryBadge();
    } catch (e) {
      console.error('Failed to save quiz history:', e);
    }
  }

  updateHistoryBadge() {
    if (!this.historyCountBadge) return;
    const histories = this.getQuizHistory();
    this.historyCountBadge.textContent = histories.length;
  }

  openHistoryModal() {
    if (!this.modalHistory) return;
    this.modalHistory.classList.remove('hidden');
    this.renderHistoryModal();
  }

  closeHistoryModal() {
    if (!this.modalHistory) return;
    this.modalHistory.classList.add('hidden');
  }

  renderHistoryModal() {
    const histories = this.getQuizHistory();

    // 総合統計の算出
    if (this.statTotalPlays) {
      this.statTotalPlays.textContent = `${histories.length} 回`;
    }
    if (this.statAvgAccuracy) {
      if (histories.length === 0) {
        this.statAvgAccuracy.textContent = '0%';
      } else {
        const totalScore = histories.reduce((sum, h) => sum + h.score, 0);
        const totalQuestions = histories.reduce((sum, h) => sum + h.total, 0);
        const avgPercent = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
        this.statAvgAccuracy.textContent = `${avgPercent}%`;
      }
    }
    if (this.statBestStreak) {
      const best = histories.reduce((max, h) => Math.max(max, h.maxStreak || 0), 0);
      this.statBestStreak.textContent = `${best} 問`;
    }

    // リスト描画
    if (!this.historyListContainer) return;
    this.historyListContainer.innerHTML = '';

    if (histories.length === 0) {
      this.historyListContainer.innerHTML = `
        <div class="history-empty-msg">
          まだ挑戦履歴がありません。<br>クイズに挑戦すると、ここに毎回の成績や復習データが記録されます！🚀
        </div>
      `;
      return;
    }

    histories.forEach((h, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';

      let badgeClass = 'low';
      if (h.percent === 100) badgeClass = 'perfect';
      else if (h.percent >= 80) badgeClass = 'high';
      else if (h.percent >= 60) badgeClass = 'mid';

      const detailsHtml = h.answers.map((ans, qIdx) => `
        <div class="history-q-row">
          <div class="history-q-header ${ans.isCorrect ? 'q-correct' : 'q-wrong'}">
            <span>${ans.isCorrect ? '⭕' : '❌'}</span>
            <span>Q${qIdx + 1}. ${ans.title}</span>
          </div>
          <div class="history-q-ans">あなたの回答: ${ans.userChoice} ${!ans.isCorrect ? ` / 正解: <strong>${ans.correctChoice}</strong>` : ''}</div>
        </div>
      `).join('');

      itemEl.innerHTML = `
        <div class="history-summary">
          <div class="history-summary-left">
            <span class="history-date">${h.dateStr} (第${histories.length - index}回)</span>
            <span class="history-score-text">
              スコア: <strong>${h.score}</strong> / ${h.total} 問正解
              ${h.maxStreak >= 3 ? `<small style="margin-left: 0.4rem; color: #ea580c; font-size: 0.78rem;">🔥${h.maxStreak}連問</small>` : ''}
            </span>
          </div>
          <div class="history-summary-right">
            <span class="history-percent-badge ${badgeClass}">${h.percent}%</span>
            <span class="history-toggle-icon">▼</span>
          </div>
        </div>
        <div class="history-details hidden">
          ${detailsHtml}
        </div>
      `;

      // クリックでアコーディオン展開
      const summaryEl = itemEl.querySelector('.history-summary');
      const detailsEl = itemEl.querySelector('.history-details');
      summaryEl.addEventListener('click', () => {
        const isOpen = itemEl.classList.toggle('open');
        if (isOpen) {
          detailsEl.classList.remove('hidden');
        } else {
          detailsEl.classList.add('hidden');
        }
      });

      this.historyListContainer.appendChild(itemEl);
    });
  }

  renderHistoryView() {
    const histories = this.getQuizHistory();

    // 総合統計の算出
    if (this.statViewTotalPlays) {
      this.statViewTotalPlays.textContent = `${histories.length} 回`;
    }
    if (this.statViewAvgAccuracy) {
      if (histories.length === 0) {
        this.statViewAvgAccuracy.textContent = '0%';
      } else {
        const totalScore = histories.reduce((sum, h) => sum + h.score, 0);
        const totalQuestions = histories.reduce((sum, h) => sum + h.total, 0);
        const avgPercent = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
        this.statViewAvgAccuracy.textContent = `${avgPercent}%`;
      }
    }
    if (this.statViewBestStreak) {
      const best = histories.reduce((max, h) => Math.max(max, h.maxStreak || 0), 0);
      this.statViewBestStreak.textContent = `${best} 問`;
    }

    // リスト描画
    if (!this.historyViewList) return;
    this.historyViewList.innerHTML = '';

    if (histories.length === 0) {
      this.historyViewList.innerHTML = `
        <div class="history-empty-msg">
          <div style="font-size: 2.8rem; margin-bottom: 0.6rem;">📝</div>
          <p style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">まだ挑戦履歴がありません</p>
          <p style="margin-top: 0.5rem; line-height: 1.5; color: var(--text-muted);">
            4択クイズに挑戦すると、毎回のスコア・正答率や、<br>全問題とあなたの回答・正解・ヒントが自動でここに記録されます！
          </p>
          <button id="btn-history-start-quiz" class="btn-primary" style="margin-top: 1.2rem;">早速クイズに挑戦する 🚀</button>
        </div>
      `;
      const btnGo = this.historyViewList.querySelector('#btn-history-start-quiz');
      if (btnGo) {
        btnGo.addEventListener('click', () => {
          this.showStartView();
        });
      }
      return;
    }

    histories.forEach((h, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';

      let badgeClass = 'low';
      if (h.percent === 100) badgeClass = 'perfect';
      else if (h.percent >= 80) badgeClass = 'high';
      else if (h.percent >= 60) badgeClass = 'mid';

      const detailsHtml = h.answers.map((ans, qIdx) => `
        <div class="history-q-row">
          <div class="history-q-header ${ans.isCorrect ? 'q-correct' : 'q-wrong'}">
            <span>${ans.isCorrect ? '⭕ 正解' : '❌ 不正解'}</span>
            <span style="margin-left: 0.2rem;">Q${qIdx + 1}. ${ans.title}</span>
            <span class="badge ${ans.scope === 'junior' ? 'badge-junior' : 'badge-high'}" style="margin-left: auto;">${ans.scope === 'junior' ? '中学' : '高校'}</span>
          </div>
          <div class="history-q-ans">
            <div style="margin-bottom: 0.25rem;"><strong>問題:</strong> ${ans.question}</div>
            <div style="margin-top: 0.2rem;">あなたの回答: <span style="font-weight: 700; color: ${ans.isCorrect ? '#059669' : '#dc2626'};">${ans.userChoice}</span> ${!ans.isCorrect ? ` / 正解: <strong style="color: #059669;">${ans.correctChoice}</strong>` : ''}</div>
            ${ans.tip ? `<div style="font-size: 0.74rem; color: #92400e; margin-top: 0.3rem; background: #fffbeb; padding: 0.2rem 0.4rem; border-radius: 4px;">💡 ${ans.tip}</div>` : ''}
          </div>
        </div>
      `).join('');

      itemEl.innerHTML = `
        <div class="history-summary">
          <div class="history-summary-left">
            <span class="history-date">${h.dateStr} (第${histories.length - index}回)</span>
            <span class="history-score-text">
              スコア: <strong>${h.score}</strong> / ${h.total} 問正解
              ${h.maxStreak >= 3 ? `<small style="margin-left: 0.4rem; color: #ea580c; font-size: 0.78rem;">🔥${h.maxStreak}問連続</small>` : ''}
            </span>
          </div>
          <div class="history-summary-right">
            <span class="history-percent-badge ${badgeClass}">${h.percent}%</span>
            <span class="history-toggle-icon">▼</span>
          </div>
        </div>
        <div class="history-details hidden">
          ${detailsHtml}
        </div>
      `;

      // クリックでアコーディオン展開
      const summaryEl = itemEl.querySelector('.history-summary');
      const detailsEl = itemEl.querySelector('.history-details');
      summaryEl.addEventListener('click', () => {
        const isOpen = itemEl.classList.toggle('open');
        if (isOpen) {
          detailsEl.classList.remove('hidden');
        } else {
          detailsEl.classList.add('hidden');
        }
      });

      this.historyViewList.appendChild(itemEl);
    });
  }

  clearQuizHistory() {
    if (confirm('これまでのクイズ挑戦履歴をすべて削除しますか？\n（この操作は元に戻せません）')) {
      localStorage.removeItem('triangle_quiz_history');
      this.updateHistoryBadge();
      this.renderHistoryModal();
      this.renderHistoryView();
    }
  }

  renderEncyclopedia() {
    const container = document.getElementById('encyclopedia-container');
    container.innerHTML = '';

    Object.keys(CENTERS_ENCYCLOPEDIA).forEach(key => {
      const data = CENTERS_ENCYCLOPEDIA[key];
      const card = document.createElement('div');
      card.className = 'encyclo-card';
      
      const propsList = data.properties.map(p => `<li>${p}</li>`).join('');
      const svgHtml = SVG_GENERATOR.generate(data.svgType);

      card.innerHTML = `
        <div class="encyclo-card-header">
          <div>
            <h3 class="encyclo-title">${data.name}</h3>
            <span class="encyclo-symbol">記号: ${data.symbol}</span>
          </div>
          <span class="badge ${data.scope.includes('中学') ? 'badge-junior' : 'badge-high'}">${data.scope}</span>
        </div>
        <div class="encyclo-body">
          <div class="encyclo-svg">${svgHtml}</div>
          <div class="encyclo-desc">
            <h4>【定義】</h4>
            <p class="encyclo-def">${data.definition}</p>
            <h4>【主な性質とポイント】</h4>
            <ul class="encyclo-props">${propsList}</ul>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  shuffleArray(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// アプリ起動
window.addEventListener('DOMContentLoaded', () => {
  new TriangleQuizApp();
});
