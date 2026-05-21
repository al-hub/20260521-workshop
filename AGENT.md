# 멀티 에이전트 오케스트레이션 대시보드 에이전트 역할 정리

이 문서는 `agent-team.md`를 기준으로 프로젝트에 정의된 oh-my-openagent 에이전트의 역할을 요약합니다.

- 에이전트 정의 위치: `.opencode/agents/*.md`
- 에이전트 등록 설정: `.opencode/oh-my-openagent.jsonc`의 `agent_definitions`
- 총 에이전트 수: **28개**
- 목적: 4컷 웹툰 제작 파이프라인을 실시간으로 시각화·제어하는 멀티 에이전트 오케스트레이션 대시보드 구축 및 운영

---

## 1. 에이전트 파일 목록

| 레이어 | 파일 | 에이전트명 | 핵심 역할 |
|---|---|---|---|
| 오케스트레이션 | `.opencode/agents/pipeline-orchestrator.md` | 파이프라인오케스트레이터 | 28개 에이전트 전체 실행 순서·의존성·병렬 그룹 지휘 |
| 오케스트레이션 | `.opencode/agents/agent-state-manager.md` | 에이전트상태관리담당 | 에이전트 상태 전이 추적 및 WebSocket 브로드캐스트 |
| 오케스트레이션 | `.opencode/agents/pipeline-visualizer.md` | 파이프라인시각화담당 | 파이프라인 DAG React/SVG 시각화 구현 |
| 오케스트레이션 | `.opencode/agents/realtime-logger.md` | 실시간로그담당 | stdout/stderr 로그 수집·링 버퍼·실시간 스트리밍 |
| 오케스트레이션 | `.opencode/agents/error-handler.md` | 에러핸들링담당 | 실패 감지 후 RETRY/SKIP/ABORT 전략 결정 |
| 오케스트레이션 | `.opencode/agents/dashboard-ui.md` | 대시보드UI담당 | React 대시보드 UI 전체 구현 |
| 오케스트레이션 | `.opencode/agents/pipeline-engine.md` | 파이프라인엔진담당 | Express 백엔드 파이프라인 엔진 및 API 확장 |
| 콘텐츠 기획 | `.opencode/agents/news-collector.md` | 뉴스소재수집담당 | 최신 뉴스·커뮤니티·SNS 기반 웹툰 후보 소재 수집 |
| 콘텐츠 기획 | `.opencode/agents/meme-analyst.md` | 밈분석담당 | MZ 감성·인터넷 밈·말투·드립 포인트 분석 |
| 콘텐츠 기획 | `.opencode/agents/character-designer.md` | 캐릭터설계담당 | 반복 사용 가능한 3인 고정 캐릭터 설계 |
| 스토리·연출 | `.opencode/agents/story-composer.md` | 스토리구성담당 | 4컷 흐름·반전 구조·대사 초안 구성 |
| 스토리·연출 | `.opencode/agents/b-grade-artist.md` | B급감성담당 | 병맛·B급 감성·황당 연출·드립 강화 |
| 스토리·연출 | `.opencode/agents/illustration-director.md` | 작화담당 | 4컷 작화 가이드·구도·색감·AI 이미지 프롬프트 작성 |
| 스토리·연출 | `.opencode/agents/expression-director.md` | 표정연출담당 | 컷별 표정 가이드 및 리액션 포인트 설계 |
| 스토리·연출 | `.opencode/agents/dialogue-polisher.md` | 대사다듬기담당 | 짧고 강한 MZ 스타일 최종 대사 정리 |
| 스토리·연출 | `.opencode/agents/rhythm-inspector.md` | 리듬검수담당 | 4컷 호흡·타이밍·마지막 컷 임팩트 검수 |
| 스토리·연출 | `.opencode/agents/final-inspector.md` | 최종검수담당 | 전체 감성·완성도·오타·연출 최종 QA |
| AI 운영 | `.opencode/agents/token-manager.md` | AI토큰관리담당 | 토큰 사용량·모델 호출 비용·작업 분배 효율 최적화 |
| AI 운영 | `.opencode/agents/prompt-optimizer.md` | 프롬프트최적화담당 | 짧고 강한 프롬프트 구조 및 재사용 템플릿 최적화 |
| AI 운영 | `.opencode/agents/model-selector.md` | 모델선택담당 | 작업 난이도·속도·비용 기준 최적 모델 배치 |
| 제작 흐름 | `.opencode/agents/speed-manager.md` | 속도관리담당 | 전체 제작 시간을 10분 이내로 유지하기 위한 병목 관리 |
| 제작 흐름 | `.opencode/agents/task-distributor.md` | 작업분배담당 | 역할 간 병렬 작업 계획 및 의존성 순서 관리 |
| 제작 흐름 | `.opencode/agents/simplification-judge.md` | 간소화판단담당 | 시간 초과 위험 시 핵심 재미를 유지하며 자동 간소화 판단 |
| 웹 구현 | `.opencode/agents/html-implementer.md` | HTML구현담당 | 완성 웹툰을 HTML 상세 페이지로 구현 |
| 웹 구현 | `.opencode/agents/responsive-designer.md` | 반응형담당 | 모바일·태블릿·PC 반응형 CSS 최적화 |
| 웹 구현 | `.opencode/agents/deployment-manager.md` | 배포담당 | GitHub Pages/Vercel/Netlify 등 외부 접속 URL 배포 |
| 웹 구현 | `.opencode/agents/accessibility-inspector.md` | 접근성검수담당 | alt·title·meta·semantic tag 등 기본 접근성 검수 |
| 웹 구현 | `.opencode/agents/performance-optimizer.md` | 성능최적화담당 | 이미지 최적화·lazy loading·경량화로 빠른 로딩 확보 |

