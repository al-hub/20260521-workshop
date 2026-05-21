# 멀티 에이전트 오케스트레이션 대시보드 — 에이전트 팀 설계

> **목표**: 4컷 웹툰 제작 파이프라인을 실시간으로 시각화·제어하는 오케스트레이션 대시보드를 구축한다.
> 에이전트들이 **대시보드를 만들고**, 동시에 그 대시보드 **위에서 실행**된다.

---

## 1. 프로젝트 개요

### 1.1 현재 프로젝트 스택

```
workspace/
├── frontend/          React 19 + Vite + Recharts + Lucide-React
├── backend/           Express + WebSocket (ws)
│   └── server.js      프로세스 모니터링 API 완성 상태
└── .opencode/agents/  21개 역할 에이전트
```

### 1.2 이미 구현된 것

| 항목 | 상태 |
|------|------|
| `GET /api/processes` | ✅ 에이전트 프로세스 감지 |
| `GET /api/system` | ✅ CPU/메모리 시스템 정보 |
| `GET /api/snapshot` | ✅ 프로세스 + 시스템 통합 스냅샷 |
| WebSocket 브로드캐스트 | ✅ 3초 간격 실시간 업데이트 |
| 에이전트 타입 분류 | ✅ AI Agent / Node Agent / Python Agent 등 |

### 1.3 대시보드가 추가로 필요한 것

| 항목 | 담당 에이전트 |
|------|--------------|
| 4컷 파이프라인 DAG 시각화 | `파이프라인시각화담당` (신규) |
| 에이전트별 실행 상태 추적 | `에이전트상태관리담당` (신규) |
| 파이프라인 실행 제어 (시작/정지/재시도) | `파이프라인오케스트레이터` (신규) |
| 에이전트 로그 실시간 스트림 | `실시간로그담당` (신규) |
| 에러 감지 및 자동 복구 | `에러핸들링담당` (신규) |
| React 대시보드 UI 컴포넌트 | `대시보드UI담당` (신규) |
| 백엔드 API 확장 (파이프라인 엔진) | `파이프라인엔진담당` (신규) |

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD (React)                        │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ Pipeline │ │  Agent    │ │  Log     │ │  System Monitor   │ │
│  │  DAG     │ │  Status   │ │  Stream  │ │  CPU / MEM / PROC │ │
│  │  View    │ │  Grid     │ │  Panel   │ │  (기존 기능)       │ │
│  └──────────┘ └───────────┘ └──────────┘ └───────────────────┘ │
│                          WebSocket ↕ REST                       │
└─────────────────────────────────────────────────────────────────┘
                              ↕ ws://localhost:3001
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express + WS)                      │
│  ┌──────────────────┐   ┌───────────────────────────────────┐  │
│  │  기존 API (유지)  │   │        확장 API (신규)             │  │
│  │  /api/processes  │   │  /api/pipeline/status             │  │
│  │  /api/system     │   │  /api/pipeline/run                │  │
│  │  /api/snapshot   │   │  /api/pipeline/stop               │  │
│  │  WS broadcast    │   │  /api/agents/:id/logs             │  │
│  └──────────────────┘   │  /api/agents/:id/retry            │  │
│                          └───────────────────────────────────┘  │
│                   ┌──────────────────────┐                      │
│                   │  Pipeline Engine     │                      │
│                   │  (상태 머신 + 큐)     │                      │
│                   └──────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              ↕ spawn / IPC
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT RUNTIME (21 + 신규)                    │
│  Phase 1: 뉴스수집 ──→ 밈분석 ──→ 캐릭터설계                    │
│  Phase 2:          스토리구성 ──→ B급감성 / 대사다듬기           │
│  Phase 3:                    작화 / 표정연출 (병렬)              │
│  Phase 4:               리듬검수 ──→ 최종검수                   │
│  Phase 5:          HTML구현 ──→ 반응형 / 성능최적화 ──→ 배포     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 에이전트 팀 구성 (총 28명)

### 3.1 오케스트레이션 레이어 — 신규 7명

