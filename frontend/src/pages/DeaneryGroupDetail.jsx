import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { getDeaneryToken } from "../utils/attendanceAuth";

Modal.setAppElement("#root");

const DeaneryGroupDetail = () => {
  const { groupId } = useParams();
  const navigate   = useNavigate();
  const token      = getDeaneryToken();

  const [group, setGroup]               = useState(null);
  const [semesters, setSemesters]       = useState([]);

  const [isRenameOpen, setRenameOpen]   = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [isSemOpen, setSemOpen]                   = useState(false);
  const [newSemesterName, setNewSemesterName]     = useState("");

  useEffect(() => {
    if (!token) return navigate("/deanery/login");

    axios
      .get(
        `http://127.0.0.1:8000/api/attendance/groups/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => {
        setGroup(res.data);
        setNewGroupName(res.data.name);
      })
      .catch(() => navigate("/deanery/dashboard"));

    loadSemesters();
  }, [groupId, navigate, token]);

  const loadSemesters = () => {
    axios
      .get(
        `http://127.0.0.1:8000/api/attendance/groups/${groupId}/semesters`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => setSemesters(res.data))
      .catch(() => {});
  };

  const saveGroupName = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/api/attendance/groups/${groupId}`,
        { name: newGroupName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroup(res.data);
      setRenameOpen(false);
    } catch (e) {
      alert("Ошибка обновления: " + (e.response?.data?.detail || e.message));
    }
  };

  const saveSemester = async () => {
    if (!newSemesterName.trim()) return;
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/attendance/groups/${groupId}/semesters`,
        { name: newSemesterName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewSemesterName("");
      setSemOpen(false);
      loadSemesters();
    } catch (e) {
      alert("Ошибка создания семестра: " + (e.response?.data?.detail || e.message));
    }
  };

  if (!group) return <p className="p-6">Загрузка…</p>;

  return (
    <>
      <button
        onClick={() => navigate("/deanery/dashboard")}
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
        Назад к списку групп
      </button>

      <div className="p-6 max-w-3xl mx-auto">
           <div className="flex flex-col items-center mb-6 gap-4">
    <h1 className="text-2xl font-bold text-center">
      Группа {group.name}
    </h1>

    <div className="mb-4">
    <button
      style={{ marginBottom: "2.5rem" }}
      onClick={() => setRenameOpen(true)}
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded mb-4"
    >
      Редактировать группу
    </button>
    </div>

    <div className="mt-6">
    <button
      onClick={() => setSemOpen(true)}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
    >
      Добавить семестр
    </button>
    </div>
  </div>

        <div className="flex flex-col items-center space-y-2">
          {semesters.length > 0 ? (
            semesters.map(s => (
              <Link
                key={s.id}
                to={`/deanery/groups/${groupId}/semesters/${s.id}`}
                className="w-3/5 text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                {s.name}
              </Link>
            ))
          ) : (
            <p className="text-gray-500">Семестров ещё нет.</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isRenameOpen}
        onRequestClose={() => setRenameOpen(false)}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.6)",
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
          <h2 className="text-xl mb-4">Переименовать группу</h2>
          <input
            style={{ marginBottom: "1.5rem" }}
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="border p-2 block mx-auto w-1/5 mb-4"
          />
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setRenameOpen(false)}
              className="px-4 py-2"
            >
              Отмена
            </button>
            <button
              onClick={saveGroupName}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSemOpen}
        onRequestClose={() => setSemOpen(false)}
        style={{
          overlay: {
            backgroundColor: "rgba(0,0,0,0.6)",
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
          <h2 className="text-xl mb-4">Новый семестр</h2>
          <input
            style={{ marginBottom: "1.5rem" }}
            value={newSemesterName}
            onChange={e => setNewSemesterName(e.target.value)}
            placeholder="Название семестра"
            className="border p-2 block mx-auto w-1/5 mb-4"
          />
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setSemOpen(false)}
              className="px-4 py-2"
            >
              Отмена
            </button>
            <button
              onClick={saveSemester}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Добавить
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeaneryGroupDetail;
