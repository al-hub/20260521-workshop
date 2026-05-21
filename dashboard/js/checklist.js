window.ChecklistComponent = {
  _container: null,
  _descEl: null,
  _itemsEl: null,
  _strategyBtns: null,

  init() {
    this._container = document.querySelector('#panel-checklist .panel-body');
    if (!this._container) return;
    this.update();
    AppState.on('stateChange', () => this.update());
  },

  _renderStrategySelector() {
    const wrap = document.createElement('div');
    wrap.className = 'strategy-selector';

    this._strategyBtns = {};
    ['committee', 'leader'].forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'strategy-btn' + (AppState.activeStrategy === s ? ' active' : '');
      btn.textContent = s === 'committee' ? '🗳 Committee' : '👑 Leader';
      btn.dataset.strategy = s;
      btn.addEventListener('click', () => {
        AppState.setState({ activeStrategy: s });
      });
      this._strategyBtns[s] = btn;
      wrap.appendChild(btn);
    });

    return wrap;
  },

  _renderDescription() {
    const desc = document.createElement('p');
    desc.className = 'strategy-description';
    this._descEl = desc;
    this._updateDescription();
    return desc;
  },

  _updateDescription() {
    if (!this._descEl) return;
    const descriptions = {
      committee: '다수 모델 투표로 합의 도출 — 정확도 우선, 속도 희생',
      leader: '리더 모델이 최종 결정, 나머지는 보조 — 속도 우선',
    };
    this._descEl.textContent = descriptions[AppState.activeStrategy] || '';
  },

  _buildChecklistItem(item) {
    const div = document.createElement('div');
    div.className = 'checklist-item' +
      (item.enabled ? ' checklist-item--enabled' : ' checklist-item--disabled');

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'checklist-item__toggle';
    toggle.checked = item.enabled;
    toggle.id = 'chk-toggle-' + item.id;
    toggle.addEventListener('change', () => {
      const updated = AppState.checklist.map(c =>
        c.id === item.id ? { ...c, enabled: toggle.checked } : c
      );
      AppState.setState({ checklist: updated });
    });

    const label = document.createElement('label');
    label.className = 'checklist-item__label';
    label.htmlFor = 'chk-toggle-' + item.id;
    label.textContent = item.label;

    const desc = document.createElement('p');
    desc.className = 'checklist-item__description';
    desc.textContent = item.description;

    div.appendChild(toggle);
    div.appendChild(label);
    div.appendChild(desc);
    return div;
  },

  _renderConfigPanel() {
    const wrap = document.createElement('div');

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'config-panel-toggle btn btn--ghost';
    toggleBtn.textContent = '⚙ 고급 설정';

    const panel = document.createElement('div');
    panel.className = 'config-panel';

    const info = document.createElement('p');
    info.textContent = '추가 라우팅 설정 및 폴백 모델 구성은 여기에서 관리합니다.';
    info.style.color = 'var(--color-text-muted)';
    info.style.fontSize = 'var(--text-sm)';
    panel.appendChild(info);

    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('open');
      toggleBtn.textContent = panel.classList.contains('open') ? '⚙ 고급 설정 닫기' : '⚙ 고급 설정';
    });

    wrap.appendChild(toggleBtn);
    wrap.appendChild(panel);
    return wrap;
  },

  update() {
    if (!this._container) return;

    while (this._container.firstChild) this._container.removeChild(this._container.firstChild);
    this._descEl = null;
    this._itemsEl = null;

    this._container.appendChild(this._renderStrategySelector());

    this._container.appendChild(this._renderDescription());

    const group = document.createElement('div');
    group.className = 'checklist-group';

    const title = document.createElement('h4');
    title.className = 'checklist-group__title';
    title.textContent = AppState.activeStrategy === 'committee'
      ? 'Committee 전략 설정'
      : 'Leader 전략 설정';
    group.appendChild(title);

    const { checklist, activeStrategy } = AppState;
    const filtered = checklist.filter(item => item.strategy === activeStrategy);
    filtered.forEach(item => group.appendChild(this._buildChecklistItem(item)));

    this._container.appendChild(group);

    this._container.appendChild(this._renderConfigPanel());

    const badge = document.getElementById('badge-checklist');
    if (badge) {
      const activeCount = checklist.filter(item => item.enabled).length;
      badge.textContent = activeCount > 0 ? activeCount : '';
      badge.dataset.count = activeCount;
    }
  },
};