| # | 에이전트명 | 역할 | 모델 | 파일 |
|---|-----------|------|------|------|
| 1 | **파이프라인오케스트레이터** | 전체 파이프라인 지휘·의존성 관리 | claude-sonnet-4-6 | `pipeline-orchestrator.md` |
| 2 | **에이전트상태관리담당** | 각 에이전트 상태(pending/running/done/fail) 추적 | gpt-5.4-mini | `agent-state-manager.md` |
| 3 | **파이프라인시각화담당** | DAG 시각화 React 컴포넌트 구현 | claude-sonnet-4-6 | `pipeline-visualizer.md` |
| 4 | **실시간로그담당** | 에이전트 stdout/stderr 수집·스트리밍 | gpt-5.4-mini | `realtime-logger.md` |
| 5 | **에러핸들링담당** | 에러 감지·분류·자동 재시도 전략 결정 | claude-sonnet-4-6 | `error-handler.md` |
| 6 | **대시보드UI담당** | React 대시보드 전체 UI 컴포넌트 구현 | claude-sonnet-4-6 | `dashboard-ui.md` |
| 7 | **파이프라인엔진담당** | 백엔드 파이프라인 실행 엔진·API 확장 | claude-sonnet-4-6 | `pipeline-engine.md` |

### 3.2 콘텐츠 기획 레이어 — 기존 3명

| # | 에이전트명 | 역할 | 파이프라인 Phase |
|---|-----------|------|----------------|
| 8 | **뉴스소재수집담당** | 최신 뉴스·밈 소재 수집 | Phase 1 |
| 9 | **밈분석담당** | MZ 밈 포인트 분석 | Phase 1 (병렬) |
| 10 | **캐릭터설계담당** | 고정 캐릭터 3인 설계 | Phase 1 (완료 후) |

### 3.3 스토리·연출 레이어 — 기존 7명

| # | 에이전트명 | 역할 | 파이프라인 Phase |
|---|-----------|------|----------------|
| 11 | **스토리구성담당** | 4컷 흐름·반전 구조 | Phase 2 |
| 12 | **B급감성담당** | 병맛·드립 강화 | Phase 2 (연속) |
| 13 | **작화담당** | 작화 가이드·AI 프롬프트 | Phase 3 |
| 14 | **표정연출담당** | 컷별 표정 가이드 | Phase 3 (병렬) |
| 15 | **대사다듬기담당** | MZ 스타일 대사 정제 | Phase 2 (병렬) |
| 16 | **리듬검수담당** | 4컷 호흡·타이밍 검수 | Phase 4 |
| 17 | **최종검수담당** | 전체 완성도 QA | Phase 4 (완료 후) |

### 3.4 AI 운영 레이어 — 기존 3명

| # | 에이전트명 | 역할 | 실행 시점 |
|---|-----------|------|----------|
| 18 | **AI토큰관리담당** | 토큰 효율 최적화 | 파이프라인 시작 전 |
| 19 | **프롬프트최적화담당** | 프롬프트 구조 최적화 | 파이프라인 시작 전 |
| 20 | **모델선택담당** | 작업별 최적 모델 배치 | 파이프라인 시작 전 |

### 3.5 제작 흐름 레이어 — 기존 3명

| # | 에이전트명 | 역할 | 실행 시점 |
|---|-----------|------|----------|
| 21 | **속도관리담당** | 10분 이내 제작 타이머 관리 | 상시 모니터링 |
| 22 | **작업분배담당** | 병렬 작업 계획·의존성 관리 | 파이프라인 시작 시 |
| 23 | **간소화판단담당** | 시간 초과 시 간소화 결정 | 조건부 호출 |

### 3.6 웹 구현 레이어 — 기존 5명

| # | 에이전트명 | 역할 | 파이프라인 Phase |
|---|-----------|------|----------------|
| 24 | **HTML구현담당** | 웹툰 HTML 페이지 | Phase 5 |
| 25 | **반응형담당** | 모바일·PC 반응형 CSS | Phase 5 (병렬) |
| 26 | **배포담당** | GitHub Pages/Vercel 배포 | Phase 5 (완료 후) |
| 27 | **접근성검수담당** | alt·lang·meta 검수 | Phase 5 (병렬) |
| 28 | **성능최적화담당** | 이미지 lazy loading 등 | Phase 5 (병렬) |

---

## 4. 파이프라인 실행 플로우

