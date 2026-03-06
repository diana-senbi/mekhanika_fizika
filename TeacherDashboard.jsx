import React, { useMemo, useState } from "react";
import "./teacher-dashboard.css";

const initialStudents = [
  {
    id: 1,
    fullName: "Айдана Сәрсен",
    group: "Мех-101",
    completedWeeks: 5,
    totalWeeks: 15,
    score: 82,
    feedback: "Есептерді жақсы шығарады, бірақ теорияны толықтыру керек.",
    statusLabel: "Жақсы",
    statusKey: "good",
  },
  {
    id: 2,
    fullName: "Нұрбек Төлеу",
    group: "Мех-101",
    completedWeeks: 3,
    totalWeeks: 15,
    score: 61,
    feedback: "Тапсырмаларды уақытында тапсыруы керек.",
    statusLabel: "Орташа",
    statusKey: "average",
  },
  {
    id: 3,
    fullName: "Диана Дәулет",
    group: "Мех-102",
    completedWeeks: 6,
    totalWeeks: 15,
    score: 91,
    feedback: "Белсенді, шешу жолдарын дұрыс көрсетеді.",
    statusLabel: "Өте жақсы",
    statusKey: "excellent",
  },
  {
    id: 4,
    fullName: "Аслан Қайрат",
    group: "Мех-102",
    completedWeeks: 2,
    totalWeeks: 15,
    score: 48,
    feedback: "Қосымша жұмыс қажет, прогресс төмен.",
    statusLabel: "Төмен",
    statusKey: "low",
  },
];

export default function TeacherDashboard() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("Барлығы");
  const [statusFilter, setStatusFilter] = useState("Барлығы");

  const groups = ["Барлығы", ...new Set(students.map((s) => s.group))];
  const statuses = ["Барлығы", ...new Set(students.map((s) => s.statusLabel))];

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = student.fullName
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesGroup =
        groupFilter === "Барлығы" || student.group === groupFilter;

      const matchesStatus =
        statusFilter === "Барлығы" || student.statusLabel === statusFilter;

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [students, search, groupFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalStudents = filteredStudents.length;

    const avgScore =
      totalStudents > 0
        ? Math.round(
            filteredStudents.reduce((sum, s) => sum + s.score, 0) / totalStudents
          )
        : 0;

    const avgCompletedWeeks =
      totalStudents > 0
        ? Math.round(
            filteredStudents.reduce((sum, s) => sum + s.completedWeeks, 0) /
              totalStudents
          )
        : 0;

    const avgProgress =
      totalStudents > 0
        ? Math.round(
            filteredStudents.reduce(
              (sum, s) => sum + (s.completedWeeks / s.totalWeeks) * 100,
              0
            ) / totalStudents
          )
        : 0;

    return {
      totalStudents,
      avgScore,
      avgCompletedWeeks,
      avgProgress,
    };
  }, [filteredStudents]);

  const handleFeedbackChange = (id, newFeedback) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, feedback: newFeedback } : student
      )
    );
  };

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Мұғалім панелі</h1>
          <p>Механика пәні бойынша студенттердің үлгерімі</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Студент саны</h3>
          <p>{stats.totalStudents}</p>
        </div>

        <div className="stat-card">
          <h3>Орташа балл</h3>
          <p>{stats.avgScore}</p>
        </div>

        <div className="stat-card">
          <h3>Орташа өткен апта</h3>
          <p>{stats.avgCompletedWeeks} / 15</p>
        </div>

        <div className="stat-card">
          <h3>Орындау пайызы</h3>
          <p>{stats.avgProgress}%</p>
        </div>
      </section>

      <section className="filters">
        <input
          type="text"
          placeholder="Студентті іздеу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </section>

      <section className="student-table-wrapper">
        <table className="student-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Аты-жөні</th>
              <th>Тобы</th>
              <th>Өткен апта</th>
              <th>Прогресс</th>
              <th>Балл</th>
              <th>Статус</th>
              <th>Кері байланыс</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => {
                const progress = Math.round(
                  (student.completedWeeks / student.totalWeeks) * 100
                );

                return (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.fullName}</td>
                    <td>{student.group}</td>
                    <td>
                      {student.completedWeeks} / {student.totalWeeks}
                    </td>
                    <td>
                      <div className="progress-box">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span>{progress}%</span>
                      </div>
                    </td>
                    <td>{student.score}</td>
                    <td>
                      <span className={`status-badge ${student.statusKey}`}>
                        {student.statusLabel}
                      </span>
                    </td>
                    <td>
                      <textarea
                        value={student.feedback}
                        onChange={(e) =>
                          handleFeedbackChange(student.id, e.target.value)
                        }
                        rows="3"
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="empty-row">
                  Мәлімет табылмады
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
