# Multi-Agent Orchestration Management Dashboard — 구현 계획서

> 작성일: 2026-05-21  
> 대상: 순수 HTML + CSS + JS (프레임워크 없음, 번들러 없음)  
> 최소 지원 화면: 1280px, 다크 테마 기본

---

## 전체 파일 구조

```
dashboard/
├── index.html
├── css/
│   ├── tokens.css       # CSS 커스텀 프로퍼티 (색상, 간격, 타이포)
│   ├── layout.css       # 그리드 / 플렉스 레이아웃
│   ├── components.css   # 카드, 배지, 버튼, 테이블
│   └── animations.css   # 트랜지션, 키프레임
├── js/
│   ├── constants.js     # 열거형, 설정값
│   ├── mock-data.js     # 모든 목 데이터
│   ├── app-state.js     # 중앙 상태 + 이벤트 에미터
│   ├── agents.js        # 에이전트 카드 로직
│   ├── tasks.js         # 태스크 목록 로직
│   ├── logs.js          # 로그 / 메모 로직
│   ├── checklist.js     # 전략 체크리스트 로직
│   └── main.js          # 부트스트랩
└── assets/icons/        # SVG 아이콘
```

---

## 아키텍처 규칙 (전 Phase 공통)

| 규칙 | 내용 |
|------|------|
| 모듈 시스템 | ES 모듈 없음 — `<script>` 태그 순서대로 로드 |
| 전역 상태 | `window.AppState` 단일 객체 |
| 컴포넌트 인터페이스 | 각 컴포넌트는 `init()` 와 `update()` 만 외부에 노출 |
| XSS 방지 | 사용자 데이터 렌더링 시 `innerHTML` 절대 금지, `textContent` 사용 |
| 잠금 파일 | `constants.js`, `mock-data.js` 는 Foundation 완료 후 수정 금지 |

---

## Phase 1 — Foundation (상수 + 목 데이터 + AppState)

### 목표
모든 후속 Phase 가 의존하는 데이터 스키마, 열거형, 중앙 상태 관리 모듈을 완성한다.

### 예상 소요 시간
15분

### 대상 파일 (신규 생성)
- `js/constants.js`
- `js/mock-data.js`
- `js/app-state.js`

### 수정 금지 파일
없음 (첫 번째 Phase)

### 세부 구현 지침

**`js/constants.js`**
```js
// 에이전트 상태 열거형
const AGENT_STATUS = Object.freeze({
  IDLE:    'idle',
  RUNNING: 'running',
  ERROR:   'error',
  OFFLINE: 'offline',
  PAUSED:  'paused',
});

// 태스크 상태 열거형
const TASK_STATUS = Object.freeze({
  PENDING:   'pending',
  QUEUED:    'queued',
  RUNNING:   'running',
  COMPLETED: 'completed',
  FAILED:    'failed',
  CANCELLED: 'cancelled',
});

// 로그 레벨 열거형
const LOG_LEVEL = Object.freeze({
  INFO:  'INFO',
  WARN:  'WARN',
  ERROR: 'ERROR',
});

// 모델 전략 열거형
const MODEL_STRATEGY = Object.freeze({
  COMMITTEE: 'committee',
  LEADER:    'leader',
});

// 자동 갱신 기본 주기 (밀리초)
const AUTO_REFRESH_INTERVAL = 5000;
```

**`js/mock-data.js`**
- 에이전트 6개 이상 (각 에이전트: `id`, `name`, `type`, `model`, `status`, `current_task`, `uptime`, `last_active`)
- 태스크 10개 이상 (각 태스크: `id`, `title`, `status`, `assigned_agent_id`, `created_at`, `updated_at`)
- 로그 엔트리 20개 이상 (각 로그: `id`, `timestamp`, `level`, `message`, `source`)
- 메모 3개 이상 (각 메모: `id`, `timestamp`, `content`)
- 전략 체크리스트 항목 (`id`, `label`, `strategy`, `enabled`, `description`)
- 모든 데이터는 `window.MOCK_DATA = { agents, tasks, logs, memos, checklist }` 로 노출

