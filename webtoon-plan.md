# 4컷 웹툰 멀티 에이전트 오케스트레이션 페이지 — 구현 계획서

> 작성일: 2026-05-21  
> 기술 스택: 순수 HTML + CSS + JS (ES 모듈 없음, 외부 의존성 없음)  
> 대상 디렉토리: `webtoon/`

---

## 파일 구조 전체 개요

```
webtoon/
├── index.html
├── css/
│   ├── webtoon-tokens.css
│   ├── webtoon-layout.css
│   ├── webtoon-panels.css
│   └── webtoon-animations.css
└── js/
    ├── constants.js
    ├── webtoon-state.js
    ├── setup-agent.js
    ├── storyboard.js
    ├── webtoon-renderer.js
    ├── agent-log.js
    ├── strategy.js
    └── main.js
```

---

## Phase 0: Foundation — constants + webtoon-state

**목표**: 모든 Phase의 블로커. `WEBTOON_SCHEMA`와 `PIPELINE_STATUS`를 정의하고 전역 상태 관리자를 초기화한다.

**예상 소요 시간**: 15분

### 대상 파일 (신규 생성)
- `webtoon/js/constants.js`
- `webtoon/js/webtoon-state.js`

### 수정 금지 파일
- 없음 (최초 생성 단계)

### 세부 구현 지침

#### `js/constants.js`
```js
'use strict';

const WEBTOON_SCHEMA = Object.freeze({
  setting: {
    title: '',
    genre: '',           // '일상'|'판타지'|'개그'|'로맨스'
    character_name: '',
    character_trait: '', // '밝음'|'냉소적'|'엉뚱함'|'진지함'
    topic: '',
  },
  panels: [
    { id: 1, situation: '', dialogue: '', emotion: '', bg_color: '' },
    { id: 2, situation: '', dialogue: '', emotion: '', bg_color: '' },
    { id: 3, situation: '', dialogue: '', emotion: '', bg_color: '' },
    { id: 4, situation: '', dialogue: '', emotion: '', bg_color: '' },
  ],
  pipeline_status: 'idle',
  agent_logs: [], // { timestamp, agent, message }
});

const PIPELINE_STATUS = Object.freeze({
  IDLE:          'idle',
  COLLECTING:    'collecting',
  STORYBOARDING: 'storyboarding',
  RENDERING:     'rendering',
  DONE:          'done',
});

const GENRE_LIST = Object.freeze(['일상', '판타지', '개그', '로맨스']);
const TRAIT_LIST = Object.freeze(['밝음', '냉소적', '엉뚱함', '진지함']);

const PRESETS = Object.freeze([
  {
    label: '직장인의 월요일',
    setting: { title: '월요병', genre: '일상', character_name: '김대리', character_trait: '냉소적', topic: '출근길 지하철' },
  },
  {
    label: '판타지 용사의 고민',
    setting: { title: '용사의 번아웃', genre: '판타지', character_name: '영웅이', character_trait: '엉뚱함', topic: '던전 대신 카페' },
  },
  {
    label: '고양이와 주인',
    setting: { title: '집사의 하루', genre: '개그', character_name: '냥이', character_trait: '냉소적', topic: '밥 달라는 고양이' },
  },
  {
    label: '대학생 시험 전날',
    setting: { title: '벼락치기', genre: '일상', character_name: '수험생', character_trait: '엉뚱함', topic: '시험 전날 밤' },
  },
  {
    label: '로맨스 첫 만남',
    setting: { title: '운명의 만남', genre: '로맨스', character_name: '하은', character_trait: '밝음', topic: '우연한 카페 만남' },
  },
]);
```

#### `js/webtoon-state.js`
```js
'use strict';

window.WebtoonState = (function () {
  let _state = JSON.parse(JSON.stringify(WEBTOON_SCHEMA));
  const _listeners = {};

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }

  function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (f) { return f !== fn; });
  }

  function emit(event, payload) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(function (fn) { fn(payload); });
  }

  function getState() {
    return JSON.parse(JSON.stringify(_state));
  }

  function setState(partial) {
    Object.assign(_state, partial);
    emit('change', getState());
  }

  function resetState() {
    _state = JSON.parse(JSON.stringify(WEBTOON_SCHEMA));
    emit('reset', getState());
  }

  function appendLog(agent, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      agent: agent,
      message: message,
    };
    _state.agent_logs.push(entry);
    emit('log', entry);
  }

  return { on, off, emit, getState, setState, resetState, appendLog };
})();
```

### CSS 클래스 레퍼런스
| 클래스 | 설명 |
|--------|------|
| (없음) | Phase 0은 JS 전용, CSS 클래스 없음 |

### 완료 기준
- 브라우저 콘솔에서 `window.WebtoonState.getState()` 실행 시 `WEBTOON_SCHEMA` 형태의 객체 반환
- `PIPELINE_STATUS.IDLE === 'idle'` 확인
- `PRESETS.length === 5` 확인

### 가시적 산출물
- 없음 (콘솔 검증만)

---

## Phase 1: HTML 셸 + CSS 토큰 + 레이아웃

**목표**: 페이지 골격(탭 4개), CSS 변수 시스템, 기본 레이아웃을 구성한다.

**예상 소요 시간**: 15분

### 대상 파일 (신규 생성)
- `webtoon/index.html`
- `webtoon/css/webtoon-tokens.css`
- `webtoon/css/webtoon-layout.css`

### 수정 금지 파일
- `js/constants.js`
- `js/webtoon-state.js`

### 세부 구현 지침

#### `index.html` 스켈레톤
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>4컷 웹툰 오케스트레이션</title>
  <link rel="stylesheet" href="css/webtoon-tokens.css" />
  <link rel="stylesheet" href="css/webtoon-layout.css" />
  <link rel="stylesheet" href="css/webtoon-panels.css" />
  <link rel="stylesheet" href="css/webtoon-animations.css" />
</head>
<body>
  <header class="wt-header">
    <h1 class="wt-header__title">4컷 웹툰 오케스트레이터</h1>
    <span id="js-pipeline-badge" class="wt-badge wt-badge--idle">idle</span>
  </header>

  <nav class="wt-tabs" role="tablist">
    <button class="wt-tab wt-tab--active" data-tab="setup"      role="tab">1. 설정</button>
    <button class="wt-tab"               data-tab="storyboard"  role="tab">2. 스토리보드</button>
    <button class="wt-tab"               data-tab="webtoon"     role="tab">3. 웹툰</button>
    <button class="wt-tab"               data-tab="strategy"    role="tab">4. 전략</button>
  </nav>

  <main class="wt-main">
    <section id="tab-setup"      class="wt-panel wt-panel--active" role="tabpanel"></section>
    <section id="tab-storyboard" class="wt-panel"                  role="tabpanel"></section>
    <section id="tab-webtoon"    class="wt-panel"                  role="tabpanel"></section>
    <section id="tab-strategy"   class="wt-panel"                  role="tabpanel"></section>
  </main>

  <aside id="js-agent-log" class="wt-log-sidebar"></aside>

  <script src="js/constants.js"></script>
  <script src="js/webtoon-state.js"></script>
  <script src="js/setup-agent.js"></script>
  <script src="js/storyboard.js"></script>
  <script src="js/webtoon-renderer.js"></script>
  <script src="js/agent-log.js"></script>
  <script src="js/strategy.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

