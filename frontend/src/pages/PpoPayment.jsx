import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import * as XLSX from "xlsx";
import Modal from "react-modal";

Modal.setAppElement("#root");
const API_ROOT = "http://127.0.0.1:8000/api/union";

const PpoPayment = () => {
  const [members, setMembers]         = useState([]);
  const [periods, setPeriods]         = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [newPeriodName, setNewPeriodName]   = useState("");
  const [searchTerm, setSearchTerm]         = useState("");
  const [groupFilter, setGroupFilter]       = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGroup, setStudentGroup] = useState("");



  const token = getAuthToken();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const fetchPeriods = async () => {
    try {
      const res = await axios.get(`${API_ROOT}/payments/periods`, { headers });
      setPeriods(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("Ошибка загрузки периодов: " + (err.response?.data?.detail || err.message));
    }
  };

  const fetchPayments = async (period) => {
    if (!period) {
      setMembers([]);
      return;
    }
    try {
      const res = await axios.get(
        `${API_ROOT}/payments?period=${encodeURIComponent(period)}`,
        { headers }
      );
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("Ошибка загрузки платежей: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriodName.trim()) {
      alert("Введите название периода");
      return;
    }
    try {
      const res = await axios.post(
        `${API_ROOT}/payments/periods`,
        { format_id: 1, period_name: newPeriodName.trim() },
        { headers }
      );
      alert(`Период создан. Добавлено для ${res.data.added_for} участников.`);
      setNewPeriodName("");
      fetchPeriods();
    } catch (err) {
      alert("Ошибка создания: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleStatusChange = async (memberId, newStatus) => {
    try {
      await axios.put(
        `${API_ROOT}/payments/update`,
        {
          member_id:   memberId,
          period_name: selectedPeriod,
          paid:        newStatus,
        },
        { headers }
      );
      setMembers(ms => ms.map(m => 
        m.id === memberId
          ? { ...m, paid: newStatus }
          : m
      ));
    } catch (err) {
      alert("Ошибка обновления: " + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => { fetchPeriods(); }, []);
  useEffect(() => { fetchPayments(selectedPeriod); }, [selectedPeriod]);

  const filtered = members
    .filter(m =>
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      m.group_name.toLowerCase().includes(groupFilter.toLowerCase())
    );
  const sortedMembers = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a,b)=> a.full_name.localeCompare(b.full_name, "ru"));
    arr.sort((a,b)=> a.group_name.localeCompare(b.group_name, "ru"));
    return arr;
  }, [filtered]);

  const loadStudentOptions = async (input) => {
    if (!input) return [];
    const res = await axios.get(
      `${API_ROOT}/members?search=${encodeURIComponent(input)}`,
      { headers }
    );

    return res.data.map(m => ({ value: m.id, label: m.full_name, group: m.group_name }));
  };

  const onStudentChange = opt => {
    setSelectedStudent(opt);
    setStudentGroup(opt?.group || "");
  };

  const handleExport = async () => {
    if (!selectedStudent) {
      alert("Выберите студента");
      return;
    }

    const res = await axios.get(
      `${API_ROOT}/payments?member_id=${selectedStudent.value}`,
      { headers }
    );
    const payMap = res.data.reduce((acc, p) => {
      acc[p.period_name] = p.paid;
      return acc;
    }, {});

    const row = {
      "ФИО": selectedStudent.label,
      "Группа": studentGroup,
    };
    periods.forEach(period => {
      row[period] = payMap[period] ?? "-";
    });
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `профвзносы_${selectedStudent.label}.xlsx`);
    setExportModalOpen(false);
  };


  return (
    <>
      <button
        onClick={() => navigate("/ppo/dashboard")}
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
      >
        Назад
      </button>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto p-6 rounded-xl shadow bg-black">

          <h1 className="text-3xl font-bold mb-6 text-center">
            Учёт профвзносов
          </h1>

          {/* фильтры + создание периода */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Поиск по ФИО"
              className="flex-1 min-w-[150px] border p-3 rounded bg-black text-white"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <input
              type="text"
              placeholder="Группа"
              className="flex-1 min-w-[150px] border p-3 rounded bg-black text-white"
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
            />
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="flex-1 min-w-[150px] border p-3 rounded bg-black text-white"
            >
              <option value="">Выберите период</option>
              {periods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="text"
              placeholder="Новый период"
              className="flex-1 min-w-[150px] border p-3 rounded bg-black text-white"
              value={newPeriodName}
              onChange={e => setNewPeriodName(e.target.value)}
            />
            <button
              onClick={handleCreatePeriod}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Добавить
            </button>

            <button
              onClick={() => setExportModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Экспорт платежей студента в Excel
            </button>
          </div>

          {/* таблица */}
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full table-auto border-collapse text-white">
              <thead className="bg-gray-800">
                <tr className="text-center text-lg">
                  {["ФИО", "Группа", "Статус"].map((h,i) => (
                    <th key={i} className="p-4 border border-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMembers.length > 0 ? sortedMembers.map(m => (
                  <tr key={m.id} className="hover:bg-gray-800 transition-colors">
                    <td className="p-4 border border-gray-700 text-center">
                      {m.full_name}
                    </td>
                    <td className="p-4 border border-gray-700 text-center">
                      {m.group_name}
                    </td>
                    <td className="p-4 border border-gray-700 text-center">
                      <select
                        value={m.paid ?? "-"}
                        onChange={e => handleStatusChange(m.id, e.target.value)}
                        className="border border-gray-600 rounded px-2 py-1 bg-black text-white"
                      >
                        <option value="-">-</option>
                        <option value="1">1 </option>
                        <option value="0">0 </option>
                      </select>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-400">
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
        isOpen={exportModalOpen}
        onRequestClose={() => setExportModalOpen(false)}
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
        <h2 className="text-xl mb-4">Выберите студента</h2>
        <AsyncSelect
          cacheOptions
          loadOptions={loadStudentOptions}
          onChange={onStudentChange}
          placeholder="Начните вводить ФИО..."
        />
        {studentGroup && (
          <p className="mt-2 text-gray-600">Группа: <b>{studentGroup}</b></p>
        )}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-2 rounded border"
          >Отмена</button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >Скачать XLSX</button>
        </div>
      </Modal>

    </>
  );
};

export default PpoPayment;