```
시작 트리거 (대시보드 "Run Pipeline" 버튼)
         │
         ▼
┌─────────────────┐
│  파이프라인      │  ← 토큰관리 + 모델선택 + 프롬프트최적화 병렬 실행
│  오케스트레이터  │    (사전 설정 완료 후 본 파이프라인 시작)
└────────┬────────┘
         │
    ─────┴──────────────────
    │                       │
    ▼                       ▼
[뉴스소재수집]          [밈분석]          ← Phase 1: 병렬
    │                       │
    └───────────┬───────────┘
                ▼
         [캐릭터설계]                     ← Phase 1: 완료 후
                │
                ▼
         [스토리구성]                     ← Phase 2
         ─────┴──────────
         │               │
         ▼               ▼
    [B급감성]        [대사다듬기]          ← Phase 2: 병렬
         │               │
         └───────┬────────┘
                 │
    ─────────────┴─────────────
    │                          │
    ▼                          ▼
[작화담당]               [표정연출]        ← Phase 3: 병렬
    │                          │
    └──────────┬───────────────┘
               ▼
         [리듬검수]                       ← Phase 4
               │
               ▼
         [최종검수]                       ← Phase 4: 완료 후
               │
    ─────────────────────────────
    │         │        │        │
    ▼         ▼        ▼        ▼
[HTML구현] [반응형] [접근성] [성능최적화]  ← Phase 5: 병렬
    │         │        │        │
    └─────────┴────────┴────────┘
               │
               ▼
            [배포]                        ← Phase 5: 완료 후
               │
               ▼
          ✅ DONE
```

### 4.1 Phase별 시간 목표 (10분 제한)

| Phase | 포함 에이전트 | 목표 시간 | 병렬 가능 |
|-------|------------|---------|---------|
| 사전 설정 | 토큰관리·모델선택·프롬프트최적화 | 0~1분 | ✅ 3개 병렬 |
| Phase 1 | 뉴스수집+밈분석 → 캐릭터 | 1~2분 | ✅ 2개 병렬 |
| Phase 2 | 스토리 → B급+대사 | 2~4분 | ✅ 2개 병렬 |
| Phase 3 | 작화+표정연출 | 4~5분 | ✅ 2개 병렬 |
| Phase 4 | 리듬 → 최종검수 | 5~6분 | ❌ 순차 |
| Phase 5 | HTML+반응형+접근성+성능 → 배포 | 6~9분 | ✅ 4개 병렬 |
| **총계** | | **≤ 10분** | |

---

## 5. 에이전트 상태 데이터 모델

```typescript
// 에이전트 실행 단위
interface AgentTask {
  id: string;                    // "뉴스소재수집-{timestamp}"
  agentName: string;             // "뉴스소재수집담당"
  phase: number;                 // 1~5
  status: AgentStatus;
  startedAt?: string;            // ISO 8601
  completedAt?: string;
  durationMs?: number;
  input?: Record<string, unknown>;
  output?: string;               // 에이전트 출력 요약
  error?: string;
  retryCount: number;            // 최대 2회
  logs: LogEntry[];
}

type AgentStatus =
  | 'waiting'    // 의존 에이전트 완료 대기
  | 'ready'      // 실행 가능 상태 (의존성 해소)
  | 'running'    // 실행 중
  | 'completed'  // 성공 완료
  | 'failed'     // 실패 (재시도 가능)
  | 'retrying'   // 재시도 중
  | 'skipped';   // 간소화로 인한 스킵

// 파이프라인 실행 세션
interface PipelineSession {
  id: string;
  topic: string;                 // 웹툰 소재 주제
  startedAt: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  currentPhase: number;
  agents: Record<string, AgentTask>;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
}

// 로그 엔트리
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  agentName: string;
}
```

---

## 6. 백엔드 API 확장 사양

기존 `/api/processes`, `/api/system`, WebSocket 위에 파이프라인 엔진 API를 추가한다.

### 6.1 파이프라인 제어 API

```
POST   /api/pipeline/run          파이프라인 시작
                                  body: { topic: string }

GET    /api/pipeline/status       현재 파이프라인 세션 상태 반환
                                  → PipelineSession

POST   /api/pipeline/stop         실행 중인 파이프라인 정지

GET    /api/pipeline/history      이전 실행 이력 (최근 10개)
```

