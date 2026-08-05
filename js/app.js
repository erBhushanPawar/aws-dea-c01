/* ── AWS DEA-C01 Quiz App ── */

const DOMAIN_NAMES = {
  1: 'Data Ingestion & Transformation',
  2: 'Data Store Management',
  3: 'Data Operations & Support',
  4: 'Data Security & Governance'
};
const DOMAIN_COLORS = { 1: '#2563eb', 2: '#16a34a', 3: '#d97706', 4: '#9333ea' };
const LETTERS = ['A', 'B', 'C', 'D'];

const AVATARS = ['🧑‍💻','👩‍💻','🧑‍🔬','👩‍🔬','🧑‍🏫','👨‍🏫','🦁','🐯','🦊','🐺','🦅','🦄','🚀','⚡','🎯','🏆'];

/* ── localStorage keys ── */
const LS_PROFILE   = 'dea_profile';
const LS_HISTORY   = 'dea_history';
const LS_SESSION   = 'dea_session';

/* ── Quiz state ── */
let questions  = [];
let shuffled   = [];
let current    = 0;
let score      = 0;
let answered   = false;
let qTimes     = [];
let qCorrect   = [];
let qAnswers   = [];
let qStart     = 0;
let totalStart = 0;
let timerInterval = null;
let timeLeft   = 120;
let timeLimit  = 120;

/* Mode selections */
let activeMode    = 'full';
let activeDomains = new Set([1, 2, 3, 4]);
let activeDiffs   = new Set(['easy', 'moderate', 'hard']);
let activeSets    = new Set();

const SET_INFO = {
  1: { title: 'Set 1 · Core',          desc: 'Original 95 questions',              floor: 120 },
  2: { title: 'Set 2 · New additions', desc: 'Bedrock, Iceberg, vectors & more',    floor: 120 },
  3: { title: 'Set 3 · Advanced I',    desc: 'Tough scenarios, 5 min each',         floor: 300 },
  4: { title: 'Set 4 · Advanced II',   desc: 'Tough scenarios, 5 min each',         floor: 300 }
};
const DIFF_THINK_SECONDS = { easy: 20, moderate: 30, hard: 45 };
const READING_WORDS_PER_SEC = 2.5; // ~150 wpm, tuned for dense technical text
const MAX_TIME_LIMIT = 480; // hard cap, 8 min

/* Adaptive per-question time budget: respects each set's floor, but stretches
   beyond it for unusually long question/option text so reading time doesn't
   eat into thinking time. */
function getTimeLimit(q) {
  if (q.timeLimit) return q.timeLimit;
  const wordCount = (q.question + ' ' + q.options.join(' ')).trim().split(/\s+/).length;
  const readSeconds = Math.ceil(wordCount / READING_WORDS_PER_SEC);
  const thinkSeconds = DIFF_THINK_SECONDS[q.difficulty] || 30;
  const floor = (SET_INFO[q.set] && SET_INFO[q.set].floor) || 120;
  return Math.min(MAX_TIME_LIMIT, Math.max(floor, readSeconds + thinkSeconds));
}

/* ── DOM refs ── */
const startScreen    = document.getElementById('startScreen');
const quizScreen     = document.getElementById('quizScreen');
const resultScreen   = document.getElementById('resultScreen');
const profileModal   = document.getElementById('profileModal');
const startBtn       = document.getElementById('startBtn');
const nextBtn        = document.getElementById('nextBtn');
const retakeBtn      = document.getElementById('retakeBtn');
const backToStartBtn = document.getElementById('backToStartBtn');
const reviewToggle   = document.getElementById('reviewToggleBtn');
const loadError      = document.getElementById('loadError');
const resumeBanner   = document.getElementById('resumeBanner');

