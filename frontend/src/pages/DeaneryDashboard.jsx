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
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
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
          backgroundColor:"rgba(f,f,f,f)",
          overlay: {
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:2000
          },
          content:{
            inset:"unset", border:"none", borderRadius:"1rem",
            padding:0, background:"#f6f6f6", color:"#2e2e2e", maxWidth:"400px", width:"90%"
          }
        }}
      >
        <div className="pt-6 text-center mx-auto">
          <h2 className="text-xl mb-6">Новая учебная группа</h2>
          <input
            style={{ marginBottom: "1.5rem" }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название группы"
            className="border p-2 block mx-auto w-3/5 mb-6"
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