**`js/app-state.js`**
```js
window.AppState = {
  agents: [],
  tasks: [],
  logs: [],
  memos: [],
  checklist: [],
  theme: 'dark',
  autoRefresh: true,
  refreshInterval: AUTO_REFRESH_INTERVAL,
  agentFilter: 'all',
  logLevelFilter: 'all',
  logSearch: '',
  taskSort: 'created_at',
  taskFilter: 'all',
  activeStrategy: MODEL_STRATEGY.LEADER,

  _listeners: {},

  on(event, fn) { /* 구독 */ },
  off(event, fn) { /* 구독 해제 */ },
  emit(event, payload) { /* 발행 */ },
  setState(patch) {
    // Object.assign 후 'stateChange' 이벤트 emit
  },
};
```

### 완료 기준 (검증 방법)
- 브라우저 콘솔에서 `window.AppState`, `window.MOCK_DATA`, `AGENT_STATUS` 등 접근 가능
- `AppState.on('stateChange', fn)` 등록 후 `AppState.setState({ theme: 'light' })` 호출 시 `fn` 실행 확인
- 목 데이터 개수 조건 충족 (에이전트 ≥ 6, 태스크 ≥ 10, 로그 ≥ 20)

### 이 Phase 의 가시적 산출물
없음 (JS 모듈만 존재, 화면 없음)

---

## Phase 2 — HTML 셸 + CSS 토큰 + 레이아웃

### 목표
전체 페이지 뼈대(HTML), 디자인 토큰(CSS 변수), 4-패널 그리드 레이아웃을 완성한다.

### 예상 소요 시간
15분

### 대상 파일 (신규 생성)
- `index.html`
- `css/tokens.css`
- `css/layout.css`

### 수정 금지 파일
- `js/constants.js`
- `js/mock-data.js`
- `js/app-state.js`

### 세부 구현 지침

**`css/tokens.css`** — CSS 커스텀 프로퍼티
```css
:root {
  --color-bg-base:       #0f1117;
  --color-bg-surface:    #1a1d27;
  --color-bg-elevated:   #252836;
  --color-border:        #2e3248;
  --color-text-primary:  #e2e8f0;
  --color-text-secondary:#94a3b8;
  --color-text-muted:    #64748b;
  --color-accent:        #6366f1;
  --color-accent-hover:  #818cf8;

  --color-status-idle:      #64748b;
  --color-status-running:   #22c55e;
  --color-status-error:     #ef4444;
  --color-status-offline:   #374151;
  --color-status-paused:    #f59e0b;

  --color-task-pending:   #94a3b8;
  --color-task-queued:    #a78bfa;
  --color-task-running:   #22c55e;
  --color-task-completed: #3b82f6;
  --color-task-failed:    #ef4444;
  --color-task-cancelled: #6b7280;

  --color-log-info:  #60a5fa;
  --color-log-warn:  #f59e0b;
  --color-log-error: #ef4444;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --font-sans: 'Inter', 'Pretendard', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   17px;
  --text-xl:   20px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-sm: 0 1px 3px rgba(0,0,0,.4);
  --shadow-md: 0 4px 12px rgba(0,0,0,.5);
}

[data-theme="light"] {
  --color-bg-base:       #f8fafc;
  --color-bg-surface:    #ffffff;
  --color-bg-elevated:   #f1f5f9;
  --color-border:        #e2e8f0;
  --color-text-primary:  #0f172a;
  --color-text-secondary:#475569;
  --color-text-muted:    #94a3b8;
}
```

