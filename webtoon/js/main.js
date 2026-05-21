'use strict';

(function () {

  function initTabs() {
    var tabs   = document.querySelectorAll('.wt-tab');
    var panels = document.querySelectorAll('.wt-panel');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;
        tabs.forEach(function (t)   { t.classList.remove('wt-tab--active'); });
        panels.forEach(function (p) { p.classList.remove('wt-panel--active'); });
        tab.classList.add('wt-tab--active');
        var targetPanel = document.getElementById('tab-' + target);
        if (targetPanel) targetPanel.classList.add('wt-panel--active');
      });
    });
  }

  function initBadge() {
    var badge = document.getElementById('js-pipeline-badge');
    if (!badge) return;
    WebtoonState.on('change', function (state) {
      var status = state.pipeline_status;
      badge.textContent = status;
      badge.className = 'wt-badge wt-badge--' + status;
    });
  }

  var SAMPLE_PANELS = [
    { situation: '주인공이 출근 준비를 하다 핸드폰을 찾는다', dialogue: '아, 어디 뒀지?',      emotion: '당황',   bg_color: '#fef9c3' },
    { situation: '지하철에서 빈 자리를 발견하고 달려간다',    dialogue: '저 자리다!',          emotion: '기쁨',   bg_color: '#dbeafe' },
    { situation: '앉는 순간 옆 사람이 먼저 앉아버린다',      dialogue: '...이런.',            emotion: '슬픔',   bg_color: '#fce7f3' },
    { situation: '그래도 손잡이 잡고 평온하게 출근 완료',    dialogue: '뭐, 이게 인생이지.',  emotion: '자신감', bg_color: '#dcfce7' },
  ];

  function runPipeline(setting) {
    var steps = [
      {
        status: PIPELINE_STATUS.COLLECTING,
        logs: [
          { agent: 'SetupAgent', message: '설정 수집 시작: ' + setting.title },
          { agent: 'SetupAgent', message: '장르 확인: ' + setting.genre },
          { agent: 'SetupAgent', message: '캐릭터 분석: ' + setting.character_name + ' (' + setting.character_trait + ')' },
        ],
        delay: 1200,
        apply: function () {},
      },
      {
        status: PIPELINE_STATUS.STORYBOARDING,
        logs: [
          { agent: 'StoryAgent', message: '소재 분석 중: ' + setting.topic },
          { agent: 'StoryAgent', message: '4컷 구조 설계 시작' },
          { agent: 'StoryAgent', message: '감정 곡선 생성 완료' },
        ],
        delay: 1500,
        apply: function () {
          var panels = SAMPLE_PANELS.map(function (p, i) {
            return { id: i + 1, situation: p.situation, dialogue: p.dialogue, emotion: p.emotion, bg_color: p.bg_color };
          });
          WebtoonState.setState({ panels: panels });
        },
      },
      {
        status: PIPELINE_STATUS.RENDERING,
        logs: [
          { agent: 'DrawingAgent', message: '배경색 팔레트 적용 중' },
          { agent: 'DrawingAgent', message: '말풍선 레이아웃 최적화' },
          { agent: 'DrawingAgent', message: '캐릭터 감정 이모지 매핑 완료' },
        ],
        delay: 1200,
        apply: function () {},
      },
      {
        status: PIPELINE_STATUS.DONE,
        logs: [
          { agent: 'StrategyAgent', message: '파이프라인 완료. 4컷 웹툰 생성 성공!' },
        ],
        delay: 0,
        apply: function () {},
      },
    ];

    var stepIndex = 0;
    function runStep() {
      if (stepIndex >= steps.length) return;
      var step = steps[stepIndex];
      WebtoonState.setState({ pipeline_status: step.status });
      step.logs.forEach(function (log) { WebtoonState.appendLog(log.agent, log.message); });
      step.apply();
      stepIndex++;
      if (stepIndex < steps.length) setTimeout(runStep, step.delay || 1000);
    }
    runStep();
  }

  function initComponents() {
    SetupAgentComponent.init(document.getElementById('tab-setup'));
    StoryboardComponent.init(document.getElementById('tab-storyboard'));
    WebtoonRendererComponent.init(document.getElementById('tab-webtoon'));
    AgentLogComponent.init(document.getElementById('js-agent-log'));
    StrategyComponent.init(document.getElementById('tab-strategy'));
  }

  function bindPipelineStart() {
    WebtoonState.on('pipeline:start', function (setting) {
      WebtoonState.resetState();
      WebtoonState.setState({ setting: setting, pipeline_status: PIPELINE_STATUS.IDLE });
      WebtoonState.appendLog('오케스트레이터', '파이프라인 시작');
      runPipeline(setting);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initBadge();
    initComponents();
    bindPipelineStart();
    WebtoonState.appendLog('시스템', '4컷 웹툰 오케스트레이터 준비 완료');
  });

})();