### 6.2 에이전트 개별 제어 API

```
POST   /api/agents/:name/retry    특정 에이전트 재실행
POST   /api/agents/:name/skip     특정 에이전트 스킵 처리
GET    /api/agents/:name/logs     에이전트 로그 조회 (최근 100줄)
```

### 6.3 WebSocket 메시지 확장

기존 `{ type: 'update', processes, system, history }` 유지하면서 새 타입 추가:

```typescript
// 기존 (유지)
{ type: 'update', processes, system, history, timestamp }

// 신규 추가
{ type: 'pipeline:status', session: PipelineSession }
{ type: 'agent:status', agentName: string, status: AgentStatus, task: AgentTask }
{ type: 'agent:log', agentName: string, entry: LogEntry }
{ type: 'pipeline:complete', session: PipelineSession, webtoonUrl?: string }
{ type: 'pipeline:error', agentName: string, error: string, retryable: boolean }
```

---

## 7. 대시보드 UI 구성

### 7.1 화면 레이아웃

```
┌────────────────────────────────────────────────────────────────┐
│  HEADER: 4컷 웹툰 오케스트레이션 대시보드    [▶ Run] [⏹ Stop]  │
├────────────────────┬───────────────────────────────────────────┤
│                    │                                           │
│  PIPELINE DAG      │  AGENT STATUS GRID                        │
│  (좌측 40%)        │  (우측 60%)                               │
│                    │                                           │
│  Phase 1 ──→──→   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  Phase 2      │   │  │ 뉴스  │ │ 밈분 │ │ 캐릭 │ │ 스토 │   │
│  Phase 3      │   │  │수집   │ │석    │ │터    │ │리    │   │
│  Phase 4      │   │  │ ✅   │ │ ⏳  │ │ 🔜  │ │ 🔜  │   │
│  Phase 5      │   │  └──────┘ └──────┘ └──────┘ └──────┘   │
│                    │                                           │
├────────────────────┴───────────────────────────────────────────┤
│  METRICS BAR: 경과 3:42 | 완료 5/21 | 실패 0 | 예상 잔여 6:18  │
├────────────────────────────────────────────────────────────────┤
│  LOG STREAM                              │  SYSTEM MONITOR    │
│  [뉴스소재수집] 소재 수집 완료 (3개)       │  CPU  ████░░ 42%  │
│  [밈분석] 밈 포인트 분석 중...             │  MEM  ██████ 68%  │
│  [캐릭터설계] 대기 중...                   │  (기존 Recharts)  │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 에이전트 카드 상태별 색상

| 상태 | 색상 | 아이콘 |
|------|------|--------|
| `waiting` | 회색 `#6b7280` | 🔜 |
| `ready` | 파란색 `#3b82f6` | 🔵 |
| `running` | 노란색 `#f59e0b` (애니메이션) | ⏳ |
| `completed` | 초록색 `#22c55e` | ✅ |
| `failed` | 빨간색 `#ef4444` | ❌ |
| `retrying` | 주황색 `#f97316` | 🔄 |
| `skipped` | 연보라 `#a855f7` | ⏭ |

### 7.3 React 컴포넌트 구조

```
App
├── DashboardHeader          제목 + Run/Stop 컨트롤
├── MainLayout
│   ├── PipelineDagView      좌측: DAG 시각화 (Recharts 또는 SVG)
│   └── AgentStatusGrid      우측: 에이전트 카드 그리드
├── MetricsBar               경과 시간, 완료율, 예상 잔여 시간
├── BottomPanel
│   ├── LogStreamPanel       실시간 로그 (WebSocket 스트림)
│   └── SystemMonitorPanel   CPU/메모리 (기존 Recharts 재사용)
└── WebSocketProvider        WS 연결 Context
```

---

## 8. 신규 역할 카드 (오케스트레이션 레이어 7명)

---

### 파이프라인오케스트레이터