#### `css/webtoon-tokens.css`
```css
:root {
  --wt-bg-base:        #0f1117;
  --wt-bg-surface:     #1a1d27;
  --wt-bg-elevated:    #242736;
  --wt-border:         #2e3147;
  --wt-text-primary:   #e8eaf0;
  --wt-text-secondary: #8b90a7;
  --wt-accent:         #7c6ff7;
  --wt-accent-hover:   #9d98f8;
  --wt-success:        #4caf84;
  --wt-warning:        #f0a500;
  --wt-danger:         #e05c5c;

  --wt-font-base:  'Noto Sans KR', system-ui, sans-serif;
  --wt-font-mono:  'JetBrains Mono', monospace;
  --wt-size-xs:    0.75rem;
  --wt-size-sm:    0.875rem;
  --wt-size-md:    1rem;
  --wt-size-lg:    1.25rem;
  --wt-size-xl:    1.5rem;

  --wt-space-xs:  4px;
  --wt-space-sm:  8px;
  --wt-space-md:  16px;
  --wt-space-lg:  24px;
  --wt-space-xl:  32px;

  --wt-radius:    8px;
  --wt-radius-lg: 16px;
  --wt-shadow:    0 2px 12px rgba(0,0,0,0.4);
  --wt-transition: 200ms ease;
}

@media print {
  :root {
    --wt-bg-base:      #ffffff;
    --wt-bg-surface:   #ffffff;
    --wt-bg-elevated:  #f5f5f5;
    --wt-border:       #cccccc;
    --wt-text-primary: #000000;
  }
}
```

#### `css/webtoon-layout.css`
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--wt-bg-base);
  color: var(--wt-text-primary);
  font-family: var(--wt-font-base);
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto auto 1fr;
  grid-template-columns: 1fr 280px;
  grid-template-areas:
    "header  header"
    "tabs    tabs"
    "main    log";
}

.wt-header {
  grid-area: header;
  display: flex;
  align-items: center;
  gap: var(--wt-space-md);
  padding: var(--wt-space-md) var(--wt-space-lg);
  background: var(--wt-bg-surface);
  border-bottom: 1px solid var(--wt-border);
}
.wt-header__title { font-size: var(--wt-size-xl); font-weight: 700; }

.wt-tabs {
  grid-area: tabs;
  display: flex;
  gap: 2px;
  padding: var(--wt-space-sm) var(--wt-space-lg);
  background: var(--wt-bg-surface);
  border-bottom: 1px solid var(--wt-border);
}

