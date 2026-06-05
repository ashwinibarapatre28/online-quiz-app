/* ==========================================================================
   QuizVerse - Client Side Application Logic
   ========================================================================== */

// Application State
let state = {
  playerName: '',
  questions: [],
  currentQuestionIndex: 0,
  selectedAnswers: {} // Map of questionId (string) -> selectedOption (string)
};

// DOM Elements
const elements = {
  // Screens
  welcomeScreen: document.getElementById('welcome-screen'),
  quizScreen: document.getElementById('quiz-screen'),
  resultsScreen: document.getElementById('results-screen'),
  
  // Theme Toggle
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  
  // Welcome Elements
  startForm: document.getElementById('start-form'),
  usernameInput: document.getElementById('username'),
  
  // Quiz Elements
  playerDisplay: document.getElementById('player-display'),
  currentQuestionNum: document.getElementById('current-question-num'),
  totalQuestionsNum: document.getElementById('total-questions-num'),
  progressBar: document.getElementById('progress-bar'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  nextBtnText: document.getElementById('next-btn-text'),
  nextBtnIcon: document.getElementById('next-btn-icon'),
  
  // Results Elements
  resultsPlayerName: document.getElementById('results-player-name'),
  scorePercentage: document.getElementById('score-percentage'),
  scoreFraction: document.getElementById('score-fraction'),
  ringProgress: document.getElementById('ring-progress'),
  statCorrect: document.getElementById('stat-correct'),
  statIncorrect: document.getElementById('stat-incorrect'),
  reviewContainer: document.getElementById('review-container'),
  restartBtn: document.getElementById('restart-btn')
};

// SVG Circle Circumference for Score Ring (r = 50)
const RING_CIRCUMFERENCE = 2 * Math.PI * 50; // ~314.16

// ==========================================================================
// Initialization & Event Listeners
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Initialize Theme (Default to Dark, check localStorage)
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  // Setup Event Listeners
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.startForm.addEventListener('submit', handleStartQuiz);
  elements.prevBtn.addEventListener('click', handlePreviousQuestion);
  elements.nextBtn.addEventListener('click', handleNextQuestion);
  elements.restartBtn.addEventListener('click', handleRestartQuiz);
});

// ==========================================================================
// Theme Management
// ==========================================================================
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  if (theme === 'light') {
    elements.themeIcon.setAttribute('data-lucide', 'sun');
  } else {
    elements.themeIcon.setAttribute('data-lucide', 'moon');
  }
  // Rerender the icons
  lucide.createIcons();
}

// ==========================================================================
// Screen Transitions
// ==========================================================================
function showScreen(activeScreen) {
  const screens = [elements.welcomeScreen, elements.quizScreen, elements.resultsScreen];
  
  screens.forEach(screen => {
    if (screen === activeScreen) {
      screen.classList.remove('hidden');
      screen.classList.add('active-screen');
    } else {
      screen.classList.add('hidden');
      screen.classList.remove('active-screen');
    }
  });
}

// ==========================================================================
// Quiz Flow Functions
// ==========================================================================

// 1. Welcome -> Quiz Screen
async function handleStartQuiz(e) {
  e.preventDefault();
  
  const name = elements.usernameInput.value.trim();
  if (!name) return;
  
  state.playerName = name;
  elements.playerDisplay.textContent = name;
  
  // Fetch questions from Backend API
  try {
    showLoadingState();
    const response = await fetch('/api/questions');
    if (!response.ok) {
      throw new Error('Failed to retrieve quiz questions.');
    }
    state.questions = await response.json();
    
    // Setup first question
    state.currentQuestionIndex = 0;
    state.selectedAnswers = {};
    
    // Go to quiz
    showScreen(elements.quizScreen);
    renderQuestion();
  } catch (error) {
    console.error('API Error:', error);
    alert(`Could not start quiz: ${error.message}. Please make sure the backend server is running.`);
    restoreBtnState();
  }
}

function showLoadingState() {
  const btn = elements.startForm.querySelector('button');
  btn.disabled = true;
  btn.innerHTML = '<span>Loading Quiz...</span><i class="animate-spin" data-lucide="loader-2"></i>';
  lucide.createIcons();
}

