import { useEffect, useState } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Modal from "react-modal";

Modal.setAppElement("#root");

const formatBirthDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
};

const formatBirthDateLong = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear(); // полный год
  return `${day}.${month}.${year}`;
};

const convertToISO = (dateStr) => {
  const parts = dateStr.split(".");
  if (parts.length !== 3) return dateStr; // если формат не соответствует, вернуть как есть
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const ViewPpoMembers = () => {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [yearFilter, setYearFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [editingMember, setEditingMember] = useState(null);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  const fetchMembers = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get("http://127.0.0.1:8000/api/union/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data);
      setFiltered(res.data);
    } catch (err) {
      alert("Ошибка загрузки: " + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

useEffect(() => {
  let result = [...members];

  if (yearFilter) {
    result = result.filter((m) => m.year.toString() === yearFilter);
  }
  if (groupFilter) {
    result = result.filter((m) => m.group_name.includes(groupFilter));
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter(
      (m) =>
        m.full_name.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        m.id.toString() === term
    );
  }
  if (dateFilter) {
    const now = new Date();
    result = result.filter((m) => {
      const createdAt = new Date(m.created_at);
      if (dateFilter === "day") return createdAt.toDateString() === now.toDateString();
      if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return createdAt >= weekAgo;
      }
      if (dateFilter === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return createdAt >= monthAgo;
      }
      return true;
    });
  }

  result.sort((a, b) =>
    a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase())
  );

  result.sort((a, b) => {
    const groupA = a.group_name.toLowerCase();
    const groupB = b.group_name.toLowerCase();
    if (groupA < groupB) return -1;
    if (groupA > groupB) return 1;
    return b.year - a.year; // по убыванию
  });

  setFiltered(result);
}, [yearFilter, groupFilter, searchTerm, dateFilter, members]);


  const exportToExcel = () => {
    const exportData = filtered.map((m) => ({
      "Подразделение ППО": m.ppo_name,
      "Группа (полностью)": m.group_name,
      "Год поступления": m.year,
      "ФИО члена профсоюза (полностью)": m.full_name,
      "Дата Рождения (чч.мм.гг)": formatBirthDate(m.birth_date),
      "Пол (м/ж)": m.gender,
      "Моб. Тел.": m.phone,
      "e-mail": m.email,
      "Бюджет/платное": m.funding_type,
      "Статус": m.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    const filename = `vstuplenie_8_inst_${formattedDate}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditData({
      group_input: member.group_name,
      year: member.year,
      full_name: member.full_name,
      birth_date: formatBirthDateLong(member.birth_date),
      gender: member.gender,
      phone: member.phone,
      email: member.email,
      funding_type: member.funding_type,
      status: member.status,
    });
  };

  const closeEditModal = () => {
    setEditingMember(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };


const submitEdit = async (e) => {
  e.preventDefault();
  try {
    const token = getAuthToken();
    const updatedData = {
      ...editData,
      birth_date: convertToISO(editData.birth_date),
    };
    await axios.put(
      `http://127.0.0.1:8000/api/union/members/${editingMember.id}`,
      updatedData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchMembers();
    closeEditModal();
  } catch (err) {
    alert("Ошибка обновления: " + (err.response?.data?.detail || err.message));
  }
};


const handleNextYear = async () => {
  const token = getAuthToken();
  if (!window.confirm("⏭️ Перевести всех на следующий курс?")) return;

  try {
    const res = await axios.post("http://127.0.0.1:8000/api/union/members/next-year", {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert(`${res.data.count} человек переведено на следующий курс!`);
    fetchMembers();
  } catch (err) {
    alert("Ошибка при переходе: " + (err.response?.data?.detail || err.message));
  }
};


const handlePreviousYear = async () => {
  const token = getAuthToken();
  if (!window.confirm("↩️ Откатить всех на курс назад?")) return;

  try {
    const res = await axios.post("http://127.0.0.1:8000/api/union/members/previous-year", {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert(`${res.data.count} человек откатилось на предыдущий курс.`);
    fetchMembers(); // перезагрузка
  } catch (err) {
    alert("Ошибка при откате: " + (err.response?.data?.detail || err.message));
  }
};



  return (
    <>
      <button
        onClick={() => navigate("/ppo/dashboard")}
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

      <div className="min-h-screen bg-black p-6 text-white">
        <div className="max-w-7xl mx-auto p-8 rounded-xl shadow bg-black">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold">Просмотр членов профсоюза</h1>
          </div>

          <div className="mt-8 flex justify-center gap-4">
              <button
                  style={{ marginBottom: "1.5rem" }}
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl text-xl"
              >
                Выгрузить в Excel
              </button>
              <button
                  style={{ marginBottom: "1.5rem" }}
                  onClick={handleNextYear}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-2xl text-xl"
              >
                Перевести на следующий курс
              </button>

              <button
                  style={{ marginBottom: "1.5rem" }}
                  onClick={handlePreviousYear}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl text-xl"
              >
                  Вернуть на курс назад
              </button>
          </div>


          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap justify-center gap-4">
              <input
                type="text"
                placeholder="ФИО, email или ID"
                className="flex-1 min-w-[200px] border-2 border-gray-700 p-5 rounded-2xl text-xl bg-black text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <input
                type="text"
                placeholder="Группа (например: М8О-101БВ-24)"
                className="flex-1 min-w-[200px] border-2 border-gray-700 p-5 rounded-2xl text-xl bg-black text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
              />
              <input
                type="text"
                placeholder="Год поступления (например: 2023)"
                className="flex-1 min-w-[200px] border-2 border-gray-700 p-5 rounded-2xl text-xl bg-black text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
              />
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="flex-1 min-w-[200px] border-2 border-gray-700 p-5 rounded-2xl text-xl bg-black text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
              >
                <option value="">Все даты</option>
                <option value="day">За день</option>
                <option value="week">За неделю</option>
                <option value="month">За месяц</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-gray-700">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-800 text-white">
                <tr className="text-center text-xl">
                  {[
                    "Подразделение ППО",
                    "Группа (полностью)",
                    "Год поступления",
                    "ФИО члена профсоюза (полностью)",
                    "Дата Рождения (чч.мм.гг)",
                    "Пол (м/ж)",
                    "Моб. Тел.",
                    "e-mail",
                    "Бюджет/платное",
                    "Статус",
                    "Действие",
                  ].map((header, idx) => (
                    <th key={idx} className="p-4 font-bold border border-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-700">
              {filtered.length > 0 ? (
                filtered.map(member => (
                  <tr key={member.id} className="hover:bg-gray-800 transition-colors">
                    <td className="p-4 border border-gray-700 text-center">{member.ppo_name}</td>
                    <td className="p-4 border border-gray-700 text-center">{member.group_name}</td>
                    <td className="p-4 border border-gray-700 text-center">{member.year}</td>
                    <td className="p-4 border border-gray-700 text-center font-semibold">{member.full_name}</td>
                    <td className="p-4 border border-gray-700 text-center">{formatBirthDate(member.birth_date)}</td>
                    <td className="p-4 border border-gray-700 text-center">{member.gender}</td>
                    <td className="px-2 py-4 border border-gray-700 text-center">{member.phone || "-"}</td>
                    <td className="px-2 py-4 border border-gray-700 text-center text-blue-400">{member.email || "-"}</td>
                    <td className="p-4 border border-gray-700 text-center">{member.funding_type}</td>
                    <td className="px-2 py-4 border border-gray-700 text-center">{member.status}</td>
                    <td className="p-4 border border-gray-700 text-center">
                      <button
                        onClick={() => openEditModal(member)}
                        className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded text-lg"
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center p-6 text-gray-400">
                    Нет данных
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

     <Modal
      isOpen={!!editingMember}
      onRequestClose={closeEditModal}
      contentLabel="Редактирование члена профсоюза"
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
          background: "#2e2e2e", // фон модального окна (слегка светлее фона сайта)
          color: "#fff",
          borderRadius: "1rem",
          maxWidth: "600px",
          width: "90%",
          padding: 0,
        },
      }}
    >
      <div style={{ margin: "0 auto", textAlign: "center" }} className="pt-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Редактирование</h2>
        <form onSubmit={submitEdit} className="space-y-5">
          <div className="ml-28">
            <div>
              <label className="block mb-1 font-semibold">Группа (полностью)</label>
              <input
                type="text"
                name="group_input"
                value={editData.group_input || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Год поступления</label>
              <input
                type="text"
                name="year"
                value={editData.year || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">ФИО (полностью)</label>
              <input
                type="text"
                name="full_name"
                value={editData.full_name || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Дата Рождения (чч.мм.гг)</label>
              <input
                type="text"
                name="birth_date"
                value={editData.birth_date || ""}
                onChange={handleEditChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Пол (м/ж)</label>
              <select
                name="gender"
                value={editData.gender || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Выберите пол</option>
                <option value="м">М</option>
                <option value="ж">Ж</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Моб. Тел.</label>
              <input
                type="text"
                name="phone"
                value={editData.phone || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">e-mail</label>
              <input
                type="email"
                name="email"
                value={editData.email || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Бюджет/платное</label>
              <select
                name="funding_type"
                value={editData.funding_type || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Выберите тип</option>
                <option value="Бюджет">Бюджет</option>
                <option value="Платное">Платное</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Статус</label>
              <select
                name="status"
                value={editData.status || ""}
                onChange={handleEditChange}
                className="block w-3/4 max-w-md border border-gray-600 rounded-md p-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Выберите статус</option>
                <option value="состоит">состоит</option>
                <option value="вышел">вышел</option>
                <option value="отчислен">отчислен</option>
                <option value="академ">академ</option>
                <option value="выпущен">выпущен</option>
              </select>
            </div>
          </div>
          <div className="flex justify-center space-x-4 pt-6">
            <button
              type="button"
              onClick={closeEditModal}
              className="bg-gray-400 hover:bg-gray-500 text-black px-4 py-2 rounded transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </Modal>


    </>
  );
};

export default ViewPpoMembers;
