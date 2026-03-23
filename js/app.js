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
let shuffled = [];
let current = 0;
let score = 0;
let answered = false;
let qTimes = [];
let qCorrect = [];
let qAnswers = [];
let qStart = 0;
let totalStart = 0;
let timerInterval = null;
let timeLeft = 120;

/* ── DOM refs ── */
const startScreen   = document.getElementById('startScreen');
const quizScreen    = document.getElementById('quizScreen');
const resultScreen  = document.getElementById('resultScreen');
const startBtn      = document.getElementById('startBtn');
const nextBtn       = document.getElementById('nextBtn');
const retakeBtn     = document.getElementById('retakeBtn');
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
      startBtn.addEventListener('click', startQuiz);
    })
    .catch(() => {
      startBtn.disabled = true;
      loadError.style.display = 'block';
    });

  nextBtn.addEventListener('click', nextQuestion);
  retakeBtn.addEventListener('click', startQuiz);
  reviewToggle.addEventListener('click', toggleReview);
});

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
  shuffled = shuffle(questions);
  current = 0;
  score = 0;
  answered = false;
  qTimes = [];
  qCorrect = [];
  qAnswers = [];
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

  /* header */
  document.getElementById('domainLabel').textContent = 'Domain ' + q.domain + ': ' + DOMAIN_NAMES[q.domain];
  const db = document.getElementById('diffLabel');
  db.textContent = q.difficulty;
  db.className = 'diff-badge diff-' + q.difficulty;

  /* progress */
  const pct = Math.round((current / shuffled.length) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = (current + 1) + ' / ' + shuffled.length;

  /* score */
  document.getElementById('scoreRunning').textContent = 'Score: ' + score + ' / ' + current;

  /* question */
  document.getElementById('qText').textContent = q.question;

  /* hide explanation + next */
  document.getElementById('explanationBox').style.display = 'none';
  nextBtn.style.display = 'none';

  /* options */
  const list = document.getElementById('optionsList');
  list.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = '<span class="opt-letter">' + LETTERS[i] + '</span><span>' + opt + '</span>';
    btn.addEventListener('click', () => selectAnswer(i));
    list.appendChild(btn);
  });

  /* timer */
  timeLeft = 120;
  clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      selectAnswer(-1); /* auto-submit as timed-out */
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

  /* colour buttons */
  const btns = document.getElementById('optionsList').querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) {
      btn.classList.add('correct');
    } else if (i === idx) {
      btn.classList.add('wrong');
    }
  });

  /* explanation */
  const box = document.getElementById('explanationBox');
  const content = document.getElementById('expContent');
  content.innerHTML = q.explanations.map((e, i) => {
    const cls = i === q.answer ? 'exp-item exp-correct' : 'exp-item';
    return '<p class="' + cls + '">' + e + '</p>';
  }).join('');
  box.style.display = 'block';

  /* score update */
  document.getElementById('scoreRunning').textContent = 'Score: ' + score + ' / ' + (current + 1);
  nextBtn.style.display = 'inline-flex';
}

/* ── Next ── */
function nextQuestion() {
  current++;
  if (current >= shuffled.length) {
    showResults();
  } else {
    loadQuestion();
  }
}

/* ── Results ── */
function showResults() {
  clearInterval(timerInterval);
  hide(quizScreen);
  show(resultScreen);

  const total = shuffled.length;
  const pct = Math.round((score / total) * 100);
  const passing = pct >= 72;

  /* score circle */
  document.getElementById('finalScore').textContent = pct + '%';
  const circle = document.getElementById('scoreCircle');
  circle.className = 'score-circle ' + (passing ? 'passing' : 'failing');
  const sub = document.getElementById('passFailLabel');
  sub.textContent = passing ? 'PASS' : 'FAIL';
  sub.className = 'score-sub ' + (passing ? 'pass' : 'fail');

  /* metrics */
  document.getElementById('mCorrect').textContent = score + ' / ' + total;
  const totalSec = Math.round((Date.now() - totalStart) / 1000);
  document.getElementById('mTime').textContent = fmt(totalSec);
  const totalQTime = qTimes.reduce((a, b) => a + b, 0);
  document.getElementById('mAvg').textContent = Math.round(totalQTime / qTimes.length) + 's';

  /* domain bars */
  const dd = { 1:{c:0,t:0}, 2:{c:0,t:0}, 3:{c:0,t:0}, 4:{c:0,t:0} };
  shuffled.forEach((q, i) => {
    dd[q.domain].t++;
    if (qCorrect[i]) dd[q.domain].c++;
  });

  const dsEl = document.getElementById('domainScores');
  dsEl.innerHTML = '';
  [1, 2, 3, 4].forEach(d => {
    const p = dd[d].t > 0 ? Math.round((dd[d].c / dd[d].t) * 100) : 0;
    const color = DOMAIN_COLORS[d];
    dsEl.innerHTML += `
      <div class="ds-row">
        <span class="ds-name">D${d}: ${DOMAIN_NAMES[d].split(' ').slice(0,2).join(' ')}</span>
        <div class="ds-bar-bg">
          <div class="ds-bar-fill" style="width:${p}%;background:${color};"></div>
        </div>
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

  const wrong = shuffled.filter((q, i) => !qCorrect[i]);
  if (wrong.length === 0) {
    list.innerHTML = '<div class="no-wrong">🎉 No wrong answers — excellent work!</div>';
    return;
  }

  shuffled.forEach((q, i) => {
    if (qCorrect[i]) return;
    const ua = qAnswers[i];
    const uaText = ua >= 0
      ? LETTERS[ua] + ' – ' + q.options[ua]
      : 'Timed out';

    list.innerHTML += `
      <div class="review-card">
        <p class="review-q"><strong>Q${i+1} · Domain ${q.domain}</strong><br>${q.question}</p>
        <p class="review-ans">Your answer:
          <span class="answer-tag wrong-tag">${uaText}</span>
        </p>
        <p class="review-ans">Correct answer:
          <span class="answer-tag correct-tag">${LETTERS[q.answer]} – ${q.options[q.answer]}</span>
        </p>
        <div class="review-exp">${q.explanations[q.answer]}</div>
      </div>`;
  });
}