function restoreBtnState() {
  const btn = elements.startForm.querySelector('button');
  btn.disabled = false;
  btn.innerHTML = '<span>Start Quiz</span><i data-lucide="arrow-right"></i>';
  lucide.createIcons();
}

// 2. Render Active Question
function renderQuestion() {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const totalQuestions = state.questions.length;
  
  // Update texts
  elements.currentQuestionNum.textContent = state.currentQuestionIndex + 1;
  elements.totalQuestionsNum.textContent = totalQuestions;
  
  // Progress bar calculation
  const progressPercent = ((state.currentQuestionIndex + 1) / totalQuestions) * 100;
  elements.progressBar.style.width = `${progressPercent}%`;
  
  // Render text with animation
  const cardElement = document.getElementById('question-card');
  cardElement.style.animation = 'none';
  // Trigger DOM reflow to restart animation
  void cardElement.offsetWidth;
  cardElement.style.animation = 'slideQuestion var(--transition-normal) forwards';
  
  elements.questionText.textContent = currentQuestion.question;
  
  // Render options
  elements.optionsContainer.innerHTML = '';
  const optionLabels = ['A', 'B', 'C', 'D'];
  
  currentQuestion.options.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    if (state.selectedAnswers[currentQuestion.id] === option) {
      btn.classList.add('selected');
    }
    
    btn.innerHTML = `
      <span class="option-badge">${optionLabels[idx] || (idx + 1)}</span>
      <span class="option-text">${escapeHtml(option)}</span>
    `;
    
    btn.addEventListener('click', () => handleSelectOption(currentQuestion.id, option));
    elements.optionsContainer.appendChild(btn);
  });
  
  // Control navigation button states
  elements.prevBtn.disabled = state.currentQuestionIndex === 0;
  
  // If last question, change next button to Submit
  if (state.currentQuestionIndex === totalQuestions - 1) {
    elements.nextBtnText.textContent = 'Submit Quiz';
    elements.nextBtnIcon.setAttribute('data-lucide', 'check-check');
  } else {
    elements.nextBtnText.textContent = 'Next';
    elements.nextBtnIcon.setAttribute('data-lucide', 'arrow-right');
  }
  
  // Re-run lucide on footer elements
  lucide.createIcons();
}

