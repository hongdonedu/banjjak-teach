/* 반짝이를 가르쳐요! 에너지 탐정단 — 학생·교사 화면 (GitHub Pages + 구글 앱스스크립트 저장)
 * 기록은 예전 앱과 같은 구글 시트(활동기록·대화기록·반짝이노트·도장판·졸업퀴즈)에 그대로 쌓여요.
 * 학생 이름은 받지 않고 반·번호만 저장해요. 미션 1~6은 모두 열려 있어서 아이들이 골라서 해요. */
(function () {
'use strict';

var API = 'https://script.google.com/macros/s/AKfycbyGk9uJKYRC0VXlm3UoykuSaUebevE0X1KG6wgP3GooQM5jwn2J0jnfhKZX-GBk6AfK/exec';
var FORMS = {
  pre: { t: '처음 마음 설문', when: '1차시 전에', url: 'https://docs.google.com/forms/d/e/1FAIpQLSfoFWG804jHuHzP6XdEsoiS9ZFSXZT_0BQp1m2AVhAqQRC3xA/viewform' },
  post: { t: '마지막 마음 설문', when: '졸업 시험 뒤에', url: 'https://docs.google.com/forms/d/e/1FAIpQLScPWxm7sazh8zdS1u_eef82q_KpK44FVpEAO2oiYnPlrDWaFA/viewform' }
};
var VOICE_ON = false; // 읽어 주기는 꺼 둬요(교실이 시끄러워져서)
var ICON = { 1: ['ic_plug', '🔌'], 2: ['ic_sun', '☀️'], 3: ['ic_wind', '🌬️'], 4: ['ic_tv', '📺'], 5: ['ic_earth', '🌏'], 6: ['ic_grad', '🎓'] };
var REASON_ICON = { EXP: ['ic_house', '🏠'], AUTH: ['ic_ear', '👂'], GUESS: ['ic_thought', '💭'] };
var STAMP_ICON = { light: 'st_light', plug: 'st_plug', tv: 'st_tv', fridge: 'st_fridge', family: 'st_family' };
var TAG = { OBS: '👀 내가 확인했어', EXP: '🏠 겪어 봤어', AUTH: '👂 들었어', GUESS: '💭 그냥 생각' };
var STEP_NAMES = ['반짝이 말 듣기', '내 생각 고르기', '직접 확인하기', '반짝이 가르치기', '반짝이와 이야기'];

var S = { data: null, cls: '', num: '', view: 'title', lesson: 0, step: 0 };

/* ---------------- 작은 도구 ---------------- */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2800); }
function confetti(n) {
  var cols = ['#ffd84d', '#6fe3ff', '#5ef0c0', '#ff8ad8', '#b7a4ff', '#ff9a52'];
  for (var i = 0; i < (n || 50); i++) {
    var c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length];
    c.style.animationDelay = Math.random() * .5 + 's'; c.style.animationDuration = 1.4 + Math.random() * 1.2 + 's';
    document.body.appendChild(c); setTimeout(function (x) { x.remove(); }.bind(null, c), 3300);
  }
}
function sparks() { var b = $('sparks'), h = ''; for (var i = 0; i < 22; i++) h += '<i style="left:' + (Math.random() * 100) + '%;animation-duration:' + (9 + Math.random() * 10) + 's;animation-delay:' + (-Math.random() * 18) + 's"></i>'; b.innerHTML = h; }
// 그림이 안 열리면 이모지로 바꿔 보여 줘요.
function img(name, emoji, cls) { return '<img class="' + (cls || 'ic') + '" src="assets/' + name + '.png" alt="" data-e="' + esc(emoji || '') + '">'; }
document.addEventListener('error', function (e) {
  var t = e.target; if (!t || t.tagName !== 'IMG' || t.dataset.fixed) return; t.dataset.fixed = '1';
  var em = t.getAttribute('data-e'); if (em) { var s = document.createElement('span'); s.className = (t.className || '') + ' e'; s.textContent = em; t.replaceWith(s); } else t.style.visibility = 'hidden';
}, true);
function bj(mood, cls) { return '<img class="bj ' + (cls || '') + '" src="assets/bj_' + mood + '.png" alt="반짝이" data-e="🤖">'; }
function talk(text, mood, extra) { return '<div class="talk">' + bj(mood || 'wave', 'float') + '<div class="bubble"><span class="who">반짝이</span>' + esc(text) + (extra || '') + '</div></div>'; }
function thinking(text, mood) { return '<div class="talk">' + bj(mood || 'think', 'float') + '<div class="bubble"><span class="who">반짝이</span><div class="loading"><i></i><i></i><i></i> ' + esc(text) + '</div></div></div>'; }
function toEnd() { setTimeout(function () { var m = document.querySelectorAll('.main .talk, .main .kid, .main .panel'); var last = m[m.length - 1]; if (last && last.scrollIntoView) try { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, 60); }
function kid(text) { return '<div class="kid"><span class="who">' + esc(S.num) + '번 선생님(나)</span>' + esc(text) + '</div>'; }

/* ---------------- 서버(구글 시트) ---------------- */
function call(fn) {
  var args = Array.prototype.slice.call(arguments, 1);
  return fetch(API, { method: 'POST', body: JSON.stringify({ fn: fn, args: args }), redirect: 'follow' })
    .then(function (r) { return r.json(); })
    .then(function (j) { if (!j.ok) throw new Error(j.error || '서버 오류'); return j.result; });
}
function callRetry(fn) { var a = arguments; return call.apply(null, a).catch(function () { return new Promise(function (ok) { setTimeout(ok, 1200); }).then(function () { return call.apply(null, a); }); }); }

/* ---------------- 말로 쓰기(🎤 → 글자) ---------------- */
function mic(id) {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('이 기기에서는 말로 쓰기가 안 돼요. 글자로 써 주세요.'); return; }
  try {
    var r = new SR(); r.lang = 'ko-KR'; r.interimResults = false; r.maxAlternatives = 1;
    toast('🎤 말해 보세요…');
    r.onresult = function (e) { var el = $(id); if (!el) return; el.value = (el.value ? el.value + ' ' : '') + e.results[0][0].transcript; el.dispatchEvent(new Event('input')); };
    r.onerror = function () { toast('마이크를 쓸 수 없어요. 글자로 써 주세요.'); };
    r.start();
  } catch (e) { toast('마이크를 쓸 수 없어요. 글자로 써 주세요.'); }
}

/* ---------------- 내 기록(이 기기) ---------------- */
function doneKey() { return 'bj_done_' + S.cls + '_' + S.num; }
function doneMap() { return store(doneKey()) || {}; }
function markDone(n) { var d = doneMap(); d[n] = (d[n] || 0) + 1; store(doneKey(), d); }

/* ---------------- 화면 그리기 ---------------- */
function setMode(m) { document.body.className = m ? 'mode-' + m : ''; }
function shell(inner) {
  setMode('in');
  $('app').innerHTML = '<div class="shell"><nav class="side" id="side" aria-label="차례">' + side() + '</nav><div class="main"><div class="inner">' + inner + '</div></div></div>';
  var on = document.querySelector('.side .nav.on'); if (on && on.scrollIntoView && window.innerWidth <= 900) try { on.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) {}
  window.scrollTo(0, 0);
}
function navBtn(v, icon, label, sub, st) {
  var on = S.view === v || (S.view === 'lesson' && v === 'm' + S.lesson) || (S.view === 'quiz' && v === 'm6');
  return '<button class="nav' + (on ? ' on' : '') + '" data-act="nav" data-v="' + v + '">' + icon + '<span>' + label + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' + (st || '') + '</button>';
}
function side() {
  var d = S.data, L = d.lessons, dm = doneMap(), h = '';
  h += '<div class="side-me">' + img('bj_wave', '🤖', '') + '<div><div class="k">ENERGY DETECTIVES</div><b>' + esc(S.cls) + '반 ' + esc(S.num) + '번 탐정</b></div></div>';
  h += navBtn('home', img('bj_happy', '🏠'), '탐정 본부');
  h += '<div class="side-label">미션 · 하고 싶은 것부터!</div>';
  for (var n = 1; n <= 6; n++) {
    var title = n === 6 ? '반짝이 졸업 시험' : L[n].title;
    var st = dm[n] ? '<span class="st done">✔ ' + dm[n] + '</span>' : (d.current === n ? '<span class="st today">오늘</span>' : '');
    h += navBtn('m' + n, img(ICON[n][0], ICON[n][1]), '미션 ' + n, title, st);
  }
  h += '<div class="side-label">우리 반</div>';
  h += navBtn('board', img('ic_note', '📒'), '반짝이 노트', '우리 반이 가르친 것');
  h += navBtn('stamp', img('ic_stamp', '⭐'), '에너지 지킴이', '집에서 도장 찍기');
  h += '<div class="side-label">설문</div>';
  h += navBtn('survey', '<span class="ic e">📝</span>', '마음 설문', '선생님이 말할 때만');
  h += '<div class="side-foot">' + '<button class="nav" data-act="relogin"><span class="ic e">🔁</span><span>반·번호 바꾸기</span></button>' +
    '<button class="nav" data-act="nav" data-v="teacher"><span class="ic e">🔑</span><span>선생님</span></button></div>';
  return h;
}

/* ---------------- 시작 화면 ---------------- */
function title() {
  S.view = 'title'; setMode('title');
  $('app').innerHTML = '<section class="title"><div class="title-bg"></div><div class="title-wrap">' +
    '<div class="kicker">2학년 창의적 체험활동 · 에너지와 우리 지구</div>' +
    '<h1><span class="l1">반짝이를</span><br><span class="l2">가르쳐요!</span></h1>' +
    '<div class="eng">ENERGY DETECTIVES</div>' +
    '<p class="lead">AI 동생 <b>반짝이</b>는 에너지를 잘 몰라서 <b>틀린 말</b>도 해요.<br>내가 <b>직접 확인</b>하고, <b>“왜냐하면”</b>으로 가르쳐 줘요!</p>' +
    '<div class="row"><button class="btn big y" data-act="start">⚡ 탐정 출발!</button></div>' +
    (S.cls ? '<div class="menu"><span class="chip">🕵️ ' + esc(S.cls) + '반 ' + esc(S.num) + '번 탐정</span><button class="chip" data-act="relogin">🔁 반·번호 바꾸기</button></div>' : '') +
    '<div class="menu"><button class="chip" data-act="nav" data-v="teacher">🔑 선생님</button></div>' +
    '</div>' +
    '<div class="credit">명진초 2학년 창체 · 반짝이를 가르쳐요 · 2026</div></section>';
}

/* ---------------- 반·번호 ---------------- */
function login() {
  S.view = 'login'; setMode('in'); S._cls = ''; S._num = '';
  var d = S.data, h = '<div class="solo">' + talk('안녕! 나는 아기 로봇 반짝이야. 우리 반과 번호를 눌러 줘. 이름은 안 써도 돼!', 'wave') +
    '<div class="panel"><h2>① 우리 반</h2><div class="grid g6" id="clsg">';
  for (var i = 1; i <= d.classes; i++) h += '<button class="num" data-act="pickCls" data-v="' + i + '">' + i + '반</button>';
  h += '</div></div><div class="panel"><h2>② 내 번호</h2><div class="grid g8" id="numg">';
  for (var j = 1; j <= d.students; j++) h += '<button class="num" data-act="pickNum" data-v="' + j + '">' + j + '</button>';
  h += '</div></div><div class="row c mt2"><button class="btn ghost" data-act="toTitle">◀ 처음으로</button><button class="btn big y" id="go" data-act="loginGo" disabled>시작하기 🚀</button></div></div>';
  $('app').innerHTML = h; window.scrollTo(0, 0);
}

/* ---------------- 탐정 본부 ---------------- */
function home() {
  S.view = 'home';
  var d = S.data, L = d.lessons, dm = doneMap(), cnt = 0;
  for (var k in dm) if (dm[k]) cnt++;
  var h = '<div class="page-h"><h1>에너지 탐정 본부</h1></div>' +
    talk(S.num + '번 선생님, 안녕! 오늘은 어떤 미션으로 나를 가르쳐 줄래? 고르는 건 너야!' + (cnt ? ' 벌써 ' + cnt + '개 미션을 가르쳐 줬어 ⭐' : ''), 'wave');
  h += '<div class="cards">';
  for (var n = 1; n <= 6; n++) {
    var x = n === 6 ? { title: '반짝이 졸업 시험', color: '#ff8ad8' } : L[n];
    h += '<button class="mcard" data-act="nav" data-v="m' + n + '" style="--mc:' + esc(x.color) + '">' +
      (d.current === n ? '<span class="ribbon">⭐ 오늘의 미션</span>' : '') + img(ICON[n][0], ICON[n][1]) +
      '<span class="n">MISSION ' + n + '</span><span class="t">' + esc(x.title) + '</span>' +
      '<span class="s' + (dm[n] ? ' done' : '') + '">' + (dm[n] ? '✔ ' + dm[n] + '번 가르쳤어요' : (n === 6 ? '반짝이의 실수를 찾아요' : '아직 안 했어요')) + '</span></button>';
  }
  h += '</div><div class="quick">' +
    '<button class="btn" data-act="nav" data-v="board">' + img('ic_note', '📒') + '우리 반 반짝이 노트</button>' +
    '<button class="btn" data-act="nav" data-v="stamp">' + img('ic_stamp', '⭐') + '에너지 지킴이 도장판</button></div>';
  shell(h);
}

/* ---------------- 미션 1~5 ---------------- */
function startLesson(n) {
  S.view = 'lesson'; S.lesson = Number(n); S.step = 0; S.prediction = ''; S.picked = []; S.observed = []; S.verdict = ''; S.reasons = []; S.own = ''; S.sentence = ''; S.t0 = Date.now(); S.logId = ''; S.first = null;
  step();
}
function lessonHead() {
  var L = S.data.lessons[S.lesson], h = '<div class="page-h">' + img(ICON[S.lesson][0], ICON[S.lesson][1]) + '<h1>미션 ' + S.lesson + '. ' + esc(L.title) + '</h1></div><div class="steps">';
  for (var i = 0; i < 5; i++) h += '<span class="' + (i === S.step ? 'on' : (i < S.step ? 'done' : '')) + '">' + (i < S.step ? '✔ ' : (i + 1) + '. ') + STEP_NAMES[i] + '</span>';
  return h + '</div>';
}
function step() {
  var L = S.data.lessons[S.lesson], h = lessonHead();
  if (S.step === 0) {
    h += '<div class="talk">' + bj('wave', 'float') + '<div class="bubble claim"><span class="who">반짝이 생각</span>' + esc(L.claim) + '</div></div>' +
      '<div class="panel center"><p style="font-size:24px;margin:0 0 14px">반짝이가 이렇게 생각하고 있어요. <b style="color:var(--yellow);font-weight:400">정말 그럴까요?</b></p>' +
      '<button class="btn big y" data-act="stepTo" data-v="1">다음 ▶</button></div>';
  } else if (S.step === 1) {
    h += talk('내 말이 맞을까? 먼저 네 생각을 골라 줘!', 'curious') +
      '<div class="pred">' +
      '<button class="btn m" data-act="pred" data-v="맞을 것 같아"><span class="em">⭕</span>맞을 것 같아</button>' +
      '<button class="btn p" data-act="pred" data-v="틀릴 것 같아"><span class="em">❌</span>틀릴 것 같아</button>' +
      '<button class="btn l" data-act="pred" data-v="잘 모르겠어"><span class="em">🤔</span>잘 모르겠어</button></div>';
  } else if (S.step === 2) {
    var sim = !!(window.BJSIM && BJSIM.has(S.lesson));
    h += talk(sim ? '반짝이 실험실에서 직접 해 보자! 준비물은 필요 없어.' : '그럼 직접 확인해 보자! 교실을 둘러봐.', 'think');
    h += '<div class="panel"><h2>' + img('ic_magnifier', '🔎', 'ic-in') + '확인하는 방법</h2><ul class="howto">' + (sim ? BJSIM.howTo[S.lesson] : L.howTo).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    if (sim) h += '<div class="panel simwrap"><h2>🧪 반짝이 실험실</h2><div id="simbox"></div></div>';
    if (L.checkType === 'pick') {
      h += '<div class="panel"><h2>🔎 ' + esc(L.pickTitle) + '</h2><div class="picks">' +
        L.items.map(function (it, i) { return '<button class="pick' + (S.picked.indexOf(it.t) >= 0 ? ' on' : '') + '" data-act="pick" data-v="' + i + '"><span class="em">' + it.e + '</span>' + esc(it.t) + '</button>'; }).join('') +
        '</div><p class="small center">찾은 물건을 모두 눌러요. 다시 누르면 지워져요.</p></div>';
    }
    h += '<div class="panel"><h2>👀 내가 확인한 것에 모두 ✔</h2><div id="obsbox">' + obsList() + '</div></div>' +
      '<div class="row c mt"><button class="btn big m" data-act="stepTo" data-v="3">반짝이 가르치러 가기 ▶</button></div>';
  } else if (S.step === 3) {
    h += talk(L.claim + ' …이렇게 생각했는데, 네가 확인해 보니 어땠어?', 'curious');
    h += '<div class="panel"><h2>① 반짝이 말은…</h2><div class="verdicts">' +
      vBtn('틀렸어', '❌ 네 말은 틀렸어', 'p') + vBtn('맞아', '⭕ 네 말이 맞아', 'm') + vBtn('모르겠어', '🤔 나도 잘 모르겠어', 'l') + '</div></div>';
    h += '<div class="panel"><h2>② 왜냐하면… <span class="small">(1~2개 골라요)</span></h2>';
    h += reasonOptions().map(function (o, i) {
      var ic = o.k === 'OBS' ? '<span class="em">' + o.e + '</span>' : img(REASON_ICON[o.k][0], REASON_ICON[o.k][1], 'em');
      return '<button class="reason' + (S.reasons.indexOf(i) >= 0 ? ' on' : '') + '" data-act="reason" data-v="' + i + '">' + ic + '<span class="tx">' + esc(o.t) + '</span><span class="tag ' + o.k + '">' + TAG[o.k] + '</span></button>';
    }).join('');
    h += '<h2 class="mt">③ 내 말로 더 알려 주기 <span class="small">(안 써도 돼요)</span></h2>' +
      '<div class="inputrow"><input class="txt" id="own" maxlength="100" placeholder="예) 얼음이 물이 되었어" value="' + esc(S.own) + '"><button class="btn sm" data-act="mic" data-v="own" aria-label="말로 쓰기">🎤</button></div></div>' +
      '<div class="sentence" id="sent"></div>' +
      '<div class="row c"><button class="btn big c" id="sendBtn" data-act="send">📮 반짝이에게 알려 주기</button></div>';
  }
  shell(h);
  if (S.step === 2 && window.BJSIM && BJSIM.has(S.lesson)) BJSIM.render(S.lesson, $('simbox'), simEvent);
  if (S.step === 3) { buildSentence(); var o = $('own'); if (o) o.addEventListener('input', function () { S.own = o.value; buildSentence(); }); }
}
// 실험실에서 아이가 실제로 해 본 것 → '내가 확인한 것'에 자동 ✔, 시트 '확인한 것' 칸에도 남겨요.
function simEvent(ev) {
  var lab = BJSIM.label[ev]; if (lab && S.picked.indexOf(lab) < 0) S.picked.push(lab);
  var i = (BJSIM.obs[S.lesson] || {})[ev];
  if (i === undefined || S.observed.indexOf(i) >= 0) return;
  S.observed.push(i); S.reasons = [];
  var ob = $('obsbox'); if (ob) { ob.innerHTML = obsList(); var b = ob.querySelector('[data-v="' + i + '"]'); if (b) { b.classList.add('flash'); } }
  toast('👀 확인했어요! ' + S.data.lessons[S.lesson].observations[i].t);
}
function vBtn(v, t, c) { return '<button class="btn ' + c + (S.verdict === v ? ' on' : '') + '" data-act="verdict" data-v="' + v + '">' + t + '</button>'; }
function obsText(o, i) {
  var L = S.data.lessons[S.lesson];
  if (L.checkType === 'pick' && i === 0) {
    var found = L.items.filter(function (it) { return it.y && it.t !== '전등' && S.picked.indexOf(it.t) >= 0; }).map(function (it) { return it.t; });
    if (found.length) return '교실에서 ' + found.slice(0, 4).join(', ') + (found.length > 4 ? ' 등' : '') + '도 전기를 쓰는 걸 찾았어';
  }
  return o.t;
}
function obsList() {
  var L = S.data.lessons[S.lesson];
  return L.observations.map(function (o, i) { return '<button class="reason' + (S.observed.indexOf(i) >= 0 ? ' on' : '') + '" data-act="obs" data-v="' + i + '"><span class="em">' + o.e + '</span><span class="tx">' + esc(obsText(o, i)) + '</span></button>'; }).join('') +
    '<button class="reason' + (S.observed.indexOf(-1) >= 0 ? ' on' : '') + '" data-act="obs" data-v="-1"><span class="em">⏳</span><span class="tx">아직 확인을 못 했어</span></button>';
}
function reasonOptions() {
  var L = S.data.lessons[S.lesson], list = [], seen = S.observed.filter(function (i) { return i >= 0; });
  seen.forEach(function (i) { var o = L.observations[i]; list.push({ t: obsText(o, i), k: 'OBS', e: o.e }); });
  L.observations.forEach(function (o, i) { if (seen.indexOf(i) < 0) list.push({ t: obsText(o, i), k: 'OBS', e: o.e }); });
  return list.concat(L.common);
}
function buildSentence() {
  var opts = reasonOptions(), rs = S.reasons.map(function (i) { return opts[i].t; }), s = '반짝아, ';
  if (S.verdict === '틀렸어') s += '네 말은 틀렸어. ';
  else if (S.verdict === '맞아') s += '네 말이 맞는 것 같아. ';
  else if (S.verdict === '모르겠어') s += '나도 잘 모르겠어. ';
  else s += '… ';
  if (rs.length) s += '왜냐하면 ' + rs.join(', 그리고 ') + '! ';
  if (S.own && S.own.trim()) s += S.own.trim();
  S.sentence = s.trim();
  var el = $('sent'); if (el) el.innerHTML = '<span class="who">🗣️ 내가 반짝이에게 할 말</span>' + esc(S.sentence);
}
function sendTeach() {
  if (!S.verdict) { toast('① 반짝이 말이 틀렸는지 맞는지 골라 주세요'); return; }
  if (!S.reasons.length && !(S.own && S.own.trim())) { toast('② 왜냐하면 이유를 골라 주세요'); return; }
  var opts = reasonOptions(), reasons = S.reasons.map(function (i) { return { t: opts[i].t, k: opts[i].k }; });
  S.step = 4;
  shell(lessonHead() + kid(S.sentence) + thinking('반짝이가 생각하는 중…')); toEnd();
  callRetry('teach', { lesson: S.lesson, cls: S.cls, num: S.num, prediction: S.prediction, picked: S.picked, verdict: S.verdict, reasons: reasons, own: S.own, sentence: S.sentence, t0: S.t0 })
    .then(function (r) { S.first = r; S.logId = r.id; talk1(); })
    .catch(function () { toast('앗, 인터넷이 약해요. 다시 한 번 눌러 주세요'); S.step = 3; step(); });
}
function talk1() {
  var r = S.first;
  var h = lessonHead() + kid(S.sentence) + talk(r.reply + ' ' + r.question, S.verdict === '틀렸어' ? 'aha' : 'curious') +
    '<div class="panel"><h2>💬 반짝이에게 대답해 줘요</h2><div class="row">' +
    (r.options || []).map(function (o) { return '<button class="btn" data-act="ans2" data-t="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') +
    '</div><div class="inputrow mt"><input class="txt" id="ans2" maxlength="100" placeholder="내 말로 대답해도 돼요"><button class="btn sm" data-act="mic" data-v="ans2" aria-label="말로 쓰기">🎤</button><button class="btn c" data-act="ans2own">보내기</button></div></div>';
  shell(h); toEnd();
}
function answer2(t) {
  t = String(t || '').trim(); if (!t) { toast('대답을 골라 주거나 써 주세요'); return; }
  var r = S.first; S.ans2 = t;
  shell(lessonHead() + kid(S.sentence) + talk(r.reply + ' ' + r.question, 'curious') + kid(t) + thinking('반짝이 노트에 적는 중…', 'write')); toEnd();
  callRetry('teach2', { id: S.logId, lesson: S.lesson, cls: S.cls, num: S.num, sentence: S.sentence, prevReply: r.reply, prevQuestion: r.question, prevNote: r.note, answer: t })
    .then(function (r2) { finishTalk(t, r2); })
    .catch(function () { finishTalk(t, { reply: '고마워, 선생님! 반짝이 노트에 적어 둘게.', note: r.note }); });
}
function finishTalk(t, r2) {
  var r = S.first;
  S.step = 4; markDone(S.lesson);
  var h = lessonHead() + kid(S.sentence) + talk(r.reply + ' ' + r.question, 'curious') + kid(t) + talk(r2.reply, 'happy') +
    (r2.note ? '<div class="note mt" style="max-width:520px;margin:18px auto">📒 <b style="font-weight:400">반짝이 노트에 붙었어요!</b><br>' + esc(r2.note) + '<div class="meta"><span>' + esc(S.num) + '번 선생님이 가르쳐 줌</span></div></div>' : '') +
    '<div class="panel center mt"><h2>오늘 반짝이를 가르쳐 보니 어땠어요?</h2><div class="feel">' +
    [['😀', '신났어요'], ['😐', '그저 그랬어요'], ['😥', '어려웠어요']].map(function (f) { return '<button class="btn" data-act="feel" data-v="' + f[0] + ' ' + f[1] + '"><span class="em">' + f[0] + '</span>' + f[1] + '</button>'; }).join('') + '</div></div>';
  shell(h); confetti(60); toEnd();
}
function feeling(f) {
  call('saveFeeling', { id: S.logId, feeling: f }).catch(function () {});
  var h = '<div class="page-h"><h1>미션 ' + S.lesson + ' 성공! 🎉</h1></div>' + talk('가르쳐 줘서 고마워! 너는 최고의 에너지 탐정이자 내 선생님이야. 다른 미션도 골라 줄래?', 'happy') +
    '<div class="quick"><button class="btn c" data-act="nav" data-v="board">' + img('ic_note', '📒') + '우리 반 노트 보기</button>' +
    '<button class="btn m" data-act="again">🔁 한 번 더 가르치기</button>' +
    '<button class="btn y" data-act="nav" data-v="home">' + img('bj_happy', '🏠') + '다른 미션 고르기</button></div>';
  shell(h); confetti(30);
}

/* ---------------- 우리 반 반짝이 노트 ---------------- */
function board(lesson) {
  S.view = 'board'; lesson = Number(lesson || S.boardLesson || S.lesson || S.data.current || 1); if (!(lesson >= 1 && lesson <= 5)) lesson = 1; S.boardLesson = lesson;
  var h = '<div class="page-h">' + img('ic_note', '📒') + '<h1>' + esc(S.cls) + '반 반짝이 노트</h1></div><p class="small" style="margin-top:-6px">우리 반 선생님들이 반짝이에게 가르쳐 준 것이에요. 좋은 설명에 ❤️를 눌러요.</p><div class="tabs">';
  for (var i = 1; i <= 5; i++) h += '<button class="tab' + (i === lesson ? ' on' : '') + '" data-act="boardTab" data-v="' + i + '">' + S.data.lessons[i].emoji + ' 미션 ' + i + '</button>';
  h += '<button class="tab" data-act="boardTab" data-v="' + lesson + '">🔄 새로 보기</button></div><div id="bd"><div class="loading"><i></i><i></i><i></i> 불러오는 중…</div></div>';
  shell(h);
  call('getBoard', S.cls, lesson).then(function (list) {
    if (S.view !== 'board') return;
    if (!list.length) { $('bd').innerHTML = talk('아직 노트가 비어 있어. 네가 첫 번째로 가르쳐 줄래?', 'curious'); return; }
    var liked = store('bj_likes') || {};
    $('bd').innerHTML = '<div class="board">' + list.map(function (n) {
      return '<div class="note">' + esc(n.text) + '<div class="meta"><span>' + esc(n.num) + '번 선생님</span><button class="like" data-act="like" data-v="' + esc(n.id) + '">' + (liked[n.id] ? '❤️' : '🤍') + ' ' + n.likes + '</button></div></div>';
    }).join('') + '</div>';
  }).catch(function () { var b = $('bd'); if (b) b.innerHTML = '<p class="center">불러오지 못했어요. 🔄 새로 보기를 눌러 주세요.</p>'; });
}
function like(b, id) {
  var liked = store('bj_likes') || {}; if (liked[id]) { toast('이미 하트를 눌렀어요 ❤️'); return; }
  liked[id] = 1; store('bj_likes', liked);
  call('likeNote', id).then(function (v) { b.textContent = '❤️ ' + v; }).catch(function () {});
}

/* ---------------- 에너지 지킴이 도장판 ---------------- */
function dayStr(offset) { var p = S.data.today.split('-'), d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); d.setDate(d.getDate() + offset); var m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; }
function stamp() {
  S.view = 'stamp'; S.stampDate = S.stampDate || dayStr(0); S.marks = {};
  var h = '<div class="page-h">' + img('ic_stamp', '⭐') + '<h1>에너지 지킴이 도장판</h1></div>' + talk('집에서 전기를 아낀 날, 도장을 쾅! 찍어 줘.', 'happy') +
    '<div class="tabs">' + [['오늘', 0], ['어제', -1], ['그저께', -2]].map(function (x) { var ds = dayStr(x[1]); return '<button class="tab' + (S.stampDate === ds ? ' on' : '') + '" data-act="stampDay" data-v="' + ds + '">' + x[0] + ' (' + ds.slice(5).replace('-', '/') + ')</button>'; }).join('') + '</div>' +
    '<div class="panel">' + S.data.stamps.map(function (s) { return '<button class="stamp" id="st_' + s.k + '" data-act="stampT" data-v="' + s.k + '">' + img(STAMP_ICON[s.k] || 'st_light', s.e, '') + '<span class="tx">' + esc(s.t) + '</span><span class="mark">도장</span></button>'; }).join('') +
    '<div class="row c mt"><button class="btn big m" data-act="stampSave">💾 도장 저장하기</button></div></div><div id="week" class="mt"></div>';
  shell(h); loadWeek();
}
function toggleStamp(k) { S.marks[k] = !S.marks[k]; var b = $('st_' + k); if (!b) return; b.classList.toggle('on', !!S.marks[k]); b.querySelector('.mark').innerHTML = S.marks[k] ? '참<br>잘했어요' : '도장'; }
function saveStamp() {
  callRetry('saveStamp', { cls: S.cls, num: S.num, date: S.stampDate, marks: S.marks }).then(function (list) { toast('도장을 저장했어요! ⭐'); confetti(40); drawWeek(list); }).catch(function () { toast('저장하지 못했어요. 다시 눌러 주세요.'); });
}
function loadWeek() {
  call('getStamps', S.cls, S.num).then(function (list) {
    if (S.view !== 'stamp') return;
    drawWeek(list);
    var cur = list.filter(function (x) { return x.date === S.stampDate; })[0];
    if (cur) Object.keys(cur.marks).forEach(function (k) { if (Number(cur.marks[k])) { S.marks[k] = false; toggleStamp(k); } });
  }).catch(function () {});
}
function drawWeek(list) {
  var w = $('week'); if (!w) return;
  if (!list || !list.length) { w.innerHTML = ''; return; }
  var items = S.data.stamps, last = list.slice(-7), total = 0;
  list.forEach(function (r) { total += Number(r.sum) || 0; });
  var h = '<div class="panel"><h2>📅 내 도장 기록 <span class="chip">모은 도장 ' + total + '개</span></h2><div class="tblwrap"><table class="week"><tr><th>날짜</th>' + items.map(function (s) { return '<th>' + s.e + '</th>'; }).join('') + '<th>합계</th></tr>';
  last.forEach(function (r) { h += '<tr><td>' + esc(r.date.slice(5).replace('-', '/')) + '</td>' + items.map(function (s) { return '<td>' + (Number(r.marks[s.k]) ? '⭐' : '') + '</td>'; }).join('') + '<td>' + esc(r.sum) + '</td></tr>'; });
  w.innerHTML = h + '</table></div></div>';
}

/* ---------------- 미션 6: 반짝이 졸업 시험 ---------------- */
function quizStart() {
  S.view = 'quiz'; S.quiz = []; S.qi = 0; S.fixes = [];
  shell('<div class="page-h">' + img('ic_grad', '🎓') + '<h1>미션 6. 반짝이 졸업 시험</h1></div>' +
    talk('그동안 배운 걸 말해 볼게! 내 말이 맞으면 ⭕, 틀리면 ❌를 눌러 줘. 내가 몰래 실수를 넣었을 수도 있어!', 'grad') +
    '<div class="row c mt"><button class="btn big p" data-act="quizGo">시험 시작! ▶</button></div>');
}
function quizQ() {
  var q = S.data.quiz[S.qi];
  shell('<div class="page-h">' + img('ic_grad', '🎓') + '<h1>졸업 시험 ' + (S.qi + 1) + ' / ' + S.data.quiz.length + '</h1></div>' + talk(q.e + ' ' + q.q, 'wave') +
    '<div class="ox"><button class="btn m" data-act="quizA" data-v="O" aria-label="맞아요">⭕</button><button class="btn p" data-act="quizA" data-v="X" aria-label="틀려요">❌</button></div>');
}
function quizA(a) {
  S.quiz[S.qi] = a;
  if (a === 'X') {
    shell('<div class="page-h">' + img('ic_grad', '🎓') + '<h1>졸업 시험 ' + (S.qi + 1) + '</h1></div>' + talk('앗, 내가 틀렸어? 어떻게 고쳐야 해? 어떻게 확인했는지도 알려 줘!', 'confused') +
      '<div class="panel"><div class="inputrow"><input class="txt" id="fix" maxlength="100" placeholder="예) 바람개비에 불어 보니 돌았어"><button class="btn sm" data-act="mic" data-v="fix" aria-label="말로 쓰기">🎤</button></div>' +
      '<div class="row c mt"><button class="btn c" data-act="quizFix">알려 주기 ▶</button></div></div>');
  } else quizNext();
}
function quizNext() {
  S.qi++;
  if (S.qi < S.data.quiz.length) { quizQ(); return; }
  shell(thinking('채점하는 중…', 'grad'));
  callRetry('submitQuiz', { cls: S.cls, num: S.num, answers: S.quiz, fixes: S.fixes }).then(function (r) {
    markDone(6);
    var h = '<div class="page-h"><h1>시험 결과 🎉</h1></div>' + talk('내가 몰래 넣은 실수 2개 중에서 ' + r.caught + '개를 찾아냈어! 정말 대단한 선생님이야.', 'happy') + '<div class="panel">';
    S.data.quiz.forEach(function (q, i) {
      var x = r.results[i];
      h += '<div class="qres"><span>' + (x.ok ? '✅' : '🔸') + '</span><span>' + q.e + ' ' + esc(q.q) + ' <span class="badge">정답 ' + (x.a === 'O' ? '⭕' : '❌') + '</span>' + (x.planted ? '<br><span class="small">→ 바르게 고치면: ' + esc(x.fix) + '</span>' : '') + '</span></div>';
    });
    h += '</div><div class="row c mt"><button class="btn big y" data-act="cert" data-v="' + r.caught + '">🎓 졸업장 받기</button></div>';
    shell(h); confetti(70);
  }).catch(function () { toast('저장하지 못했어요. 다시 해 주세요.'); quizStart(); });
}
function cert(c) {
  var p = S.data.today.split('-');
  shell('<div class="cert">' + '<h1>🎓 반짝이 졸업장</h1>' + bj('grad', 'float') +
    '<h2>' + esc(S.data.grade) + '학년 ' + esc(S.cls) + '반 ' + esc(S.num) + '번 에너지 탐정님</h2>' +
    '<p style="font-size:22px">반짝이가 틀린 말을 할 때마다<br>직접 확인하고 “왜냐하면”으로 친절하게 가르쳐 주었기에<br>이 졸업장을 드립니다.</p>' +
    '<p>⭐ 반짝이 실수 찾기: ' + c + ' / 2</p><p>' + p[0] + '년 ' + Number(p[1]) + '월 ' + Number(p[2]) + '일<br><b>제자 반짝이 드림</b></p></div>' +
    '<div class="row c mt noprint"><button class="btn y" data-act="nav" data-v="home">🏠 본부로</button></div>');
  confetti(80);
}

/* ---------------- 마음 설문(구글 설문지를 이 화면 안에서) ---------------- */
function survey(which) {
  S.view = 'survey'; which = which || S.surveyWhich || 'pre'; S.surveyWhich = which;
  var f = FORMS[which];
  shell('<div class="page-h"><span class="ic e">📝</span><h1>마음 설문</h1></div>' +
    talk('이건 시험이 아니야. 정답이 없어! 선생님이 한 문제씩 읽어 주면, 내 마음과 가장 가까운 것을 눌러 줘.', 'wave') +
    '<div class="tabs"><button class="tab' + (which === 'pre' ? ' on' : '') + '" data-act="survey" data-v="pre">① ' + FORMS.pre.t + ' (' + FORMS.pre.when + ')</button>' +
    '<button class="tab' + (which === 'post' ? ' on' : '') + '" data-act="survey" data-v="post">② ' + FORMS.post.t + ' (' + FORMS.post.when + ')</button></div>' +
    '<div class="formbox"><iframe src="' + f.url + '?embedded=true" title="' + esc(f.t) + '" loading="lazy">불러오는 중…</iframe></div>' +
    '<p class="small mt">화면이 안 보이면 <a href="' + f.url + '" target="_blank" rel="noopener">여기를 눌러 새 창에서 열어요 ↗</a></p>');
}

/* ---------------- 선생님 ---------------- */
function teacher() {
  S.view = 'teacher';
  var inner = '<div class="page-h"><span class="ic e">🔑</span><h1>선생님 화면</h1></div><div class="panel center">' +
    // 코드는 화면에 숫자로 나오지 않게 ●로 가리고, 기기가 비밀번호로 기억하지 않게 해요.
    '<div class="row c"><input class="txt secret" id="tc" type="text" inputmode="numeric" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="●●●●" aria-label="선생님 코드"><button class="btn y" data-act="tlogin">들어가기</button></div></div>' +
    '<div class="row c mt"><button class="btn ghost" data-act="back">◀ 돌아가기</button></div>';
  if (S.cls) shell(inner); else { setMode('in'); $('app').innerHTML = '<div class="solo">' + inner + '</div>'; }
  var t = $('tc'); if (t) { t.focus(); t.addEventListener('keydown', function (e) { if (e.key === 'Enter') tLogin(); }); }
}
function tLogin() { var c = $('tc').value; call('teacherLogin', c).then(function (r) { if (!r.ok) { toast('코드가 달라요'); return; } S.tcode = c; tDash(r); }).catch(function (e) { toast('오류: ' + (e.message || e)); }); }
function tSet(k, v) { call('teacherSet', S.tcode, k, v).then(function (r) { if (r.ok) { S.data.current = r.current; tDash(r); toast('바꿨어요'); } }); }
function tDash(r) {
  S.view = 'tdash';
  var h = '<div class="page-h"><span class="ic e">👩‍🏫</span><h1>선생님 화면</h1></div>' +
    '<div class="panel"><h2>오늘의 미션 (⭐ 표시만 해요)</h2><div class="tabs">';
  for (var j = 1; j <= 6; j++) h += '<button class="tab' + (r.current === j ? ' on' : '') + '" data-act="tset" data-k="current" data-v="' + j + '">' + j + '차시</button>';
  h += '</div><p class="small">이 새 화면에서는 <b>미션 1~6이 모두 열려 있어요.</b> 아이들은 원하는 미션을 골라 하고, 여기서 고른 차시에는 ‘오늘의 미션’ 별표가 붙어요.</p></div>' +
    '<div class="panel"><h2>AI 대답</h2><p class="small">Gemini 키: ' + (r.keySet ? '설정됨' : '없음 → 기본 대답 모드(만 18세 미만 사용 제한 때문에 기본 대답으로 수업)') + ' · 지금: ' + (r.aiOn && r.keySet ? 'AI 대답' : '기본 대답') + '</p>' +
    '<div class="row"><button class="btn sm' + (r.aiOn ? ' m' : '') + '" data-act="tset" data-k="ai" data-v="1">AI 켜기</button><button class="btn sm' + (!r.aiOn ? ' p' : '') + '" data-act="tset" data-k="ai" data-v="0">AI 끄기(기본 대답)</button></div></div>' +
    '<div class="panel"><h2>현황</h2><div class="stat"><div><b>' + r.total + '</b>전체 가르치기</div><div><b>' + r.todayCount + '</b>오늘</div><div><b>' + r.obsRate + '%</b>직접 확인 증거 사용</div></div><p class="mt">' +
    Object.keys(r.byClass).map(function (k) { return '<span class="badge">' + esc(k) + ' ' + r.byClass[k] + '</span>'; }).join(' ') + '</p>' +
    '<p><a href="' + esc(r.sheetUrl) + '" target="_blank" rel="noopener">📊 연구 데이터 시트 열기 ↗</a></p></div>' +
    '<div class="panel"><h2>최근 기록</h2><div class="tblwrap"><table class="tbl"><tr><th>시각</th><th>학생</th><th>미션</th><th>가르친 문장</th><th>반짝이</th><th>증거</th><th>기분</th></tr>' +
    r.recent.map(function (x) { return '<tr><td>' + esc(x.time) + '</td><td>' + esc(x.who) + '</td><td>' + esc(x.lesson) + '</td><td>' + esc(x.sentence) + '</td><td>' + esc(x.reply) + ' <span class="muted">(' + esc(x.mode) + ')</span></td><td>' + esc(x.score) + '</td><td>' + esc(x.feeling) + '</td></tr>'; }).join('') +
    '</table></div></div><div class="row c mt"><button class="btn" data-act="trefresh">🔄 새로고침</button><button class="btn ghost" data-act="back">◀ 학생 화면</button></div>';
  if (S.cls) shell(h); else { $('app').innerHTML = '<div class="solo">' + h + '</div>'; window.scrollTo(0, 0); }
}

/* ---------------- 이동 ---------------- */
function nav(v) {
  if (v === 'teacher') return teacher();
  if (!S.cls) return login();
  if (v === 'home') return home();
  if (v === 'board') return board();
  if (v === 'stamp') return stamp();
  if (v === 'survey') return survey();
  if (/^m[1-5]$/.test(v)) return startLesson(Number(v.slice(1)));
  if (v === 'm6') return quizStart();
  home();
}

document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  var a = b.dataset.act, v = b.dataset.v;
  switch (a) {
    case 'start': return S.cls ? home() : login();
    case 'toTitle': return title();
    case 'relogin': store('bj_user', {}); S.cls = ''; S.num = ''; return login();
    case 'pickCls': [].forEach.call(document.querySelectorAll('#clsg .num'), function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); S._cls = v; $('go').disabled = !(S._cls && S._num); return;
    case 'pickNum': [].forEach.call(document.querySelectorAll('#numg .num'), function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); S._num = v; $('go').disabled = !(S._cls && S._num); return;
    case 'loginGo': S.cls = S._cls; S.num = S._num; store('bj_user', { cls: S.cls, num: S.num }); toast(S.cls + '반 ' + S.num + '번 탐정, 출동! ⚡'); return home();
    case 'nav': return nav(v);
    case 'stepTo': S.step = Number(v); return step();
    case 'pred': S.prediction = v; S.step = 2; return step();
    case 'pick': (function () { var t = S.data.lessons[S.lesson].items[Number(v)].t, k = S.picked.indexOf(t); if (k >= 0) { S.picked.splice(k, 1); b.classList.remove('on'); } else { S.picked.push(t); b.classList.add('on'); } var ob = $('obsbox'); if (ob) ob.innerHTML = obsList(); })(); return;
    case 'obs': (function () { var i = Number(v), k = S.observed.indexOf(i); if (k >= 0) { S.observed.splice(k, 1); b.classList.remove('on'); } else { S.observed.push(i); b.classList.add('on'); } S.reasons = []; })(); return;
    case 'verdict': S.verdict = v; [].forEach.call(document.querySelectorAll('.verdicts .btn'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); return buildSentence();
    case 'reason': (function () { var i = Number(v), k = S.reasons.indexOf(i); if (k >= 0) { S.reasons.splice(k, 1); b.classList.remove('on'); } else { if (S.reasons.length >= 2) { toast('이유는 2개까지 고를 수 있어요'); return; } S.reasons.push(i); b.classList.add('on'); } buildSentence(); })(); return;
    case 'mic': return mic(v);
    case 'send': return sendTeach();
    case 'ans2': return answer2(b.dataset.t);
    case 'ans2own': return answer2(($('ans2') || {}).value);
    case 'feel': return feeling(v);
    case 'again': return startLesson(S.lesson);
    case 'boardTab': return board(v);
    case 'like': return like(b, v);
    case 'stampDay': S.stampDate = v; return stamp();
    case 'stampT': return toggleStamp(v);
    case 'stampSave': return saveStamp();
    case 'quizGo': return quizQ();
    case 'quizA': return quizA(v);
    case 'quizFix': (function () { var x = (($('fix') || {}).value || '').trim(); S.fixes.push((S.qi + 1) + '번: ' + (x || '(안 씀)')); })(); return quizNext();
    case 'cert': return cert(v);
    case 'survey': return survey(v);
    case 'tlogin': return tLogin();
    case 'tset': return tSet(b.dataset.k, b.dataset.k === 'ai' ? v === '1' : Number(v));
    case 'trefresh': return call('teacherLogin', S.tcode).then(function (r) { if (r.ok) tDash(r); });
    case 'back': return S.cls ? home() : title();
  }
});
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'ans2') answer2(e.target.value);
  if (e.target.id === 'fix') { var b = document.querySelector('[data-act="quizFix"]'); if (b) b.click(); }
});

/* ---------------- 시작 ---------------- */
function boot() {
  sparks();
  var u = store('bj_user'); if (u && u.cls && u.num) { S.cls = u.cls; S.num = u.num; }
  $('app').innerHTML = '<div class="solo"><div class="loading" style="min-height:60vh"><i></i><i></i><i></i> 반짝이를 깨우는 중…</div></div>';
  callRetry('getAppData').then(function (d) { S.data = d; title(); })
    .catch(function (e) { $('app').innerHTML = '<div class="solo"><div class="panel center"><h2>앗, 연결이 잠깐 끊겼어요</h2><p class="small">' + esc(e.message || e) + '</p><button class="btn y" onclick="location.reload()">다시 해 보기</button></div></div>'; });
}
window.__bj = { S: S }; // 점검용
boot();
})();
