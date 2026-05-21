(function () {
  // 1. AppState에 목 데이터 주입
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

  // 3. 테마 토글
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = document.documentElement.dataset.theme === 'light';
      document.documentElement.dataset.theme = isLight ? 'dark' : 'light';
      themeBtn.textContent = isLight ? '🌙 다크' : '☀️ 라이트';
    });
  }

  // 4. 자동 갱신 토글
  const refreshBtn = document.getElementById('btn-auto-refresh');
  const refreshStatus = document.getElementById('refresh-status');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      AppState.setState({ autoRefresh: !AppState.autoRefresh });
      refreshBtn.textContent = AppState.autoRefresh ? '⏸ 갱신 중' : '▶ 갱신 중지';
      if (refreshStatus) {
        refreshStatus.textContent = AppState.autoRefresh ? '자동 갱신 중...' : '갱신 중지됨';
      }
    });
  }

  // 5. 자동 갱신 루프 — 에이전트 상태 시뮬레이션
  const STATUSES = ['idle', 'running', 'error', 'paused'];
  let lastRefresh = Date.now();

  setInterval(() => {
    if (!AppState.autoRefresh) return;

    // 에이전트 1개 랜덤 상태 변경 (시뮬레이션)
    const agents = AppState.agents.map((a, i) => {
      if (i !== Math.floor(Math.random() * AppState.agents.length)) return a;
      return { ...a, status: STATUSES[Math.floor(Math.random() * STATUSES.length)], last_active: new Date().toISOString() };
    });

    // 새 로그 엔트리 추가 (시뮬레이션)
    const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
    const sources = ['AgentRunner', 'TaskScheduler', 'StateManager', 'LogCollector'];
    const messages = [
      '에이전트 상태 갱신 완료',
      '태스크 큐 처리 중',
      '상태 동기화 완료',
      '응답 지연 감지됨',
      '연결 재시도 중',
    ];
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    };

    lastRefresh = Date.now();
    AppState.setState({
      agents: agents,
      logs: [newLog, ...AppState.logs].slice(0, 100), // 최대 100개 유지
    });

    if (refreshStatus) {
      const d = new Date(lastRefresh);
      refreshStatus.textContent = '마지막 갱신: ' + d.toLocaleTimeString('ko-KR');
    }
  }, AUTO_REFRESH_INTERVAL);

})();
