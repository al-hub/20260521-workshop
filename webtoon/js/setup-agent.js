'use strict';

// CSS 클래스: .setup-form, .setup-presets, .setup-label, .setup-fields
//             .form-group, .form-label, .form-input, .form-select
//             .btn, .btn--primary, .btn--outline, .btn--sm, .btn--lg
// RULE: innerHTML 금지 / textContent 사용 / document.createElement 사용

window.SetupAgentComponent = (function () {
  var _container = null;

  function _buildForm() {
    var section = document.createElement('div');
    section.className = 'setup-form';

    var presetArea = document.createElement('div');
    presetArea.className = 'setup-presets';
    var presetLabel = document.createElement('p');
    presetLabel.className = 'setup-label';
    presetLabel.textContent = '프리셋 소재 선택';
    presetArea.appendChild(presetLabel);

    PRESETS.forEach(function (preset) {
      var btn = document.createElement('button');
      btn.className = 'btn btn--outline btn--sm';
      btn.textContent = preset.label;
      btn.addEventListener('click', function () {
        WebtoonState.setState({ setting: JSON.parse(JSON.stringify(preset.setting)) });
        WebtoonState.appendLog('SetupAgent', '프리셋 적용: ' + preset.label);
        _syncFormValues();
      });
      presetArea.appendChild(btn);
    });
    section.appendChild(presetArea);

    var fields = [
      { key: 'title',           label: '제목',      type: 'text',   placeholder: '웹툰 제목을 입력하세요' },
      { key: 'genre',           label: '장르',      type: 'select', options: GENRE_LIST },
      { key: 'character_name',  label: '캐릭터명',  type: 'text',   placeholder: '주인공 이름' },
      { key: 'character_trait', label: '성격',      type: 'select', options: TRAIT_LIST },
      { key: 'topic',           label: '소재',      type: 'text',   placeholder: '이야기 소재 (예: 출근길 지하철)' },
    ];

    var form = document.createElement('form');
    form.className = 'setup-fields';
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    fields.forEach(function (field) {
      var group = document.createElement('div');
      group.className = 'form-group';

      var label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = field.label;
      label.setAttribute('for', 'setup-' + field.key);
      group.appendChild(label);

      var input;
      if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-select';
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '선택하세요';
        input.appendChild(placeholder);
        field.options.forEach(function (opt) {
          var option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.placeholder = field.placeholder || '';
      }
      input.id = 'setup-' + field.key;
      input.dataset.key = field.key;
      input.addEventListener('change', function (e) {
        var state = WebtoonState.getState();
        state.setting[field.key] = e.target.value;
        WebtoonState.setState({ setting: state.setting });
      });
      group.appendChild(input);
      form.appendChild(group);
    });
    section.appendChild(form);

    var startBtn = document.createElement('button');
    startBtn.id = 'js-start-btn';
    startBtn.className = 'btn btn--primary btn--lg';
    startBtn.textContent = '파이프라인 시작';
    startBtn.addEventListener('click', function () {
      var state = WebtoonState.getState();
      if (!state.setting.title || !state.setting.genre) {
        WebtoonState.appendLog('SetupAgent', '[오류] 제목과 장르는 필수입니다.');
        return;
      }
      WebtoonState.emit('pipeline:start', state.setting);
    });
    section.appendChild(startBtn);

    return section;
  }

  function _syncFormValues() {
    var state = WebtoonState.getState();
    var setting = state.setting;
    Object.keys(setting).forEach(function (key) {
      var el = document.getElementById('setup-' + key);
      if (el) el.value = setting[key] || '';
    });
  }

  function init(container) {
    _container = container;
    if (!_container) return;
    _container.appendChild(_buildForm());
    WebtoonState.on('change', _syncFormValues);
  }

  function update() { _syncFormValues(); }

  return { init: init, update: update };
})();