**`css/layout.css`** — 레이아웃
- `body`: `font-family: var(--font-sans)`, `background: var(--color-bg-base)`, `color: var(--color-text-primary)`
- `.dashboard-root`: CSS Grid, `grid-template-rows: auto 1fr`, `min-height: 100vh`
- `.top-bar`: 헤더 (로고, 제목, 테마 토글, 자동갱신 토글), `height: 56px`, flex row
- `.panel-grid`: 4개 패널 그리드
  - `grid-template-columns: 1fr 1fr`, `grid-template-rows: 1fr 1fr`, `gap: var(--space-4)`, `padding: var(--space-4)`
  - `.panel`: `background: var(--color-bg-surface)`, `border-radius: var(--radius-lg)`, `border: 1px solid var(--color-border)`, `overflow: hidden`, `display: flex`, `flex-direction: column`
  - `.panel-header`: `height: 48px`, flex row, `border-bottom: 1px solid var(--color-border)`
  - `.panel-body`: `flex: 1`, `overflow-y: auto`, `padding: var(--space-4)`
- 4개 패널 ID: `#panel-agents`, `#panel-tasks`, `#panel-logs`, `#panel-checklist`

**`index.html`**
- `<head>`: tokens.css → layout.css → components.css → animations.css 순서로 링크
- `<body>`: `.dashboard-root` > `.top-bar` + `.panel-grid`
- `.top-bar` 내: 좌측 로고+제목, 우측 `#btn-theme-toggle` + `#btn-auto-refresh` + `#refresh-status`
- `.panel-grid` 내: 4개 `.panel` (각각 `.panel-header` + `.panel-body`)
- 패널 헤더에 `.panel-title` + `.notification-badge` (숨김 상태 초기값)
- `<body>` 맨 아래: constants.js → mock-data.js → app-state.js → agents.js → tasks.js → logs.js → checklist.js → main.js 순서로 `<script>` 태그

### 완료 기준 (검증 방법)
- 브라우저에서 `index.html` 열면 다크 배경의 4분할 패널 그리드 표시
- DevTools > Elements 에서 CSS 변수 값 확인 가능
- 콘솔 오류 없음

### 이 Phase 의 가시적 산출물
빈 4-패널 다크 대시보드 레이아웃 (콘텐츠 없음)

---

## Phase 3 — Agent Cards 컴포넌트

### 목표
에이전트 목록을 카드 형식으로 렌더링하고, 상태별 필터링 기능을 구현한다.

### 예상 소요 시간
20분

### 대상 파일 (신규 생성 / 수정)
- `js/agents.js` (신규)
- `css/components.css` (신규 — 에이전트 카드 관련 클래스 추가)

### 수정 금지 파일
- `js/constants.js`, `js/mock-data.js`, `js/app-state.js`
- `index.html` (구조 변경 금지, 내용 삽입만 가능)

### CSS 클래스 레퍼런스 (components.css 에 정의)

| 클래스 | 설명 |
|--------|------|
| `.agent-filter-bar` | 필터 버튼 행 컨테이너 |
| `.filter-btn` | 개별 필터 버튼 |
| `.filter-btn.active` | 선택된 필터 버튼 |
| `.agent-grid` | 에이전트 카드 그리드 (auto-fill, min 200px) |
| `.agent-card` | 단일 에이전트 카드 |
| `.agent-card__header` | 카드 헤더 (이름 + 상태 표시) |
| `.agent-card__status-dot` | 상태 색상 원형 점 |
| `.agent-card__name` | 에이전트 이름 |
| `.agent-card__type-badge` | 타입 배지 (explore/build 등) |
| `.agent-card__body` | 카드 본문 (모델, 현재 태스크, 업타임 등) |
| `.agent-card__field` | 레이블 + 값 한 행 |
| `.agent-card__field-label` | 필드 레이블 |
| `.agent-card__field-value` | 필드 값 |
| `.status-badge` | 상태 텍스트 배지 |
| `.status-badge--idle` | 유휴 배지 |
| `.status-badge--running` | 실행 중 배지 |
| `.status-badge--error` | 오류 배지 |
| `.status-badge--offline` | 오프라인 배지 |
| `.status-badge--paused` | 일시중지 배지 |

### 세부 구현 지침

