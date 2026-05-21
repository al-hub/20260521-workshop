'use strict';

window.WebtoonState = (function () {
  var _state = JSON.parse(JSON.stringify(WEBTOON_SCHEMA));
  var _listeners = {};

  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }

  function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (f) { return f !== fn; });
  }

  function emit(event, payload) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(function (fn) { fn(payload); });
  }

  function getState() {
    return JSON.parse(JSON.stringify(_state));
  }

  function setState(partial) {
    Object.assign(_state, partial);
    emit('change', getState());
  }

  function resetState() {
    _state = JSON.parse(JSON.stringify(WEBTOON_SCHEMA));
    emit('reset', getState());
  }

  function appendLog(agent, message) {
    var entry = {
      timestamp: new Date().toISOString(),
      agent: agent,
      message: message,
    };
    _state.agent_logs.push(entry);
    emit('log', entry);
  }

  return { on: on, off: off, emit: emit, getState: getState, setState: setState, resetState: resetState, appendLog: appendLog };
})();
