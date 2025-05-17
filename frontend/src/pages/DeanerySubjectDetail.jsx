import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { getDeaneryToken } from "../utils/attendanceAuth";

Modal.setAppElement("#root");

const API_ROOT = "http://127.0.0.1:8000/api/attendance";
const STATUS_OPTIONS = ["+", "н", "б"];
const GRADE_OPTIONS  = ["0", "1", "2", "3", "4", "5", "Ня", "Нд", "Зч"];

const DeanerySubjectDetail = () => {
  const { groupId, semId, subjId } = useParams();
  const navigate = useNavigate();
  const token    = getDeaneryToken();
  const headers  = { Authorization: `Bearer ${token}` };

  const [subject, setSubject]   = useState(null);
  const [lessons, setLessons]   = useState([]);
  const [students, setStudents] = useState([]);
  const [attMap, setAttMap]     = useState({});
  const [gradesMap, setGradesMap] = useState({});

  const [isAddLessonOpen, setAddLessonOpen]       = useState(false);
  const [newLessonDate, setNewLessonDate]         = useState("");
  const [isDeleteLessonOpen, setDeleteLessonOpen] = useState(false);
  const [delLessonId, setDelLessonId]             = useState("");

  useEffect(() => {
    if (!token) return navigate("/deanery/login");

    axios.get(`${API_ROOT}/subjects/${subjId}`, { headers })
      .then(res => setSubject(res.data))
      .catch(() => navigate("/deanery/dashboard"));

    axios.get(`${API_ROOT}/subjects/${subjId}/lessons`, { headers })
      .then(res => {
        if (!Array.isArray(res.data)) throw new Error("Ожидали массив уроков");
        const sorted = res.data
          .slice()
          .sort((a, b) => new Date(a.lesson_date) - new Date(b.lesson_date));
        setLessons(sorted);

        res.data.forEach(lesson => {
          axios.get(`${API_ROOT}/lessons/${lesson.id}/attendances`, { headers })
            .then(r2 => {
              if (!Array.isArray(r2.data)) return;
              setAttMap(prev => ({
                ...prev,
                [lesson.id]: r2.data.reduce((acc, a) => {
                  acc[a.student_id] = a.status;
                  return acc;
                }, {})
              }));
            })
            .catch(console.error);
        });
      })
      .catch(console.error);

    axios.get(`${API_ROOT}/semesters/${semId}/students`, { headers })
      .then(res => {
        if (!Array.isArray(res.data)) throw new Error("Ожидали массив студентов");
        setStudents(res.data);
      })
      .catch(console.error);

    axios.get(`${API_ROOT}/subjects/${subjId}/grades`, { headers })
      .then(res => {
        if (!Array.isArray(res.data)) throw new Error("Ожидали массив оценок");
        const map = {};
        res.data.forEach(g => {
          map[g.student_id] = {
            control_1: g.control_1 || "",
            control_2: g.control_2 || "",
            exam:      g.exam      || "",
            retake:    g.retake    || "",
            commission: g.commission || ""
          };
        });
        setGradesMap(map);
      })
      .catch(console.error);

  }, [semId, subjId, token, navigate]);

  if (!subject) return <p className="p-6">Загрузка…</p>;

  const handleAttChange = (lessonId, studentId, status) => {
    setAttMap(prev => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], [studentId]: status }
    }));
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradesMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };

  const saveAttendances = async () => {
    const updates = [];
    Object.entries(attMap).forEach(([lessonId, studMap]) =>
      Object.entries(studMap).forEach(([studentId, status]) =>
        updates.push({ lesson_id: +lessonId, student_id: +studentId, status })
      )
    );
    await axios.put(`${API_ROOT}/attendances`, updates, { headers });
    alert("Посещаемость сохранена");
  };

  const saveGrades = async () => {
  const updates = Object.entries(gradesMap).map(([studentId, fields]) => ({
    subject_id:  Number(subjId),
    student_id:  Number(studentId),
    control_1: fields.control_1 !== "" ? fields.control_1 : null,
    control_2: fields.control_2 !== "" ? fields.control_2 : null,
    exam:      fields.exam      !== "" ? fields.exam      : null,
    retake:    fields.retake    !== "" ? fields.retake    : null,
    commission:  fields.commission !== "" ? fields.commission : null,

  }));

  try {
    await axios.put(
      `${API_ROOT}/grades`,
      updates,
      { headers }
    );
    alert("Оценки сохранены");
  } catch (e) {
    alert("Ошибка сохранения оценок: " +
      (e.response?.data?.detail || e.message)
    );
  }
};

  const createLesson = async () => {
    if (!newLessonDate) return alert("Укажите дату занятия");
    await axios.post(
      `${API_ROOT}/subjects/${subjId}/lessons`,
      { lesson_date: newLessonDate },
      { headers }
    );
    setNewLessonDate("");
    setAddLessonOpen(false);
    const r = await axios.get(`${API_ROOT}/subjects/${subjId}/lessons`, { headers });
    setLessons(Array.isArray(r.data) ? r.data : []);
  };

  const deleteLesson = async () => {
    if (!delLessonId) return;
    await axios.delete(`${API_ROOT}/lessons/${delLessonId}`, { headers });
    setDelLessonId("");
    setDeleteLessonOpen(false);
    const r = await axios.get(`${API_ROOT}/subjects/${subjId}/lessons`, { headers });
    setLessons(Array.isArray(r.data) ? r.data : []);
  };

  const sortedStudents = [...students].sort((a, b) =>
    a.full_name.split(" ")[0].localeCompare(b.full_name.split(" ")[0], "ru")
  );

  return (
      <>
    <button
      onClick={() => navigate(`/deanery/groups/${groupId}/semesters/${semId}`)}
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        backgroundColor: "#1a1a1a",
        color: "#fff",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      Назад к списку предметов
    </button>

    <div className="p-6 overflow-auto">
      <h1 className="text-2xl font-bold mb-4 text-center w-full">{subject.name}</h1>

      <div className="mb-4 flex justify-center flex-wrap gap-2">
        <button onClick={() => setAddLessonOpen(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Добавить занятие
        </button>
        <button onClick={() => setDeleteLessonOpen(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Удалить занятие
        </button>
        <button onClick={saveAttendances}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Сохранить посещаемость
        </button>
        <button onClick={saveGrades}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Сохранить оценки
        </button>
      </div>

      <div className="p-6 overflow-auto">
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ФИО</th>
            {lessons.map(ls => (
              <th key={ls.id} className="border px-2 py-1">
                {(() => { 
                  const d = new Date(ls.lesson_date);
                  const dd = String(d.getDate()).padStart(2, "0");
                  const mm = String(d.getMonth()+1).padStart(2, "0");
                  const yy = String(d.getFullYear()).slice(-2);
                  return `${dd}.${mm}.${yy}`;
                })()}
              </th>
            ))}
            <th className="border px-2 py-1">КР1</th>
            <th className="border px-2 py-1">КР2</th>
            <th className="border px-2 py-1">Э</th>
            <th className="border px-2 py-1">П</th>
            <th className="border px-2 py-1">Км</th> 

          </tr>
        </thead>
        <tbody>
          {sortedStudents.map(st => (
            <tr key={st.id}>
              <td className="border px-2 py-1">{st.full_name}</td>
              {lessons.map(ls => (
                <td key={ls.id} className="border px-2 py-1">
                  <select
                    value={attMap[ls.id]?.[st.id] ?? "н"}
                    onChange={e => handleAttChange(ls.id, st.id, e.target.value)}
                    className="block w-3/5 mx-auto text-center [text-align-last:center] [-moz-text-align-last:center]"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              ))}
              <td className="border px-2 py-1">
                <select
                  value={gradesMap[st.id]?.control_1 ?? ""}
                  onChange={e => handleGradeChange(st.id, "control_1", e.target.value)}
                  className="w-full text-center [text-align-last:center] [-moz-text-align-last:center]"
                >
                  <option value="">–</option>
                  {GRADE_OPTIONS.slice(0, 8).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  value={gradesMap[st.id]?.control_2 ?? ""}
                  onChange={e => handleGradeChange(st.id, "control_2", e.target.value)}
                  className="w-full text-center [text-align-last:center] [-moz-text-align-last:center]"
                >
                  <option value="">–</option>
                  {GRADE_OPTIONS.slice(0, 8).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  value={gradesMap[st.id]?.exam ?? ""}
                  onChange={e => handleGradeChange(st.id, "exam", e.target.value)}
                  className="w-full text-center [text-align-last:center] [-moz-text-align-last:center]"
                >
                  <option value="">–</option>
                  {GRADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  value={gradesMap[st.id]?.retake ?? ""}
                  onChange={e => handleGradeChange(st.id, "retake", e.target.value)}
                  className="w-full text-center [text-align-last:center] [-moz-text-align-last:center]"
                >
                  <option value="">–</option>
                  {GRADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  value={gradesMap[st.id]?.commission ?? ""}
                  onChange={e => handleGradeChange(st.id, "commission", e.target.value)}
                  className="w-full text-center [text-align-last:center] [-moz-text-align-last:center]"
                >
                  <option value="">–</option>
                  {GRADE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Modal
        isOpen={isAddLessonOpen}
        onRequestClose={() => setAddLessonOpen(false)}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          content: {
          position: "relative",
          inset: "unset",
          border: "none",
          background: "#2e2e2e",
          color: "#fff",
          borderRadius: "2rem",
          maxWidth: "600px",
          width: "90%",
          padding: 0,
          },
        }}
      >
      <div style={{ margin: "0 auto", textAlign: "center" }} className="pt-6">
        <h2 className="text-xl mb-4">Новая дата занятия</h2>
        <input
          style={{ marginBottom: "1.5rem" }}
          type="date"
          value={newLessonDate}
          onChange={e => setNewLessonDate(e.target.value)}
          className="border p-2 block mx-auto w-2/5 max-w-md h-16 text-xl"
        />
        <div className="flex justify-center gap-2">
          <button onClick={() => setAddLessonOpen(false)} className="px-4 py-2">Отмена</button>
          <button onClick={createLesson} className="bg-green-600 text-white px-4 py-2 rounded">Добавить</button>
        </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteLessonOpen}
        onRequestClose={() => setDeleteLessonOpen(false)}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          content: {
          position: "relative",
          inset: "unset",
          border: "none",
          background: "#2e2e2e",
          color: "#fff",
          borderRadius: "2rem",
          maxWidth: "600px",
          width: "90%",
          padding: 0,
          },
        }}
      >
      <div style={{ margin: "0 auto", textAlign: "center" }} className="pt-6">
        <h2 className="text-xl mb-4">Удалить занятие</h2>
        <select
          style={{ marginBottom: "1.5rem" }}
          value={delLessonId}
          onChange={e => setDelLessonId(e.target.value)}
          className="border p-2 block mx-auto w-2/5 max-w-md h-16 text-xl"
        >
          <option value="">Выберите дату</option>
          {lessons.map(ls => (
            <option key={ls.id} value={ls.id}>{ls.lesson_date}</option>
          ))}
        </select>
        <div className="flex justify-center gap-2">
          <button onClick={() => setDeleteLessonOpen(false)} className="px-4 py-2">Отмена</button>
          <button onClick={deleteLesson} className="bg-red-600 text-white px-4 py-2 rounded">Удалить</button>
        </div>
        </div>
      </Modal>
    </div>
    </>
  );
};

export default DeanerySubjectDetail;
