import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { getDeaneryToken } from "../utils/attendanceAuth";

Modal.setAppElement("#root");
const API_ROOT = "http://127.0.0.1:8000/api/attendance";

const SemesterDetail = () => {
  const { groupId, semId } = useParams();
  const navigate = useNavigate();
  const token = getDeaneryToken();
  const headers = { Authorization: `Bearer ${token}` };

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [group, setGroup] = useState(null);

  const [isAddOpen, setAddOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isSubjOpen, setSubjOpen] = useState(false);
  const [isCloneOpen, setCloneOpen] = useState(false);

  const [stuForm, setStuForm] = useState({ full_name: "" });
  const [importFile, setImportFile] = useState(null);
  const [delStudentId, setDelStudentId] = useState("");
  const [newSubjName, setNewSubjName] = useState("");
  const [targetSem, setTargetSem] = useState("");

  useEffect(() => {
    if (!token) return navigate("/deanery/login");

    fetchGroup();
    fetchGroupSemesters();
    fetchStudents();
    fetchSubjects();
  }, [semId, token, navigate]);

  const fetchStudents = () => {
    axios
      .get(`${API_ROOT}/semesters/${semId}/students`, { headers })
      .then((res) => setStudents(res.data));
  };

  const fetchSubjects = () => {
    axios
      .get(`${API_ROOT}/semesters/${semId}/subjects`, { headers })
      .then((res) => setSubjects(res.data));
  };

  const fetchGroupSemesters = () => {
    axios
      .get(`${API_ROOT}/groups/${groupId}/semesters`, { headers })
      .then((res) => setSemesters(res.data))
      .catch(console.error);
  };

  const fetchGroup = () => {
    axios
      .get(`${API_ROOT}/groups/${groupId}`, { headers })
      .then((res) => setGroup(res.data))
      .catch(console.error);
  };


  const currentGroupName = group ? group.name : "";
  const currentSem = semesters.find(s => String(s.id) === semId);
  const currentSemName = currentSem ? currentSem.name : "";

  const sortedStudents = [...students].sort((a, b) =>
    a.full_name.split(" ")[0].localeCompare(b.full_name.split(" ")[0], "ru")
  );

  const sortedSubjects = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name, "ru")
  );

  const onAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_ROOT}/semesters/${semId}/students`,
        stuForm,
        { headers }
      );
      setAddOpen(false);
      setStuForm({ full_name: "" });
      fetchStudents();
    } catch (e) {
      alert("Ошибка добавления студента: " + e.message);
    }
  };

  const onImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return alert("Выберите файл");
    const fd = new FormData();
    fd.append("file", importFile);
    try {
      await axios.post(
        `${API_ROOT}/semesters/${semId}/students/import`,
        fd,
        { headers }
      );
      setImportOpen(false);
      setImportFile(null);
      fetchStudents();
    } catch (e) {
      alert("Ошибка импорта: " + e.message);
    }
  };

  const onDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!delStudentId) return;
    try {
      await axios.delete(
        `${API_ROOT}/students/${delStudentId}`,
        { headers }
      );
      setDeleteOpen(false);
      setDelStudentId("");
      fetchStudents();
    } catch (e) {
      alert("Ошибка удаления: " + e.message);
    }
  };

  const onSubjSubmit = async (e) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    try {
      await axios.post(
        `${API_ROOT}/semesters/${semId}/subjects`,
        { name: newSubjName },
        { headers }
      );
      setSubjOpen(false);
      setNewSubjName("");
      fetchSubjects();
    } catch (e) {
      alert("Ошибка добавления предмета: " + e.message);
    }
  };

  const onCloneSubmit = async (e) => {
    e.preventDefault();
    if (!targetSem) return alert("Выберите семестр");
    try {
      await axios.post(
        `${API_ROOT}/semesters/${semId}/students/clone?to_sem=${targetSem}`,
        null,
        { headers }
      );
      setCloneOpen(false);
      setTargetSem("");
      alert("Студенты переведены");
    } catch (e) {
      alert("Ошибка при переводе: " + (e.response?.data?.detail || e.message));
    }
  };


  return (
    <>
    <button
     onClick={() => navigate(`/deanery/groups/${groupId}/`)}
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
      Назад к списку семестров
    </button>
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold">Группа {currentGroupName}</h1>
        <p className="text-xl text-gray-300">{currentSemName}</p>
      </div>
      {/* Кнопки сверху по центру */}
      <div className="flex justify-center space-x-4 my-6">
        <button
          onClick={() => setAddOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Добавить студента
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Импорт из Excel
        </button>
        <button
          onClick={() => setCloneOpen(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
        >
          Перевести студентов
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Удалить студента
        </button>
      </div>

      {/* Общий контейнер с двумя колонками */}
      <div className="p-6 max-w-4xl mx-auto grid grid-cols-4 gap-8">
        {/* Левая колонка: студенты */}
        <div className="col-start-2 text-left">
          <h2 className="text-2xl font-semibold mb-4 text-center">Студенты</h2>
          <ol className="list-decimal list-inside space-y-2 max-h-[60vh] overflow-auto">
            {sortedStudents.map((s) => (
              <li key={s.id} className="border-b py-2">
                {s.full_name}
              </li>
            ))}
            {!sortedStudents.length && (
              <p className="text-gray-500">Нет студентов</p>
            )}
          </ol>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Предметы</h2>
          <button
            onClick={() => setSubjOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-center text-white px-4 py-2 rounded mb-4"
          >
            Добавить предмет
          </button>
          <div className="flex flex-col space-y-2 text-center">
            {sortedSubjects.map((subj) => (
              <Link
                key={subj.id}
                to={`/deanery/groups/${groupId}/semesters/${semId}/subjects/${subj.id}`}
                className="underline"
              >
                {subj.name}
              </Link>
            ))}
            {!sortedSubjects.length && (
              <p className="text-gray-500">Нет предметов</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddOpen}
        onRequestClose={() => setAddOpen(false)}
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
        <h2 className="text-xl mb-4">Новый студент</h2>
        <form onSubmit={onAddSubmit} className="space-y-3">
          <input
            style={{ marginBottom: "1.5rem" }}
            required
            placeholder="ФИО"
            value={stuForm.full_name}
            onChange={e => setStuForm({ ...stuForm, full_name: e.target.value })}
            className="border p-2 block mx-auto w-3/5 max-w-md h-16 text-xl"
          />
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2">
              Отмена
            </button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Добавить
            </button>
          </div>
        </form>
        </div>
      </Modal>

      <Modal
        isOpen={isImportOpen}
        onRequestClose={() => setImportOpen(false)}
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
        <h2 className="text-xl mb-4">Импорт из Excel</h2>
        <form onSubmit={onImportSubmit} encType="multipart/form-data" className="space-y-3">
          <div className="flex justify-center items-center space-x-4">
              <label 
              style={{ marginBottom: "1.5rem" }}
              className="
              bg-gray-800 hover:bg-gray-700
              text-white text-lg
              px-6 py-3
              rounded cursor-pointer
            ">
              Выбрать файл
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={e => setImportFile(e.target.files[0])}
                className="hidden"
              />
            </label>
    {importFile && (
      <span className="text-lg text-gray-200">{importFile.name}</span>
    )}
  </div>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => setImportOpen(false)} className="px-4 py-2">
              Отмена
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
              Загрузить
            </button>
          </div>
        </form>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        onRequestClose={() => setDeleteOpen(false)}
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
        <div className="pt-6 text-center mx-auto">
          <h2 className="text-xl mb-4">Удалить студента</h2>
          <form onSubmit={onDeleteSubmit} className="space-y-3 px-6">
            <select
              style={{ marginBottom: "1.5rem" }}
              required
              value={delStudentId}
              onChange={(e) => setDelStudentId(e.target.value)}
              className="border p-2 block mx-auto w-3/5 max-w-md h-16 text-xl"
            >
              <option value="">Выберите студента</option>
              {sortedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Удалить
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isSubjOpen}
        onRequestClose={() => setSubjOpen(false)}
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
        <h2 className="text-xl mb-4">Новый предмет</h2>
        <form onSubmit={onSubjSubmit} className="space-y-3">
          <input
            style={{ marginBottom: "1.5rem" }}
            required
            placeholder="Название предмета"
            value={newSubjName}
            onChange={e => setNewSubjName(e.target.value)}
            className="border p-2 block mx-auto w-3/5 max-w-md h-16 text-xl"
          />
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => setSubjOpen(false)} className="px-4 py-2">
              Отмена
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Добавить
            </button>
          </div>
        </form>
        </div>
      </Modal>

      <Modal
        isOpen={isCloneOpen}
        onRequestClose={() => setCloneOpen(false)}
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
        <div className="bg-white p-6 rounded max-w-sm w-full">
          <h2 className="text-center text-xl mb-4">Перевести студентов</h2>
          <form onSubmit={onCloneSubmit}>
            <select
              style={{ marginBottom: "1.5rem" }}
              value={targetSem}
              onChange={e => setTargetSem(e.target.value)}
              className="border p-2 block mx-auto w-1/2 max-w-md h-16 text-xl text-center [text-align-last:center] "
            >
              <option className="text-center [text-align-last:center] " value="">-- Выберите семестр --</option>
              {semesters
                .filter(s => String(s.id) !== semId)
                .map(s => (
                  <option key={s.id} value={s.id} className="text-center [text-align-last:center] ">
                    {s.name}
                  </option>
                ))}
            </select>
            <div className="flex justify-center gap-2">
              <button type="button" onClick={() => setCloneOpen(false)} className="px-4 py-2">
                Отмена
              </button>
              <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
                Перевести
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default SemesterDetail;
