window.LogsComponent = {
  _container: null,
  _activeTab: 'logs',
  _logList: null,
  _memoList: null,
  _tabContents: null,

  init() {
    this._container = document.querySelector('#panel-logs .panel-body');
    if (!this._container) return;
    this._renderTabBar();
    this._renderLogView();
    this._renderMemoView();
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderTabBar() {
    const bar = document.createElement('div');
    bar.className = 'log-tab-bar';

    ['logs', 'memos'].forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'log-tab-btn' + (this._activeTab === tab ? ' active' : '');
      btn.textContent = tab === 'logs' ? '📋 로그' : '📝 메모';
      btn.dataset.tab = tab;
      btn.addEventListener('click', () => {
        this._activeTab = tab;
        bar.querySelectorAll('.log-tab-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.tab === tab);
        });
        this._showActiveTab();
        this.update();
      });
      bar.appendChild(btn);
    });

    this._container.appendChild(bar);
  },

  _renderLogView() {
    const wrap = document.createElement('div');
    wrap.dataset.tabContent = 'logs';

    const toolbar = document.createElement('div');
    toolbar.className = 'log-toolbar';

    const levelGroup = document.createElement('div');
    levelGroup.className = 'log-level-filter';
    ['all', 'INFO', 'WARN', 'ERROR'].forEach(level => {
      const btn = document.createElement('button');
      btn.className = 'log-level-btn' + (AppState.logLevelFilter === level ? ' active' : '');
      btn.textContent = level === 'all' ? '전체' : level;
      btn.dataset.level = level;
      btn.addEventListener('click', () => {
        AppState.setState({ logLevelFilter: level });
        levelGroup.querySelectorAll('.log-level-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.level === level);
        });
      });
      levelGroup.appendChild(btn);
    });

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'log-search-input';
    searchInput.placeholder = '로그 검색...';
    searchInput.addEventListener('input', e => {
      AppState.setState({ logSearch: e.target.value });
    });

    const exportBtn = document.createElement('button');
    exportBtn.className = 'log-export-btn btn btn--ghost';
    exportBtn.textContent = '⬇ 내보내기';
    exportBtn.addEventListener('click', () => this._exportLogs());

    toolbar.appendChild(levelGroup);
    toolbar.appendChild(searchInput);
    toolbar.appendChild(exportBtn);

    const list = document.createElement('div');
    list.className = 'log-list';
    this._logList = list;

    wrap.appendChild(toolbar);
    wrap.appendChild(list);
    this._container.appendChild(wrap);
  },

  _renderMemoView() {
    const wrap = document.createElement('div');
    wrap.dataset.tabContent = 'memos';
    wrap.style.display = 'none';

    const list = document.createElement('div');
    list.className = 'memo-list';
    this._memoList = list;

    const compose = document.createElement('div');
    compose.className = 'memo-compose';

    const textarea = document.createElement('textarea');
    textarea.className = 'memo-input';
    textarea.placeholder = '메모를 입력하세요...';
    textarea.rows = 3;

    const submitBtn = document.createElement('button');
    submitBtn.className = 'memo-submit-btn btn btn--primary';
    submitBtn.textContent = '메모 추가';
    submitBtn.addEventListener('click', () => {
      const content = textarea.value.trim();
      if (!content) return;
      const newMemo = {
        id: 'memo-' + Date.now(),
        timestamp: new Date().toISOString(),
        content: content,
      };
      AppState.setState({ memos: [newMemo, ...AppState.memos] });
      textarea.value = '';
    });

    compose.appendChild(textarea);
    compose.appendChild(submitBtn);
    wrap.appendChild(list);
    wrap.appendChild(compose);
    this._container.appendChild(wrap);
  },

  _showActiveTab() {
    this._container.querySelectorAll('[data-tab-content]').forEach(el => {
      el.style.display = el.dataset.tabContent === this._activeTab ? '' : 'none';
    });
  },

  _filterLogs(logs) {
    const { logLevelFilter, logSearch } = AppState;
    return logs.filter(log => {
      const levelOk = logLevelFilter === 'all' || log.level === logLevelFilter;
      const searchOk = !logSearch || [log.level, log.source, log.message]
        .some(f => f && f.toLowerCase().includes(logSearch.toLowerCase()));
      return levelOk && searchOk;
    });
  },

  _buildLogEntry(log) {
    const div = document.createElement('div');
    div.className = 'log-entry log-entry--' + log.level.toLowerCase();

    const time = document.createElement('span');
    time.className = 'log-entry__time';
    time.textContent = log.timestamp
      ? new Date(log.timestamp).toLocaleTimeString('ko-KR')
      : '';

    const level = document.createElement('span');
    level.className = 'log-entry__level';
    level.textContent = log.level;

    const source = document.createElement('span');
    source.className = 'log-entry__source';
    source.textContent = log.source || '';

    const msg = document.createElement('span');
    msg.className = 'log-entry__message';
    msg.textContent = log.message;

    div.appendChild(time);
    div.appendChild(level);
    div.appendChild(source);
    div.appendChild(msg);
    return div;
  },

  _buildMemoEntry(memo) {
    const div = document.createElement('div');
    div.className = 'memo-entry';

    const time = document.createElement('div');
    time.className = 'memo-entry__time';
    time.textContent = memo.timestamp
      ? new Date(memo.timestamp).toLocaleString('ko-KR')
      : '';

    const content = document.createElement('div');
    content.className = 'memo-entry__content';
    content.textContent = memo.content;

    div.appendChild(time);
    div.appendChild(content);
    return div;
  },

  _exportLogs() {
    const filtered = this._filterLogs(AppState.logs);
    const lines = filtered.map(log =>
      '[' + log.timestamp + '] [' + log.level + '] [' + (log.source || '') + '] ' + log.message
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs_export_' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  },

  update() {
    if (this._activeTab === 'logs') {
      if (!this._logList) return;
      const filtered = this._filterLogs(AppState.logs);
      while (this._logList.firstChild) this._logList.removeChild(this._logList.firstChild);
      filtered.forEach(log => this._logList.appendChild(this._buildLogEntry(log)));

      const errorCount = AppState.logs.filter(l => l.level === 'ERROR').length;
      const badge = document.getElementById('badge-logs');
      if (badge) {
        badge.textContent = errorCount > 0 ? errorCount : '';
        badge.dataset.count = errorCount;
      }
    } else {
      if (!this._memoList) return;
      while (this._memoList.firstChild) this._memoList.removeChild(this._memoList.firstChild);
      AppState.memos.forEach(memo => this._memoList.appendChild(this._buildMemoEntry(memo)));
    }
  },
};
