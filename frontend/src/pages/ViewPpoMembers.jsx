import { useEffect, useState, useMemo } from "react";
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
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const convertToISO = (dateStr) => {
  const parts = dateStr.split(".");
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

function parseGroup(grp) {
  const parts = grp.split("-");
  const core = parts[1] || "";
  const [, numStr = "0", prefix = ""] = core.match(/^(\d+)(.*)$/) || [];
  const suffix = parseInt(parts[2], 10) || 0;
  return {
    num:    parseInt(numStr, 10),
    prefix, 
    suffix
  };
}

export default function ViewPpoMembers() {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [yearFilter, setYearFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [editingMember, setEditingMember] = useState(null);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  const fetchMembers = async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(
        "http://127.0.0.1:8000/api/union/members",
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
    if (statusFilter) {
      result = result.filter((m) => m.status === statusFilter);
    }
    if (dateFilter) {
      const now = new Date();
      result = result.filter((m) => {
        const createdAt = new Date(m.created_at);
        if (dateFilter === "day")
          return createdAt.toDateString() === now.toDateString();
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
  setFiltered(result);
  }, [members, yearFilter, groupFilter, searchTerm, dateFilter, statusFilter]);

  const sortedMembers = useMemo(() => {
      return [...filtered].sort((a, b) => {
        const nameCmp = a.full_name.localeCompare(b.full_name, "ru", { sensitivity: "base" });
        if (nameCmp !== 0) return nameCmp;
  
        const A = parseGroup(a.group_name);
        const B = parseGroup(b.group_name);
        if (A.num !== B.num) return A.num - B.num;
        const prefCmp = A.prefix.localeCompare(B.prefix, "ru", { sensitivity: "base" });
        if (prefCmp !== 0) return prefCmp;
        if (A.suffix !== B.suffix) return A.suffix - B.suffix;
  
        return b.year - a.year;
      });
    }, [filtered]);



  const exportToExcel = () => {
    const exportData = filtered.map((m) => ({
      "ППО": m.ppo_name,
      "Группа": m.group_name,
      "Год": m.year,
      "ФИО": m.full_name,
      "Дата рожд.": formatBirthDate(m.birth_date),
      "Пол": m.gender,
      "Телефон": m.phone,
      "e-mail": m.email,
      "Тип": m.funding_type,
      "Статус": m.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    XLSX.writeFile(workbook, `vstuplenie_${day}-${month}-${year}.xlsx`);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportError("");
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      const payload = json.map((row) => ({
        full_name: row["ФИО"]?.toString().trim() || "",
        group_input: row["Группа"]?.toString().trim() || "",
        birth_date: convertToISO(row["Дата рожд."] || ""),
        gender: row["Пол"] || "",
        phone: row["Телефон"] || "",
        email: row["e-mail"] || "",
        funding_type: row["Тип"] || "",
        year: Number(row["Год"]) || null,
        status: row["Статус"] || "состоит",
      }));
      const token = getAuthToken();
      await axios.post(
        "http://127.0.0.1:8000/api/union/members/batch_create",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Импорт завершён");
      fetchMembers();
    } catch (err) {
      console.error(err);
      setImportError("Ошибка при импорте: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const openEditModal = (m) => {
    setEditingMember(m);
    setEditData({
      group_input: m.group_name,
      year: m.year,
      full_name: m.full_name,
      birth_date: formatBirthDateLong(m.birth_date),
      gender: m.gender,
      phone: m.phone,
      email: m.email,
      funding_type: m.funding_type,
      status: m.status,
    });
  };
  const closeEditModal = () => setEditingMember(null);
  const handleEditChange = (e) =>
    setEditData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const upd = {
        ...editData,
        birth_date: convertToISO(editData.birth_date),
      };
      await axios.put(
        `http://127.0.0.1:8000/api/union/members/${editingMember.id}`,
        upd,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMembers();
      closeEditModal();
    } catch (err) {
      alert("Ошибка обновления: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleNextYear = async () => {
    if (!window.confirm("Перевести всех на следующий курс?")) return;
    try {
      const token = getAuthToken();
      const res = await axios.post(
        "http://127.0.0.1:8000/api/union/members/next-year",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${res.data.count} человек переведено`);
      fetchMembers();
    } catch (err) {
      alert("Ошибка: " + (err.response?.data?.detail || err.message));
    }
  };

  const handlePreviousYear = async () => {
    if (!window.confirm("Вернуть всех на предыдущий курс?")) return;
    try {
      const token = getAuthToken();
      const res = await axios.post(
        "http://127.0.0.1:8000/api/union/members/previous-year",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${res.data.count} человек откатилось`);
      fetchMembers();
    } catch (err) {
      alert("Ошибка: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <>
      <button
        onClick={() => navigate("/ppo/dashboard")}
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
      >
        Назад
      </button>
      <div className="min-h-screen bg-black p-6 text-white">
        <div className="max-w-7xl mx-auto p-8 rounded-xl shadow bg-black">
          <h1 className="text-4xl font-bold text-center mb-6">
            Члены профсоюза
          </h1>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl text-xl"
            >
              Экспорт в Excel
            </button>
            <button
              onClick={() => document.getElementById("fileInput").click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xl"
              disabled={importing}
            >
              {importing ? "Импорт…" : "Импорт из Excel"}
            </button>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              onClick={handleNextYear}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-2xl text-xl"
            >
              На следующий курс
            </button>
            <button
              onClick={handlePreviousYear}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl text-xl"
            >
              Вернуть на курс назад
            </button>
          </div>

          {importError && (
            <p className="text-red-500 text-center mb-4">{importError}</p>
          )}

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <input
              type="text"
              placeholder="ФИО, email или ID"
              className="flex-1 min-w-[200px] border-2 border-gray-700 p-3 rounded-2xl bg-black text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input
              type="text"
              placeholder="Группа"
              className="flex-1 min-w-[200px] border-2 border-gray-700 p-3 rounded-2xl bg-black text-white"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            />
            <input
              type="text"
              placeholder="Год"
              className="flex-1 min-w-[200px] border-2 border-gray-700 p-3 rounded-2xl bg-black text-white"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 min-w-[150px] border p-3 rounded-2xl bg-black text-white"
            >
              <option value="">Статус</option>
              <option value="состоит">состоит</option>
              <option value="вышел">вышел</option>
              <option value="академ">академ</option>
              <option value="отчислен">отчислен</option>
              <option value="выпущен">выпущен</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 min-w-[150px] border p-3 rounded-2xl bg-black text-white"
            >
              <option value="">Все даты</option>
              <option value="day">За день</option>
              <option value="week">За неделю</option>
              <option value="month">За месяц</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-gray-700">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-800 text-white">
                <tr className="text-center text-xl">
                  {[
                    "ППО",
                    "Группа",
                    "Год",
                    "ФИО",
                    "Дата рожд.",
                    "Пол",
                    "Телефон",
                    "e-mail",
                    "Тип",
                    "Статус",
                    "Действие",
                  ].map((h, i) => (
                    <th key={i} className="p-4 border border-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.length > 0 ? (
                  filtered.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="p-4 border border-gray-700 text-center">
                        {m.ppo_name}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        {m.group_name}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        {m.year}
                      </td>
                      <td className="p-4 border border-gray-700 text-center font-semibold">
                        {m.full_name}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        {formatBirthDate(m.birth_date)}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        {m.gender}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        {m.phone || "-"}
                      </td>
                      <td className="p-4 border border-gray-700 text-center text-blue-400">
                        {m.email || "-"}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        {m.funding_type}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        {m.status}
                      </td>
                      <td className="p-4 border border-gray-700 text-center">
                        <button
                          onClick={() => openEditModal(m)}
                          className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="text-center p-6 text-gray-400"
                    >
                      Нет данных
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal редактирования */}
      <Modal
        isOpen={!!editingMember}
        onRequestClose={closeEditModal}
        contentLabel="Редактирование"
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
}
