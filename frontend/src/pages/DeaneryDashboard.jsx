import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { getDeaneryToken } from "../utils/attendanceAuth";

Modal.setAppElement("#root");

const DeaneryDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();

  const token = getDeaneryToken();
  const unitId = token
    ? JSON.parse(atob(token.split(".")[1])).unit_id
    : null;

  useEffect(() => {
    if (!token) return navigate("/deanery/login");
    axios
      .get("http://127.0.0.1:8000/api/attendance/groups", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setGroups(res.data))
      .catch(() => navigate("/deanery/login"));
  }, [navigate, token]);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setNewName("");
    setIsOpen(false);
  };

  const createGroup = async () => {
    if (!newName.trim()) {
      alert("Введите название группы");
      return;
    }
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/attendance/groups",
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // обновляем список
      const res = await axios.get(
        "http://127.0.0.1:8000/api/attendance/groups",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroups(res.data);
      closeModal();
    } catch (e) {
      alert("Ошибка: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <>
      <button
        onClick={() => navigate("/deanery")}
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
        Назад к авторизации
      </button>

      <div className="p-6 flex flex-col items-center">
        {/* Заголовок */}
        <h1 className="w-full text-center text-3xl font-bold mb-6">
          Академический учет
        </h1>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={openModal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Создать учебную группу
          </button>
          <button
            onClick={() => navigate("/deanery/statistics")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Аналитика
          </button>
        </div>

        <div className="flex flex-col items-center space-y-2">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/deanery/groups/${g.id}`}
              className="text-blue-600 hover:underline"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onRequestClose={closeModal}
        contentLabel="Новая учебная группа"
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
          <h2 className="text-xl mb-6">Новая учебная группа</h2>
          <input
            style={{ marginBottom: "1.5rem" }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название группы"
            className="border p-2 block mx-auto w-1/5 mb-6"
          />
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-700 rounded"
            >
              Отмена
            </button>
            <button
              onClick={createGroup}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeaneryDashboard;
