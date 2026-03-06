const STORAGE_KEY = "mechanics_course_site_v2";

let state = loadState();
let currentView = "home";

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const viewContainer = document.getElementById("viewContainer");
const studentNameEl = document.getElementById("studentName");
const loginErrorEl = document.getElementById("loginError");

document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.getElementById("logoutBtn").addEventListener("click", logout);

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setActiveNav(btn.dataset.view);
    renderView(btn.dataset.view);
  });
});

init();

function init() {
  if (state.currentStudent) {
    showApp();
    renderView(currentView);
  } else {
    showLogin();
  }
}

function createEmptyProgress() {
  const weeks = {};
  for (let i = 0; i < courseData.weeks.length; i++) {
    weeks[i + 1] = {
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
  } catch {
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
  if (!state.progressByLogin[state.currentStudent.login]) {
    state.progressByLogin[state.currentStudent.login] = createEmptyProgress();
    saveState();
  }
  return state.progressByLogin[state.currentStudent.login];
}

function handleLogin() {
  const login = document.getElementById("loginInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  const found = courseData.students.find(
    s => s.login === login && s.password === password
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
  currentView = "home";
  showLogin();
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function showApp() {
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  studentNameEl.textContent = state.currentStudent.name;
}

function setActiveNav(view) {
  currentView = view;
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

function renderView(view) {
  currentView = view;
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

        <div class="info-grid" style="margin-top: 18px;">
          <div class="info-box">
            <h4>Пән</h4>
            <p>${courseData.subject}</p>
          </div>
          <div class="info-box">
            <h4>Оқытушылар</h4>
            <p>${courseData.teachers.join("<br>")}</p>
          </div>
          <div class="info-box">
            <h4>Курс форматы</h4>
            <p>15 апта • лекция • тест • практика • кері байланыс</p>
          </div>
          <div class="info-box">
            <h4>Қорытынды</h4>
            <p>Нәтиже + сертификат</p>
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
                item => `
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
            .map(item => `<div class="scale-item">${item}</div>`)
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
        Лекцияны оқыған соң 4 тестке жауап бересің. Практикада 2 есепке
        берілгенін, формулаларын, толық шығарылуын және жауабын жазасың.
      </p>
    </section>

    <section class="weeks-grid">
      ${courseData.weeks
        .map((week, index) => {
          const weekNo = index + 1;
          const weekProgress = progress.weeks[weekNo];
          const practiceCount = weekProgress.practices.filter(p => p.submitted).length;
          const feedbackDone = weekProgress.feedback.trim() ? "Иә" : "Жоқ";

          return `
          <article class="week-card">
            <div class="week-number">${weekNo}</div>
            <h3>${week.title}</h3>
            <p>${week.short}</p>

            <div class="week-meta">
              <span class="tag">Тест: ${weekProgress.testDone ? weekProgress.testScore + "/4" : "орындалмаған"}</span>
              <span class="tag">Практика: ${practiceCount}/2</span>
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
          Тест: ${progress.testDone ? progress.testScore + "/4" : "0/4"} | Практика: ${progress.practices.filter(p => p.submitted).length}/2
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
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
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
          ${progress.testDone ? `<p class="locked-note">Тест бір рет тапсырылды. Нәтиже: ${progress.testScore}/4</p>` : ""}
          <div id="testWrap">
            ${week.tests
              .map(
                (item, idx) => `
                <div class="test-card question-item">
                  <b>${idx + 1}. ${item.q}</b>
                  <div class="options-list">
                    ${item.options
                      .map(
                        (opt, optIdx) => `
                        <label class="option">
                          <input type="radio" name="week${weekNo}_q${idx}" value="${optIdx}" ${progress.testDone ? "disabled" : ""}>
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
      </div>
    `;
  }

  if (tab === "practice") {
    content.innerHTML = `
      <div class="warning-note">
        Бұл бөлім Волькенштейннің механикаға арналған есептерінің <b>типіне негізделіп</b> жасалды.
        Сайт форматына сай есеп мәтіндері сөзбе-сөз емес, мазмұнын сақтай отырып ықшамдалды.
      </div>

      ${week.practices
        .map((task, idx) => {
          const item = progress.practices[idx];
          return `
          <div class="practice-card">
            <h3 class="section-subtitle">${task.title}</h3>
            <p class="muted"><b>Шарт:</b> ${task.prompt}</p>
            <p class="small-note"><b>Көмек:</b> ${task.hint}</p>

            <textarea
              id="practice_${weekNo}_${idx}"
              class="textarea"
              placeholder="Берілгені, SI жүйесіне келтіру, негізгі формула, түрлендіру, есептеу, толық шығарылуы, жауабы..."
              ${item.submitted ? "disabled" : ""}
            >${item.content}</textarea>

            <div class="practice-actions">
              ${
                item.submitted
                  ? `<span class="locked-note">Бұл есеп жіберілген.</span>`
                  : `<button class="submit-btn" onclick="submitPractice(${weekNo}, ${idx})">Есепті жіберу</button>`
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
          Бұл бөлімде студент қай жері түсініксіз болғанын, қай формула қиын болғанын,
          немесе қосымша түсіндіруді қажет ететін тұстарын жазады.
        </p>

        <textarea id="feedbackArea" class="textarea" placeholder="Мысалы: Ньютонның үшінші заңындағы күштердің қай денелерге әсер ететінін шатастырдым...">${progress.feedback}</textarea>

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

  if (progress.testDone) return;

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
    if (value === week.tests[i].answer) score++;
  }

  progress.testDone = true;
  progress.testScore = score;
  progress.selectedAnswers = selectedAnswers;
  saveState();

  alert(`Тест аяқталды. Нәтиже: ${score}/4`);
  openWeek(weekNo);
}

function submitPractice(weekNo, taskIdx) {
  const textarea = document.getElementById(`practice_${weekNo}_${taskIdx}`);
  const text = textarea.value.trim();

  if (text.length < 30) {
    alert("Есептің берілгенін, формуласын және толық шығарылуын толығырақ жаз.");
    return;
  }

  const progress = getCurrentProgress().weeks[weekNo];
  progress.practices[taskIdx].submitted = true;
  progress.practices[taskIdx].content = text;

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
  const totalTestQuestions = courseData.weeks.length * 4;

  let earnedTestQuestions = 0;
  let completedPractices = 0;
  let completedFeedbacks = 0;

  courseData.weeks.forEach((_, idx) => {
    const weekNo = idx + 1;
    const weekProgress = progress.weeks[weekNo];
    earnedTestQuestions += weekProgress.testScore;
    completedPractices += weekProgress.practices.filter(p => p.submitted).length;
    if (weekProgress.feedback.trim()) completedFeedbacks++;
  });

  const lecturePoints = round2((earnedTestQuestions / totalTestQuestions) * 20);
  const practicePoints = round2((completedPractices / (courseData.weeks.length * 2)) * 50);
  const feedbackPoints = round2((completedFeedbacks / courseData.weeks.length) * 10);
  const finalPoints = round2((progress.finalQuizScore / courseData.finalQuiz.length) * 20);

  const total = round2(lecturePoints + practicePoints + feedbackPoints + finalPoints);

  return {
    lecturePoints,
    practicePoints,
    feedbackPoints,
    finalPoints,
    total,
    completedPractices,
    completedFeedbacks,
    earnedTestQuestions
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
        Мұнда лекциялық бақылау, практикалық жұмыстар, кері байланыс және қорытынды бақылау бойынша
        жинақталған жалпы нәтиже көрсетіледі.
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

      <div class="card" style="margin-top: 18px;">
        <h3 class="section-subtitle">Жалпы қорытынды</h3>
        <p class="muted">Жалпы балл: <b>${result.total}</b> / 100</p>
        <p class="muted">Баға: <b>${getGradeLabel(result.total)}</b></p>
        <p class="muted">Лекция сұрақтары: <b>${result.earnedTestQuestions}</b> / ${courseData.weeks.length * 4}</p>
        <p class="muted">Практика орындалуы: <b>${result.completedPractices}</b> / ${courseData.weeks.length * 2}</p>
        <p class="muted">Кері байланыс саны: <b>${result.completedFeedbacks}</b> / ${courseData.weeks.length}</p>
      </div>

      <div class="progress-list">
        ${courseData.weeks
          .map((week, idx) => {
            const weekNo = idx + 1;
            const wp = progress.weeks[weekNo];
            const done = wp.testDone && wp.practices.every(p => p.submitted) && wp.feedback.trim();
            return `
              <div class="progress-row">
                <div class="progress-left">
                  <span class="week-number">${weekNo}</span>
                  <div>
                    <b>${week.title}</b>
                    <div class="small-note">Тест: ${wp.testDone ? wp.testScore + "/4" : "жоқ"} | Практика: ${wp.practices.filter(p => p.submitted).length}/2 | Кері байланыс: ${wp.feedback.trim() ? "бар" : "жоқ"}</div>
                  </div>
                </div>
                <div class="progress-status ${done ? "status-good" : "status-bad"}">
                  ${done ? "Аяқталған" : "Толық емес"}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>

    ${renderFinalQuizBlock(progress)}
    ${progress.finalQuizDone ? renderCertificateBlock(result.total) : ""}
  `;
}

function renderFinalQuizBlock(progress) {
  if (progress.finalQuizDone) {
    return `
      <section class="card final-quiz-card">
        <h3 class="section-subtitle">Қорытынды бақылау</h3>
        <p class="locked-note">Қорытынды бақылау тапсырылды. Нәтиже: ${progress.finalQuizScore}/${courseData.finalQuiz.length}</p>
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
          (item, idx) => `
          <div class="question-item">
            <b>${idx + 1}. ${item.q}</b>
            <div class="options-list">
              ${item.options
                .map(
                  (opt, optIdx) => `
                  <label class="option">
                    <input type="radio" name="final_q${idx}" value="${optIdx}">
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
    if (value === courseData.finalQuiz[i].answer) score++;
  }

  progress.finalQuizDone = true;
  progress.finalQuizScore = score;
  progress.finalSelectedAnswers = selected;
  saveState();

  alert(`Қорытынды бақылау аяқталды. Нәтиже: ${score}/${courseData.finalQuiz.length}`);
  renderResults();
}

function renderCertificateBlock(total) {
  const grade = getGradeLabel(total);

  return `
    <section class="card certificate-card">
      <h3 class="section-subtitle">Сертификат</h3>
      <div class="certificate">
        <img src="logo.png" alt="Zhansibekov University" class="logo" />
        <h2>ZHANIBEKOV UNIVERSITY</h2>
        <h3>СЕРТИФИКАТ</h3>
        <p>Осы сертификат</p>
        <div class="cert-name">${state.currentStudent.name}</div>
        <p>
          <b>${courseData.subject}</b> пәні бойынша 15 апталық онлайн курсты
          аяқтағанын растайды.
        </p>
        <p class="cert-score">Жалпы балл: ${total} / 100</p>
        <p><b>Деңгейі:</b> ${grade}</p>
        <p>
          Оқытушылар: ${courseData.teachers.join(", ")}
        </p>
        <p>${new Date().toLocaleDateString("kk-KZ")}</p>
      </div>
      <button class="print-btn" onclick="window.print()">Сертификатты шығару</button>
    </section>
  `;
}

function round2(num) {
  return Math.round(num * 100) / 100;
}
