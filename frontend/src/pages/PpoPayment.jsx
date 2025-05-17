import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";

Modal.setAppElement("#root");

const PpoPayment = () => {
  const [members, setMembers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [newPeriodName, setNewPeriodName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("0");

  const token = getAuthToken();
  const navigate = useNavigate();

  const fetchPeriods = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/union/payments/periods",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPeriods(res.data);
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
        `http://127.0.0.1:8000/api/union/payments?period=${encodeURIComponent(period)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(res.data);
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
      const format_id = 1;
      const res = await axios.post(
        "http://127.0.0.1:8000/api/union/payments/periods",
        { format_id, period_name: newPeriodName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Период создан. Добавлено для ${res.data.added_for} участников`);
      setNewPeriodName("");
      await fetchPeriods();
    } catch (err) {
      alert("Ошибка создания: " + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    fetchPayments(selectedPeriod);
  }, [selectedPeriod]);

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    m.group_name.toLowerCase().includes(groupFilter.toLowerCase())
  );

  const sortedMembers = useMemo(() => {
    const result = [...filtered];
    result.sort((a, b) =>
      a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase())
    );
    result.sort((a, b) => {
      const groupA = a.group_name.toLowerCase();
      const groupB = b.group_name.toLowerCase();
      if (groupA < groupB) return -1;
      if (groupA > groupB) return 1;
      return 0;
    });
    return result;
  }, [filtered]);

  const openEditModal = (m) => {
    setEditingMember(m);
    setPaymentStatus(m.paid ?? "0");
  };
  const closeEditModal = () => {
    setEditingMember(null);
    setPaymentStatus("0");
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://127.0.0.1:8000/api/union/payments/update",
        {
          member_id: editingMember.id,
          period_name: selectedPeriod,
          paid: paymentStatus,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPayments(selectedPeriod);
      closeEditModal();
    } catch (err) {
      alert("Ошибка обновления: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <>
      <button
        onClick={() => navigate("/ppo/dashboard")}
        style={{
          position: "fixed",
          top: 20, left: 20,
          backgroundColor: "#1a1a1a", color: "#fff",
          padding: "10px 20px", border: "none",
          borderRadius: 8, cursor: "pointer", zIndex: 1000,
        }}
      >
        Назад
      </button>

      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto p-6 rounded-xl shadow bg-black">
          <h1 className="text-3xl font-bold mb-6 text-center">Учёт профвзносов</h1>

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
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full table-auto border-collapse text-white">
              <thead className="bg-gray-800">
                <tr className="text-center text-lg">
                  {["ФИО", "Группа", "Статус", "Действие"].map((h, i) => (
                    <th key={i} className="p-4 border border-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMembers.length > 0 ? sortedMembers.map(m => (
                  <tr key={m.id} className="hover:bg-gray-800 transition-colors">
                    <td className="p-4 border border-gray-700 text-center">{m.full_name}</td>
                    <td className="p-4 border border-gray-700 text-center">{m.group_name}</td>
                    <td className="p-4 border border-gray-700 text-center">{m.paid}</td>
                    <td className="p-4 border border-gray-700 text-center">
                      <button
                        onClick={() => openEditModal(m)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">Нет данных</td>
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
        contentLabel="Внесение данных об оплате"
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
        <div className="pt-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Редактировать {selectedPeriod}</h2>
          <form onSubmit={submitEdit} className="px-6 pb-6 space-y-4">
            <label className="block mb-2 font-semibold text-left">Статус</label>
            <select
              value={paymentStatus}
              onChange={e => setPaymentStatus(e.target.value)}
              className="w-full p-3 border rounded bg-black text-white"
            >
              <option value="-">- (не установлен)</option>
              <option value="1">1 (оплатил)</option>
              <option value="0">0 (не оплатил)</option>
            </select>
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
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

export default PpoPayment;