/* ── Boot ── */
window.addEventListener('DOMContentLoaded', () => {
  buildAvatarGrid();

  fetch('questions.json')
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      questions = data;
      document.getElementById('totalBadge').textContent = data.length + ' Questions';
      buildSetChips();
      updateSummary();
      initProfile();
      checkResumable();
      startBtn.addEventListener('click', startQuiz);
    })
    .catch(() => {
      startBtn.disabled = true;
      loadError.style.display = 'block';
    });

  nextBtn.addEventListener('click', nextQuestion);
  retakeBtn.addEventListener('click', startQuiz);
  backToStartBtn.addEventListener('click', () => { hide(resultScreen); show(startScreen); });
  reviewToggle.addEventListener('click', toggleReview);

  document.getElementById('backBtn').addEventListener('click', () => {
    if (confirm('Exit exam? Your progress will be saved and you can resume later.')) {
      clearInterval(timerInterval);
      saveSessionCheckpoint();
      hide(quizScreen);
      show(startScreen);
      checkResumable();
    }
  });
  document.getElementById('resumeBtn').addEventListener('click', resumeSession);
  document.getElementById('discardBtn').addEventListener('click', discardSession);
  document.getElementById('editProfileBtn').addEventListener('click', openProfileModal);
  document.getElementById('profileSaveBtn').addEventListener('click', saveProfile);
  document.getElementById('profileNameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveProfile();
  });

  /* mode buttons */
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMode = btn.dataset.mode;
      document.getElementById('domainFilter').style.display    = activeMode === 'domain'     ? 'block' : 'none';
      document.getElementById('difficultyFilter').style.display = activeMode === 'difficulty' ? 'block' : 'none';
      document.getElementById('setFilter').style.display        = activeMode === 'set'        ? 'block' : 'none';
      updateSummary();
    });
  });

  /* domain chips */
  document.querySelectorAll('[data-domain]').forEach(chip => {
    chip.addEventListener('click', () => {
      const d = parseInt(chip.dataset.domain);
      if (activeDomains.has(d)) {
        if (activeDomains.size > 1) { activeDomains.delete(d); chip.classList.remove('active'); }
      } else { activeDomains.add(d); chip.classList.add('active'); }
      updateSummary();
    });
  });

  /* difficulty chips */
  document.querySelectorAll('[data-diff]').forEach(chip => {
    chip.addEventListener('click', () => {
      const diff = chip.dataset.diff;
      if (activeDiffs.has(diff)) {
        if (activeDiffs.size > 1) { activeDiffs.delete(diff); chip.classList.remove('active'); }
      } else { activeDiffs.add(diff); chip.classList.add('active'); }
      updateSummary();
    });
  });
});

/* ── Profile ── */
function buildAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  AVATARS.forEach((av, i) => {
    const btn = document.createElement('button');
    btn.className = 'avatar-opt' + (i === 0 ? ' selected' : '');
    btn.textContent = av;
    btn.dataset.av = av;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    grid.appendChild(btn);
  });
}

function getProfile() {
  try { return JSON.parse(localStorage.getItem(LS_PROFILE)) || null; } catch { return null; }
}

function initProfile() {
  const p = getProfile();
  if (!p) {
    openProfileModal(true);
  } else {
    renderProfileBar(p);
  }
}

function openProfileModal(isFirst = false) {
  const p = getProfile();
  if (p) {
    document.getElementById('profileNameInput').value = p.name;
    document.querySelectorAll('.avatar-opt').forEach(b => {
      b.classList.toggle('selected', b.dataset.av === p.avatar);
    });
  }
  profileModal.style.display = 'flex';
  if (!isFirst) profileModal.querySelector('.modal-title').textContent = 'Edit your profile';
  setTimeout(() => document.getElementById('profileNameInput').focus(), 100);
}

function saveProfile() {
  const name = document.getElementById('profileNameInput').value.trim();
  if (!name) { document.getElementById('profileNameInput').focus(); return; }
  const avatar = document.querySelector('.avatar-opt.selected')?.dataset.av || AVATARS[0];
  const existing = getProfile();
  const profile = { name, avatar, createdAt: existing?.createdAt || Date.now() };
  localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
  profileModal.style.display = 'none';
  renderProfileBar(profile);
}

function renderProfileBar(p) {
  document.getElementById('profileBar').style.display = 'flex';
  document.getElementById('profileAvatar').textContent = p.avatar;
  document.getElementById('profileName').textContent = p.name;
  const history = getHistory();
  if (history.length > 0) {
    const best = Math.max(...history.map(h => h.pct));
    document.getElementById('profileBest').textContent = 'Best: ' + best + '%';
    document.getElementById('profileAttempts').textContent = history.length + ' attempt' + (history.length === 1 ? '' : 's');
  } else {
    document.getElementById('profileBest').textContent = 'No attempts yet';
    document.getElementById('profileAttempts').textContent = '';
  }
}

