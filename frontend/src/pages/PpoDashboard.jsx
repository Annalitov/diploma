import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../utils/auth";

const PpoDashboard = () => {
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      const token = getAuthToken();
      if (!token) {
        alert("Сессия истекла. Пожалуйста, войдите снова.");
        return navigate("/ppo/login");
      }

      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/api/union/members",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMembers(res.data);
      } catch (err) {
        alert(
          "Ошибка при получении данных: " +
            (err.response?.data?.detail || err.message)
        );
        navigate("/ppo/login");
      }
    };

    fetchMembers();
  }, [navigate]);

  return (
    <>
      <button
        onClick={() => navigate("/ppo")}
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
        Назад
      </button>

      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
          {/* Заголовок */}
          <h1 className="text-3xl font-bold mb-8 text-center">
            Профсоюзный учет
          </h1>

          <div className="flex flex-row gap-8">
            <div className="w-1/2">
              <h2 className="text-xl font-semibold mb-4">
                Последние зарегистрированные студенты:
              </h2>
              {members.length === 0 ? (
                <p>Загрузка данных…</p>
              ) : (
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-left">ФИО</th>
                      <th className="border px-4 py-2 text-left">Группа</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.slice(0, 5).map((m, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border px-4 py-2">{m.full_name}</td>
                        <td className="border px-4 py-2">
                          {m.group_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="w-1/2 flex flex-col items-center space-y-4">
              <button
                style={{ marginTop: "3.5rem", marginBottom: "1.5rem" }}
                onClick={() => navigate("/ppo/add-member")}
                className="w-2/5 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                Добавить нового члена профсоюза
              </button>
              <button
                style={{ marginBottom: "1.5rem" }}
                onClick={() => navigate("/ppo/view-members")}
                className="w-2/5 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                Просмотреть членов профсоюза
              </button>
              <button
                style={{ marginBottom: "1.5rem" }}
                onClick={() => navigate("/ppo/payment")}
                className="w-2/5 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                 Занести в базу профвзносы  
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PpoDashboard;
