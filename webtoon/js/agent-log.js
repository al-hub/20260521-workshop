'use strict';

// CSS 클래스: .log-header, .log-entry, .log-entry--new, .log-entry__ts
//             .log-entry__agent, .log-entry__msg, .log-agent--{name}
// RULE: innerHTML 금지 / textContent 사용 / document.createElement 사용

window.AgentLogComponent = (function () {
  var _container = null;

  var AGENT_COLORS = {
    'SetupAgent':       'log-agent--setup',
    'StoryAgent':       'log-agent--story',
    'DrawingAgent':     'log-agent--drawing',
    'StrategyAgent':    'log-agent--strategy',
    'StoryboardEditor': 'log-agent--editor',
  };

  function _appendEntry(entry) {
    if (!_container) return;
    var item = document.createElement('div');
    item.className = 'log-entry log-entry--new';

    var ts = document.createElement('span');
    ts.className = 'log-entry__ts';
    var d = new Date(entry.timestamp);
    ts.textContent = [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
      String(d.getSeconds()).padStart(2, '0'),
    ].join(':');
    item.appendChild(ts);

    var agentTag = document.createElement('span');
    agentTag.className = 'log-entry__agent ' + (AGENT_COLORS[entry.agent] || 'log-agent--default');
    agentTag.textContent = entry.agent;
    item.appendChild(agentTag);

    var msg = document.createElement('span');
    msg.className = 'log-entry__msg';
    msg.textContent = entry.message;
    item.appendChild(msg);

    _container.appendChild(item);
    requestAnimationFrame(function () { item.classList.remove('log-entry--new'); });
    _container.scrollTop = _container.scrollHeight;
  }

  function _renderAll() {
    if (!_container) return;
    while (_container.firstChild) _container.removeChild(_container.firstChild);
    var header = document.createElement('p');
    header.className = 'log-header';
    header.textContent = '에이전트 로그';
    _container.appendChild(header);
    WebtoonState.getState().agent_logs.forEach(function (entry) { _appendEntry(entry); });
  }

  function init(container) {
    _container = container;
    _renderAll();
    WebtoonState.on('log', function (entry) { _appendEntry(entry); });
    WebtoonState.on('reset', _renderAll);
  }

  function update() { _renderAll(); }

  return { init: init, update: update };
})();
