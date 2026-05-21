window.AgentsComponent = {
  _container: null,
  _filterBar: null,
  _grid: null,

  init() {
    this._container = document.querySelector('#panel-agents .panel-body');
    if (!this._container) return;
    this._renderFilterBar();
    this._renderGrid();
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderFilterBar() {
    const bar = document.createElement('div');
    bar.className = 'agent-filter-bar';
    const filters = [
      { value: 'all', label: '전체' },
      { value: 'idle', label: 'Idle' },
      { value: 'running', label: 'Running' },
      { value: 'error', label: 'Error' },
      { value: 'offline', label: 'Offline' },
      { value: 'paused', label: 'Paused' },
    ];
    filters.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (AppState.agentFilter === f.value ? ' active' : '');
      btn.textContent = f.label;
      btn.dataset.value = f.value;
      btn.addEventListener('click', () => {
        AppState.setState({ agentFilter: f.value });
      });
      bar.appendChild(btn);
    });
    this._filterBar = bar;
    this._container.appendChild(bar);
  },

  _renderGrid() {
    const grid = document.createElement('div');
    grid.className = 'agent-grid';
    this._grid = grid;
    this._container.appendChild(grid);
  },

  _formatUptime(seconds) {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
  },

  _formatRelativeTime(isoString) {
    if (!isoString) return '-';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return diff + '초 전';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    return Math.floor(diff / 3600) + '시간 전';
  },

  _buildCard(agent) {
    const card = document.createElement('article');
    card.className = 'agent-card';

    const header = document.createElement('div');
    header.className = 'agent-card__header';

    const dot = document.createElement('span');
    dot.className = 'agent-card__status-dot';
    dot.style.background = 'var(--color-status-' + agent.status + ')';

    const name = document.createElement('span');
    name.className = 'agent-card__name';
    name.textContent = agent.name;

    const typeBadge = document.createElement('span');
    typeBadge.className = 'agent-card__type-badge';
    typeBadge.textContent = agent.type;

    header.appendChild(dot);
    header.appendChild(name);
    header.appendChild(typeBadge);

    const statusBadge = document.createElement('span');
    statusBadge.className = 'status-badge status-badge--' + agent.status;
    statusBadge.textContent = agent.status;

    const body = document.createElement('div');
    body.className = 'agent-card__body';

    const fields = [
      { label: '모델', value: agent.model },
      { label: '현재 태스크', value: agent.current_task || '없음' },
      { label: '업타임', value: this._formatUptime(agent.uptime) },
      { label: '마지막 활동', value: this._formatRelativeTime(agent.last_active) },
    ];

    fields.forEach(f => {
      const row = document.createElement('div');
      row.className = 'agent-card__field';
      const lbl = document.createElement('span');
      lbl.className = 'agent-card__field-label';
      lbl.textContent = f.label;
      const val = document.createElement('span');
      val.className = 'agent-card__field-value';
      val.textContent = f.value;
      row.appendChild(lbl);
      row.appendChild(val);
      body.appendChild(row);
    });

    card.appendChild(header);
    card.appendChild(statusBadge);
    card.appendChild(body);
    return card;
  },

  update() {
    if (!this._grid) return;

    if (this._filterBar) {
      this._filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === AppState.agentFilter);
      });
    }

    const { agents, agentFilter } = AppState;
    const filtered = agentFilter === 'all'
      ? agents
      : agents.filter(a => a.status === agentFilter);

    while (this._grid.firstChild) this._grid.removeChild(this._grid.firstChild);

    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = '해당 상태의 에이전트가 없습니다.';
      this._grid.appendChild(empty);
    } else {
      filtered.forEach(agent => {
        this._grid.appendChild(this._buildCard(agent));
      });
    }

    const errorCount = agents.filter(a => a.status === 'error').length;
    const badge = document.getElementById('badge-agents');
    if (badge) {
      badge.textContent = errorCount > 0 ? errorCount : '';
      badge.dataset.count = errorCount;
    }
  },
};
