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
