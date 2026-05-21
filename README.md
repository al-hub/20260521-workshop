# 멀티에이전트 오케스트레이션 대시보드

28개 에이전트가 협력해 4컷 웹툰을 10분 안에 만드는 파이프라인과, 그 과정을 실시간으로 시각화하는 대시보드.

---

## 개요

이 프로젝트는 **opencode + oh-my-openagent** 기반의 멀티에이전트 워크플로우를 설계하고, 그 실행 상태를 브라우저에서 모니터링하는 대시보드를 구축하는 실습 워크샵입니다.

에이전트 팀이 하는 일은 두 가지입니다. 첫째, 4컷 웹툰 제작 파이프라인(소재 수집 → 스토리 → 작화 → 배포)을 실행합니다. 둘째, 그 파이프라인이 돌아가는 동안 상태를 대시보드 위에 실시간으로 시각화합니다. 즉, **에이전트들이 대시보드를 만들고, 동시에 그 대시보드 위에서 실행됩니다.**

워크플로우의 핵심은 `role-card.md`에 역할을 정의하는 것에서 시작해 `@plan`과 `/start-work`까지 이어지는 6단계 흐름입니다. 이 README는 그 흐름을 처음 보는 개발자가 바로 따라할 수 있도록 정리합니다.

---

## 결과물

### 대시보드 기능 (`dashboard/`)

| 패널 | 기능 |
|------|------|
| 🤖 에이전트 카드 | 상태 필터(idle/running/error/offline/paused), 업타임, 마지막 활동 시각 |
| 📋 태스크 목록 | 상태 필터 + 정렬(최신/상태/제목순), 담당 에이전트 표시 |
| 📜 로그/메모 | 탭 전환, 레벨 필터(INFO/WARN/ERROR), 검색, `.txt` 내보내기, 메모 추가 |
| ⚙️ 모델 전략 체크리스트 | Committee vs Leader 전략 선택, 항목 토글 |

그 외 다크/라이트 테마 토글, 5초 주기 자동 갱신 토글, 알림 배지(에러 에이전트 수, 활성 태스크 수, ERROR 로그 수)를 지원합니다.

### 백엔드 API (`backend/server.js`)

| 엔드포인트 | 설명 |
|------------|------|
| `GET /api/health` | 헬스체크 |
| `GET /api/system` | CPU/메모리/시스템 정보 |
| `GET /api/processes` | 실행 중인 에이전트 프로세스 감지 (AI Agent, Node Agent, Python Agent 자동 분류) |
| `GET /api/snapshot` | 프로세스 + 시스템 통합 스냅샷 |
| `ws://localhost:3001` | 3초 간격 실시간 WebSocket 브로드캐스트 |

---

## 프로젝트 구조

```
20260521-workshop/
├── dashboard/                  # 오케스트레이션 대시보드 (순수 HTML+CSS+JS)
│   ├── index.html
│   ├── css/
│   │   ├── tokens.css          # CSS 변수 (다크/라이트 테마)
│   │   ├── layout.css          # 4-패널 그리드
│   │   ├── components.css      # 컴포넌트 스타일
│   │   └── animations.css      # 트랜지션/키프레임
│   └── js/
│       ├── constants.js        # 열거형 상수
│       ├── mock-data.js        # 목 데이터
│       ├── app-state.js        # 중앙 상태 관리
│       ├── agents.js           # 에이전트 카드 컴포넌트
│       ├── tasks.js            # 태스크 목록 컴포넌트
│       ├── logs.js             # 로그/메모 패널 컴포넌트
│       ├── checklist.js        # 전략 체크리스트 컴포넌트
│       └── main.js             # 부트스트랩
├── backend/
│   ├── server.js               # Express + WebSocket API 서버
│   └── package.json
├── frontend/                   # React 19 + Vite (확장용 스캐폴드)
│   └── src/App.jsx
├── .opencode/
│   ├── agents/                 # 28개 에이전트 역할 카드 (.md)
│   └── oh-my-openagent.jsonc   # 카테고리 + 에이전트 설정
├── role-card.md                # 에이전트 역할 정의 원본
├── agent-team.md               # 에이전트 팀 구성 문서
└── AGENT.md                    # 에이전트 역할 요약
```

---

## 시작하기

### 사전 준비

