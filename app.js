const pads = document.querySelectorAll('.pad');
const startBtn = document.getElementById('startBtn');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const messageEl = document.getElementById('message');
const speedSelect = document.getElementById('speed');
const centerPanel = document.querySelector('.center-panel');

const colors = ['green', 'red', 'yellow', 'blue'];
    
let sequence = [];
let playerStep = 0;
let score = 0;
let best = Number(localStorage.getItem('simonBest')) || 0;
let isPlaying = false;
let acceptingInput = false;

bestEl.textContent = best;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const freqs = { green: 261.6, red: 329.6, yellow: 392.0, blue: 466.2 };

function playTone(color, duration = 300) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freqs[color];
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}

function playErrorTone() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 110;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

function flashPad(color, duration) {
  return new Promise(resolve => {
    const pad = document.getElementById(color);
    pad.classList.add('active');
    playTone(color, duration);
    setTimeout(() => {
      pad.classList.remove('active');
      setTimeout(resolve, duration * 0.2);
    }, duration * 0.8);
  });
}

function getSpeed() {
  return Number(speedSelect.value);
}

async function playSequence() {
  acceptingInput = false;
  messageEl.textContent = 'Watch carefully...';
  await new Promise(r => setTimeout(r, 500));
  for (const color of sequence) {
    await flashPad(color, getSpeed());
  }
  acceptingInput = true;
  playerStep = 0;
  messageEl.textContent = 'Your turn';
}

function nextRound() {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  sequence.push(randomColor);
  score = sequence.length - 1;
  scoreEl.textContent = score;
  playSequence();
}

function handlePadClick(color) {
  if (!acceptingInput || !isPlaying) return;

  const pad = document.getElementById(color);
  pad.classList.add('active');
  playTone(color, 200);
  setTimeout(() => pad.classList.remove('active'), 200);

  if (color === sequence[playerStep]) {
    playerStep++;
    if (playerStep === sequence.length) {
      acceptingInput = false;
      score = sequence.length;
      scoreEl.textContent = score;
      messageEl.textContent = 'Nice! Next round...';
      setTimeout(nextRound, 800);
    }
  } else {
    gameOver();
  }
}

function gameOver() {
  acceptingInput = false;
  isPlaying = false;
  playErrorTone();
  centerPanel.classList.add('shake');
  setTimeout(() => centerPanel.classList.remove('shake'), 400);

  if (score > best) {
    best = score;
    localStorage.setItem('simonBest', best);
    bestEl.textContent = best;
    messageEl.textContent = `New best! Score: ${score}`;
  } else {
    messageEl.textContent = `Game over! Score: ${score}`;
  }

  startBtn.disabled = false;
  startBtn.textContent = 'Start';
}

function startGame() {
  sequence = [];
  score = 0;
  scoreEl.textContent = 0;
  isPlaying = true;
  startBtn.disabled = true;
  startBtn.textContent = 'Playing';
  nextRound();
}

pads.forEach(pad => {
  pad.addEventListener('click', () => handlePadClick(pad.dataset.color));
});

startBtn.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  startGame();
});

document.addEventListener('keydown', (e) => {
  const keyMap = { '1': 'green', '2': 'red', '3': 'yellow', '4': 'blue' };
  if (keyMap[e.key]) {
    handlePadClick(keyMap[e.key]);
  }
});