// 3. Selection Event
function handleSelectOption(questionId, selectedOption) {
  state.selectedAnswers[questionId] = selectedOption;
  
  // Re-render only selected states visually
  const buttons = elements.optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach(btn => {
    const textNode = btn.querySelector('.option-text').textContent;
    if (textNode === selectedOption) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// 4. Previous Navigation
function handlePreviousQuestion() {
  if (state.currentQuestionIndex > 0) {
    state.currentQuestionIndex--;
    renderQuestion();
  }
}

// 5. Next Navigation / Submit Submission
async function handleNextQuestion() {
  const currentQuestion = state.questions[state.currentQuestionIndex];
  
  // Optional UX choice: Prompt if user hasn't selected an answer
  if (!state.selectedAnswers[currentQuestion.id]) {
    alert('Please select an option before moving forward!');
    return;
  }
  
  const totalQuestions = state.questions.length;
  
  if (state.currentQuestionIndex < totalQuestions - 1) {
    state.currentQuestionIndex++;
    renderQuestion();
  } else {
    // Submit results
    await submitQuizResults();
  }
}

// 6. Submit API call
async function submitQuizResults() {
  elements.nextBtn.disabled = true;
  elements.nextBtnText.textContent = 'Grading...';
  
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answers: state.selectedAnswers
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to grade quiz.');
    }
    
    const resultData = await response.json();
    renderResults(resultData);
    showScreen(elements.resultsScreen);
  } catch (error) {
    console.error('Submission Error:', error);
    alert(`Could not submit answers: ${error.message}`);
    elements.nextBtn.disabled = false;
    elements.nextBtnText.textContent = 'Submit Quiz';
  }
}

// ==========================================================================
// Results Rendering & Scoring Animations
// ==========================================================================
function renderResults(results) {
  // Update header text
  elements.resultsPlayerName.textContent = state.playerName;
  
  // Stats cards values
  const correctCount = results.score;
  const incorrectCount = results.total - results.score;
  
  elements.statCorrect.textContent = correctCount;
  elements.statIncorrect.textContent = incorrectCount;
  elements.scoreFraction.textContent = `${correctCount} / ${results.total}`;
  
  // Custom Performance Verdict Message
  const verdictText = document.getElementById('results-verdict');
  const percentage = results.percentage;
  if (percentage === 100) {
    verdictText.textContent = 'Perfect score! You are an absolute tech maestro!';
  } else if (percentage >= 80) {
    verdictText.textContent = 'Outstanding job! You have a solid grasp of web technologies.';
  } else if (percentage >= 50) {
    verdictText.textContent = 'Good effort! You know your stuff, but there is room to grow.';
  } else {
    verdictText.textContent = 'Keep practicing! Review the explanations below to improve your skills.';
  }

  // Animate Percentage Ring & Label
  elements.scorePercentage.textContent = '0%';
  elements.ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE; // Set full offset at start
  
  // Dynamic offset calculation
  const offset = RING_CIRCUMFERENCE - (percentage / 100) * RING_CIRCUMFERENCE;
  
  // Start drawing animation after screen enters
  setTimeout(() => {
    elements.ringProgress.style.strokeDashoffset = offset;
    animateCountUp(percentage);
  }, 300);

  // Render Detailed Explanations / Review Section
  elements.reviewContainer.innerHTML = '';
  
  results.results.forEach((item, index) => {
    const itemCard = document.createElement('div');
    itemCard.className = `review-item ${item.isCorrect ? 'correct-item' : 'incorrect-item'}`;
    
    // Icons based on correct/incorrect
    const statusIcon = item.isCorrect 
      ? '<i data-lucide="check-circle" style="color: var(--success);"></i>'
      : '<i data-lucide="x-circle" style="color: var(--error);"></i>';
      
    let answersHtml = '';
    
    if (item.isCorrect) {
      answersHtml = `
        <div class="answer-pill correct-pick">
          <i data-lucide="check"></i>
          <span>Your Answer: ${escapeHtml(item.userAnswer)} (Correct)</span>
        </div>
      `;
    } else {
      answersHtml = `
        <div class="answer-pill user-pick">
          <i data-lucide="x"></i>
          <span>Your Answer: ${escapeHtml(item.userAnswer || 'No answer selected')} (Incorrect)</span>
        </div>
        <div class="answer-pill correct-pick">
          <i data-lucide="check"></i>
          <span>Correct Answer: ${escapeHtml(item.correctAnswer)}</span>
        </div>
      `;
    }
    
    itemCard.innerHTML = `
      <div class="review-question">
        <span style="margin-right: 8px; vertical-align: middle;">${statusIcon}</span>
        <span>${index + 1}. ${escapeHtml(item.question)}</span>
      </div>
      <div class="review-answers-grid">
        ${answersHtml}
      </div>
      <div class="explanation-box">
        <div class="explanation-title">Explanation:</div>
        <p>${escapeHtml(item.explanation)}</p>
      </div>
    `;
    
    elements.reviewContainer.appendChild(itemCard);
  });
  
  lucide.createIcons();
}

// Percentage label counter animation
function animateCountUp(targetVal) {
  let currentVal = 0;
  if (targetVal === 0) return;
  
  const duration = 1500; // ms (matches stroke-dashoffset transition)
  const steps = targetVal;
  const stepTime = Math.max(Math.floor(duration / steps), 15); // limit min speed
  
  const timer = setInterval(() => {
    currentVal++;
    elements.scorePercentage.textContent = `${currentVal}%`;
    if (currentVal >= targetVal) {
      clearInterval(timer);
    }
  }, stepTime);
}

// ==========================================================================
// Restart Quiz
// ==========================================================================
function handleRestartQuiz() {
  state.playerName = '';
  state.questions = [];
  state.currentQuestionIndex = 0;
  state.selectedAnswers = {};
  
  elements.usernameInput.value = '';
  restoreBtnState();
  
  showScreen(elements.welcomeScreen);
}

// ==========================================================================
// Helper Utility Functions
// ==========================================================================
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
