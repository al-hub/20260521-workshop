'use strict';

// CSS 클래스: .wt-comic-title, .wt-comic-grid, .wt-comic-panel, .wt-comic-panel__num
//             .wt-comic-character, .wt-comic-name, .wt-speech-bubble, .wt-speech-bubble__text
//             .wt-comic-caption, .wt-print-btn
// RULE: innerHTML 금지 / textContent 사용 / document.createElement 사용

window.WebtoonRendererComponent = (function () {
  var _container = null;

  var EMOTION_EMOJI = {
    '기쁨': '😄', '슬픔': '😢', '분노': '😤',
    '당황': '😲', '설렘': '💕', '피곤': '😪',
    '고민': '🤔', '자신감': '😎', '기본': '🙂',
  };

  var BG_PALETTE = ['#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3'];

  function _resolveEmoji(emotion) {
    return EMOTION_EMOJI[emotion] || '🙂';
  }

  function _resolveBg(panel, index) {
    if (panel.bg_color) return panel.bg_color;
    return BG_PALETTE[index % BG_PALETTE.length];
  }

  function _buildPanel(panel, index, characterName) {
    var cell = document.createElement('div');
    cell.className = 'wt-comic-panel';
    cell.style.setProperty('--panel-bg', _resolveBg(panel, index));

    var num = document.createElement('span');
    num.className = 'wt-comic-panel__num';
    num.textContent = String(index + 1);
    cell.appendChild(num);

    var character = document.createElement('div');
    character.className = 'wt-comic-character';
    character.textContent = _resolveEmoji(panel.emotion);
    cell.appendChild(character);

    var nameTag = document.createElement('div');
    nameTag.className = 'wt-comic-name';
    nameTag.textContent = characterName || '캐릭터';
    cell.appendChild(nameTag);

    if (panel.dialogue) {
      var bubble = document.createElement('div');
      bubble.className = 'wt-speech-bubble';
      var text = document.createElement('p');
      text.className = 'wt-speech-bubble__text';
      text.textContent = panel.dialogue;
      bubble.appendChild(text);
      cell.appendChild(bubble);
    }

    if (panel.situation) {
      var caption = document.createElement('div');
      caption.className = 'wt-comic-caption';
      caption.textContent = panel.situation;
      cell.appendChild(caption);
    }

    return cell;
  }

  function _render() {
    if (!_container) return;
    while (_container.firstChild) _container.removeChild(_container.firstChild);
    var state = WebtoonState.getState();

    var titleEl = document.createElement('h2');
    titleEl.className = 'wt-comic-title';
    titleEl.textContent = state.setting.title || '제목 없음';
    _container.appendChild(titleEl);

    var grid = document.createElement('div');
    grid.className = 'wt-comic-grid';
    state.panels.forEach(function (panel, i) {
      grid.appendChild(_buildPanel(panel, i, state.setting.character_name));
    });
    _container.appendChild(grid);

    var printBtn = document.createElement('button');
    printBtn.className = 'btn btn--outline btn--sm wt-print-btn';
    printBtn.textContent = '인쇄 / 내보내기';
    printBtn.addEventListener('click', function () { window.print(); });
    _container.appendChild(printBtn);
  }

  function init(container) {
    _container = container;
    _render();
    WebtoonState.on('change', _render);
  }

  function update() { _render(); }

  return { init: init, update: update };
})();