**`js/agents.js`**
```js
window.AgentsComponent = {
  _container: null,

  init() {
    this._container = document.querySelector('#panel-agents .panel-body');
    this._renderFilterBar();
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderFilterBar() {
    // 필터 버튼: All, Idle, Running, Error, Offline, Paused
    // 클릭 시 AppState.setState({ agentFilter: value })
    // 각 버튼 textContent 사용
  },

  _buildCard(agent) {
    // DOM 요소로 카드 구성 — innerHTML 절대 사용 금지
    // textContent 로 모든 텍스트 설정
    // status 에 따라 .agent-card__status-dot 배경색 CSS 변수 적용
    // uptime: 초 단위 숫자를 "Xh Ym" 형식으로 변환
    // last_active: ISO 문자열을 "N분 전" 형식으로 변환
    // 반환: article.agent-card 요소
  },

  update() {
    const { agents, agentFilter } = AppState;
    const filtered = agentFilter === 'all'
      ? agents
      : agents.filter(a => a.status === agentFilter);
    // .agent-grid 초기화 후 카드 재렌더링
    // 빈 결과 시 "해당 상태의 에이전트가 없습니다" 메시지 표시
    // notification badge: error 상태 에이전트 수 업데이트
  },
};
```

### 완료 기준 (검증 방법)
- `#panel-agents` 패널에 에이전트 카드 6개 이상 표시
- 상태 점 색상이 `--color-status-*` 변수와 일치
- 필터 버튼 클릭 시 카드 목록 필터링 동작
- XSS 테스트: `MOCK_DATA.agents[0].name = '<img onerror=alert(1) src=x>'` 후 `update()` → 태그가 텍스트로 표시됨

### 이 Phase 의 가시적 산출물
에이전트 패널에 상태 표시, 필터 버튼, 카드 그리드 표시

---

## Phase 4 — Task Status List 컴포넌트

### 목표
태스크 목록을 테이블/리스트 형식으로 렌더링하고, 상태 필터 및 정렬 기능을 구현한다.

### 예상 소요 시간
20분

### 대상 파일 (신규 생성 / 수정)
- `js/tasks.js` (신규)
- `css/components.css` (태스크 관련 클래스 추가)

### 수정 금지 파일
- `js/constants.js`, `js/mock-data.js`, `js/app-state.js`
- `js/agents.js`
- `css/tokens.css`, `css/layout.css`

### CSS 클래스 레퍼런스

| 클래스 | 설명 |
|--------|------|
| `.task-toolbar` | 필터 + 정렬 컨트롤 컨테이너 |
| `.task-filter-select` | 상태 필터 `<select>` |
| `.task-sort-select` | 정렬 기준 `<select>` |
| `.task-table` | 태스크 테이블 |
| `.task-table th` | 헤더 셀 |
| `.task-table td` | 데이터 셀 |
| `.task-row` | 태스크 행 |
| `.task-row:hover` | 행 호버 |
| `.task-status-badge` | 태스크 상태 배지 |
| `.task-status-badge--pending` | 대기 배지 |
| `.task-status-badge--queued` | 큐 배지 |
| `.task-status-badge--running` | 실행 중 배지 |
| `.task-status-badge--completed` | 완료 배지 |
| `.task-status-badge--failed` | 실패 배지 |
| `.task-status-badge--cancelled` | 취소 배지 |
| `.task-empty` | 빈 결과 메시지 |

### 세부 구현 지침

**`js/tasks.js`**
```js
window.TasksComponent = {
  _container: null,

  init() {
    this._container = document.querySelector('#panel-tasks .panel-body');
    this._renderToolbar();
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderToolbar() {
    // 상태 필터 <select>: All, Pending, Queued, Running, Completed, Failed, Cancelled
    // 정렬 <select>: 최신순(created_at), 상태순(status), 제목순(title)
    // change 이벤트에서 AppState.setState({ taskFilter, taskSort })
  },

  _buildRow(task, agents) {
    // tr.task-row 생성 (innerHTML 금지)
    // 컬럼: 태스크 제목, 상태 배지, 담당 에이전트 이름, 생성 시각
    // 에이전트 이름: agents.find(a => a.id === task.assigned_agent_id)?.name ?? '미배정'
  },

  _sortTasks(tasks) {
    // AppState.taskSort 기준으로 배열 복사 후 정렬 반환
  },

  _filterTasks(tasks) {
    // AppState.taskFilter === 'all' 이면 전체 반환
  },

  update() {
    const { tasks, agents } = AppState;
    const filtered = this._filterTasks(tasks);
    const sorted   = this._sortTasks(filtered);
    // 테이블 재렌더링
    // notification badge: running + queued 태스크 수 업데이트
  },
};
```