.wt-tab {
  padding: var(--wt-space-sm) var(--wt-space-md);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--wt-radius);
  color: var(--wt-text-secondary);
  cursor: pointer;
  font-size: var(--wt-size-sm);
  transition: background var(--wt-transition), color var(--wt-transition);
}
.wt-tab:hover { background: var(--wt-bg-elevated); color: var(--wt-text-primary); }
.wt-tab--active { background: var(--wt-accent); color: #fff; border-color: var(--wt-accent); }

.wt-main { grid-area: main; overflow-y: auto; padding: var(--wt-space-lg); }
.wt-panel { display: none; }
.wt-panel--active { display: block; }

.wt-log-sidebar {
  grid-area: log;
  background: var(--wt-bg-surface);
  border-left: 1px solid var(--wt-border);
  overflow-y: auto;
  padding: var(--wt-space-md);
}

.wt-badge {
  padding: 2px 10px;
  border-radius: 100px;
  font-size: var(--wt-size-xs);
  font-weight: 600;
  text-transform: uppercase;
}
.wt-badge--idle          { background: var(--wt-bg-elevated); color: var(--wt-text-secondary); }
.wt-badge--collecting    { background: var(--wt-warning);     color: #000; }
.wt-badge--storyboarding { background: var(--wt-accent);      color: #fff; }
.wt-badge--rendering     { background: var(--wt-accent);      color: #fff; }
.wt-badge--done          { background: var(--wt-success);     color: #fff; }

@media print {
  body { display: block; }
  .wt-header, .wt-tabs, .wt-log-sidebar { display: none; }
  .wt-main { padding: 0; }
  .wt-panel { display: block !important; }
  #tab-setup, #tab-storyboard, #tab-strategy { display: none !important; }
  #tab-webtoon { display: block !important; }
}
```

### CSS 클래스 레퍼런스
| 클래스 | 파일 | 설명 |
|--------|------|------|
| `wt-header` | webtoon-layout.css | 상단 헤더 영역 |
| `wt-header__title` | webtoon-layout.css | 헤더 제목 |
| `wt-tabs` | webtoon-layout.css | 탭 네비게이션 컨테이너 |
| `wt-tab` | webtoon-layout.css | 개별 탭 버튼 |
| `wt-tab--active` | webtoon-layout.css | 활성 탭 상태 |
| `wt-main` | webtoon-layout.css | 메인 콘텐츠 영역 |
| `wt-panel` | webtoon-layout.css | 탭 패널 (숨김 기본) |
| `wt-panel--active` | webtoon-layout.css | 표시 중인 패널 |
| `wt-log-sidebar` | webtoon-layout.css | 에이전트 로그 사이드바 |
| `wt-badge` | webtoon-layout.css | 파이프라인 상태 배지 기본 |
| `wt-badge--{status}` | webtoon-layout.css | 상태별 배지 색상 변형 |

### 완료 기준
- 브라우저에서 `webtoon/index.html` 열면 다크 테마 헤더 + 탭 4개 표시
- 탭 클릭 시 active 스타일 전환 확인
- 콘솔 오류 없음

### 가시적 산출물
- 다크 테마 탭 레이아웃 페이지 (콘텐츠 미완성 상태)

---

## Phase 2: 설정 에이전트 컴포넌트

**목표**: 사용자가 웹툰 설정을 입력하고 파이프라인을 시작하는 폼 컴포넌트를 구현한다.  
**병렬 가능**: Phase 3, 4, 5, 6과 동시 작업 가능 (Phase 0, 1 완료 후)

**예상 소요 시간**: 20분

### 대상 파일 (신규 생성)
- `webtoon/js/setup-agent.js`

### 수정 금지 파일
- `js/constants.js`
- `js/webtoon-state.js`
- `css/webtoon-tokens.css`
- `css/webtoon-layout.css`

### 세부 구현 지침

```js
'use strict';

window.SetupAgentComponent = (function () {
  let _container = null;

  function _buildForm() {
    const section = document.createElement('div');
    section.className = 'setup-form';

    // 프리셋 버튼 영역
    const presetArea = document.createElement('div');
    presetArea.className = 'setup-presets';
    const presetLabel = document.createElement('p');
    presetLabel.className = 'setup-label';
    presetLabel.textContent = '프리셋 소재 선택';
    presetArea.appendChild(presetLabel);

    PRESETS.forEach(function (preset) {
      const btn = document.createElement('button');
      btn.className = 'btn btn--outline btn--sm';
      btn.textContent = preset.label;
      btn.addEventListener('click', function () {
        WebtoonState.setState({ setting: Object.assign({}, preset.setting) });
        WebtoonState.appendLog('SetupAgent', '프리셋 적용: ' + preset.label);
        update();
      });
      presetArea.appendChild(btn);
    });
    section.appendChild(presetArea);

    const fields = [
      { key: 'title',           label: '제목',      type: 'text',   placeholder: '웹툰 제목을 입력하세요' },
      { key: 'genre',           label: '장르',      type: 'select', options: GENRE_LIST },
      { key: 'character_name',  label: '캐릭터명', type: 'text',   placeholder: '주인공 이름' },
      { key: 'character_trait', label: '성격',      type: 'select', options: TRAIT_LIST },
      { key: 'topic',           label: '소재',      type: 'text',   placeholder: '이야기 소재 (예: 출근길 지하철)' },
    ];

    const form = document.createElement('form');
    form.className = 'setup-fields';
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    fields.forEach(function (field) {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = field.label;
      label.setAttribute('for', 'setup-' + field.key);
      group.appendChild(label);

      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-select';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '선택하세요';
        input.appendChild(placeholder);
        field.options.forEach(function (opt) {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.placeholder = field.placeholder || '';
      }
      input.id = 'setup-' + field.key;
      input.dataset.key = field.key;
      input.addEventListener('change', function (e) {
        const state = WebtoonState.getState();
        state.setting[field.key] = e.target.value;
        WebtoonState.setState({ setting: state.setting });
      });
      group.appendChild(input);
      form.appendChild(group);
    });
    section.appendChild(form);

    const startBtn = document.createElement('button');
    startBtn.id = 'js-start-btn';
    startBtn.className = 'btn btn--primary btn--lg';
    startBtn.textContent = '파이프라인 시작';
    startBtn.addEventListener('click', function () {
      const state = WebtoonState.getState();
      if (!state.setting.title || !state.setting.genre) {
        WebtoonState.appendLog('SetupAgent', '[오류] 제목과 장르는 필수입니다.');
        return;
      }
      WebtoonState.emit('pipeline:start', state.setting);
    });
    section.appendChild(startBtn);

    return section;
  }

  function _syncFormValues() {
    const state = WebtoonState.getState();
    const setting = state.setting;
    Object.keys(setting).forEach(function (key) {
      const el = document.getElementById('setup-' + key);
      if (el) el.value = setting[key] || '';
    });
  }

  function init(container) {
    _container = container;
    _container.appendChild(_buildForm());
    WebtoonState.on('change', _syncFormValues);
  }

  function update() { _syncFormValues(); }

  return { init, update };
})();
```

### CSS 클래스 레퍼런스
| 클래스 | 파일 | 설명 |
|--------|------|------|
| `setup-form` | webtoon-panels.css | 설정 폼 래퍼 |
| `setup-presets` | webtoon-panels.css | 프리셋 버튼 그룹 |
| `setup-label` | webtoon-panels.css | 소섹션 레이블 |
| `setup-fields` | webtoon-panels.css | 폼 필드 컨테이너 |
| `form-group` | webtoon-panels.css | 레이블+입력 묶음 |
| `form-label` | webtoon-panels.css | 폼 레이블 |
| `form-input` | webtoon-panels.css | 텍스트 입력 |
| `form-select` | webtoon-panels.css | 셀렉트 박스 |
| `btn` | webtoon-panels.css | 기본 버튼 |
| `btn--primary` | webtoon-panels.css | 주요 액션 버튼 |
| `btn--outline` | webtoon-panels.css | 외곽선 버튼 |
| `btn--sm` | webtoon-panels.css | 소형 버튼 |
| `btn--lg` | webtoon-panels.css | 대형 버튼 |

### 완료 기준
- 설정 탭에 폼 5개 필드 렌더링
- 프리셋 버튼 클릭 시 필드 자동 채움
- "파이프라인 시작" 클릭 시 `WebtoonState.appendLog` 기록 확인
- 제목/장르 미입력 시 오류 로그 출력

### 가시적 산출물
- 설정 탭: 프리셋 버튼 5개 + 입력 폼 + 파이프라인 시작 버튼

---

## Phase 3: 스토리보드 컴포넌트

**목표**: 4컷 패널 구조를 표시하고, 각 컷의 대사를 `<textarea>`로 편집 가능하게 한다.  
**병렬 가능**: Phase 2, 4, 5, 6과 동시 작업 가능 (Phase 0, 1 완료 후)

**예상 소요 시간**: 20분

### 대상 파일 (신규 생성)
- `webtoon/js/storyboard.js`

### 수정 금지 파일
- `js/constants.js`
- `js/webtoon-state.js`
- `js/setup-agent.js`

### 세부 구현 지침

```js
'use strict';

window.StoryboardComponent = (function () {
  let _container = null;

  function _renderPanel(panel, index) {
    const card = document.createElement('div');
    card.className = 'sb-panel';
    card.dataset.panelId = panel.id;

    const num = document.createElement('div');
    num.className = 'sb-panel__num';
    num.textContent = (index + 1) + '컷';
    card.appendChild(num);

    const situationLabel = document.createElement('p');
    situationLabel.className = 'sb-field-label';
    situationLabel.textContent = '상황';
    card.appendChild(situationLabel);

    const situationEl = document.createElement('p');
    situationEl.className = 'sb-situation';
    situationEl.textContent = panel.situation || '(생성 대기 중)';
    card.appendChild(situationEl);

    const emotionLabel = document.createElement('p');
    emotionLabel.className = 'sb-field-label';
    emotionLabel.textContent = '감정';
    card.appendChild(emotionLabel);

    const emotionEl = document.createElement('p');
    emotionEl.className = 'sb-emotion';
    emotionEl.textContent = panel.emotion || '-';
    card.appendChild(emotionEl);

    const dialogLabel = document.createElement('p');
    dialogLabel.className = 'sb-field-label';
    dialogLabel.textContent = '대사 (편집 가능)';
    card.appendChild(dialogLabel);

    const textarea = document.createElement('textarea');
    textarea.className = 'sb-dialogue-edit';
    textarea.rows = 3;
    textarea.value = panel.dialogue || '';
    textarea.placeholder = '대사를 입력하거나 수정하세요';
    textarea.addEventListener('change', function (e) {
      const state = WebtoonState.getState();
      state.panels[index].dialogue = e.target.value;
      WebtoonState.setState({ panels: state.panels });
      WebtoonState.appendLog('StoryboardEditor', (index + 1) + '컷 대사 수정');
    });
    card.appendChild(textarea);

    return card;
  }

  function _render() {
    while (_container.firstChild) _container.removeChild(_container.firstChild);

    const state = WebtoonState.getState();
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '스토리보드';
    _container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'sb-grid';
    state.panels.forEach(function (panel, i) {
      grid.appendChild(_renderPanel(panel, i));
    });
    _container.appendChild(grid);
  }

  function init(container) {
    _container = container;
    _render();
    WebtoonState.on('change', _render);
  }

  function update() { _render(); }

  return { init, update };
})();
```

### CSS 클래스 레퍼런스
| 클래스 | 파일 | 설명 |
|--------|------|------|
| `sb-grid` | webtoon-panels.css | 4컷 카드 2×2 그리드 |
| `sb-panel` | webtoon-panels.css | 개별 컷 카드 |
| `sb-panel__num` | webtoon-panels.css | 컷 번호 배지 |
| `sb-field-label` | webtoon-panels.css | 필드 소레이블 |
| `sb-situation` | webtoon-panels.css | 상황 설명 텍스트 |
| `sb-emotion` | webtoon-panels.css | 감정 태그 |
| `sb-dialogue-edit` | webtoon-panels.css | 대사 편집 textarea |
| `section-title` | webtoon-panels.css | 섹션 제목 h2 |

### 완료 기준
- 스토리보드 탭에 4컷 카드 그리드 렌더링
- textarea에서 대사 수정 후 상태 반영 확인
- 상태 변경 시 자동 리렌더링

### 가시적 산출물
- 스토리보드 탭: 4카드 그리드 (편집 가능 textarea 포함)

---

## Phase 4: 웹툰 렌더러 컴포넌트

**목표**: 4컷 웹툰을 CSS 아트(배경색 + 이모지/텍스트 캐릭터 + 말풍선)로 렌더링하고 인쇄 기능을 제공한다.  
**병렬 가능**: Phase 2, 3, 5, 6과 동시 작업 가능 (Phase 0, 1 완료 후)

**예상 소요 시간**: 20분

### 대상 파일 (신규 생성)
- `webtoon/js/webtoon-renderer.js`

### 수정 금지 파일
- `js/constants.js`, `js/webtoon-state.js`, `js/setup-agent.js`, `js/storyboard.js`

### 세부 구현 지침

```js
'use strict';

window.WebtoonRendererComponent = (function () {
  let _container = null;

  const EMOTION_EMOJI = {
    '기쁨': '😄', '슬픔': '😢', '분노': '😤',
    '당황': '😲', '설렘': '💕', '피곤': '😪',
    '고민': '🤔', '자신감': '😎', '기본': '🙂',
  };

  const BG_PALETTE = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3'];

  function _resolveEmoji(emotion) {
    return EMOTION_EMOJI[emotion] || '🙂';
  }

  function _resolveBg(panel, index) {
    if (panel.bg_color) return panel.bg_color;
    return BG_PALETTE[index % BG_PALETTE.length];
  }

  function _buildPanel(panel, index, characterName) {
    const cell = document.createElement('div');
    cell.className = 'wt-comic-panel';
    cell.style.setProperty('--panel-bg', _resolveBg(panel, index));

    const num = document.createElement('span');
    num.className = 'wt-comic-panel__num';
    num.textContent = (index + 1) + '';
    cell.appendChild(num);

    const character = document.createElement('div');
    character.className = 'wt-comic-character';
    character.textContent = _resolveEmoji(panel.emotion);
    cell.appendChild(character);

    const nameTag = document.createElement('div');
    nameTag.className = 'wt-comic-name';
    nameTag.textContent = characterName || '캐릭터';
    cell.appendChild(nameTag);

    if (panel.dialogue) {
      const bubble = document.createElement('div');
      bubble.className = 'wt-speech-bubble';
      const text = document.createElement('p');
      text.className = 'wt-speech-bubble__text';
      text.textContent = panel.dialogue;
      bubble.appendChild(text);
      cell.appendChild(bubble);
    }

    if (panel.situation) {
      const caption = document.createElement('div');
      caption.className = 'wt-comic-caption';
      caption.textContent = panel.situation;
      cell.appendChild(caption);
    }

    return cell;
  }

  function _render() {
    while (_container.firstChild) _container.removeChild(_container.firstChild);
    const state = WebtoonState.getState();

    const titleEl = document.createElement('h2');
    titleEl.className = 'wt-comic-title';
    titleEl.textContent = state.setting.title || '제목 없음';
    _container.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.className = 'wt-comic-grid';
    state.panels.forEach(function (panel, i) {
      grid.appendChild(_buildPanel(panel, i, state.setting.character_name));
    });
    _container.appendChild(grid);

    const printBtn = document.createElement('button');
    printBtn.className = 'btn btn--outline btn--sm wt-print-btn';
    printBtn.textContent = '인쇄 / 내보내기';
    printBtn.addEventListener('click', function () { window.print(); });
    _container.appendChild(printBtn);
  }

  function init(container) {
    _container = container;
    _render();
    WebtoonState.on('change', _render);
  }

  function update() { _render(); }

  return { init, update };
})();
```

### CSS 클래스 레퍼런스
| 클래스 | 파일 | 설명 |
|--------|------|------|
| `wt-comic-title` | webtoon-panels.css | 웹툰 제목 |
| `wt-comic-grid` | webtoon-panels.css | 2×2 컷 그리드 |
| `wt-comic-panel` | webtoon-panels.css | 개별 컷 (배경색 CSS 변수) |
| `wt-comic-panel__num` | webtoon-panels.css | 컷 번호 배지 |
| `wt-comic-character` | webtoon-panels.css | 이모지 캐릭터 |
| `wt-comic-name` | webtoon-panels.css | 캐릭터 이름 태그 |
| `wt-speech-bubble` | webtoon-panels.css | 말풍선 컨테이너 |
| `wt-speech-bubble__text` | webtoon-panels.css | 말풍선 내 텍스트 |
| `wt-comic-caption` | webtoon-panels.css | 하단 상황 캡션 |
| `wt-print-btn` | webtoon-panels.css | 인쇄 버튼 위치 조정 |

### 완료 기준
- 웹툰 탭에 제목 + 4컷 그리드 렌더링
- 각 컷에 이모지 캐릭터 + 말풍선 + 캡션 표시
- 인쇄 미리보기에서 웹툰 컷만 표시

### 가시적 산출물
- 웹툰 탭: CSS 아트 4컷 레이아웃 + 인쇄 버튼

---

## Phase 5: 에이전트 로그 패널

**목표**: 파이프라인 실행 중 에이전트들의 활동을 실시간으로 사이드바에 스트리밍한다.  
**병렬 가능**: Phase 2, 3, 4, 6과 동시 작업 가능 (Phase 0, 1 완료 후)

**예상 소요 시간**: 15분

### 대상 파일 (신규 생성)
- `webtoon/js/agent-log.js`

### 수정 금지 파일
- `js/constants.js`, `js/webtoon-state.js`, `js/setup-agent.js`, `js/storyboard.js`, `js/webtoon-renderer.js`

### 세부 구현 지침

```js
'use strict';

window.AgentLogComponent = (function () {
  let _container = null;

  const AGENT_COLORS = {
    'SetupAgent':       'log-agent--setup',
    'StoryAgent':       'log-agent--story',
    'DrawingAgent':     'log-agent--drawing',
    'StrategyAgent':    'log-agent--strategy',
    'StoryboardEditor': 'log-agent--editor',
  };

  function _appendEntry(entry) {
    const item = document.createElement('div');
    item.className = 'log-entry log-entry--new';

    const ts = document.createElement('span');
    ts.className = 'log-entry__ts';
    const d = new Date(entry.timestamp);
    ts.textContent = [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
      String(d.getSeconds()).padStart(2, '0'),
    ].join(':');
    item.appendChild(ts);

    const agentTag = document.createElement('span');
    agentTag.className = 'log-entry__agent ' + (AGENT_COLORS[entry.agent] || 'log-agent--default');
    agentTag.textContent = entry.agent;
    item.appendChild(agentTag);

    const msg = document.createElement('span');
    msg.className = 'log-entry__msg';
    msg.textContent = entry.message;
    item.appendChild(msg);

    _container.appendChild(item);
    requestAnimationFrame(function () { item.classList.remove('log-entry--new'); });
    _container.scrollTop = _container.scrollHeight;
  }

  function _renderAll() {
    while (_container.firstChild) _container.removeChild(_container.firstChild);
    const header = document.createElement('p');
    header.className = 'log-header';
    header.textContent = '에이전트 로그';
    _container.appendChild(header);
    WebtoonState.getState().agent_logs.forEach(function (entry) { _appendEntry(entry); });
  }

  function init(container) {
    _container = container;
    _renderAll();
    WebtoonState.on('log', function (entry) { _appendEntry(entry); });
    WebtoonState.on('reset', _renderAll);
  }

  function update() { _renderAll(); }

  return { init, update };
})();
```

### CSS 클래스 레퍼런스
| 클래스 | 파일 | 설명 |
|--------|------|------|
| `log-header` | webtoon-panels.css | 사이드바 제목 |
| `log-entry` | webtoon-panels.css | 로그 항목 행 |
| `log-entry--new` | webtoon-animations.css | 신규 항목 페이드인 |
| `log-entry__ts` | webtoon-panels.css | 타임스탬프 |
| `log-entry__agent` | webtoon-panels.css | 에이전트 이름 태그 |
| `log-entry__msg` | webtoon-panels.css | 로그 메시지 |
| `log-agent--{name}` | webtoon-panels.css | 에이전트별 색상 |

### 완료 기준
- 사이드바에 "에이전트 로그" 헤더 표시
- `WebtoonState.appendLog()` 호출 시 즉시 항목 추가
- 새 항목 추가 시 페이드인 애니메이션
- 자동 스크롤 하단 유지

### 가시적 산출물
- 우측 사이드바: 실시간 에이전트 로그 스트림

---

## Phase 6: 전략 체크리스트 컴포넌트

**목표**: 파이프라인 각 Phase의 완료 상태를 체크리스트로 표시하고 진행률 요약을 제공한다.  
**병렬 가능**: Phase 2, 3, 4, 5와 동시 작업 가능 (Phase 0, 1 완료 후)

**예상 소요 시간**: 15분

### 대상 파일 (신규 생성)
- `webtoon/js/strategy.js`

### 수정 금지 파일
- Phase 2~5에서 생성된 모든 JS 파일

### 세부 구현 지침

```js
'use strict';

window.StrategyComponent = (function () {
  let _container = null;

  const STRATEGY_STEPS = [
    { id: 'setup',       label: '설정 수집',       agent: 'SetupAgent',    status_key: PIPELINE_STATUS.COLLECTING },
    { id: 'storyboard',  label: '스토리보드 생성', agent: 'StoryAgent',    status_key: PIPELINE_STATUS.STORYBOARDING },
    { id: 'rendering',   label: '웹툰 렌더링',     agent: 'DrawingAgent',  status_key: PIPELINE_STATUS.RENDERING },
    { id: 'done',        label: '완료',            agent: '오케스트레이터', status_key: PIPELINE_STATUS.DONE },
  ];

  const STATUS_ORDER = [
    PIPELINE_STATUS.IDLE,
    PIPELINE_STATUS.COLLECTING,
    PIPELINE_STATUS.STORYBOARDING,
    PIPELINE_STATUS.RENDERING,
    PIPELINE_STATUS.DONE,
  ];

  function _isCompleted(step, currentStatus) {
    return STATUS_ORDER.indexOf(currentStatus) > STATUS_ORDER.indexOf(step.status_key);
  }

  function _render() {
    while (_container.firstChild) _container.removeChild(_container.firstChild);
    const state = WebtoonState.getState();

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '파이프라인 전략';
    _container.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'strategy-list';

    STRATEGY_STEPS.forEach(function (step) {
      const li = document.createElement('li');
      const done   = _isCompleted(step, state.pipeline_status);
      const active = state.pipeline_status === step.status_key;
      li.className = 'strategy-item' +
        (done   ? ' strategy-item--done'   : '') +
        (active ? ' strategy-item--active' : '');

      const icon = document.createElement('span');
      icon.className = 'strategy-item__icon';
      icon.textContent = done ? '✓' : (active ? '▶' : '○');
      li.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'strategy-item__label';
      label.textContent = step.label;
      li.appendChild(label);

      const agent = document.createElement('span');
      agent.className = 'strategy-item__agent';
      agent.textContent = step.agent;
      li.appendChild(agent);

      list.appendChild(li);
    });
    _container.appendChild(list);

    const summary = document.createElement('div');
    summary.className = 'strategy-summary';
    const completedCount = STRATEGY_STEPS.filter(function (s) {
      return _isCompleted(s, state.pipeline_status);
    }).length;
    const progress = document.createElement('p');
    progress.className = 'strategy-summary__progress';
    progress.textContent = '진행률: ' + completedCount + ' / ' + STRATEGY_STEPS.length + ' 단계 완료';
    summary.appendChild(progress);
    _container.appendChild(summary);
  }

  function init(container) {
    _container = container;
    _render();
    WebtoonState.on('change', _render);
  }

  function update() { _render(); }

  return { init, update };
})();
```

### CSS 클래스 레퍼런스
| 클래스 | 파일 | 설명 |
|--------|------|------|
| `strategy-list` | webtoon-panels.css | 체크리스트 ul |
| `strategy-item` | webtoon-panels.css | 체크 항목 |
| `strategy-item--done` | webtoon-panels.css | 완료 상태 (초록) |
| `strategy-item--active` | webtoon-panels.css | 진행 중 상태 (보라) |
| `strategy-item__icon` | webtoon-panels.css | 상태 아이콘 |
| `strategy-item__label` | webtoon-panels.css | 단계 이름 |
| `strategy-item__agent` | webtoon-panels.css | 담당 에이전트 |
| `strategy-summary` | webtoon-panels.css | 요약 통계 영역 |
| `strategy-summary__progress` | webtoon-panels.css | 진행률 텍스트 |

### 완료 기준
- 전략 탭에 4단계 체크리스트 표시
- 파이프라인 상태 변경 시 체크리스트 자동 업데이트
- 완료 단계에 체크 아이콘 표시
- 진행률 텍스트 표시

### 가시적 산출물
- 전략 탭: 파이프라인 단계 체크리스트 + 진행률

---

## Phase 7: 파이프라인 부트스트랩

**목표**: 모든 컴포넌트를 조합하고, `setTimeout` 체인 기반 시뮬레이션 파이프라인을 연결한다.

**예상 소요 시간**: 10분

### 대상 파일 (신규 생성)
- `webtoon/js/main.js`

### 수정 금지 파일
- Phase 0~6에서 생성된 모든 파일

### 세부 구현 지침

```js
'use strict';

(function () {

  function initTabs() {
    const tabs   = document.querySelectorAll('.wt-tab');
    const panels = document.querySelectorAll('.wt-panel');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const target = tab.dataset.tab;
        tabs.forEach(function (t)   { t.classList.remove('wt-tab--active'); });
        panels.forEach(function (p) { p.classList.remove('wt-panel--active'); });
        tab.classList.add('wt-tab--active');
        const targetPanel = document.getElementById('tab-' + target);
        if (targetPanel) targetPanel.classList.add('wt-panel--active');
      });
    });
  }

  function initBadge() {
    const badge = document.getElementById('js-pipeline-badge');
    if (!badge) return;
    WebtoonState.on('change', function (state) {
      const status = state.pipeline_status;
      badge.textContent = status;
      badge.className = 'wt-badge wt-badge--' + status;
    });
  }

  const SAMPLE_PANELS = [
    { situation: '주인공이 출근 준비를 하다 핸드폰을 찾는다', dialogue: '아, 어디 뒀지?',      emotion: '당황',   bg_color: '#fef9c3' },
    { situation: '지하철에서 빈 자리를 발견하고 달려간다',    dialogue: '저 자리다!',          emotion: '기쁨',   bg_color: '#dbeafe' },
    { situation: '앉는 순간 옆 사람이 먼저 앉아버린다',      dialogue: '...이런.',            emotion: '슬픔',   bg_color: '#fce7f3' },
    { situation: '그래도 손잡이 잡고 평온하게 출근 완료',    dialogue: '뭐, 이게 인생이지.',  emotion: '자신감', bg_color: '#dcfce7' },
  ];

  function runPipeline(setting) {
    const steps = [
      {
        status: PIPELINE_STATUS.COLLECTING,
        logs: [
          { agent: 'SetupAgent', message: '설정 수집 시작: ' + setting.title },
          { agent: 'SetupAgent', message: '장르 확인: ' + setting.genre },
          { agent: 'SetupAgent', message: '캐릭터 분석: ' + setting.character_name + ' (' + setting.character_trait + ')' },
        ],
        delay: 1200,
        apply: function () {},
      },
      {
        status: PIPELINE_STATUS.STORYBOARDING,
        logs: [
          { agent: 'StoryAgent', message: '소재 분석 중: ' + setting.topic },
          { agent: 'StoryAgent', message: '4컷 구조 설계 시작' },
          { agent: 'StoryAgent', message: '감정 곡선 생성 완료' },
        ],
        delay: 1500,
        apply: function () {
          const panels = SAMPLE_PANELS.map(function (p, i) {
            return Object.assign({ id: i + 1 }, p);
          });
          WebtoonState.setState({ panels: panels });
        },
      },
      {
        status: PIPELINE_STATUS.RENDERING,
        logs: [
          { agent: 'DrawingAgent', message: '배경색 팔레트 적용 중' },
          { agent: 'DrawingAgent', message: '말풍선 레이아웃 최적화' },
          { agent: 'DrawingAgent', message: '캐릭터 감정 이모지 매핑 완료' },
        ],
        delay: 1200,
        apply: function () {},
      },
      {
        status: PIPELINE_STATUS.DONE,
        logs: [
          { agent: 'StrategyAgent', message: '파이프라인 완료. 4컷 웹툰 생성 성공!' },
        ],
        delay: 0,
        apply: function () {},
      },
    ];

    let stepIndex = 0;
    function runStep() {
      if (stepIndex >= steps.length) return;
      const step = steps[stepIndex];
      WebtoonState.setState({ pipeline_status: step.status });
      step.logs.forEach(function (log) { WebtoonState.appendLog(log.agent, log.message); });
      step.apply();
      stepIndex++;
      if (stepIndex < steps.length) setTimeout(runStep, step.delay || 1000);
    }
    runStep();
  }

  function initComponents() {
    SetupAgentComponent.init(document.getElementById('tab-setup'));
    StoryboardComponent.init(document.getElementById('tab-storyboard'));
    WebtoonRendererComponent.init(document.getElementById('tab-webtoon'));
    AgentLogComponent.init(document.getElementById('js-agent-log'));
    StrategyComponent.init(document.getElementById('tab-strategy'));
  }

  function bindPipelineStart() {
    WebtoonState.on('pipeline:start', function (setting) {
      WebtoonState.resetState();
      WebtoonState.setState({ setting: setting, pipeline_status: PIPELINE_STATUS.IDLE });
      WebtoonState.appendLog('오케스트레이터', '파이프라인 시작');
      runPipeline(setting);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initBadge();
    initComponents();
    bindPipelineStart();
    WebtoonState.appendLog('시스템', '4컷 웹툰 오케스트레이터 준비 완료');
  });

})();
```

### CSS 클래스 레퍼런스
| 클래스 | 파일 | 설명 |
|--------|------|------|
| (없음) | — | Phase 7은 JS 부트스트랩 전용 |

### 완료 기준
- 페이지 로드 시 모든 컴포넌트 초기화 완료
- "파이프라인 시작" 클릭 시 상태가 `collecting → storyboarding → rendering → done` 순서로 전환
- 각 단계에서 에이전트 로그 추가
- storyboarding 단계에서 패널 데이터 삽입 → 스토리보드/웹툰 탭 자동 업데이트

### 가시적 산출물
- 파이프라인 시작 후 전체 플로우 동작 확인 (시뮬레이션)

---

## Phase 8: 스타일 완성

**목표**: `webtoon-panels.css`와 `webtoon-animations.css`로 모든 컴포넌트 스타일을 완성한다.

**예상 소요 시간**: 15분

### 대상 파일 (신규 생성)
- `webtoon/css/webtoon-panels.css`
- `webtoon/css/webtoon-animations.css`

### 수정 금지 파일
- `css/webtoon-tokens.css`
- `css/webtoon-layout.css`
- Phase 0~7에서 생성된 모든 JS 파일

### 세부 구현 지침

#### `css/webtoon-panels.css` (핵심 스니펫)
```css
.section-title {
  font-size: var(--wt-size-lg);
  font-weight: 700;
  margin-bottom: var(--wt-space-md);
}

/* 버튼 */
.btn {
  display: inline-flex; align-items: center; gap: var(--wt-space-xs);
  padding: var(--wt-space-sm) var(--wt-space-md);
  border: 1px solid transparent; border-radius: var(--wt-radius);
  cursor: pointer; font-size: var(--wt-size-sm); font-family: inherit;
  transition: background var(--wt-transition), border-color var(--wt-transition);
}
.btn--primary  { background: var(--wt-accent); color: #fff; }
.btn--primary:hover { background: var(--wt-accent-hover); }
.btn--outline  { background: transparent; border-color: var(--wt-border); color: var(--wt-text-primary); }
.btn--outline:hover { background: var(--wt-bg-elevated); }
.btn--sm { padding: 4px 10px; font-size: var(--wt-size-xs); }
.btn--lg { padding: var(--wt-space-md) var(--wt-space-xl); font-size: var(--wt-size-md); }

/* 설정 폼 */
.setup-form { max-width: 560px; }
.setup-presets { display: flex; flex-wrap: wrap; gap: var(--wt-space-sm); margin-bottom: var(--wt-space-lg); }
.setup-label { font-size: var(--wt-size-xs); color: var(--wt-text-secondary); margin-bottom: var(--wt-space-xs); }
.setup-fields { display: flex; flex-direction: column; gap: var(--wt-space-md); }
.form-group { display: flex; flex-direction: column; gap: var(--wt-space-xs); }
.form-label { font-size: var(--wt-size-sm); color: var(--wt-text-secondary); }
.form-input, .form-select {
  padding: var(--wt-space-sm) var(--wt-space-md);
  background: var(--wt-bg-elevated); border: 1px solid var(--wt-border);
  border-radius: var(--wt-radius); color: var(--wt-text-primary);
  font-size: var(--wt-size-md); font-family: inherit;
}
.form-input:focus, .form-select:focus { outline: none; border-color: var(--wt-accent); }
#js-start-btn { margin-top: var(--wt-space-lg); width: 100%; justify-content: center; }

/* 스토리보드 */
.sb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--wt-space-md); }
.sb-panel {
  background: var(--wt-bg-surface); border: 1px solid var(--wt-border);
  border-radius: var(--wt-radius-lg); padding: var(--wt-space-md);
  display: flex; flex-direction: column; gap: var(--wt-space-sm);
}
.sb-panel__num { font-size: var(--wt-size-xs); font-weight: 700; color: var(--wt-accent); text-transform: uppercase; }
.sb-field-label { font-size: var(--wt-size-xs); color: var(--wt-text-secondary); }
.sb-situation, .sb-emotion { font-size: var(--wt-size-sm); }
.sb-dialogue-edit {
  width: 100%; background: var(--wt-bg-elevated); border: 1px solid var(--wt-border);
  border-radius: var(--wt-radius); color: var(--wt-text-primary);
  font-size: var(--wt-size-sm); font-family: inherit;
  padding: var(--wt-space-sm); resize: vertical;
}

/* 웹툰 렌더러 */
.wt-comic-title { font-size: var(--wt-size-xl); font-weight: 900; margin-bottom: var(--wt-space-lg); text-align: center; }
.wt-comic-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 3px; background: #000; border: 3px solid #000;
  border-radius: var(--wt-radius); overflow: hidden;
  max-width: 700px; margin: 0 auto;
}
.wt-comic-panel {
  position: relative; background-color: var(--panel-bg, #fff);
  min-height: 220px; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: var(--wt-space-md); gap: var(--wt-space-sm);
}
.wt-comic-panel__num { position: absolute; top: var(--wt-space-xs); left: var(--wt-space-xs); font-size: var(--wt-size-xs); font-weight: 700; color: rgba(0,0,0,0.4); }
.wt-comic-character { font-size: 3.5rem; line-height: 1; }
.wt-comic-name { font-size: var(--wt-size-xs); font-weight: 700; color: rgba(0,0,0,0.6); }
.wt-speech-bubble {
  position: relative; background: #fff; border: 2px solid #000;
  border-radius: 12px; padding: var(--wt-space-xs) var(--wt-space-sm);
  max-width: 90%; text-align: center;
}
.wt-speech-bubble::after {
  content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: #000;
}
.wt-speech-bubble__text { font-size: var(--wt-size-sm); color: #000; font-weight: 600; line-height: 1.4; }
.wt-comic-caption { position: absolute; bottom: var(--wt-space-xs); left: 0; right: 0; text-align: center; font-size: var(--wt-size-xs); color: rgba(0,0,0,0.5); padding: 0 var(--wt-space-xs); }
.wt-print-btn { margin-top: var(--wt-space-lg); display: block; margin-left: auto; margin-right: auto; }

/* 에이전트 로그 */
.log-header { font-size: var(--wt-size-xs); font-weight: 700; color: var(--wt-text-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--wt-space-sm); }
.log-entry { display: flex; flex-direction: column; gap: 2px; padding: var(--wt-space-xs) 0; border-bottom: 1px solid var(--wt-border); font-size: var(--wt-size-xs); }
.log-entry__ts   { color: var(--wt-text-secondary); font-family: var(--wt-font-mono); }
.log-entry__agent { display: inline-block; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; width: fit-content; }
.log-entry__msg  { color: var(--wt-text-primary); line-height: 1.4; }
.log-agent--setup    { background: #3b82f620; color: #60a5fa; }
.log-agent--story    { background: #8b5cf620; color: #a78bfa; }
.log-agent--drawing  { background: #10b98120; color: #34d399; }
.log-agent--strategy { background: #f59e0b20; color: #fbbf24; }
.log-agent--editor   { background: #ef444420; color: #f87171; }
.log-agent--default  { background: var(--wt-bg-elevated); color: var(--wt-text-secondary); }

/* 전략 체크리스트 */
.strategy-list { list-style: none; display: flex; flex-direction: column; gap: var(--wt-space-sm); max-width: 480px; }
.strategy-item {
  display: flex; align-items: center; gap: var(--wt-space-md);
  padding: var(--wt-space-sm) var(--wt-space-md);
  background: var(--wt-bg-surface); border: 1px solid var(--wt-border);
  border-radius: var(--wt-radius); transition: border-color var(--wt-transition);
}
.strategy-item--done   { border-color: var(--wt-success); }
.strategy-item--active { border-color: var(--wt-accent); background: var(--wt-bg-elevated); }
.strategy-item__icon   { font-size: var(--wt-size-md); width: 20px; text-align: center; color: var(--wt-text-secondary); }
.strategy-item--done .strategy-item__icon   { color: var(--wt-success); }
.strategy-item--active .strategy-item__icon { color: var(--wt-accent); }
.strategy-item__label  { flex: 1; font-size: var(--wt-size-sm); font-weight: 600; }
.strategy-item__agent  { font-size: var(--wt-size-xs); color: var(--wt-text-secondary); }
.strategy-summary { margin-top: var(--wt-space-lg); }
.strategy-summary__progress { font-size: var(--wt-size-sm); color: var(--wt-text-secondary); }
```

#### `css/webtoon-animations.css`
```css
/* 탭 전환 페이드인 */
.wt-panel--active { animation: wt-fade-in 200ms ease forwards; }
@keyframes wt-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 로그 신규 항목 슬라이드인 */
.log-entry--new { animation: log-slide-in 250ms ease forwards; }
@keyframes log-slide-in {
  from { opacity: 0; transform: translateX(8px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* 말풍선 팝 등장 */
.wt-speech-bubble { animation: bubble-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes bubble-pop {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}

/* 파이프라인 진행 중 배지 펄스 */
.wt-badge--collecting,
.wt-badge--storyboarding,
.wt-badge--rendering { animation: badge-pulse 1.5s ease-in-out infinite; }
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

/* 스토리보드 패널 등장 */
.sb-panel { animation: panel-slide-up 300ms ease forwards; }
@keyframes panel-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### CSS 클래스 레퍼런스
(Phase 2~6 레퍼런스 테이블 참조 — 모든 클래스가 이 파일에서 구현됨)

### 완료 기준
- 모든 탭 전환 시 페이드인 애니메이션 동작
- 파이프라인 실행 중 배지 펄스 애니메이션
- 웹툰 컷의 말풍선 팝 애니메이션
- 로그 신규 항목 슬라이드인 애니메이션
- 인쇄 미리보기에서 웹툰 4컷만 표시 (흰 배경)

### 가시적 산출물
- 완성된 4컷 웹툰 오케스트레이션 페이지 (모든 애니메이션 동작)

---

## 의존성 그래프 (ASCII)

```
Phase 0: Foundation
  constants.js + webtoon-state.js
        |
        v
Phase 1: HTML Shell + CSS Tokens + Layout
  index.html + webtoon-tokens.css + webtoon-layout.css
        |
        +------------------------------------------+
        |                                          |
        v                                          |
Phase 2: SetupAgent       [병렬 가능]              |
  setup-agent.js                                   |
                                                   |
Phase 3: Storyboard       [병렬 가능]              |
  storyboard.js                                    |
                                                   |
Phase 4: WebtoonRenderer  [병렬 가능]              |
  webtoon-renderer.js                              |
                                                   |
Phase 5: AgentLog         [병렬 가능]              |
  agent-log.js                                     |
                                                   |
Phase 6: Strategy         [병렬 가능]              |
  strategy.js                                      |
        |                                          |
        +------------------------------------------+
                          |
                          v
             Phase 7: Pipeline Bootstrap
                      main.js
                          |
                          v
             Phase 8: Style Completion
               webtoon-panels.css
               webtoon-animations.css
                          |
                          v
                    완성 (Done)
```

**병렬 실행 가능 구간**:
- Phase 1 완료 후 Phase 2~6은 동시 병렬 작업 가능
- Phase 7은 Phase 2~6 전체 완료 후 시작
- Phase 8은 Phase 7과 병렬 가능 (CSS이므로 JS에 의존하지 않음)

---

## Phase별 예상 소요 시간 요약

| Phase | 이름 | 소요 시간 | 병렬 여부 |
|-------|------|-----------|-----------|
| Phase 0 | Foundation (constants + state) | 15분 | 직렬 (블로커) |
| Phase 1 | HTML Shell + CSS Tokens + Layout | 15분 | 직렬 (블로커) |
| Phase 2 | 설정 에이전트 (setup-agent.js) | 20분 | 병렬 가능 |
| Phase 3 | 스토리보드 (storyboard.js) | 20분 | 병렬 가능 |
| Phase 4 | 웹툰 렌더러 (webtoon-renderer.js) | 20분 | 병렬 가능 |
| Phase 5 | 에이전트 로그 (agent-log.js) | 15분 | 병렬 가능 |
| Phase 6 | 전략 체크리스트 (strategy.js) | 15분 | 병렬 가능 |
| Phase 7 | 파이프라인 부트스트랩 (main.js) | 10분 | 직렬 (통합) |
| Phase 8 | 스타일 완성 (panels + animations) | 15분 | 직렬 (마무리) |
| **합계** | **직렬 총합** | **145분** | — |
| **합계** | **병렬 최적** | **75분** | Phase 2~6 동시 실행 시 |

> **직렬 총합**: 15 + 15 + 20 + 20 + 20 + 15 + 15 + 10 + 15 = **145분**  
> **병렬 최적**: Phase 0(15) + Phase 1(15) + Phase 2~6 병렬(20) + Phase 7(10) + Phase 8(15) = **75분**

---

*계획서 끝*