- **목적**: 28개 에이전트의 전체 실행 순서·의존성·병렬 그룹 지휘
- **입력**: 파이프라인 세션 초기화 요청, 에이전트 의존성 그래프
- **출력**: Phase별 실행 지시, 완료·실패 이벤트 처리, 다음 에이전트 호출
- **사용할 도구**: task(category), background_output, pipeline engine API
- **수정 가능 범위**: 실행 순서, 병렬 그룹, 타임아웃 설정
- **조심할 점**: 의존성 무시한 조기 실행 금지 / 무한 재시도 루프 금지
- **완료 기준**: 전체 파이프라인 DONE 또는 명확한 실패 이유 보고
- **에이전트 파일**: `.opencode/agents/pipeline-orchestrator.md`

---

### 에이전트상태관리담당

- **목적**: 각 에이전트의 실행 상태를 추적하고 파이프라인 엔진에 보고
- **입력**: 에이전트 실행 이벤트 (started / completed / failed)
- **출력**: `PipelineSession` 상태 업데이트, WebSocket 브로드캐스트 페이로드
- **사용할 도구**: `/api/pipeline/status` 엔드포인트, WebSocket
- **수정 가능 범위**: 상태 전이 규칙, 타임아웃 임계값
- **조심할 점**: 상태 경쟁 조건(race condition) 방지 / 완료 전 completed 마킹 금지
- **완료 기준**: 모든 에이전트 상태가 대시보드에 100ms 이내 반영
- **에이전트 파일**: `.opencode/agents/agent-state-manager.md`

---

### 파이프라인시각화담당

- **목적**: 파이프라인 DAG를 React 컴포넌트로 구현 (SVG 또는 Recharts)
- **입력**: 에이전트 의존성 그래프, 실시간 상태 데이터
- **출력**: `PipelineDagView` React 컴포넌트 (상태 반응형)
- **사용할 도구**: React, SVG, Recharts, lucide-react
- **수정 가능 범위**: 레이아웃 알고리즘, 노드 스타일, 엣지 애니메이션
- **조심할 점**: 21+ 노드 렌더링 시 성능 저하 주의 / 모바일 가독성 유지
- **완료 기준**: Phase 흐름이 한눈에 파악되고 상태 색상이 실시간 반영되는 상태
- **에이전트 파일**: `.opencode/agents/pipeline-visualizer.md`

---

### 실시간로그담당

- **목적**: 각 에이전트의 stdout/stderr를 수집해 대시보드 로그 패널에 스트리밍
- **입력**: 에이전트 프로세스 출력, WebSocket 연결
- **출력**: `LogEntry[]` 스트림, 로그 패널 자동 스크롤
- **사용할 도구**: Node.js child_process, WebSocket broadcast, Ring buffer
- **수정 가능 범위**: 로그 레벨 필터, 버퍼 크기, 색상 구분
- **조심할 점**: 로그 폭발(verbose 에이전트)로 인한 메모리 누수 방지 / 최대 1000줄 링 버퍼
- **완료 기준**: 에이전트 출력이 200ms 이내 대시보드에 표시
- **에이전트 파일**: `.opencode/agents/realtime-logger.md`

---

### 에러핸들링담당

- **목적**: 에이전트 실패를 감지하고 재시도/스킵/파이프라인 중단을 결정
- **입력**: `AgentTask.status = 'failed'` 이벤트, 에러 내용, 재시도 횟수
- **출력**: 처리 전략 (RETRY / SKIP / ABORT), 에러 요약, 사용자 알림
- **사용할 도구**: `/api/agents/:name/retry`, `/api/agents/:name/skip`, 대시보드 알림
- **수정 가능 범위**: 재시도 정책 (최대 횟수, 백오프 간격), 스킵 가능 에이전트 목록
- **조심할 점**: 핵심 에이전트(스토리구성, 최종검수) 무조건 스킵 금지 / 무한 재시도 금지
- **완료 기준**: 모든 에러에 3초 이내 처리 전략 결정 및 실행
- **에이전트 파일**: `.opencode/agents/error-handler.md`

---

### 대시보드UI담당