### 완료 기준 (검증 방법)
- `#panel-tasks` 패널에 태스크 테이블 표시 (10개 이상 행)
- 상태 필터 변경 시 행 목록 즉시 갱신
- 정렬 변경 시 순서 변경 확인
- notification badge 에 running/queued 태스크 수 표시

### 이 Phase 의 가시적 산출물
태스크 패널에 필터/정렬 컨트롤과 상태 배지가 있는 테이블 표시

---

## Phase 5 — Log / Memo Panel 컴포넌트

### 목표
시스템 로그와 사용자 메모를 탭으로 구분하여 표시하고, 로그 레벨 필터, 검색, 로그 내보내기 기능을 구현한다.

### 예상 소요 시간
20분

### 대상 파일 (신규 생성 / 수정)
- `js/logs.js` (신규)
- `css/components.css` (로그 관련 클래스 추가)

### 수정 금지 파일
- `js/constants.js`, `js/mock-data.js`, `js/app-state.js`
- `js/agents.js`, `js/tasks.js`
- `css/tokens.css`, `css/layout.css`

### CSS 클래스 레퍼런스

| 클래스 | 설명 |
|--------|------|
| `.log-tab-bar` | 탭 버튼 컨테이너 |
| `.log-tab-btn` | 개별 탭 버튼 (Logs / Memos) |
| `.log-tab-btn.active` | 선택된 탭 |
| `.log-toolbar` | 필터 + 검색 + 내보내기 컨테이너 |
| `.log-level-filter` | 레벨 필터 버튼 그룹 |
| `.log-level-btn` | 개별 레벨 필터 버튼 |
| `.log-level-btn.active` | 선택된 레벨 필터 |
| `.log-search-input` | 로그 검색 `<input>` |
| `.log-export-btn` | 로그 내보내기 버튼 |
| `.log-list` | 로그 엔트리 목록 |
| `.log-entry` | 단일 로그 엔트리 행 |
| `.log-entry--info` | INFO 레벨 배경/색상 |
| `.log-entry--warn` | WARN 레벨 배경/색상 |
| `.log-entry--error` | ERROR 레벨 배경/색상 |
| `.log-entry__time` | 타임스탬프 |
| `.log-entry__level` | 레벨 배지 |
| `.log-entry__source` | 소스 모듈명 |
| `.log-entry__message` | 메시지 본문 |
| `.memo-list` | 메모 목록 |
| `.memo-entry` | 단일 메모 항목 |
| `.memo-entry__time` | 메모 작성 시각 |
| `.memo-entry__content` | 메모 내용 |
| `.memo-compose` | 메모 입력 영역 |
| `.memo-input` | 메모 텍스트 `<textarea>` |
| `.memo-submit-btn` | 메모 제출 버튼 |

### 세부 구현 지침

