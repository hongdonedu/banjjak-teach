/* 반짝이 실험실 — 준비물 없이 화면 안에서 하는 '직접 확인하기' (미션 2~5)
 * 미션 2 햇빛: 얼음 녹이기(시간 흐르기) + 종이 만져 보기(온도계)
 * 미션 3 바람: 바람개비(약하게·세게·멈추기, 입으로 불기 선택) + 종이 조각 + 바람 안경
 * 미션 4 대기 전력: TV·리모컨·플러그·'전기 숫자 측정기'
 * 미션 5 전기 오는 길: 그림 카드 순서 + 발전소 바꾸기·불 끄기(연기)
 * 아이가 한 일을 emit(사건)으로 알려 주면, 학생 앱은 '내가 확인한 것'에 자동으로 ✔ 하고 시트 '확인한 것' 칸에 남겨요. */
(function () {
'use strict';
var SIM = {};
var HOWTO = {
  2: ['☀️ 얼음 하나는 햇빛, 하나는 그늘에 있어요', '⏩ ‘5분 지나가기’를 3번 눌러 15분을 보내요', '🖐️ 검은 종이·흰 종이·그늘 종이를 눌러 만져 봐요'],
  3: ['🪭 ‘살랑살랑’과 💨 ‘세게 후~’를 눌러 바람개비를 봐요', '✋ 바람을 멈추면 어떻게 될까요?', '👓 바람 안경을 쓰면 안 보이던 바람이 보여요', '🎤 입으로 후~ 불어 봐도 돼요(선택)'],
  4: ['📺 TV가 켜져 있어요. 측정기 숫자를 봐요', '🔴 리모컨으로 끄고, 숫자와 TV를 자세히 봐요', '🔌 플러그를 뽑으면 숫자는? (진짜 플러그는 꼭 어른과 함께!)'],
  5: ['🃏 전기가 오는 순서대로 카드를 눌러요', '🏭 석탄 발전소와 ☀️ 햇빛·바람 발전소를 바꿔 봐요', '💡 안 쓰는 불을 끄면 연기는 어떻게 될까요?']
};
// 사건 → '내가 확인한 것' 번호(앱 LESSONS의 observations 순서와 같음)
var OBS = {
  2: { ice: 0, paperSun: 1, blackWhite: 2, shade: 3 },
  3: { blow: 0, faster: 1, stop: 2, paper: 3 },
  4: { standby: 0, unplug: 1, redlight: 2, compare: 3 },
  5: { order: 0, coal: 1, clean: 2, save: 3 }
};
var LABEL = {
  ice: '실험실: 햇빛·그늘 얼음 비교', paperSun: '실험실: 햇빛 종이 만짐', blackWhite: '실험실: 검은·흰 종이 비교', shade: '실험실: 그늘 종이 만짐',
  blow: '실험실: 바람개비 돌림', faster: '실험실: 약하게·세게 비교', stop: '실험실: 바람 멈춤', paper: '실험실: 종이 조각 날림', mic: '실험실: 입으로 불기',
  on: '실험실: TV 켬', standby: '실험실: 리모컨으로 끔(숫자 확인)', unplug: '실험실: 플러그 뽑음(0 확인)', redlight: '실험실: 빨간 불 찾음', compare: '실험실: 세 숫자 비교',
  order: '실험실: 전기 오는 길 순서', coal: '실험실: 석탄 발전소 연기', clean: '실험실: 햇빛·바람 발전소', save: '실험실: 불 끄기로 연기 줄임'
};
function once(emit) { var seen = {}; return function (k) { if (seen[k]) return; seen[k] = 1; emit(k); }; }
function alive(el) { return document.body.contains(el); }
function say(el, text, mood) { var b = el.querySelector('.simsay'); if (b) { b.innerHTML = text; b.className = 'simsay ' + (mood || ''); } }

/* ===================== 미션 2: 햇빛 ===================== */
SIM[2] = function (el, emit) {
  emit = once(emit);
  el.innerHTML =
    '<div class="sim sim2">' +
    '<div class="scene2"><div class="zone sun"><span class="zl">☀️ 햇빛</span><img class="sunimg" src="assets/ic_sun.png" alt=""><div class="plate"><i class="pud" id="pd0"></i><i class="ice" id="ice0"></i></div></div>' +
    '<div class="zone shade"><span class="zl">🌳 그늘</span><span class="tree">🌳</span><div class="plate"><i class="pud" id="pd1"></i><i class="ice" id="ice1"></i></div></div></div>' +
    '<div class="simbar"><span class="clock">⏱️ <b id="clk">0</b>분</span><button class="btn y" data-sim="tick">⏩ 5분 지나가기</button><button class="btn sm ghost" data-sim="reset">↺ 처음부터</button></div>' +
    '<div class="simsay">얼음 두 개는 크기가 똑같아요. 시간을 흐르게 해 볼까요?</div>' +
    '<h3 class="simh">🖐️ 종이를 눌러서 만져 봐요</h3>' +
    '<div class="papers"><button class="paper black" data-sim="p" data-v="black"><span>⬛</span>햇빛 속<br>검은 종이</button><button class="paper white" data-sim="p" data-v="white"><span>⬜</span>햇빛 속<br>흰 종이</button><button class="paper shd" data-sim="p" data-v="shade"><span>📄</span>그늘 속<br>종이</button></div>' +
    '<div class="thermo"><div class="tbar"><i id="tlv"></i></div><div class="tsay" id="tsay">종이를 눌러 보세요</div></div></div>';
  var t = 0, touched = {};
  function draw() {
    var s0 = Math.max(.12, 1 - .29 * t), s1 = Math.max(.75, 1 - .07 * t);
    el.querySelector('#ice0').style.transform = 'scale(' + s0 + ')';
    el.querySelector('#ice1').style.transform = 'scale(' + s1 + ')';
    el.querySelector('#pd0').style.transform = 'scale(' + (.2 + .3 * t) + ')';
    el.querySelector('#pd1').style.transform = 'scale(' + (.2 + .06 * t) + ')';
    el.querySelector('#clk').textContent = t * 5;
  }
  el.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sim]'); if (!b) return;
    var a = b.dataset.sim;
    if (a === 'tick') {
      if (t >= 3) { say(el, '벌써 15분이 지났어요! ↺ 처음부터 다시 볼 수도 있어요.'); return; }
      t++; draw();
      if (t < 3) say(el, t * 5 + '분이 지났어요. 두 얼음을 비교해 봐요!');
      else say(el, '15분이 지났어요! <b>어느 쪽 얼음이 더 많이 녹았나요?</b><div class="row c mt"><button class="btn sm y" data-sim="ans" data-v="sun">☀️ 햇빛 쪽</button><button class="btn sm c" data-sim="ans" data-v="shade">🌳 그늘 쪽</button><button class="btn sm" data-sim="ans" data-v="same">똑같아요</button></div>');
    }
    if (a === 'ans') {
      if (b.dataset.v === 'sun') { say(el, '맞아요, 직접 봤죠? <b>햇빛 쪽 얼음이 훨씬 더 많이 녹았어요.</b> 햇빛이 얼음을 따뜻하게 했나 봐요!', 'ok'); emit('ice'); }
      else say(el, '접시를 다시 비교해 볼까요? 얼음이 더 작아지고 물이 더 많은 쪽은 어디인가요?', 'hmm');
    }
    if (a === 'reset') { t = 0; draw(); say(el, '얼음 두 개는 크기가 똑같아요. 시간을 흐르게 해 볼까요?'); }
    if (a === 'p') {
      var v = b.dataset.v, lv = { black: 92, white: 62, shade: 24 }[v];
      var tx = { black: '앗, 뜨끈뜨끈해요! 🔥 검은 종이가 제일 따뜻해요', white: '따뜻해요 🙂 그런데 검은 종이보다는 덜 따뜻해요', shade: '시원해요 😌 그늘에 있던 종이예요' }[v];
      el.querySelector('#tlv').style.height = lv + '%';
      el.querySelector('#tlv').style.background = lv > 80 ? '#ff5a3c' : lv > 50 ? '#ffb938' : '#5fb8ff';
      el.querySelector('#tsay').textContent = tx;
      [].forEach.call(el.querySelectorAll('.paper'), function (x) { x.classList.toggle('on', x === b); });
      touched[v] = 1;
      if (v !== 'shade') emit('paperSun'); else emit('shade');
      if (touched.black && touched.white) emit('blackWhite');
    }
  });
  draw();
};

