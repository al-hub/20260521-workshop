window.TasksComponent = {
  _container: null,
  _tbody: null,

  init() {
    this._container = document.querySelector('#panel-tasks .panel-body');
    if (!this._container) return;
    this._renderToolbar();
    this._renderTable();
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'task-toolbar';

    // 상태 필터
    const filterSel = document.createElement('select');
    filterSel.className = 'task-filter-select';
    const filterOpts = [
      { value: 'all', label: '전체 상태' },
      { value: 'pending', label: 'Pending' },
      { value: 'queued', label: 'Queued' },
      { value: 'running', label: 'Running' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];
    filterOpts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      filterSel.appendChild(opt);
    });
    filterSel.value = AppState.taskFilter;
    filterSel.addEventListener('change', e => {
      AppState.setState({ taskFilter: e.target.value });
    });

    // 정렬
    const sortSel = document.createElement('select');
    sortSel.className = 'task-sort-select';
    const sortOpts = [
      { value: 'created_at', label: '최신순' },
      { value: 'status', label: '상태순' },
      { value: 'title', label: '제목순' },
    ];
    sortOpts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      sortSel.appendChild(opt);
    });
    sortSel.value = AppState.taskSort;
    sortSel.addEventListener('change', e => {
      AppState.setState({ taskSort: e.target.value });
    });

    toolbar.appendChild(filterSel);
    toolbar.appendChild(sortSel);
    this._container.appendChild(toolbar);
  },

  _renderTable() {
    const table = document.createElement('table');
    table.className = 'task-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['태스크', '상태', '담당 에이전트', '생성 시각'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    this._tbody = tbody;
    table.appendChild(tbody);

    this._container.appendChild(table);
  },

  _buildRow(task, agents) {
    const tr = document.createElement('tr');
    tr.className = 'task-row';

    // 제목
    const tdTitle = document.createElement('td');
    tdTitle.textContent = task.title;

    // 상태 배지
    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'task-status-badge task-status-badge--' + task.status;
    badge.textContent = task.status;
    tdStatus.appendChild(badge);

    // 담당 에이전트
    const tdAgent = document.createElement('td');
    const agent = agents.find(a => a.id === task.assigned_agent_id);
    tdAgent.textContent = agent ? agent.name : '미배정';

    // 생성 시각
    const tdDate = document.createElement('td');
    tdDate.textContent = task.created_at
      ? new Date(task.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '-';

    tr.appendChild(tdTitle);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAgent);
    tr.appendChild(tdDate);
    return tr;
  },

  _filterTasks(tasks) {
    const f = AppState.taskFilter;
    return f === 'all' ? tasks : tasks.filter(t => t.status === f);
  },

  _sortTasks(tasks) {
    const s = AppState.taskSort;
    return [...tasks].sort((a, b) => {
      if (s === 'created_at') return new Date(b.created_at) - new Date(a.created_at);
      if (s === 'status') return a.status.localeCompare(b.status);
      if (s === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  },

  update() {
    if (!this._tbody) return;

    const { tasks, agents } = AppState;
    const filtered = this._filterTasks(tasks);
    const sorted = this._sortTasks(filtered);

    while (this._tbody.firstChild) this._tbody.removeChild(this._tbody.firstChild);

    if (sorted.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.className = 'task-empty';
      td.textContent = '해당 조건의 태스크가 없습니다.';
      tr.appendChild(td);
      this._tbody.appendChild(tr);
    } else {
      sorted.forEach(task => {
        this._tbody.appendChild(this._buildRow(task, agents));
      });
    }

    // 알림 배지: running + queued 태스크 수
    const activeCount = tasks.filter(t => t.status === 'running' || t.status === 'queued').length;
    const badge = document.getElementById('badge-tasks');
    if (badge) {
      badge.textContent = activeCount > 0 ? activeCount : '';
      badge.dataset.count = activeCount;
    }
  },
};
