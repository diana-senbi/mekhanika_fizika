const STORAGE_KEY = "mechanics_course_site_v3";

let state = loadState();
let currentView = "home";

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const viewContainer = document.getElementById("viewContainer");
const studentNameEl = document.getElementById("studentName");
const loginErrorEl = document.getElementById("loginError");

document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.getElementById("logoutBtn").addEventListener("click", logout);

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    renderView(btn.dataset.view);
  });
});

init();

function init() {
  if (state.currentStudent) {
    showApp();
    renderView("home");
  } else {
    showLogin();
  }
}

function createEmptyProgress() {
  const weeks = {};

  for (let i = 1; i <= courseData.weeks.length; i++) {
    weeks[i] = {
      testDone: false,
      testScore: 0,
      selectedAnswers: [],
      practices: [
        { submitted: false, content: "" },
        { submitted: false, content: "" }
      ],
      feedback: ""
    };
  }

  return {
    weeks,
    finalQuizDone: false,
    finalQuizScore: 0,
    finalSelectedAnswers: []
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {
      currentStudent: null,
      progressByLogin: {}
    };
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return {
      currentStudent: null,
      progressByLogin: {}
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentProgress() {
  if (!state.currentStudent) return null;

  const login = state.currentStudent.login;

  if (!state.progressByLogin[login]) {
    state.progressByLogin[login] = createEmptyProgress();
    saveState();
  }

  return state.progressByLogin[login];
}

function handleLogin() {
  const login = document.getElementById("loginInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  const found = courseData.students.find(
    (student) => student.login === login && student.password === password
  );

  if (!found) {
    loginErrorEl.textContent = "Логин немесе құпия сөз қате.";
    return;
  }

  state.currentStudent = {
    login: found.login,
    name: found.name
  };

  if (!state.progressByLogin[found.login]) {
    state.progressByLogin[found.login] = createEmptyProgress();
  }

  saveState();
  loginErrorEl.textContent = "";
  showApp();
  renderView("home");
}

function logout() {
  state.currentStudent = null;
  saveState();
  showLogin();
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function showApp() {
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  if (state.currentStudent) {
    studentNameEl.textContent = state.currentStudent.name;
  }
}

function setActiveNav(view) {
  currentView = view;

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

function renderView(view) {
  setActiveNav(view);

  if (view === "home") {
    renderHome();
  } else if (view === "weeks") {
    renderWeeks();
  } else if (view === "results") {
    renderResults();
  }
}

function renderHome() {
  viewContainer.innerHTML = `
    <section class="two-col">
      <div class="card">
        <h2 class="section-title">Пән туралы толық таныстыру</h2>
        <p class="muted">${courseData.intro.replace(/\n/g, "<br><br>")}</p>

        <div class="info-grid" style="margin-top:18px;">
          <div class="info-box">
            <h4>Пән</h4>
            <p>${courseData.subject}</p>
          </div>
          <div class="info-box">
            <h4>Оқытушылар</h4>
            <p>${courseData.teachers.join("<br>")}</p>
          </div>
          <div class="info-box">
            <h4>Оқу форматы</h4>
            <p>15 апта, лекция, тест, практика, кері байланыс</p>
          </div>
          <div class="info-box">
            <h4>Қорытынды</h4>
            <p>Нәтиже және сертификат</p>
          </div>
        </div>

        <div class="start-wrap">
          <button class="primary-btn" onclick="renderView('weeks')">Сабақты бастау</button>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">Бағалау критерийі</h2>

        <table class="criteria-table">
          <thead>
            <tr>
              <th>Бөлім</th>
              <th>Балл</th>
              <th>Сипаттама</th>
            </tr>
          </thead>
          <tbody>
            ${courseData.grading
              .map(
                (item) => `
                <tr>
                  <td><b>${item.title}</b></td>
                  <td><b>${item.points}</b></td>
                  <td>${item.desc.replace(/\n/g, "<br>")}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <div class="scale-list">
          ${courseData.scale
            .map((item) => `<div class="scale-item">${item}</div>`)
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderWeeks() {
  const progress = getCurrentProgress();

  viewContainer.innerHTML = `
    <section class="card">
      <h2 class="section-title">15 аптаға бөлінген сабақтар</h2>
      <p class="muted">
        Әр аптада 3 бөлім бар: <b>Лекция</b>, <b>Практика</b>, <b>Кері байланыс</b>.
        Лекцияны оқыған соң тест тапсырасың. Практикада екі есепке
        берілгенін, формулаларын, толық шығарылуын және жауабын жазасың.
      </p>
    </section>

    <section class="weeks-grid">
      ${courseData.weeks
        .map((week, index) => {
          const weekNo = index + 1;
          const wp = progress.weeks[weekNo];
          const practiceDone = wp.practices.filter((p) => p.submitted).length;
          const feedbackDone = wp.feedback.trim() ? "бар" : "жоқ";

          return `
            <article class="week-card">
              <div class="week-number">${weekNo}</div>
              <h3>${week.title}</h3>
              <p>${week.short}</p>

              <div class="week-meta">
                <span class="tag">Тест: ${wp.testDone ? wp.testScore + "/4" : "жоқ"}</span>
                <span class="tag">Практика: ${practiceDone}/2</span>
                <span class="tag">Кері байланыс: ${feedbackDone}</span>
              </div>

              <button class="week-btn" onclick="openWeek(${weekNo})">Аптаны ашу</button>
            </article>
          `;
        })
        .join("")}
    </section>
  `;
}

function openWeek(weekNo) {
  const week = courseData.weeks[weekNo - 1];
  const progress = getCurrentProgress().weeks[weekNo];

  viewContainer.innerHTML = `
    <div class="card">
      <span class="back-link" onclick="renderView('weeks')">← 15 апта тізіміне қайту</span>

      <div class="week-header">
        <div>
          <h2 class="section-title">${weekNo}-апта. ${week.title}</h2>
          <p class="muted">${week.short}</p>
        </div>
        <div class="score-pill">
          Тест: ${progress.testDone ? progress.testScore + "/4" : "0/4"} |
          Практика: ${progress.practices.filter((p) => p.submitted).length}/2
        </div>
      </div>

      <div class="week-tabs">
        <button class="tab-btn active" onclick="showWeekTab(${weekNo}, 'lecture', this)">Лекция</button>
        <button class="tab-btn" onclick="showWeekTab(${weekNo}, 'practice', this)">Практика</button>
        <button class="tab-btn" onclick="showWeekTab(${weekNo}, 'feedback', this)">Кері байланыс</button>
      </div>

      <div id="weekTabContent"></div>
    </div>
  `;

  renderWeekTabContent(weekNo, "lecture");
}

function showWeekTab(weekNo, tab, el) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  el.classList.add("active");
  renderWeekTabContent(weekNo, tab);
}

function renderWeekTabContent(weekNo, tab) {
  const week = courseData.weeks[weekNo - 1];
  const progress = getCurrentProgress().weeks[weekNo];
  const content = document.getElementById("weekTabContent");

  if (tab === "lecture") {
    content.innerHTML = `
      <div class="lecture-block">
        <div class="card">
          <h3 class="section-subtitle">Лекция мәтіні</h3>
          <p class="muted">${week.lecture.replace(/\n/g, "<br><br>")}</p>
        </div>

        <div class="card">
          <h3 class="section-subtitle">Негізгі формулалар</h3>
          <div class="formula-box">${week.formulas.join("\n")}</div>
        </div>

        <div class="card">
          <h3 class="section-subtitle">Лекция соңындағы тест</h3>
          ${
            progress.testDone
              ? `<p class="locked-note">Тест бір рет тапсырылды. Нәтиже: ${progress.testScore}/4</p>`
              : ""
          }

          ${week.tests
            .map(
              (item, qIndex) => `
                <div class="test-card question-item">
                  <b>${qIndex + 1}. ${item.q}</b>
                  <div class="options-list">
                    ${item.options
                      .map(
                        (opt, optIndex) => `
                          <label class="option">
                            <input
                              type="radio"
                              name="week${weekNo}_q${qIndex}"
                              value="${optIndex}"
                              ${progress.testDone ? "disabled" : ""}
                            >
                            <span>${opt}</span>
                          </label>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `
            )
            .join("")}

          ${
            progress.testDone
              ? ""
              : `<button class="submit-btn" onclick="submitWeekTest(${weekNo})">Тестті аяқтау</button>`
          }
        </div>
      </div>
    `;
  }

  if (tab === "practice") {
    content.innerHTML = `
      <div class="warning-note">
        Бұл бөлім Волькенштейн типіндегі механика есептеріне сай жасалған.
        Әр есепке берілгенін, SI жүйесіне келтіруді, формуланы, толық шығарылуын және жауабын жазыңдар.
      </div>

      ${week.practices
        .map((task, index) => {
          const item = progress.practices[index];

          return `
            <div class="practice-card">
              <h3 class="section-subtitle">${task.title}</h3>
              <p class="muted"><b>Шарт:</b> ${task.prompt}</p>
              <p class="small-note"><b>Көмек:</b> ${task.hint}</p>

              <textarea
                id="practice_${weekNo}_${index}"
                class="textarea"
                placeholder="Берілгені, SI жүйесіне келтіру, формула, түрлендіру, есептеу, толық шығарылуы, жауабы..."
                ${item.submitted ? "disabled" : ""}
              >${item.content}</textarea>

              <div class="practice-actions">
                ${
                  item.submitted
                    ? `<span class="locked-note">Бұл есеп жіберілген.</span>`
                    : `<button class="submit-btn" onclick="submitPractice(${weekNo}, ${index})">Есепті жіберу</button>`
                }
              </div>
            </div>
          `;
        })
        .join("")}
    `;
  }

  if (tab === "feedback") {
    content.innerHTML = `
      <div class="feedback-card">
        <h3 class="section-subtitle">Кері байланыс</h3>
        <p class="muted">
          Қай жері түсініксіз болғанын, қандай формула қиын болғанын,
          немесе тағы нені қайталау керек екенін жазыңдар.
        </p>

        <textarea
          id="feedbackArea"
          class="textarea"
          placeholder="Мысалы: Бұл аптада үдеу формулаларын ажырату қиын болды..."
        >${progress.feedback}</textarea>

        <div class="practice-actions">
          <button class="submit-btn" onclick="saveFeedback(${weekNo})">Кері байланысты сақтау</button>
        </div>

        ${
          progress.feedback.trim()
            ? `<p class="locked-note">Кері байланыс сақталған.</p>`
            : ""
        }
      </div>
    `;
  }
}

function submitWeekTest(weekNo) {
  const week = courseData.weeks[weekNo - 1];
  const progress = getCurrentProgress().weeks[weekNo];

  if (progress.testDone) {
    return;
  }

  let score = 0;
  const selectedAnswers = [];

  for (let i = 0; i < week.tests.length; i++) {
    const checked = document.querySelector(`input[name="week${weekNo}_q${i}"]:checked`);

    if (!checked) {
      alert("Барлық сұраққа жауап бер.");
      return;
    }

    const value = Number(checked.value);
    selectedAnswers.push(value);

    if (value === week.tests[i].answer) {
      score++;
    }
  }

  progress.testDone = true;
  progress.testScore = score;
  progress.selectedAnswers = selectedAnswers;

  saveState();
  alert(`Тест аяқталды. Нәтиже: ${score}/4`);
  openWeek(weekNo);
}

function submitPractice(weekNo, taskIndex) {
  const textarea = document.getElementById(`practice_${weekNo}_${taskIndex}`);
  const text = textarea.value.trim();

  if (text.length < 30) {
    alert("Есептің толық шығарылуын толығырақ жаз.");
    return;
  }

  const progress = getCurrentProgress().weeks[weekNo];
  progress.practices[taskIndex].submitted = true;
  progress.practices[taskIndex].content = text;

  saveState();
  alert("Есеп жіберілді.");
  renderWeekTabContent(weekNo, "practice");
}

function saveFeedback(weekNo) {
  const text = document.getElementById("feedbackArea").value.trim();
  const progress = getCurrentProgress().weeks[weekNo];

  progress.feedback = text;

  saveState();
  alert("Кері байланыс сақталды.");
  renderWeekTabContent(weekNo, "feedback");
}

function calculateResults() {
  const progress = getCurrentProgress();

  let earnedTestQuestions = 0;
  let completedPractices = 0;
  let completedFeedbacks = 0;

  courseData.weeks.forEach((week, index) => {
    const weekNo = index + 1;
    const wp = progress.weeks[weekNo];

    earnedTestQuestions += wp.testScore;
    completedPractices += wp.practices.filter((p) => p.submitted).length;

    if (wp.feedback.trim()) {
      completedFeedbacks++;
    }
  });

  const totalTestQuestions = courseData.weeks.length * 4;
  const totalPracticeCount = courseData.weeks.length * 2;

  const lecturePoints = round2((earnedTestQuestions / totalTestQuestions) * 20);
  const practicePoints = round2((completedPractices / totalPracticeCount) * 50);
  const feedbackPoints = round2((completedFeedbacks / courseData.weeks.length) * 10);
  const finalPoints = round2((progress.finalQuizScore / courseData.finalQuiz.length) * 20);

  const total = round2(lecturePoints + practicePoints + feedbackPoints + finalPoints);

  return {
    lecturePoints,
    practicePoints,
    feedbackPoints,
    finalPoints,
    total,
    earnedTestQuestions,
    completedPractices,
    completedFeedbacks
  };
}

function getGradeLabel(total) {
  if (total >= 90) return "A / A- — Өте жақсы";
  if (total >= 75) return "B+ / B / B- — Жақсы";
  if (total >= 50) return "C+ / C / C- / D — Қанағаттанарлық";
  return "F — Қанағаттанарлықсыз";
}

function renderResults() {
  const progress = getCurrentProgress();
  const result = calculateResults();

  viewContainer.innerHTML = `
    <section class="card">
      <h2 class="section-title">15 аптаның нәтижесі</h2>
      <p class="muted">
        Бұл бөлімде лекциялық бақылау, практикалық жұмыс, кері байланыс
        және қорытынды бақылау бойынша жинақталған жалпы нәтиже көрсетіледі.
      </p>

      <div class="result-grid">
        <div class="result-box">
          <h4>Лекциялық бақылау</h4>
          <div class="result-number">${result.lecturePoints}</div>
          <div class="small-note">20 баллдан</div>
        </div>

        <div class="result-box">
          <h4>Практикалық жұмыс</h4>
          <div class="result-number">${result.practicePoints}</div>
          <div class="small-note">50 баллдан</div>
        </div>

        <div class="result-box">
          <h4>Кері байланыс</h4>
          <div class="result-number">${result.feedbackPoints}</div>
          <div class="small-note">10 баллдан</div>
        </div>

        <div class="result-box">
          <h4>Қорытынды бақылау</h4>
          <div class="result-number">${result.finalPoints}</div>
          <div class="small-note">20 баллдан</div>
        </div>
      </div>

      <div class="card" style="margin-top:18px;">
        <h3 class="section-subtitle">Жалпы қорытынды</h3>
        <p class="muted">Жалпы балл: <b>${result.total}</b> / 100</p>
        <p class="muted">Баға: <b>${getGradeLabel(result.total)}</b></p>
        <p class="muted">Лекция сұрақтары: <b>${result.earnedTestQuestions}</b> / ${courseData.weeks.length * 4}</p>
        <p class="muted">Практика орындалуы: <b>${result.completedPractices}</b> / ${courseData.weeks.length * 2}</p>
        <p class="muted">Кері байланыс саны: <b>${result.completedFeedbacks}</b> / ${courseData.weeks.length}</p>
      </div>

      <div class="progress-list">
        ${courseData.weeks
          .map((week, index) => {
            const weekNo = index + 1;
            const wp = progress.weeks[weekNo];
            const fullDone =
              wp.testDone &&
              wp.practices.every((p) => p.submitted) &&
              wp.feedback.trim();

            return `
              <div class="progress-row">
                <div class="progress-left">
                  <span class="week-number">${weekNo}</span>
                  <div>
                    <b>${week.title}</b>
                    <div class="small-note">
                      Тест: ${wp.testDone ? wp.testScore + "/4" : "жоқ"} |
                      Практика: ${wp.practices.filter((p) => p.submitted).length}/2 |
                      Кері байланыс: ${wp.feedback.trim() ? "бар" : "жоқ"}
                    </div>
                  </div>
                </div>
                <div class="progress-status ${fullDone ? "status-good" : "status-bad"}">
                  ${fullDone ? "Аяқталған" : "Толық емес"}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>

    ${renderFinalQuizBlock(progress)}

    ${
      progress.finalQuizDone
        ? `
          <section class="card">
            <h3 class="section-subtitle">Курс аяқталды</h3>
            <p class="muted">15 апта толық аяқталған соң сертификатты ашуға болады.</p>
            <button class="print-btn" onclick="openCertificate()">Сертификат</button>
          </section>
        `
        : ""
    }
  `;
}

function renderFinalQuizBlock(progress) {
  if (progress.finalQuizDone) {
    return `
      <section class="card final-quiz-card">
        <h3 class="section-subtitle">Қорытынды бақылау</h3>
        <p class="locked-note">
          Қорытынды бақылау тапсырылды. Нәтиже: ${progress.finalQuizScore}/${courseData.finalQuiz.length}
        </p>
      </section>
    `;
  }

  return `
    <section class="card final-quiz-card">
      <h3 class="section-subtitle">Қорытынды бақылау</h3>
      <p class="muted">
        Бұл бөлім 20 баллдық қорытынды бақылауға жатады. Барлық сұраққа жауап беріп, нәтижені бекітіңдер.
      </p>

      ${courseData.finalQuiz
        .map(
          (item, qIndex) => `
            <div class="question-item">
              <b>${qIndex + 1}. ${item.q}</b>
              <div class="options-list">
                ${item.options
                  .map(
                    (opt, optIndex) => `
                      <label class="option">
                        <input type="radio" name="final_q${qIndex}" value="${optIndex}">
                        <span>${opt}</span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")}

      <button class="submit-btn" onclick="submitFinalQuiz()">Қорытынды бақылауды аяқтау</button>
    </section>
  `;
}

function submitFinalQuiz() {
  const progress = getCurrentProgress();

  let score = 0;
  const selected = [];

  for (let i = 0; i < courseData.finalQuiz.length; i++) {
    const checked = document.querySelector(`input[name="final_q${i}"]:checked`);

    if (!checked) {
      alert("Қорытынды бақылауда барлық сұраққа жауап бер.");
      return;
    }

    const value = Number(checked.value);
    selected.push(value);

    if (value === courseData.finalQuiz[i].answer) {
      score++;
    }
  }

  progress.finalQuizDone = true;
  progress.finalQuizScore = score;
  progress.finalSelectedAnswers = selected;

  saveState();
  alert(`Қорытынды бақылау аяқталды. Нәтиже: ${score}/${courseData.finalQuiz.length}`);
  renderResults();
}

function openCertificate() {
  const result = calculateResults();

  viewContainer.innerHTML = `
    <section class="card">
      <span class="back-link" onclick="renderView('results')">← Нәтиже бетіне қайту</span>
      ${renderCertificateBlock(result.total)}
    </section>
  `;
}

function renderCertificateBlock(total) {
  return `
    <section class="certificate-card">
      <div class="certificate custom-cert">
        <div class="cert-border">
          <div class="cert-inner">
            <h2 class="cert-title-main">СЕРТИФИКАТ</h2>

            <p class="cert-text">
              Осы сертификат жас маманға 15 апталық
              <b>«Механика»</b> бөлімін толық меңгеріп,
              төзімділік пен білімге деген құштарлық танытқаны үшін табысталады.
            </p>

            <div class="cert-name">${state.currentStudent.name}</div>

            <p class="cert-text">
              Бұл тек бастамасы! Алдағы сабақтарға сәттілік!
            </p>

            <div class="cert-info">
              <div><b>Жалпы балл:</b> ${total} / 100</div>
              <div><b>Бағасы:</b> ${getGradeLabel(total)}</div>
            </div>

            <div class="cert-awarders">
              <h4>Табыстағандар:</h4>
              <p>• Сенби Диана</p>
              <p>• Илес Диана</p>
              <p>• Рахматулла Ернар</p>
            </div>

            <div class="cert-footer-line">
              <span>Шымкент, 2026</span>
              <span>«Механика» бөлімі бойынша жетістік сертификаты</span>
            </div>
          </div>
        </div>
      </div>

      <button class="print-btn" onclick="window.print()">Сертификатты шығару</button>
    </section>
  `;
}

function round2(num) {
  return Math.round(num * 100) / 100;
}
