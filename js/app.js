/* ── AWS DEA-C01 Quiz App ── */

const DOMAIN_NAMES = {
  1: 'Data Ingestion & Transformation',
  2: 'Data Store Management',
  3: 'Data Operations & Support',
  4: 'Data Security & Governance'
};
const DOMAIN_COLORS = {
  1: '#2563eb',
  2: '#16a34a',
  3: '#d97706',
  4: '#9333ea'
};
const LETTERS = ['A', 'B', 'C', 'D'];

/* ── State ── */
let questions = [];
let shuffled  = [];
let current   = 0;
let score     = 0;
let answered  = false;
let qTimes    = [];
let qCorrect  = [];
let qAnswers  = [];
let qStart    = 0;
let totalStart = 0;
let timerInterval = null;
let timeLeft  = 120;

/* current mode selections */
let activeMode       = 'full';
let activeDomains    = new Set([1, 2, 3, 4]);
let activeDiffs      = new Set(['easy', 'moderate', 'hard']);

/* ── DOM refs ── */
const startScreen   = document.getElementById('startScreen');
const quizScreen    = document.getElementById('quizScreen');
const resultScreen  = document.getElementById('resultScreen');
const startBtn      = document.getElementById('startBtn');
const nextBtn       = document.getElementById('nextBtn');
const retakeBtn     = document.getElementById('retakeBtn');
const backToStartBtn = document.getElementById('backToStartBtn');
const reviewToggle  = document.getElementById('reviewToggleBtn');
const loadError     = document.getElementById('loadError');

/* ── Boot ── */
window.addEventListener('DOMContentLoaded', () => {
  fetch('questions.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      questions = data;
      document.getElementById('totalBadge').textContent = data.length + ' Questions';
      updateSummary();
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

  /* mode buttons */
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMode = btn.dataset.mode;
      document.getElementById('domainFilter').style.display    = activeMode === 'domain'     ? 'block' : 'none';
      document.getElementById('difficultyFilter').style.display = activeMode === 'difficulty' ? 'block' : 'none';
      updateSummary();
    });
  });

  /* domain chips */
  document.querySelectorAll('[data-domain]').forEach(chip => {
    chip.addEventListener('click', () => {
      const d = parseInt(chip.dataset.domain);
      if (activeDomains.has(d)) {
        if (activeDomains.size > 1) { activeDomains.delete(d); chip.classList.remove('active'); }
      } else {
        activeDomains.add(d); chip.classList.add('active');
      }
      updateSummary();
    });
  });

  /* difficulty chips */
  document.querySelectorAll('[data-diff]').forEach(chip => {
    chip.addEventListener('click', () => {
      const diff = chip.dataset.diff;
      if (activeDiffs.has(diff)) {
        if (activeDiffs.size > 1) { activeDiffs.delete(diff); chip.classList.remove('active'); }
      } else {
        activeDiffs.add(diff); chip.classList.add('active');
      }
      updateSummary();
    });
  });
});

/* ── Filter questions based on current mode ── */
function getFilteredQuestions() {
  if (activeMode === 'full') return questions;
  if (activeMode === 'domain') return questions.filter(q => activeDomains.has(q.domain));
  if (activeMode === 'difficulty') return questions.filter(q => activeDiffs.has(q.difficulty));
  return questions;
}

/* ── Update summary line on start screen ── */
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

function fmt(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

/* ── Start ── */
function startQuiz() {
  const pool = getFilteredQuestions();
  if (pool.length === 0) return;

  shuffled   = shuffle(pool);
  current    = 0;
  score      = 0;
  answered   = false;
  qTimes     = [];
  qCorrect   = [];
  qAnswers   = [];
  totalStart = Date.now();

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

  timeLeft = 120;
  clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      selectAnswer(-1);
    }
  }, 1000);

  qStart = Date.now();
}

/* ── Timer display ── */
function updateTimer() {
  document.getElementById('timerDisplay').textContent = fmt(timeLeft);
  const circle = document.getElementById('timerCircle');
  circle.className = timeLeft > 60 ? '' : timeLeft > 30 ? 'warn' : 'danger';
}

/* ── Answer selection ── */
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
    const cls = i === q.answer ? 'exp-item exp-correct' : 'exp-item';
    return '<p class="' + cls + '">' + e + '</p>';
  }).join('');
  document.getElementById('explanationBox').style.display = 'block';

  document.getElementById('scoreRunning').textContent = 'Score: ' + score + ' / ' + (current + 1);
  nextBtn.style.display = 'inline-flex';
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
  hide(quizScreen);
  show(resultScreen);

  const total = shuffled.length;
  const pct   = Math.round((score / total) * 100);
  const passing = pct >= 72;

  document.getElementById('finalScore').textContent = pct + '%';
  const circle = document.getElementById('scoreCircle');
  circle.className = 'score-circle ' + (passing ? 'passing' : 'failing');
  const sub = document.getElementById('passFailLabel');
  sub.textContent = passing ? 'PASS' : 'FAIL';
  sub.className = 'score-sub ' + (passing ? 'pass' : 'fail');

  document.getElementById('mCorrect').textContent = score + ' / ' + total;
  const totalSec = Math.round((Date.now() - totalStart) / 1000);
  document.getElementById('mTime').textContent = fmt(totalSec);
  const totalQTime = qTimes.reduce((a, b) => a + b, 0);
  document.getElementById('mAvg').textContent = Math.round(totalQTime / qTimes.length) + 's';

  const dd = { 1:{c:0,t:0}, 2:{c:0,t:0}, 3:{c:0,t:0}, 4:{c:0,t:0} };
  shuffled.forEach((q, i) => { dd[q.domain].t++; if (qCorrect[i]) dd[q.domain].c++; });

  const dsEl = document.getElementById('domainScores');
  dsEl.innerHTML = '';
  [1, 2, 3, 4].forEach(d => {
    if (dd[d].t === 0) return;
    const p = Math.round((dd[d].c / dd[d].t) * 100);
    const color = DOMAIN_COLORS[d];
    dsEl.innerHTML += `
      <div class="ds-row">
        <span class="ds-name">D${d}: ${DOMAIN_NAMES[d].split(' ').slice(0,2).join(' ')}</span>
        <div class="ds-bar-bg"><div class="ds-bar-fill" style="width:${p}%;background:${color};"></div></div>
        <span class="ds-pct">${p}%</span>
      </div>`;
  });
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

  const hasWrong = shuffled.some((q, i) => !qCorrect[i]);
  if (!hasWrong) {
    list.innerHTML = '<div class="no-wrong">🎉 No wrong answers — excellent work!</div>';
    return;
  }

  shuffled.forEach((q, i) => {
    if (qCorrect[i]) return;
    const ua = qAnswers[i];
    const uaText = ua >= 0 ? LETTERS[ua] + ' – ' + q.options[ua] : 'Timed out';
    list.innerHTML += `
      <div class="review-card">
        <p class="review-q"><strong>Q${i+1} · Domain ${q.domain} · ${q.difficulty}</strong><br>${q.question}</p>
        <p class="review-ans">Your answer: <span class="answer-tag wrong-tag">${uaText}</span></p>
        <p class="review-ans">Correct answer: <span class="answer-tag correct-tag">${LETTERS[q.answer]} – ${q.options[q.answer]}</span></p>
        <div class="review-exp">${q.explanations[q.answer]}</div>
      </div>`;
  });
}