/* ── Score history ── */
function getHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; } catch { return []; }
}

function saveToHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, 20); // keep last 20
  localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed));
}

function renderHistory() {
  const history = getHistory();
  const el = document.getElementById('scoreHistory');
  if (history.length === 0) {
    el.innerHTML = '<p class="history-empty">No previous attempts yet.</p>';
    return;
  }
  el.innerHTML = history.slice(0, 5).map(h => {
    const date = new Date(h.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const passCls = h.pct >= 72 ? 'hist-pass' : 'hist-fail';
    return `<div class="hist-row">
      <span class="hist-date">${date}</span>
      <span class="hist-mode">${h.mode}</span>
      <span class="hist-score ${passCls}">${h.pct}%</span>
      <span class="hist-detail">${h.correct}/${h.total} · ${h.time}</span>
    </div>`;
  }).join('');
}

/* ── Session persistence (resume) ── */
function saveSessionCheckpoint() {
  const session = {
    shuffledIds: shuffled.map(q => q.id),
    current,
    score,
    qTimes: [...qTimes],
    qCorrect: [...qCorrect],
    qAnswers: [...qAnswers],
    totalStart,
    timeLeft,
    mode: activeMode,
    savedAt: Date.now()
  };
  localStorage.setItem(LS_SESSION, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(LS_SESSION);
}

function checkResumable() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SESSION));
    if (!s || !s.shuffledIds || s.current >= s.shuffledIds.length) { clearSession(); return; }
    const age = Date.now() - s.savedAt;
    if (age > 30 * 24 * 60 * 60 * 1000) { clearSession(); return; } // expire after 30 days
    const remaining = s.shuffledIds.length - s.current;
    const p = s.shuffledIds[s.current];
    const q = questions.find(q => q.id === p);
    if (!q) { clearSession(); return; }
    document.getElementById('resumeDetail').textContent =
      `Q${s.current + 1} of ${s.shuffledIds.length} · ${remaining} question${remaining === 1 ? '' : 's'} remaining · Score so far: ${s.score}/${s.current}`;
    resumeBanner.style.display = 'block';
  } catch { clearSession(); }
}

function resumeSession() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SESSION));
    shuffled    = s.shuffledIds.map(id => questions.find(q => q.id === id)).filter(Boolean);
    current     = s.current;
    score       = s.score;
    qTimes      = s.qTimes;
    qCorrect    = s.qCorrect;
    qAnswers    = s.qAnswers;
    const elapsedSoFar = qTimes.reduce((a, b) => a + b, 0); // approximate, current question restarts fresh
    totalStart  = Date.now() - elapsedSoFar * 1000;
    timeLeft    = s.timeLeft;

    resumeBanner.style.display = 'none';
    hide(startScreen);
    show(quizScreen);
    loadQuestion();
  } catch { discardSession(); }
}

function discardSession() {
  clearSession();
  resumeBanner.style.display = 'none';
}

/* ── Filter ── */
function getFilteredQuestions() {
  if (activeMode === 'full')       return questions;
  if (activeMode === 'domain')     return questions.filter(q => activeDomains.has(q.domain));
  if (activeMode === 'difficulty') return questions.filter(q => activeDiffs.has(q.difficulty));
  if (activeMode === 'set')        return questions.filter(q => activeSets.has(q.set));
  return questions;
}

function buildSetChips() {
  const sets = [...new Set(questions.map(q => q.set))].sort((a, b) => a - b);
  activeSets = new Set(sets);
  const row = document.getElementById('setChipRow');
  row.innerHTML = '';
  sets.forEach(s => {
    const count = questions.filter(q => q.set === s).length;
    const info = SET_INFO[s] || { title: 'Set ' + s, desc: '' };
    const chip = document.createElement('button');
    chip.className = 'chip active';
    chip.dataset.set = s;
    chip.innerHTML = info.title + ' <span class="chip-sub">(' + count + ')</span>';
    chip.title = info.desc;
    chip.addEventListener('click', () => {
      if (activeSets.has(s)) {
        if (activeSets.size > 1) { activeSets.delete(s); chip.classList.remove('active'); }
      } else { activeSets.add(s); chip.classList.add('active'); }
      updateSummary();
    });
    row.appendChild(chip);
  });
}

