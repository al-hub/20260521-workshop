'use strict';

// CSS 클래스: .strategy-list, .strategy-item, .strategy-item--done, .strategy-item--active
//             .strategy-item__icon, .strategy-item__label, .strategy-item__agent
//             .strategy-summary, .strategy-summary__progress, .section-title
// RULE: innerHTML 금지 / textContent 사용 / document.createElement 사용

window.StrategyComponent = (function () {
  var _container = null;

  var STRATEGY_STEPS = [
    { id: 'setup',      label: '설정 수집',       agent: 'SetupAgent',     status_key: PIPELINE_STATUS.COLLECTING },
    { id: 'storyboard', label: '스토리보드 생성', agent: 'StoryAgent',     status_key: PIPELINE_STATUS.STORYBOARDING },
    { id: 'rendering',  label: '웹툰 렌더링',     agent: 'DrawingAgent',   status_key: PIPELINE_STATUS.RENDERING },
    { id: 'done',       label: '완료',            agent: '오케스트레이터', status_key: PIPELINE_STATUS.DONE },
  ];

  var STATUS_ORDER = [
    PIPELINE_STATUS.IDLE,
    PIPELINE_STATUS.COLLECTING,
    PIPELINE_STATUS.STORYBOARDING,
    PIPELINE_STATUS.RENDERING,
    PIPELINE_STATUS.DONE,
  ];

  function _isCompleted(step, currentStatus) {
    return STATUS_ORDER.indexOf(currentStatus) > STATUS_ORDER.indexOf(step.status_key);
  }

  function _render() {
    if (!_container) return;
    while (_container.firstChild) _container.removeChild(_container.firstChild);
    var state = WebtoonState.getState();

    var title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '파이프라인 전략';
    _container.appendChild(title);

    var list = document.createElement('ul');
    list.className = 'strategy-list';

    STRATEGY_STEPS.forEach(function (step) {
      var li = document.createElement('li');
      var done   = _isCompleted(step, state.pipeline_status);
      var active = state.pipeline_status === step.status_key;
      li.className = 'strategy-item' +
        (done   ? ' strategy-item--done'   : '') +
        (active ? ' strategy-item--active' : '');

      var icon = document.createElement('span');
      icon.className = 'strategy-item__icon';
      icon.textContent = done ? '✓' : (active ? '▶' : '○');
      li.appendChild(icon);

      var label = document.createElement('span');
      label.className = 'strategy-item__label';
      label.textContent = step.label;
      li.appendChild(label);

      var agent = document.createElement('span');
      agent.className = 'strategy-item__agent';
      agent.textContent = step.agent;
      li.appendChild(agent);

      list.appendChild(li);
    });
    _container.appendChild(list);

    var summary = document.createElement('div');
    summary.className = 'strategy-summary';
    var completedCount = STRATEGY_STEPS.filter(function (s) {
      return _isCompleted(s, state.pipeline_status);
    }).length;
    var progress = document.createElement('p');
    progress.className = 'strategy-summary__progress';
    progress.textContent = '진행률: ' + completedCount + ' / ' + STRATEGY_STEPS.length + ' 단계 완료';
    summary.appendChild(progress);
    _container.appendChild(summary);
  }

  function init(container) {
    _container = container;
    _render();
    WebtoonState.on('change', _render);
  }

  function update() { _render(); }

  return { init: init, update: update };
})();
