import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList
} from "recharts";
import axios from "axios";
import Modal from "react-modal";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { getDeaneryToken } from "../utils/attendanceAuth";

const API_BASE = "http://127.0.0.1:8000/api/attendance";
const ANALYTICS = API_BASE + "/analytics";

export default function DeaneryStatistics() {
  const navigate = useNavigate();
  const token    = getDeaneryToken();
  const headers  = { Authorization: `Bearer ${token}` };

  const [groups,     setGroups]     = useState([]);
  const [semesters,  setSemesters]  = useState([]);
  const [subjects,   setSubjects]   = useState([]);

  const [course,     setCourse]     = useState("");
  const [groupIds,   setGroupIds]   = useState([]);
  const [semId,      setSemId]      = useState("");
  const [subjectId,  setSubjectId]  = useState("");
  const [gradeField, setGradeField] = useState("exam");
  const [mode,       setMode]       = useState("dist");

  const [data,        setData]        = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const [isDebtorsOpen, setDebtorsOpen] = useState(false);
  const [debSubject, setDebSubject]       = useState("");
  const [debForm,    setDebForm]          = useState("exam");

  const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658",
    "#ff8042", "#8dd1e1", "#a4de6c",
    "#d0ed57", "#888888", "#d88484",
    "#84d8d8"
  ];

  useEffect(() => {
    axios.get(`${API_BASE}/groups`, { headers })
      .then(r => setGroups(r.data))
      .catch(console.error);
  }, []);

 useEffect(() => {
  if (course) {
    const matched = groups
      .filter(g => {
        const raw = g.name
          .replace(/[–—]/g, "-")
          .trim();
        const parts = raw.split("-");
        if (parts.length < 2) return false;
        const segment = parts[1].trim();
        return segment.charAt(0) === String(course);
      })
      .map(g => g.id);
    setGroupIds(matched);
  } else {
    setGroupIds([]);
  }
  setSemesters([]);
  setSemId("");
  setSubjects([]);
  setSubjectId("");
}, [course, groups]);

  useEffect(() => {
    if (!groupIds.length) {
      setSemesters([]);
      setSemId("");
      setSubjects([]);
      setSubjectId("");
      return;
    }
    axios.get(`${API_BASE}/groups/${groupIds[0]}/semesters`, { headers })
      .then(r => setSemesters(r.data))
      .catch(console.error);
    setSemId("");
    setSubjects([]);
    setSubjectId("");
  }, [groupIds]);

  useEffect(() => {
    if (!semId) {
      setSubjects([]);
      setSubjectId("");
      return;
    }
    axios.get(`${API_BASE}/semesters/${semId}/subjects`, { headers })
      .then(r => setSubjects(r.data))
      .catch(console.error);
    setSubjectId("");
  }, [semId]);

  const formatTick = value => {
    if (value === "Нд") return "Не сдали (Н/д)";
    if (value === "Ня") return "Не сдали (Н/я)";
    if ((gradeField==="exam"||gradeField==="retake"||gradeField==="commission") && value==="2")
      return "Не сдали (2)";
    if (["0","1","2","3","4","5"].includes(value))
      return `Оценка ${value}`;
    if (value==="–") return "Без оценки";
    return value;
  };

  const buildChart = async () => {
    if (!semId || !subjectId || !groupIds.length) {
      setError("Укажите группы, семестр и предмет");
      return;
    }
    setError(""); setLoading(true);
    try {
      const sem_name     = semesters.find(s=>s.id==+semId)?.name;
      const subject_name = subjects.find(s=>s.id==+subjectId)?.name;
      if (!sem_name || !subject_name) throw new Error("Не нашли имя семестра/предмета");

      const params = {
        sem_name,
        subject_name,
        grade_field: gradeField,
        "group_ids[]": groupIds
      };

      const res = await axios.get(`${ANALYTICS}/grades-distribution`, { headers, params });
      const buckets = res.data.buckets;
      const total   = buckets.reduce((sum,b)=>sum+b.count, 0);
      setData([
        { grade: "Всего", count: total, percent: 100 },
        ...buckets.map(b=>({
          grade: b.grade,
          count: b.count,
          percent: total?+(b.count/total*100).toFixed(1):0
        }))
      ]);
    } catch(e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const buildSummary = async () => {
    if (!semId || !subjectId || !groupIds.length) {
      setError("Укажите группы, семестр и предмет");
      return;
    }
    setError(""); setLoading(true);
    try {
      const sem_name     = semesters.find(s=>s.id==+semId)?.name;
      const subject_name = subjects.find(s=>s.id==+subjectId)?.name;
      if (!sem_name || !subject_name) throw new Error("Не нашли имя семестра/предмета");

      const params = {
        sem_name,
        subject_name,
        "group_ids[]": groupIds
      };

      const res = await axios.get(`${ANALYTICS}/grades-summary`, { headers, params });
      const t   = res.data.total;
      setSummaryData([
        { category: "Всего",            count: t,                         percent: 100 },
        { category: "Сдали экзамен",    count: res.data.exam_pass,        percent: t?+(res.data.exam_pass/t*100).toFixed(1):0 },
        { category: "Сдали пересдачу",  count: res.data.retake_pass,      percent: t?+(res.data.retake_pass/t*100).toFixed(1):0 },
        { category: "Сдали комиссию",   count: res.data.commission_pass,   percent: t?+(res.data.commission_pass/t*100).toFixed(1):0 },
        { category: "Не сдали (2)",     count: res.data.commission_fail_2, percent: t?+(res.data.commission_fail_2/t*100).toFixed(1):0 },
        { category: "Не сдали (Н/я)",   count: res.data.commission_fail_ny,percent: t?+(res.data.commission_fail_ny/t*100).toFixed(1):0 },
      ]);
    } catch(e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

 const scopeLabel = course
  ? `Курс ${course}`
  : `Группы: ${groupIds
      .map(id => groups.find(g => g.id === id)?.name)
      .filter(Boolean)
      .join(", ")}`;
  const subjectLabel  = subjects.find(s=>s.id==+subjectId)?.name || "";

  const exportDebtors = async () => {
    if (!semId || !groupIds.length) {
      alert("Укажите группы и семестр");
      return;
    }
    try {
      const params = {
        sem_id: semId,
        grade_field: debForm,
        "group_ids[]": groupIds,
      };
      const res = await axios.get(
        `${ANALYTICS}/debtors-export`,
        { headers, responseType: "blob", params }
      );
      saveAs(res.data, `debtors_${semId}.xlsx`);
      setDebtorsOpen(false);
    } catch {
      alert("Ошибка при формировании файла");
    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={()=>navigate("/deanery/dashboard")}
        className="fixed top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
      >Назад</button>

      <h1 className="text-3xl font-bold text-center mb-6">Аналитика успеваемости</h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={()=>setMode(mode==="dist"?"summary":"dist")}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          {mode==="dist" ? "Переключить на сводку" : "Переключить на распределение"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 justify-center mb-4">
        {/* курс */}
        <select
          value={course}
          onChange={e=>setCourse(e.target.value)}
          className="border p-2"
        >
          <option value="">– Курс –</option>
          {[1,2,3,4].map(c=><option key={c} value={c}>{c} курс</option>)}
        </select>

        {/* мультивыбор групп */}
        <select
          multiple
          value={groupIds.map(String)}
          onChange={e=>{
            const vals = Array.from(e.target.selectedOptions).map(o=>+o.value);
            setGroupIds(vals);
          }}
          className="border p-2 h-32"
        >
          {groups.map(g=>(
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {/* семестр */}
        <select
          value={semId}
          onChange={e=>setSemId(e.target.value)}
          className="border p-2"
        >
          <option value="">– Семестр –</option>
          {semesters.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* предмет */}
        <select
          value={subjectId}
          onChange={e=>setSubjectId(e.target.value)}
          className="border p-2"
        >
          <option value="">– Предмет –</option>
          {subjects.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {mode==="dist" && (
          <select
            value={gradeField}
            onChange={e=>setGradeField(e.target.value)}
            className="border p-2"
          >
            {[
              ["control_1","Контрольная 1"],
              ["control_2","Контрольная 2"],
              ["exam","Экзамен"],
              ["retake","Пересдача"],
              ["commission","Комиссия"],
            ].map(([k,l])=>(
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex justify-center mb-8">
        <button
          style={{ marginBottom: "1.5rem" }}
          onClick={mode==="dist" ? buildChart : buildSummary}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {loading
            ? "Загрузка…"
            : mode==="dist"
              ? "Построить распределение"
              : "Построить сводку"}
        </button>
      </div>

      <div className="flex justify-center mt-6">
        <button
           onClick={()=>setDebtorsOpen(true)}
          className="bg-red-600 text-white px-6 py-2 rounded"
        >
          Скачать список должников
        </button>
      </div>

      {error && <p className="text-red-600 text-center mb-4">{error}</p>}

      {mode==="dist" && data.length>0 && (
        <>
          <p className="text-center text-gray-700 mb-2">
            {scopeLabel} / {subjectLabel} / {gradeField}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top:40, right:30, left:20, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="grade" tickFormatter={formatTick} tick={{ fill:"#888", fontSize:16 }}
                label={{ value:"Оценка", position:"insideBottom", dy:34 }}/>
              <YAxis allowDecimals={false}
                label={{ value:"Количество", angle:-90, position:"insideLeft", dx:-10 }}/>
              <Tooltip formatter={(v,n)=>(n==="percent"?`${v}%`:v)}/>
              <Bar dataKey="count">
                {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                <LabelList dataKey="percent" position="top" formatter={v=>`${v}%`} fill="#fff" fontSize={14}/>
                <LabelList dataKey="count" position="insideBottom" offset={-40} fill="#fff" fontSize={14}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {mode==="summary" && summaryData.length>0 && (
        <>
          <p className="text-center text-gray-700 mb-2">
            {scopeLabel} / {subjectLabel} (сводка)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summaryData} margin={{ top:40, right:30, left:20, bottom:30 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="category" tick={{ fill:"#888", fontSize:16 }}/>
              <YAxis allowDecimals={false}
                label={{ value:"Количество", angle:-90, position:"insideLeft", dx:-10 }}/>
              <Tooltip formatter={(v,n)=>(n==="percent"?`${v}%`:v)}/>
              <Bar dataKey="count">
                {summaryData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                <LabelList dataKey="percent" position="top" formatter={v=>`${v}%`} fill="#fff" fontSize={14}/>
                <LabelList dataKey="count" position="insideBottom" offset={-40} fill="#fff" fontSize={14}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      <Modal
        isOpen={isDebtorsOpen}
        onRequestClose={() => setDebtorsOpen(false)}
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
        <div className="bg-white p-6 rounded max-w-sm w-full mx-auto">
          <h2 className="text-center text-xl mb-4">Список должников</h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              exportDebtors();
            }}
          >
            <label className="block mb-6 text-center">
              Форма контроля:
              <select
                style={{ margin: "1rem auto" }}
                value={debForm}
                onChange={e => setDebForm(e.target.value)}
                className="border p-2 block w-1/2 max-w-md h-12 text-center"
              >
                <option value="exam">Экзамен</option>
                <option value="retake">Пересдача</option>
                <option value="commission">Комиссия</option>
                <option value="control_1">Контрольная 1</option>
                <option value="control_2">Контрольная 2</option>
              </select>
            </label>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setDebtorsOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Скачать
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>


  );
}