/* ===================== 미션 3: 바람 ===================== */
SIM[3] = function (el, emit) {
  emit = once(emit);
  var blades = '';
  var cols = ['#ff5d73', '#ffd84d', '#4fd1a5', '#4fa8ff'];
  for (var i = 0; i < 4; i++) blades += '<path d="M0 0 L0 -78 Q34 -60 26 -16 Z" fill="' + cols[i] + '" transform="rotate(' + (i * 90) + ')" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>';
  var scraps = ''; for (var j = 0; j < 9; j++) scraps += '<i class="scrap" style="left:' + (8 + j * 9) + '%;background:' + cols[j % 4] + '"></i>';
  el.innerHTML =
    '<div class="sim sim3"><div class="scene3"><div class="winds" id="winds"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<svg class="pin" viewBox="-100 -100 200 300" aria-label="바람개비"><rect x="-5" y="0" width="10" height="190" rx="5" fill="#a0703c"/><g id="rot">' + blades + '</g><circle r="11" fill="#fff" stroke="#ffb938" stroke-width="5"/></svg>' +
    '<div class="scraps" id="scraps">' + scraps + '</div>' +
    '<div class="speed"><span>빙글빙글 빠르기</span><div class="sbar"><i id="sbar"></i></div></div></div>' +
    '<div class="simbar"><button class="btn m" data-sim="w" data-v="1">🪭 살랑살랑 부채질</button><button class="btn c" data-sim="w" data-v="3">💨 세게 후~</button><button class="btn p" data-sim="w" data-v="0">✋ 멈추기</button></div>' +
    '<div class="simbar"><button class="btn sm" data-sim="glasses">👓 바람 안경 쓰기</button><button class="btn sm" data-sim="mic">🎤 입으로 불기</button></div>' +
    '<div class="simsay">바람은 눈에 보이지 않아요. 단추를 눌러 바람을 보내 볼까요?</div></div>';
  var target = 0, speed = 0, ang = 0, tried = {}, blewAt = 0, micOn = false, A = null, last = performance.now();
  var rot = el.querySelector('#rot'), sbar = el.querySelector('#sbar'), winds = el.querySelector('#winds'), sc = el.querySelector('#scraps');
  function micLevel() {
    if (!A) return 0; A.an.getFloatTimeDomainData(A.buf); var s = 0;
    for (var i = 0; i < A.buf.length; i++) s += A.buf[i] * A.buf[i];
    var db = 20 * Math.log10(Math.sqrt(s / A.buf.length) + 1e-7) + 100; // 소리 탐정단과 같은 0~100 점수
    return Math.max(0, Math.min(3, (db - 55) / 9));
  }
  function stopMic() { micOn = false; if (A) { try { A.stream.getTracks().forEach(function (t) { t.stop(); }); A.ctx.close(); } catch (e) {} A = null; } }
  function loop(now) {
    if (!alive(el)) { stopMic(); return; }
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var goal = micOn ? Math.max(target, micLevel()) : target;
    speed += (goal - speed) * Math.min(1, dt * (goal > speed ? 3 : 1.2));
    ang = (ang + speed * 260 * dt) % 360;
    rot.setAttribute('transform', 'rotate(' + ang + ')');
    sbar.style.width = Math.min(100, speed / 3 * 100) + '%';
    winds.style.opacity = el.classList.contains('glasses') ? Math.min(1, speed / 1.2) : 0;
    winds.style.setProperty('--wd', (1.6 - speed * .35) + 's');
    sc.style.setProperty('--fly', speed);
    sc.classList.toggle('fly', speed > .3);
    if (speed > .5) { if (!blewAt) blewAt = now; if (now - blewAt > 900) emit('paper'); emit('blow'); } else blewAt = 0;
    if (micOn && goal > 1) emit('mic');
    if (tried.blew && target === 0 && speed < .05 && tried.stopPressed) { emit('stop'); }
    requestAnimationFrame(loop);
  }
  el.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sim]'); if (!b) return;
    var a = b.dataset.sim;
    if (a === 'w') {
      target = Number(b.dataset.v);
      if (target === 1) { tried.weak = 1; tried.blew = 1; say(el, '살랑살랑~ 바람개비가 <b>천천히</b> 돌아요. 종이 조각도 살짝 움직여요.'); }
      if (target === 3) { tried.strong = 1; tried.blew = 1; say(el, '후~! 바람개비가 <b>빙글빙글 빨리</b> 돌아요! 종이 조각이 날아가요.'); }
      if (target === 0) { tried.stopPressed = 1; say(el, tried.blew ? '바람을 멈췄어요. 바람개비는 어떻게 되나요? 끝까지 지켜봐요.' : '먼저 바람을 보내 볼까요?'); }
      if (tried.weak && tried.strong) emit('faster');
    }
    if (a === 'glasses') { el.classList.toggle('glasses'); b.textContent = el.classList.contains('glasses') ? '👓 바람 안경 벗기' : '👓 바람 안경 쓰기'; say(el, el.classList.contains('glasses') ? '바람 안경을 썼어요! 진짜 바람은 이렇게 보이지 않지만, 화면에서만 하얀 선으로 보여 줄게요.' : '안경을 벗으니 바람이 다시 안 보여요. 그래도 바람개비는 움직이죠?'); }
    if (a === 'mic') {
      if (micOn) { stopMic(); b.textContent = '🎤 입으로 불기'; return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say(el, '이 기기에서는 입으로 불기가 안 돼요. 단추로 바람을 보내요.'); return; }
      var AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (st) {
        if (ctx.state !== 'running') ctx.resume();
        var an = ctx.createAnalyser(); an.fftSize = 1024; ctx.createMediaStreamSource(st).connect(an);
        A = { stream: st, ctx: ctx, an: an, buf: new Float32Array(1024) }; micOn = true; tried.blew = 1;
        b.textContent = '🎤 끄기'; say(el, '마이크에 대고 <b>후~</b> 불어 보세요! 세게 불수록 빨리 돌아요.');
      }).catch(function () { say(el, '마이크를 쓸 수 없어요. 단추로 바람을 보내요.'); });
    }
  });
  requestAnimationFrame(loop);
};