**`js/logs.js`**
```js
window.LogsComponent = {
  _container: null,
  _activeTab: 'logs',

  init() {
    this._container = document.querySelector('#panel-logs .panel-body');
    this._renderTabBar();
    this._renderToolbar();
    this._renderMemoCompose();
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderTabBar() {
    // Logs 탭, Memos 탭 버튼 생성
    // 클릭 시 this._activeTab 변경 후 this.update() 호출
  },

  _renderToolbar() {
    // 레벨 필터 버튼: All, INFO, WARN, ERROR
    // 검색 input: input 이벤트에서 AppState.setState({ logSearch: value })
    // 내보내기 버튼: _exportLogs() 호출
  },

  _exportLogs() {
    // 현재 필터/검색이 적용된 로그를 텍스트로 직렬화
    // Blob + 다운로드 링크로 logs_export_{timestamp}.txt 다운로드
    // 각 행 형식: [timestamp] [level] [source] message
  },

  _buildLogEntry(log) {
    // div.log-entry 생성 (innerHTML 금지)
    // level 에 따라 .log-entry--info / --warn / --error 클래스 추가
    // textContent 사용
  },

  _buildMemoEntry(memo) {
    // div.memo-entry 생성 (innerHTML 금지)
  },

  _renderMemoCompose() {
    // textarea.memo-input + 제출 버튼
    // 제출 시 새 메모 객체를 AppState.memos 앞에 추가
    // 제출 후 textarea 초기화
  },

  _filterLogs(logs) {
    // logLevelFilter 및 logSearch 기준 필터링
    // logSearch: level, source, message 필드에서 대소문자 무시 부분 일치
  },

  update() {
    if (this._activeTab === 'logs') {
      // 필터링된 로그 렌더링 (최신순)
      // notification badge: error 로그 수 업데이트
    } else {
      // 메모 목록 렌더링 (최신순)
    }
  },
};
```

### 완료 기준 (검증 방법)
- `#panel-logs` 패널에 탭 바, 툴바, 로그 목록 표시
- 레벨 필터 버튼 클릭 시 해당 레벨만 표시
- 검색어 입력 시 실시간 필터링 동작
- "내보내기" 클릭 시 `.txt` 파일 다운로드
- Memos 탭 클릭 시 메모 목록 + 입력창 표시, 메모 추가 가능
- ERROR 레벨 로그 수가 notification badge 에 반영

### 이 Phase 의 가시적 산출물
로그 패널에 탭, 레벨별 색상 코딩, 검색, 내보내기, 메모 입력 기능 표시

---

## Phase 6 — Model Strategy Checklist 컴포넌트

### 목표
Committee vs. Leader 전략 선택과 각 전략별 설정 항목 토글을 구현한다.

### 예상 소요 시간
15분

### 대상 파일 (신규 생성 / 수정)
- `js/checklist.js` (신규)
- `css/components.css` (체크리스트 관련 클래스 추가)

### 수정 금지 파일
- `js/constants.js`, `js/mock-data.js`, `js/app-state.js`
- `js/agents.js`, `js/tasks.js`, `js/logs.js`
- `css/tokens.css`, `css/layout.css`

### CSS 클래스 레퍼런스

| 클래스 | 설명 |
|--------|------|
| `.strategy-selector` | 전략 선택 토글 컨테이너 |
| `.strategy-btn` | 개별 전략 버튼 (Committee / Leader) |
| `.strategy-btn.active` | 선택된 전략 버튼 |
| `.strategy-description` | 선택된 전략 설명 텍스트 |
| `.checklist-group` | 전략별 체크리스트 그룹 |
| `.checklist-group__title` | 그룹 제목 |
| `.checklist-item` | 단일 체크리스트 항목 |
| `.checklist-item__toggle` | 토글 스위치 `<input type="checkbox">` |
| `.checklist-item__label` | 항목 레이블 |
| `.checklist-item__description` | 항목 상세 설명 |
| `.checklist-item--enabled` | 활성화된 항목 |
| `.checklist-item--disabled` | 비활성화된 항목 |
| `.config-panel` | 펼쳐지는 설정 패널 |
| `.config-panel.open` | 열린 상태 설정 패널 |
| `.config-panel-toggle` | 설정 패널 토글 버튼 |

### 세부 구현 지침