---

## 2. 실행 레이어별 책임

### 2.1 오케스트레이션 레이어

대시보드 자체를 만들고, 실행 중인 에이전트들의 상태를 제어·시각화하는 레이어입니다.

- **파이프라인오케스트레이터**: 전체 Phase 실행 순서, 병렬 실행, 의존성 해소를 관리합니다.
- **에이전트상태관리담당**: `waiting → ready → running → completed/failed` 상태 전이를 추적합니다.
- **파이프라인시각화담당**: 28개 에이전트의 DAG를 화면에서 한눈에 보이도록 구성합니다.
- **실시간로그담당**: 각 에이전트 로그를 수집해 로그 패널로 스트리밍합니다.
- **에러핸들링담당**: 실패한 에이전트에 대해 재시도, 스킵, 중단을 판단합니다.
- **대시보드UI담당**: React 기반 대시보드 레이아웃과 인터랙션을 구현합니다.
- **파이프라인엔진담당**: 백엔드에 `/api/pipeline/*`, `/api/agents/*` API와 상태 머신을 추가합니다.

### 2.2 콘텐츠 기획 레이어

웹툰의 소재·밈·캐릭터를 준비하는 초기 레이어입니다.

- **뉴스소재수집담당**: 최신 뉴스와 SNS 반응에서 후보 소재를 수집합니다.
- **밈분석담당**: 소재에 붙일 MZ 감성, 밈, 드립 포인트를 정리합니다.
- **캐릭터설계담당**: 반복 사용 가능한 3인 캐릭터의 성격, 외형, 말투를 정의합니다.

### 2.3 스토리·연출 레이어

콘텐츠를 실제 4컷 웹툰으로 만드는 핵심 창작 레이어입니다.

- **스토리구성담당**: 1컷 설정, 2컷 전개, 3컷 절정, 4컷 반전 구조를 설계합니다.
- **B급감성담당**: “어이없는데 웃김” 상태가 되도록 병맛과 드립을 강화합니다.
- **작화담당**: 컷별 구도, 색감, 배경, 이미지 생성 프롬프트를 작성합니다.
- **표정연출담당**: 캐릭터 표정과 리액션 포인트를 컷별로 설계합니다.
- **대사다듬기담당**: 말풍선에 들어갈 짧고 강한 최종 대사를 만듭니다.
- **리듬검수담당**: 4컷 호흡과 펀치라인 타이밍을 검수합니다.
- **최종검수담당**: 전체 결과물을 PASS/CONDITIONAL/FAIL 기준으로 검수합니다.

### 2.4 AI 운영 레이어

모델 비용, 토큰, 프롬프트 품질을 관리하는 운영 최적화 레이어입니다.

- **AI토큰관리담당**: 불필요한 토큰 사용을 줄이고 모델 호출을 최적화합니다.
- **프롬프트최적화담당**: 각 역할 프롬프트를 간결하고 재사용 가능하게 다듬습니다.
- **모델선택담당**: 창작·분석·검수 작업별로 적절한 모델 티어를 배치합니다.