- [opencode](https://opencode.ai) 설치
- oh-my-openagent 플러그인 설치

```bash
# opencode 설치 (npm)
npm install -g opencode-ai

# oh-my-openagent 플러그인 설치
cd .opencode
npm install
```

### 에이전트 설정 확인

`.opencode/oh-my-openagent.jsonc`에 28개 에이전트가 모두 등록되어 있는지 확인합니다.

```jsonc
{
  "agent_definitions": [
    ".opencode/agents/news-collector.md",
    ".opencode/agents/story-composer.md",
    // ... 총 28개
    ".opencode/agents/pipeline-orchestrator.md"
  ],
  "categories": {
    "뉴스소재수집": {
      "description": "최신 뉴스·밈 기반 웹툰 소재 수집",
      "model": "openai/gpt-5.4-mini",
      "prompt_append": "<role>...</role>"
    }
    // ... 카테고리별 모델 + 프롬프트 설정
  }
}
```

---

## 워크플로우

이 프로젝트의 핵심입니다. 아래 6단계 흐름을 따르면 멀티에이전트 파이프라인을 처음부터 끝까지 구성할 수 있습니다.

```
role-card.md
     │
     ▼
category 정의 (oh-my-openagent.jsonc)
     │
     ▼
agent-team.md
     │
     ▼
개발 스택 준비
     │
     ▼
@plan (Prometheus 플래너)
     │
     ▼
/start-work (Atlas 오케스트레이터)
```

---

### 1단계. `role-card.md` — 에이전트 역할 정의

에이전트가 무엇을 해야 하는지 자연어로 씁니다. 형식은 아래를 따릅니다.

```markdown
# 뉴스소재수집담당
- 목적 : 최신 뉴스 및 밈 기반 소재 수집
- 입력 : 실시간 뉴스, 커뮤니티 반응, SNS 밈
- 출력 : 웹툰 후보 소재 리스트
- 사용할 도구 : 뉴스 검색, SNS, 커뮤니티
- 수정 가능 범위 : 소재 후보, 키워드 정리
- 조심할 점 : 정치·혐오 과몰입 금지
- 완료 기준 : MZ 공감 가능한 소재 확보 상태
```

**포인트:** "완료 기준"을 구체적으로 써야 에이전트가 언제 멈춰야 하는지 압니다.

---

### 2단계. category 정의 — `oh-my-openagent.jsonc`

`role-card.md`에 쓴 역할을 oh-my-openagent 카테고리로 옮깁니다. 카테고리마다 사용할 모델과 시스템 프롬프트를 지정합니다.

```jsonc
"뉴스소재수집": {
  "description": "최신 뉴스·밈 기반 웹툰 소재 수집. MZ 공감 가능한 후보 소재 리스트 출력.",
  "model": "openai/gpt-5.4-mini",
  "prompt_append": "<role>\n당신은 4컷 웹툰 뉴스소재수집담당입니다.\n...\n</role>"
}
```

**포인트:** 단순 검색/분류 작업은 `gpt-5.4-mini`, 창작/판단이 필요한 작업은 `claude-sonnet-4-6`처럼 작업 특성에 맞게 모델을 나눕니다.

---

### 3단계. `agent-team.md` — 팀 구성

어떤 에이전트가 어떤 순서로 협력하는지 문서화합니다. 이 문서가 나중에 `@plan`의 입력 컨텍스트가 됩니다.

```markdown
## 파이프라인 실행 플로우

Phase 1 (병렬): 뉴스소재수집 || 밈분석
Phase 1 (완료 후): 캐릭터설계
Phase 2 (순차): 스토리구성
Phase 2 (병렬): B급감성 || 대사다듬기
Phase 3 (병렬): 작화 || 표정연출
Phase 4 (순차): 리듬검수 → 최종검수
Phase 5 (병렬): HTML구현 || 반응형 || 접근성검수 || 성능최적화
Phase 5 (완료 후): 배포
```

이 프로젝트의 28개 에이전트는 6개 레이어로 구성됩니다.

| 레이어 | 에이전트 수 | 역할 |
|--------|------------|------|
| 오케스트레이션 | 7개 | 파이프라인 지휘, 상태 관리, 시각화, 로그, 에러 처리 |
| 콘텐츠 기획 | 3개 | 뉴스 소재 수집, 밈 분석, 캐릭터 설계 |
| 스토리·연출 | 7개 | 스토리 구성, B급 감성, 작화, 표정 연출, 대사, 검수 |
| AI 운영 | 3개 | 토큰 관리, 프롬프트 최적화, 모델 선택 |
| 제작 흐름 | 3개 | 속도 관리, 작업 분배, 간소화 판단 |
| 웹 구현 | 5개 | HTML, 반응형, 배포, 접근성, 성능 |

---

### 4단계. 개발 스택 준비

파이프라인이 실제로 실행될 환경을 만듭니다. 이 프로젝트의 스택은 아래와 같습니다.

```
backend/    Express + WebSocket  (에이전트 프로세스 모니터링 API)
dashboard/  순수 HTML+CSS+JS     (대시보드 UI)
frontend/   React 19 + Vite      (확장용 스캐폴드)
```

에이전트들이 생성할 파일이 어디에 놓여야 하는지, 어떤 API가 있어야 하는지를 미리 잡아두는 단계입니다.

---

### 5단계. `@plan` — Prometheus 플래너에게 구현 계획 요청

opencode에서 `@plan`을 입력하면 Prometheus 플래너가 `agent-team.md`와 현재 코드베이스를 분석해 구현 계획을 만듭니다.

```
opencode 채팅창에서:

@plan agent-team.md를 기반으로 대시보드 구현 계획을 세워줘.
백엔드 API는 backend/server.js를 확장하고,
UI는 dashboard/index.html을 기준으로 해.
```

Prometheus는 단계별 구현 순서, 각 단계의 담당 에이전트, 예상 소요 시간을 포함한 계획서를 반환합니다.

---

### 6단계. `/start-work` — Atlas 오케스트레이터 실행

`@plan`이 만든 계획서를 Atlas가 읽고 에이전트들을 병렬로 실행합니다.

```
/start-work
```

Atlas는 `agent-team.md`의 의존성 그래프를 따라 순차/병렬 실행을 자동으로 조율합니다. 각 에이전트의 진행 상황은 대시보드에서 실시간으로 확인할 수 있습니다.

```
파이프라인오케스트레이터
        │
   ─────┴──────────────────────
   │                           │
[뉴스소재수집]             [밈분석]       ← Phase 1 병렬
   │                           │
   └──────────┬────────────────┘
              ▼
         [캐릭터설계]                     ← Phase 1 완료 후
              │
         [스토리구성]                     ← Phase 2
         ─────┴─────────────
         │                  │
     [B급감성]          [대사다듬기]       ← Phase 2 병렬
         │                  │
         └────────┬──────────┘
      ────────────┴────────────
      │                        │
   [작화]                  [표정연출]      ← Phase 3 병렬
      │                        │
      └──────────┬─────────────┘
             [리듬검수]
                 │
             [최종검수]                   ← Phase 4
      ──────────────────────────
      │        │        │       │
  [HTML]  [반응형]  [접근성]  [성능]       ← Phase 5 병렬
      └────────┴────────┴───────┘
                   │
                [배포]
                   │
               DONE
```

---

## 대시보드 실행

외부 서버 없이 브라우저로 바로 열 수 있습니다.

```bash
open dashboard/index.html
```

Windows라면:

```bash
start dashboard/index.html
```

백엔드 없이도 목 데이터(`dashboard/js/mock-data.js`)로 모든 UI를 확인할 수 있습니다. 실시간 데이터를 보려면 아래 백엔드를 먼저 실행하세요.

---

## 백엔드 실행

```bash
cd backend
npm install
npm start
```

서버가 `http://localhost:3001`에서 실행됩니다. WebSocket도 같은 포트를 씁니다.

개발 중 코드 변경을 자동으로 반영하려면:

```bash
npm run dev
```

---

## 에이전트 레이어 구성

```
.opencode/agents/
├── pipeline-orchestrator.md    # 전체 파이프라인 지휘
├── agent-state-manager.md      # 상태 전이 추적
├── pipeline-visualizer.md      # DAG 시각화 컴포넌트
├── realtime-logger.md          # 로그 수집·스트리밍
├── error-handler.md            # 에러 감지 및 재시도 결정
├── dashboard-ui.md             # React 대시보드 UI 구현
├── pipeline-engine.md          # 백엔드 파이프라인 엔진
├── news-collector.md           # 뉴스 소재 수집
├── meme-analyst.md             # 밈 분석
├── character-designer.md       # 캐릭터 설계
├── story-composer.md           # 스토리 구성
├── b-grade-artist.md           # B급 감성 강화
├── illustration-director.md    # 작화 가이드
├── expression-director.md      # 표정 연출
├── dialogue-polisher.md        # 대사 정제
├── rhythm-inspector.md         # 리듬 검수
├── final-inspector.md          # 최종 QA
├── token-manager.md            # 토큰 관리
├── prompt-optimizer.md         # 프롬프트 최적화
├── model-selector.md           # 모델 선택
├── speed-manager.md            # 속도 관리
├── task-distributor.md         # 작업 분배
├── simplification-judge.md     # 간소화 판단
├── html-implementer.md         # HTML 구현
├── responsive-designer.md      # 반응형 CSS
├── deployment-manager.md       # 배포
├── accessibility-inspector.md  # 접근성 검수
└── performance-optimizer.md    # 성능 최적화
```
