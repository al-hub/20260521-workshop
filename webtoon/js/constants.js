'use strict';

const WEBTOON_SCHEMA = Object.freeze({
  setting: {
    title: '',
    genre: '',
    character_name: '',
    character_trait: '',
    topic: '',
  },
  panels: [
    { id: 1, situation: '', dialogue: '', emotion: '', bg_color: '' },
    { id: 2, situation: '', dialogue: '', emotion: '', bg_color: '' },
    { id: 3, situation: '', dialogue: '', emotion: '', bg_color: '' },
    { id: 4, situation: '', dialogue: '', emotion: '', bg_color: '' },
  ],
  pipeline_status: 'idle',
  agent_logs: [],
});

const PIPELINE_STATUS = Object.freeze({
  IDLE:          'idle',
  COLLECTING:    'collecting',
  STORYBOARDING: 'storyboarding',
  RENDERING:     'rendering',
  DONE:          'done',
});

const GENRE_LIST = Object.freeze(['일상', '판타지', '개그', '로맨스']);
const TRAIT_LIST = Object.freeze(['밝음', '냉소적', '엉뚱함', '진지함']);

const PRESETS = Object.freeze([
  {
    label: '직장인의 월요일',
    setting: { title: '월요병', genre: '일상', character_name: '김대리', character_trait: '냉소적', topic: '출근길 지하철' },
  },
  {
    label: '판타지 용사의 고민',
    setting: { title: '용사의 번아웃', genre: '판타지', character_name: '영웅이', character_trait: '엉뚱함', topic: '던전 대신 카페' },
  },
  {
    label: '고양이와 주인',
    setting: { title: '집사의 하루', genre: '개그', character_name: '냥이', character_trait: '냉소적', topic: '밥 달라는 고양이' },
  },
  {
    label: '대학생 시험 전날',
    setting: { title: '벼락치기', genre: '일상', character_name: '수험생', character_trait: '엉뚱함', topic: '시험 전날 밤' },
  },
  {
    label: '로맨스 첫 만남',
    setting: { title: '운명의 만남', genre: '로맨스', character_name: '하은', character_trait: '밝음', topic: '우연한 카페 만남' },
  },
]);