- **목적**: 오케스트레이션 대시보드의 React 컴포넌트 전체 구현
- **입력**: UI 사양(섹션 7), WebSocket 데이터, 기존 `App.jsx` (교체)
- **출력**: `App.jsx` + 컴포넌트 폴더 (`components/`) + `App.css` 전면 재작성
- **사용할 도구**: React, Recharts, lucide-react, CSS Grid, WebSocket API
- **수정 가능 범위**: 컴포넌트 구조, 스타일, 레이아웃 (기존 Vite 스캐폴드 교체)
- **조심할 점**: 기존 백엔드 API 호환성 유지 / 모바일에서 DAG 레이아웃 붕괴 방지
- **완료 기준**: 대시보드 4개 패널 모두 정상 렌더링, WebSocket 실시간 업데이트 동작
- **에이전트 파일**: `.opencode/agents/dashboard-ui.md`

---

### 파이프라인엔진담당

- **목적**: 백엔드에 파이프라인 실행 엔진과 신규 API 엔드포인트 추가
- **입력**: 기존 `server.js`, 파이프라인 API 사양 (섹션 6), 에이전트 의존성 그래프
- **출력**: `server.js` 확장 또는 `pipeline.js` 모듈 분리
- **사용할 도구**: Node.js, Express, child_process, EventEmitter, WebSocket
- **수정 가능 범위**: 신규 라우트 추가 (`/api/pipeline/*`, `/api/agents/*`), 상태 머신 구현
- **조심할 점**: 기존 `/api/processes`, `/api/system`, WebSocket 브로드캐스트 로직 절대 변경 금지
- **완료 기준**: `/api/pipeline/run` 호출 시 파이프라인이 순서대로 실행되고 상태가 WS로 브로드캐스트
- **에이전트 파일**: `.opencode/agents/pipeline-engine.md`

---

## 9. 구현 착수 순서 (권장)

에이전트가 이 문서를 받았을 때 수행해야 할 순서:

```
Step 1: 파이프라인엔진담당
        → server.js에 파이프라인 API 추가
        → PipelineSession 상태 머신 구현
        → WS 메시지 타입 확장

Step 2: 에이전트상태관리담당
        → AgentTask 상태 전이 로직 구현
        → WS 브로드캐스트 연결

Step 3: 실시간로그담당
        → 로그 수집 및 스트리밍 구현
        → 링 버퍼 적용

Step 4: 대시보드UI담당 (병렬)
        → App.jsx 전면 재작성
        → 컴포넌트 구현

    Step 4.1: 파이프라인시각화담당 (병렬)
              → PipelineDagView 컴포넌트

Step 5: 에러핸들링담당
        → 재시도·스킵 로직 연결

Step 6: 파이프라인오케스트레이터
        → 전체 21개 에이전트 호출 로직
        → 의존성 그래프 기반 실행

Step 7: 최종검수담당
        → 대시보드 통합 테스트
```

---

## 10. 파일 구조 (구현 완료 후 목표)

```
workspace/
├── frontend/src/
│   ├── components/
│   │   ├── DashboardHeader.jsx
│   │   ├── PipelineDagView.jsx      ← 파이프라인시각화담당
│   │   ├── AgentStatusGrid.jsx      ← 대시보드UI담당
│   │   ├── AgentCard.jsx
│   │   ├── MetricsBar.jsx
│   │   ├── LogStreamPanel.jsx       ← 실시간로그담당
│   │   └── SystemMonitorPanel.jsx   ← 기존 기능 재사용
│   ├── hooks/
│   │   ├── useWebSocket.js          WebSocket Context
│   │   └── usePipeline.js           파이프라인 상태 관리
│   ├── App.jsx                      ← 전면 재작성
│   └── App.css
├── backend/
│   ├── server.js                    ← 기존 기능 유지
│   ├── pipeline/
│   │   ├── engine.js                ← 파이프라인엔진담당
│   │   ├── state-machine.js         에이전트 상태 전이
│   │   ├── dependency-graph.js      DAG 정의
│   │   └── logger.js                ← 실시간로그담당
│   └── routes/
│       ├── pipeline.js              /api/pipeline/*
│       └── agents.js                /api/agents/*
└── .opencode/agents/                ← 기존 21개 + 신규 7개
    ├── pipeline-orchestrator.md     (신규)
    ├── agent-state-manager.md       (신규)
    ├── pipeline-visualizer.md       (신규)
    ├── realtime-logger.md           (신규)
    ├── error-handler.md             (신규)
    ├── dashboard-ui.md              (신규)
    └── pipeline-engine.md           (신규)
```