function updateSummary() {
  const pool = getFilteredQuestions();
  const el = document.getElementById('selectionSummary');
  if (pool.length === 0) {
    el.textContent = 'No questions match — select at least one option above.';
    el.className = 'selection-summary selection-empty';
    startBtn.disabled = true;
  } else {
    el.textContent = pool.length + ' question' + (pool.length === 1 ? '' : 's') + ' in this session';
    el.className = 'selection-summary';
    startBtn.disabled = false;
  }
}

/* ── Helpers ── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function show(el) { el.classList.add('active'); }
function hide(el) { el.classList.remove('active'); }
function fmt(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

/* ── Start ── */
function startQuiz() {
  const pool = getFilteredQuestions();
  if (pool.length === 0) return;

  clearSession();
  shuffled    = shuffle(pool).slice(0, 40);
  current     = 0;
  score       = 0;
  answered    = false;
  qTimes      = [];
  qCorrect    = [];
  qAnswers    = [];
  totalStart  = Date.now();

  resumeBanner.style.display = 'none';
  hide(startScreen);
  hide(resultScreen);
  document.getElementById('reviewSection').style.display = 'none';
  show(quizScreen);
  loadQuestion();
}

/* ── Load question ── */
function loadQuestion() {
  answered = false;
  const q = shuffled[current];

  document.getElementById('domainLabel').textContent = 'Domain ' + q.domain + ': ' + DOMAIN_NAMES[q.domain];
  const db = document.getElementById('diffLabel');
  db.textContent = q.difficulty;
  db.className = 'diff-badge diff-' + q.difficulty;

  const pct = Math.round((current / shuffled.length) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = (current + 1) + ' / ' + shuffled.length;
  document.getElementById('scoreRunning').textContent = 'Score: ' + score + ' / ' + current;
  document.getElementById('qText').textContent = q.question;
  document.getElementById('explanationBox').style.display = 'none';
  nextBtn.style.display = 'none';

  const list = document.getElementById('optionsList');
  list.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = '<span class="opt-letter">' + LETTERS[i] + '</span><span>' + opt + '</span>';
    btn.addEventListener('click', () => selectAnswer(i));
    list.appendChild(btn);
  });

  timeLimit = getTimeLimit(q);
  timeLeft = timeLimit;
  clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft % 10 === 0) saveSessionCheckpoint(); // checkpoint every 10s
    if (timeLeft <= 0) { clearInterval(timerInterval); selectAnswer(-1); }
  }, 1000);

  qStart = Date.now();
}

/* ── Timer ── */
function updateTimer() {
  document.getElementById('timerDisplay').textContent = fmt(timeLeft);
  const c = document.getElementById('timerCircle');
  const frac = timeLeft / (timeLimit || 120);
  c.className = frac > 0.5 ? '' : frac > 0.25 ? 'warn' : 'danger';
}

/* ── Answer ── */
function selectAnswer(idx) {
  if (answered) return;
  answered = true;
  clearInterval(timerInterval);

  const elapsed = Math.round((Date.now() - qStart) / 1000);
  qTimes.push(elapsed);
  qAnswers.push(idx);

  const q = shuffled[current];
  const isCorrect = idx === q.answer;
  if (isCorrect) score++;
  qCorrect.push(isCorrect);

  const btns = document.getElementById('optionsList').querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add('correct');
    else if (i === idx)  btn.classList.add('wrong');
  });

  const content = document.getElementById('expContent');
  content.innerHTML = q.explanations.map((e, i) => {
    return '<p class="exp-item' + (i === q.answer ? ' exp-correct' : '') + '">' + e + '</p>';
  }).join('');
  document.getElementById('explanationBox').style.display = 'block';

  const topicBox = document.getElementById('topicBox');
  if (q.topic) {
    document.getElementById('topicContent').innerHTML = '<p>' + q.topic + '</p>';
    topicBox.style.display = 'block';
  } else {
    topicBox.style.display = 'none';
  }

  document.getElementById('scoreRunning').textContent = 'Score: ' + score + ' / ' + (current + 1);
  nextBtn.style.display = 'inline-flex';

  saveSessionCheckpoint();
}