**`js/checklist.js`**
```js
window.ChecklistComponent = {
  _container: null,

  init() {
    this._container = document.querySelector('#panel-checklist .panel-body');
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderStrategySelector() {
    // Committee / Leader 두 버튼
    // 클릭 시 AppState.setState({ activeStrategy: value })
  },

  _renderStrategyDescription() {
    // Committee: "다수 모델 투표로 합의 도출 — 정확도 우선, 속도 희생"
    // Leader: "리더 모델이 최종 결정, 나머지는 보조 — 속도 우선"
    // textContent 사용
  },

  _buildChecklistItem(item) {
    // div.checklist-item 생성 (innerHTML 금지)
    // checkbox change 이벤트: 해당 item.id 의 enabled 값을 토글
    // item.strategy !== AppState.activeStrategy 이면 .checklist-item--disabled 추가
  },

  _renderConfigPanel() {
    // "고급 설정" 토글 버튼 + .config-panel
    // 토글 버튼 클릭 시 .config-panel.open 클래스 토글
  },

  update() {
    const { checklist, activeStrategy } = AppState;
    // 전략 선택기, 설명, 체크리스트 항목, 설정 패널 렌더링
  },
};
```

### 완료 기준 (검증 방법)
- Committee / Leader 전략 버튼 표시 및 전환 동작
- 전략 전환 시 설명 텍스트 변경 및 항목 활성/비활성 상태 갱신
- 체크박스 토글 시 `AppState.checklist` 업데이트 및 UI 반영
- "고급 설정" 패널 열기/닫기 동작

### 이 Phase 의 가시적 산출물
전략 선택, 체크리스트 항목, 고급 설정 패널이 있는 전략 체크리스트 패널

---

## Phase 7 — 통합 부트스트랩 + AppState 연결

### 목표
`main.js` 에서 모든 컴포넌트를 초기화하고, 목 데이터를 AppState 에 주입하며, 자동 갱신 루프를 시작한다.

### 예상 소요 시간
10분

### 대상 파일 (신규 생성)
- `js/main.js`

### 수정 금지 파일
- 모든 컴포넌트 파일 (`agents.js`, `tasks.js`, `logs.js`, `checklist.js`)
- `js/constants.js`, `js/mock-data.js`, `js/app-state.js`

### 세부 구현 지침

**`js/main.js`**
```js
(function () {
  // 1. AppState 에 목 데이터 주입
  AppState.setState({
    agents:    MOCK_DATA.agents,
    tasks:     MOCK_DATA.tasks,
    logs:      MOCK_DATA.logs,
    memos:     MOCK_DATA.memos,
    checklist: MOCK_DATA.checklist,
  });

  // 2. 컴포넌트 초기화
  AgentsComponent.init();
  TasksComponent.init();
  LogsComponent.init();
  ChecklistComponent.init();

  // 3. 상단 바 버튼 이벤트 연결
  //    #btn-theme-toggle: document.documentElement.dataset.theme 토글
  //    #btn-auto-refresh: autoRefresh 토글

  // 4. 자동 갱신 루프
  //    setInterval 로 AUTO_REFRESH_INTERVAL 주기마다
  //    AppState.autoRefresh 가 true 이면 데이터 시뮬레이션 갱신
})();
```

### 완료 기준 (검증 방법)
- 페이지 로드 시 모든 4개 패널에 데이터 표시
- 자동 갱신 토글 버튼 작동 확인
- 테마 토글 버튼 클릭 시 다크/라이트 모드 전환

### 이 Phase 의 가시적 산출물
4개 패널에 데이터가 채워진 완전히 작동하는 대시보드

---

## Phase 8 — Polish (테마, 애니메이션, 배지, SVG 아이콘)

### 목표
다크/라이트 테마 전환 애니메이션, 컴포넌트 진입 애니메이션, 알림 배지, SVG 아이콘, 반응형 세부 조정을 완성한다.

### 예상 소요 시간
20분

### 대상 파일 (신규 생성 / 수정)
- `css/animations.css` (신규)
- `css/components.css` (배지 + 아이콘 클래스 추가)
- `assets/icons/` (SVG 파일 추가)
- `js/main.js` (아이콘 삽입 로직 추가)

### 수정 금지 파일
- `js/constants.js`, `js/mock-data.js`, `js/app-state.js`
- `js/agents.js`, `js/tasks.js`, `js/logs.js`, `js/checklist.js`

### 세부 구현 지침

