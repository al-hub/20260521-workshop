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

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  },

  emit(event, payload) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(fn => fn(payload));
  },

  setState(patch) {
    Object.assign(this, patch);
    this.emit('stateChange', patch);
  },
};