### 2.5 제작 흐름 레이어

10분 내 제작 완료를 위한 시간·병렬화·간소화 판단 레이어입니다.

- **속도관리담당**: 진행 시간을 추적하고 병목 구간을 감지합니다.
- **작업분배담당**: 선행/후행 의존성을 정리하고 병렬 실행 그룹을 구성합니다.
- **간소화판단담당**: 시간이 부족할 때 배경 디테일 등 비핵심 요소를 줄입니다.

### 2.6 웹 구현 레이어

최종 웹툰 결과물을 웹 페이지로 구현·배포하는 레이어입니다.

- **HTML구현담당**: 시맨틱 HTML 구조와 웹툰 상세 페이지를 작성합니다.
- **반응형담당**: 320px 모바일부터 데스크톱까지 레이아웃을 안정화합니다.
- **배포담당**: 외부 접속 가능한 URL로 배포하고 이미지 누락을 확인합니다.
- **접근성검수담당**: alt 텍스트, lang, title, meta description을 검수합니다.
- **성능최적화담당**: 이미지 크기, lazy loading, WebP 전환 등으로 로딩 속도를 개선합니다.

---

## 3. 권장 실행 순서

```text
0. 사전 설정
   AI토큰관리담당 || 모델선택담당 || 프롬프트최적화담당

1. 콘텐츠 기획
   뉴스소재수집담당 || 밈분석담당 → 캐릭터설계담당

2. 스토리 제작
   스토리구성담당 → B급감성담당 || 대사다듬기담당

3. 연출 제작
   작화담당 || 표정연출담당

4. 검수
   리듬검수담당 → 최종검수담당

5. 웹 구현
   HTML구현담당 → 반응형담당 || 접근성검수담당 || 성능최적화담당 → 배포담당

6. 대시보드 운영
   파이프라인오케스트레이터가 전체 흐름을 지휘하고,
   상태관리·시각화·로그·에러핸들링 에이전트가 실시간 대시보드를 유지한다.
```

---

## 4. oh-my-openagent 등록 상태

`agent_definitions`에는 다음 28개 에이전트 파일이 등록되어야 합니다.

```text
.opencode/agents/news-collector.md
.opencode/agents/meme-analyst.md
.opencode/agents/character-designer.md
.opencode/agents/story-composer.md
.opencode/agents/b-grade-artist.md
.opencode/agents/illustration-director.md
.opencode/agents/expression-director.md
.opencode/agents/dialogue-polisher.md
.opencode/agents/rhythm-inspector.md
.opencode/agents/final-inspector.md
.opencode/agents/token-manager.md
.opencode/agents/prompt-optimizer.md
.opencode/agents/model-selector.md
.opencode/agents/speed-manager.md
.opencode/agents/task-distributor.md
.opencode/agents/simplification-judge.md
.opencode/agents/html-implementer.md
.opencode/agents/responsive-designer.md
.opencode/agents/deployment-manager.md
.opencode/agents/accessibility-inspector.md
.opencode/agents/performance-optimizer.md
.opencode/agents/pipeline-orchestrator.md
.opencode/agents/agent-state-manager.md
.opencode/agents/pipeline-visualizer.md
.opencode/agents/realtime-logger.md
.opencode/agents/error-handler.md
.opencode/agents/dashboard-ui.md
.opencode/agents/pipeline-engine.md
```

현재 프로젝트의 `.opencode/oh-my-openagent.jsonc`는 위 28개 정의를 `agent_definitions`에 등록합니다.

---

## 5. 운영 원칙

- 기존 백엔드의 `/api/processes`, `/api/system`, `/api/snapshot`, 기본 WebSocket 브로드캐스트는 유지합니다.
- 신규 대시보드 기능은 `/api/pipeline/*`, `/api/agents/*`, `pipeline:*`, `agent:*` WebSocket 메시지로 확장합니다.
- 핵심 에이전트(`스토리구성담당`, `최종검수담당`, `파이프라인오케스트레이터`)는 실패 시 무조건 스킵하지 않습니다.
- 10분 초과 위험이 감지되면 `간소화판단담당`을 호출해 배경 디테일·보조 연출부터 줄입니다.
- 대시보드 구현은 기존 의존성(React, Recharts, lucide-react)을 우선 사용하고 불필요한 새 라이브러리는 추가하지 않습니다.
