'use strict';

// CSS 클래스: .sb-grid, .sb-panel, .sb-panel__num, .sb-field-label
//             .sb-situation, .sb-emotion, .sb-dialogue-edit, .section-title
// RULE: innerHTML 금지 / textContent 사용 / document.createElement 사용

window.StoryboardComponent = (function () {
  var _container = null;

  function _renderPanel(panel, index) {
    var card = document.createElement('div');
    card.className = 'sb-panel';
    card.dataset.panelId = panel.id;

    var num = document.createElement('div');
    num.className = 'sb-panel__num';
    num.textContent = (index + 1) + '컷';
    card.appendChild(num);

    var situationLabel = document.createElement('p');
    situationLabel.className = 'sb-field-label';
    situationLabel.textContent = '상황';
    card.appendChild(situationLabel);

    var situationEl = document.createElement('p');
    situationEl.className = 'sb-situation';
    situationEl.textContent = panel.situation || '(생성 대기 중)';
    card.appendChild(situationEl);

    var emotionLabel = document.createElement('p');
    emotionLabel.className = 'sb-field-label';
    emotionLabel.textContent = '감정';
    card.appendChild(emotionLabel);

    var emotionEl = document.createElement('p');
    emotionEl.className = 'sb-emotion';
    emotionEl.textContent = panel.emotion || '-';
    card.appendChild(emotionEl);

    var dialogLabel = document.createElement('p');
    dialogLabel.className = 'sb-field-label';
    dialogLabel.textContent = '대사 (편집 가능)';
    card.appendChild(dialogLabel);

    var textarea = document.createElement('textarea');
    textarea.className = 'sb-dialogue-edit';
    textarea.rows = 3;
    textarea.value = panel.dialogue || '';
    textarea.placeholder = '대사를 입력하거나 수정하세요';
    (function (idx) {
      textarea.addEventListener('change', function (e) {
        var state = WebtoonState.getState();
        state.panels[idx].dialogue = e.target.value;
        WebtoonState.setState({ panels: state.panels });
        WebtoonState.appendLog('StoryboardEditor', (idx + 1) + '컷 대사 수정');
      });
    })(index);
    card.appendChild(textarea);

    return card;
  }

  function _render() {
    if (!_container) return;
    while (_container.firstChild) _container.removeChild(_container.firstChild);

    var state = WebtoonState.getState();
    var title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = '스토리보드';
    _container.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'sb-grid';
    state.panels.forEach(function (panel, i) {
      grid.appendChild(_renderPanel(panel, i));
    });
    _container.appendChild(grid);
  }

  function init(container) {
    _container = container;
    _render();
    WebtoonState.on('change', _render);
  }

  function update() { _render(); }

  return { init: init, update: update };
})();