/* ===================== 미션 4: 꺼진 TV ===================== */
SIM[4] = function (el, emit) {
  emit = once(emit);
  el.innerHTML =
    '<div class="sim sim4"><div class="scene4">' +
    '<div class="tv" id="tv"><div class="scr" id="scr"><span class="show">🐻🎵</span></div><div class="tvfoot"><button class="led" id="led" data-sim="led" aria-label="TV 아래 작은 불"></button></div></div>' +
    '<div class="cord"></div>' +
    '<div class="meter"><div class="mlab">전기 숫자 측정기</div><div class="mnum" id="mnum">85</div><div class="munit">W (와트)</div><div class="mplug" id="mplug" data-sim="plug"><span>🔌</span></div></div>' +
    '<div class="wall">벽<br>콘센트</div></div>' +
    '<div class="simbar"><button class="btn p" data-sim="remote">🔴 리모컨 전원</button><button class="btn c" data-sim="plug" id="plugbtn">🔌 플러그 뽑기</button></div>' +
    '<div class="tally"><div><span>📺 켰을 때</span><b id="r_on">?</b></div><div><span>🔴 리모컨으로 껐을 때</span><b id="r_off">?</b></div><div><span>🔌 플러그를 뽑았을 때</span><b id="r_un">?</b></div></div>' +
    '<div class="simsay">TV가 켜져 있어요. 측정기의 숫자가 클수록 전기를 많이 먹어요.</div>' +
    '<p class="small center">⚠️ 진짜 플러그는 꼭 어른과 함께 뽑아요.</p></div>';
  var on = true, plugged = true, seen = {}, tm = 0;
  var num = el.querySelector('#mnum');
  function state() {
    var tv = el.querySelector('#tv');
    tv.classList.toggle('off', !on || !plugged);
    tv.classList.toggle('standby', !on && plugged);
    el.querySelector('#mplug').classList.toggle('out', !plugged);
    el.querySelector('#plugbtn').textContent = plugged ? '🔌 플러그 뽑기' : '🔌 플러그 다시 꽂기';
  }
  function value() { return !plugged ? 0 : on ? 84 + Math.round(Math.random() * 3) : 1; }
  function tick() {
    if (!alive(el)) return;
    var v = value(); num.textContent = v; num.className = 'mnum' + (v === 0 ? ' zero' : '');
    if (plugged && on) { el.querySelector('#r_on').textContent = v; seen.on = 1; emit('on'); }
    if (plugged && !on) { el.querySelector('#r_off').textContent = v; seen.off = 1; emit('standby'); }
    if (!plugged) { el.querySelector('#r_un').textContent = '0'; seen.un = 1; emit('unplug'); }
    if (seen.on && seen.off && seen.un) emit('compare');
    tm = setTimeout(tick, 700);
  }
  el.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sim]'); if (!b) return;
    var a = b.dataset.sim;
    if (a === 'remote') {
      if (!plugged) { say(el, '플러그가 빠져 있어서 리모컨을 눌러도 TV가 안 켜져요.'); return; }
      on = !on; state();
      say(el, on ? 'TV를 켰어요. 숫자를 봐요!' : 'TV를 리모컨으로 껐어요. 그런데… <b>숫자가 0일까요?</b> TV 아래도 자세히 봐요!');
    }
    if (a === 'plug') {
      plugged = !plugged; if (!plugged) on = false; state();
      say(el, plugged ? '플러그를 다시 꽂았어요. 숫자는 어떻게 됐나요?' : '플러그를 뽑았어요. <b>이제 숫자는 몇인가요?</b>');
    }
    if (a === 'led') {
      if (plugged && !on) { say(el, '찾았다! 꺼진 TV에 <b>작은 빨간 불</b>이 켜져 있어요. 아직 전기가 조금 들어가고 있다는 표시예요.', 'ok'); emit('redlight'); b.classList.add('found'); }
      else say(el, '지금은 이 작은 불이 꺼져 있어요. 리모컨으로 TV를 끄고 다시 봐요.');
    }
    clearTimeout(tm); tick();
  });
  state(); tick();
};