**`css/animations.css`**
```css
/* 테마 전환 부드럽게 */
*, *::before, *::after {
  transition: background-color 0.25s ease, color 0.2s ease, border-color 0.2s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.agent-card { animation: fadeInUp 0.2s ease both; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
.refresh-spinner { animation: spin 1s linear infinite; }

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.15); }
}
.notification-badge.pulse { animation: badgePulse 0.6s ease; }

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
.log-entry { animation: slideInLeft 0.15s ease both; }
```

**알림 배지 (`css/components.css` 추가)**
```css
.notification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-1);
  border-radius: 9px;
  background: var(--color-status-error);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: 700;
}
.notification-badge[data-count="0"] { display: none; }
```

**SVG 아이콘 (`assets/icons/`)**
- `agent.svg`, `task.svg`, `log.svg`, `checklist.svg` — 패널 헤더 아이콘
- `moon.svg`, `sun.svg` — 테마 토글 아이콘
- `refresh.svg` — 자동 갱신 아이콘
- `export.svg` — 내보내기 아이콘
- 각 SVG: `width="16" height="16"`, `fill="currentColor"`, `aria-hidden="true"`

### 완료 기준 (검증 방법)
- 테마 토글 클릭 시 부드러운 색상 전환 애니메이션
- 페이지 로드 시 에이전트 카드 fadeInUp 애니메이션
- 오류 상태 에이전트 존재 시 에이전트 패널 헤더에 배지 표시
- ERROR 로그 존재 시 로그 패널 헤더에 배지 표시

### 이 Phase 의 가시적 산출물
애니메이션, 배지, 아이콘이 포함된 완성된 다크/라이트 대시보드

---

## 잠금 CSS 클래스 전체 레퍼런스

### 레이아웃

| 클래스 | 파일 | 설명 |
|--------|------|------|
| `.dashboard-root` | layout.css | 전체 페이지 래퍼 |
| `.top-bar` | layout.css | 상단 헤더 바 |
| `.panel-grid` | layout.css | 4-패널 그리드 |
| `.panel` | layout.css | 개별 패널 |
| `.panel-header` | layout.css | 패널 헤더 |
| `.panel-body` | layout.css | 패널 본문 |
| `.panel-title` | layout.css | 패널 제목 |

### 공통 컴포넌트

| 클래스 | 파일 | 설명 |
|--------|------|------|
| `.notification-badge` | components.css | 알림 수 배지 |
| `.status-badge` | components.css | 에이전트 상태 배지 |
| `.btn` | components.css | 기본 버튼 |
| `.btn--primary` | components.css | 주요 액션 버튼 |
| `.btn--ghost` | components.css | 고스트 버튼 |
| `.filter-btn` | components.css | 필터 버튼 |
| `.filter-btn.active` | components.css | 활성 필터 버튼 |

---

## 의존성 그래프

```
Phase 1 (constants + mock-data + app-state)
    └── Phase 2 (HTML + tokens + layout)
            ├── Phase 3 (agents.js + components.css 일부)
            ├── Phase 4 (tasks.js + components.css 일부)
            ├── Phase 5 (logs.js + components.css 일부)
            └── Phase 6 (checklist.js + components.css 일부)
                    └── Phase 7 (main.js — 통합 부트스트랩)
                                └── Phase 8 (animations.css + 아이콘 + polish)
```

Phase 3~6 은 서로 독립적이므로 병렬 작업 가능합니다.

---

## 총 예상 소요 시간

| Phase | 소요 시간 |
|-------|-----------|
| Phase 1 — Foundation | 15분 |
| Phase 2 — HTML + CSS | 15분 |
| Phase 3 — Agent Cards | 20분 |
| Phase 4 — Task List | 20분 |
| Phase 5 — Log / Memo | 20분 |
| Phase 6 — Checklist | 15분 |
| Phase 7 — Bootstrap | 10분 |
| Phase 8 — Polish | 20분 |
| **합계** | **약 2시간 15분** |

> Phase 3~6 병렬 작업 시 약 1시간 20분으로 단축 가능