/* ── Next ── */
function nextQuestion() {
  current++;
  if (current >= shuffled.length) showResults();
  else loadQuestion();
}

/* ── Results ── */
function showResults() {
  clearInterval(timerInterval);
  clearSession();
  hide(quizScreen);
  show(resultScreen);

  const total   = shuffled.length;
  const pct     = Math.round((score / total) * 100);
  const passing = pct >= 72;
  const totalSec = Math.round((Date.now() - totalStart) / 1000);
  const avgSec   = Math.round(qTimes.reduce((a, b) => a + b, 0) / qTimes.length);

  document.getElementById('finalScore').textContent = pct + '%';
  const circle = document.getElementById('scoreCircle');
  circle.className = 'score-circle ' + (passing ? 'passing' : 'failing');
  const sub = document.getElementById('passFailLabel');
  sub.textContent = passing ? 'PASS' : 'FAIL';
  sub.className = 'score-sub ' + (passing ? 'pass' : 'fail');

  document.getElementById('mCorrect').textContent = score + ' / ' + total;
  document.getElementById('mTime').textContent = fmt(totalSec);
  document.getElementById('mAvg').textContent = avgSec + 's';

  const dd = { 1:{c:0,t:0}, 2:{c:0,t:0}, 3:{c:0,t:0}, 4:{c:0,t:0} };
  shuffled.forEach((q, i) => { dd[q.domain].t++; if (qCorrect[i]) dd[q.domain].c++; });
  const dsEl = document.getElementById('domainScores');
  dsEl.innerHTML = '';
  [1,2,3,4].forEach(d => {
    if (dd[d].t === 0) return;
    const p = Math.round((dd[d].c / dd[d].t) * 100);
    dsEl.innerHTML += `<div class="ds-row">
      <span class="ds-name">D${d}: ${DOMAIN_NAMES[d].split(' ').slice(0,2).join(' ')}</span>
      <div class="ds-bar-bg"><div class="ds-bar-fill" style="width:${p}%;background:${DOMAIN_COLORS[d]};"></div></div>
      <span class="ds-pct">${p}%</span>
    </div>`;
  });

  /* save to history */
  const modeLbl = activeMode === 'full' ? 'Full exam'
    : activeMode === 'domain' ? 'Domain ' + [...activeDomains].sort().join(',')
    : [...activeDiffs].join('+');
  saveToHistory({ pct, correct: score, total, time: fmt(totalSec), mode: modeLbl, ts: Date.now() });

  renderHistory();
  const p = getProfile();
  if (p) renderProfileBar(p);
}

/* ── Review ── */
function toggleReview() {
  const rev = document.getElementById('reviewSection');
  const visible = rev.style.display !== 'none';
  rev.style.display = visible ? 'none' : 'block';
  reviewToggle.textContent = visible ? 'Review wrong answers' : 'Hide review';
  if (!visible) buildReview();
}

function buildReview() {
  const list = document.getElementById('reviewList');
  list.innerHTML = '';
  if (!shuffled.some((q, i) => !qCorrect[i])) {
    list.innerHTML = '<div class="no-wrong">🎉 No wrong answers — excellent work!</div>';
    return;
  }
  shuffled.forEach((q, i) => {
    if (qCorrect[i]) return;
    const ua = qAnswers[i];
    const uaText = ua >= 0 ? LETTERS[ua] + ' – ' + q.options[ua] : 'Timed out';
    list.innerHTML += `<div class="review-card">
      <p class="review-q"><strong>Q${i+1} · Domain ${q.domain} · ${q.difficulty}</strong><br>${q.question}</p>
      <p class="review-ans">Your answer: <span class="answer-tag wrong-tag">${uaText}</span></p>
      <p class="review-ans">Correct answer: <span class="answer-tag correct-tag">${LETTERS[q.answer]} – ${q.options[q.answer]}</span></p>
      <div class="review-exp">${q.explanations[q.answer]}</div>
    </div>`;
  });
}