/* ===================== 미션 5: 전기 오는 길 ===================== */
SIM[5] = function (el, emit) {
  emit = once(emit);
  var CARDS = [{ k: 'plant', e: '🏭', t: '발전소' }, { k: 'line', e: '⚡', t: '전선·전봇대' }, { k: 'socket', e: '🔌', t: '콘센트' }, { k: 'lamp', e: '💡', t: '우리 집 전등' }];
  var shuffled = [2, 0, 3, 1].map(function (i) { return CARDS[i]; });
  el.innerHTML =
    '<div class="sim sim5"><h3 class="simh">① 전기가 오는 길 — 순서대로 카드를 눌러요</h3>' +
    '<div class="cards5" id="pool">' + shuffled.map(function (c) { return '<button class="card5" data-sim="card" data-v="' + c.k + '"><span>' + c.e + '</span>' + c.t + '</button>'; }).join('') + '</div>' +
    '<div class="path5" id="path"><b class="slot"></b><i>➜</i><b class="slot"></b><i>➜</i><b class="slot"></b><i>➜</i><b class="slot"></b></div>' +
    '<div class="row c"><button class="btn sm ghost" data-sim="again">↺ 다시 놓기</button></div>' +
    '<h3 class="simh">② 발전소를 바꿔 보고, 안 쓰는 불을 꺼 봐요</h3>' +
    '<div class="village"><div class="plant5" id="plant"><div class="smoke" id="smoke"></div><span class="pe" id="pe">🏭</span><span class="pl" id="pl">석탄 발전소</span></div>' +
    '<div class="wire5"></div><div class="houses" id="houses"></div><div class="earth5"><img src="assets/ic_earth.png" alt=""><span id="emood">😐</span></div></div>' +
    '<div class="simbar"><button class="btn sm on" data-sim="pt" data-v="coal">🏭 석탄 발전소</button><button class="btn sm" data-sim="pt" data-v="clean">☀️🌬️ 햇빛·바람 발전소</button></div>' +
    '<div class="simbar"><button class="btn sm y" data-sim="lt" data-v="1">💡 불 켜기</button><button class="btn sm m" data-sim="lt" data-v="-1">🌙 안 쓰는 불 끄기</button></div>' +
    '<div class="simsay">카드를 눌러서 전기가 어디에서 출발하는지 찾아봐요.</div></div>';
  var order = [], plant = 'coal', lights = 5, maxSmokeSeen = 0;
  function drawPath() {
    var slots = el.querySelectorAll('#path .slot');
    [].forEach.call(slots, function (s, i) { var c = order[i] && CARDS.filter(function (x) { return x.k === order[i]; })[0]; s.innerHTML = c ? c.e + '<small>' + c.t + '</small>' : (i + 1); s.classList.toggle('full', !!c); });
    [].forEach.call(el.querySelectorAll('.card5'), function (b) { b.disabled = order.indexOf(b.dataset.v) >= 0; });
  }
  function drawVillage() {
    var h = ''; for (var i = 0; i < 6; i++) h += '<span class="hs' + (i < lights ? ' lit' : '') + '">🏠<i>💡</i></span>';
    el.querySelector('#houses').innerHTML = h;
    var smoke = plant === 'coal' ? lights : 0;
    var sm = ''; for (var j = 0; j < smoke; j++) sm += '<i style="--d:' + (j * .35) + 's;left:' + (10 + j * 9) + 'px"></i>';
    el.querySelector('#smoke').innerHTML = sm;
    el.querySelector('#pe').textContent = plant === 'coal' ? '🏭' : '☀️🌬️';
    el.querySelector('#pl').textContent = plant === 'coal' ? '석탄 발전소' : '햇빛·바람 발전소';
    el.querySelector('#emood').textContent = smoke >= 4 ? '🥵' : smoke >= 1 ? '😐' : '😊';
    return smoke;
  }
  el.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sim]'); if (!b) return;
    var a = b.dataset.sim;
    if (a === 'card') {
      if (order.length >= 4) return;
      order.push(b.dataset.v); drawPath();
      if (order.length === 4) {
        if (order.join() === 'plant,line,socket,lamp') { el.querySelector('#path').classList.add('flow'); say(el, '딩동댕! 전기는 <b>발전소</b>에서 만들어져서 <b>전선</b>을 타고 <b>콘센트</b>까지 와요. 콘센트 안에서 저절로 생기는 게 아니에요!', 'ok'); emit('order'); }
        else { el.querySelector('#path').classList.add('shake'); say(el, '음… 전기가 처음 만들어지는 곳은 어디일까요? ↺ 다시 놓기를 눌러 봐요.', 'hmm'); setTimeout(function () { var p = el.querySelector('#path'); if (p) p.classList.remove('shake'); }, 600); }
      }
    }
    if (a === 'again') { order = []; el.querySelector('#path').classList.remove('flow'); drawPath(); say(el, '카드를 눌러서 전기가 어디에서 출발하는지 찾아봐요.'); }
    if (a === 'pt') {
      plant = b.dataset.v; [].forEach.call(el.querySelectorAll('[data-sim="pt"]'), function (x) { x.classList.toggle('on', x === b); });
      var s = drawVillage();
      if (plant === 'coal') { say(el, '석탄을 태워 전기를 만들면 <b>연기</b>가 나와요. 불을 많이 켤수록 연기도 많아져요.'); if (s) emit('coal'); }
      else { say(el, '햇빛과 바람으로 전기를 만들면 <b>연기가 나오지 않아요!</b> 지구가 웃어요.', 'ok'); emit('clean'); }
    }
    if (a === 'lt') {
      var before = plant === 'coal' ? lights : 0;
      lights = Math.max(1, Math.min(6, lights + Number(b.dataset.v)));
      var after = drawVillage(); maxSmokeSeen = Math.max(maxSmokeSeen, after);
      if (plant === 'coal' && after < before) { say(el, '안 쓰는 불을 껐더니 <b>연기가 줄었어요!</b> 전기를 아끼면 지구를 지킬 수 있어요.', 'ok'); emit('save'); }
      else if (plant === 'coal' && after > before) say(el, '불을 더 켰더니 연기가 늘었어요. 😮');
      else if (plant === 'coal') say(el, lights === 1 ? '불이 하나만 남았어요.' : '불이 모두 켜져 있어요.');
      else say(el, '햇빛·바람 발전소는 불을 켜도 연기가 안 나와요. 그래도 전기는 아껴 써요!');
      if (plant === 'coal' && after) emit('coal');
    }
  });
  drawPath(); drawVillage();
};

window.BJSIM = {
  has: function (n) { return !!SIM[n]; },
  render: function (n, el, emit) { if (SIM[n] && el) SIM[n](el, emit || function () {}); },
  howTo: HOWTO, obs: OBS, label: LABEL
};
})();
