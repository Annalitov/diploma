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
import Select from "react-select";

Modal.setAppElement("#root");

const API_BASE = "http://127.0.0.1:8000/api/attendance";
const ANALYTICS = API_BASE + "/analytics";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    textAlign: "center",
    borderRadius: "8px",
    paddingLeft: "2.5rem",
    fontWeight: "500",
    backgroundColor: "#f4f4f4",
    borderColor: state.isFocused ? "#646cff" : "#c0c0c0",
    boxShadow: "none",
    "&:hover": { borderColor: "#c0c0c0" },
    cursor: "pointer",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#4a4a4a",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#4a4a4a",
  }),
  input: (provided) => ({
    ...provided,
    color: "#4a4a4a",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#e2e2e2" : "#fff",
    color: "#4a4a4a",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#fff",
    border: "1px solid #c0c0c0",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#4a4a4a",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#888",
    ":hover": {
      backgroundColor: "#f4f4f4",
      color: "#333",
    },
  }),
};

export default function DeaneryStatistics() {
  const navigate = useNavigate();
  const token = getDeaneryToken();
  const headers = { Authorization: `Bearer ${token}` };

  const [groups, setGroups]           = useState([]);
  const [semesters, setSemesters]     = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [course, setCourse]           = useState("");
  const [groupIds, setGroupIds]       = useState([]);
  const [semId, setSemId]             = useState("");
  const [subjectId, setSubjectId]     = useState("");
  const [gradeField, setGradeField]   = useState("exam");
  const [mode, setMode]               = useState("dist");
  const [data, setData]               = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const [isDebtorsOpen, setDebtorsOpen]   = useState(false);
  const [debGroupId, setDebGroupId]       = useState(null);
  const [reportStage, setReportStage]     = useState("exam");
  const [isAllDebtorsOpen, setAllDebtorsOpen] = useState(false);
  const [allReportStage, setAllReportStage]   = useState("exam");

  const COLORS = ["#8884d8","#82ca9d","#ffc658","#ff8042","#8dd1e1","#a4de6c","#d0ed57","#888","#d88484","#84d8d8"];
  const groupOptions = groups.map(g => ({ value: g.id, label: g.name }));


  const gradeLabels = {
    control_1: "Контрольная 1",
    control_2: "Контрольная 2",
    exam:      "Экзамен",
    retake:    "Пересдача",
    commission:"Комиссия",
  };
  useEffect(() => {
    axios.get(`${API_BASE}/groups`, { headers })
      .then(r => setGroups(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!course) {
      setGroupIds([]);
      setSemesters([]); setSemId(""); setSubjects([]); setSubjectId("");
      return;
    }
    const matched = groups.filter(g => {
      const parts = g.name.replace(/[–—]/g, "-").split("-");
      return parts[1]?.trim().charAt(0) === String(course);
    }).map(g => g.id);
    setGroupIds(matched);
    setSemesters([]); setSemId(""); setSubjects([]); setSubjectId("");
  }, [course, groups]);

  useEffect(() => {
    if (!groupIds.length) return;
    axios.get(`${API_BASE}/groups/${groupIds[0]}/semesters`, { headers })
      .then(r => setSemesters(r.data))
      .catch(console.error);
    setSemId(""); setSubjects([]); setSubjectId("");
  }, [groupIds]);

  useEffect(() => {
    if (!semId) return;
    axios.get(`${API_BASE}/semesters/${semId}/subjects`, { headers })
      .then(r => setSubjects(r.data))
      .catch(console.error);
    setSubjectId("");
  }, [semId]);

  const formatTick = v => {
    if (v==="Нд") return "Не сдали (Н/д)";
    if (v==="Ня") return "Не сдали (Н/я)";
    if ((["exam","retake","commission"].includes(gradeField)) && v==="2")
      return "Не сдали (2)";
    if (["0","1","2","3","4","5"].includes(v)) return `Оценка ${v}`;
    if (v==="–") return "Без оценки";
    return v;
  };
  const scopeLabel   = course
    ? `Курс ${course}`
    : `Группы: ${groupIds.map(id=>groups.find(g=>g.id===id)?.name).join(", ")}`;
  const subjectLabel = subjects.find(s=>s.id==+subjectId)?.name || "";

  // построение графиков
  const buildChart = async () => {
  if (!semId || !subjectId || !groupIds.length) {
    setError("Укажите группы, семестр и предмет");
    return;
  }
  setError("");
  setLoading(true);

  try {
    const params = {
      sem_name: semesters.find(s => s.id == +semId).name,
      subject_name: subjects.find(s => s.id == +subjectId).name,
      grade_field: gradeField,
      "group_ids[]": groupIds
    };

    const res = await axios.get(`${ANALYTICS}/grades-distribution`, { headers, params });
    const buckets = res.data.buckets;
    const total = buckets.reduce((sum, b) => sum + b.count, 0);

    const desiredOrder = ["5", "4", "3", "2", "Ня", "Нд", "–"];
    const sortedBuckets = [...buckets].sort((a, b) => {
      const idxA = desiredOrder.indexOf(a.grade);
      const idxB = desiredOrder.indexOf(b.grade);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    const formattedData = sortedBuckets.map(b => ({
      grade: b.grade,
      count: b.count,
      percent: total ? +(b.count / total * 100).toFixed(1) : 0
    }));

    setData([
      { grade: "Всего", count: total, percent: 100 },
      ...formattedData
    ]);
  } catch (e) {
    setError(e.response?.data?.detail || e.message);
  } finally {
    setLoading(false);
  }
};

  const buildSummary = async () => {
    if (!semId||!subjectId||!groupIds.length) {
      setError("Укажите группы, семестр и предмет"); return;
    }
    setError(""); setLoading(true);
    try {
      const params = {
        sem_name: semesters.find(s=>s.id==+semId).name,
        subject_name: subjects.find(s=>s.id==+subjectId).name,
        "group_ids[]": groupIds
      };
      const res = await axios.get(`${ANALYTICS}/grades-summary`, { headers, params });
      const t = res.data.total;
      setSummaryData([
        { category:"Всего", count:t, percent:100 },
        { category:"Сдали экзамен", count:res.data.exam_pass, percent:t?+(res.data.exam_pass/t*100).toFixed(1):0 },
        { category:"Сдали пересдачу", count:res.data.retake_pass, percent:t?+(res.data.retake_pass/t*100).toFixed(1):0 },
        { category:"Сдали комиссию", count:res.data.commission_pass, percent:t?+(res.data.commission_pass/t*100).toFixed(1):0 },
        { category:"Не сдали (2)", count:res.data.commission_fail_2, percent:t?+(res.data.commission_fail_2/t*100).toFixed(1):0 },
        { category:"Не сдали (Н/я)", count:res.data.commission_fail_ny, percent:t?+(res.data.commission_fail_ny/t*100).toFixed(1):0 },
      ]);
    } catch(e) {
      setError(e.response?.data?.detail||e.message);
    } finally { setLoading(false); }
  };

  const exportDebtors = async () => {
    if (!debGroupId) { alert("Выберите группу"); return; }
    try {
      const res = await axios.get(`${ANALYTICS}/debtors-by-group_stage`, {
        headers, responseType:"blob",
        params: { group_id: debGroupId, stage: reportStage }
      });
      const cd = res.headers["content-disposition"]||"";
      let fn = `Должники_группа_${groups.find(g=>g.id===debGroupId)?.name}.xlsx`;
      const m = cd.match(/filename\*=UTF-8''(.+)$/i);
      if (m) fn = decodeURIComponent(m[1]);
      saveAs(res.data, fn);
      setDebtorsOpen(false);
    } catch {
      alert("Ошибка формирования файла");
    }
  };

  const exportAllDebtors = async () => {
    try {
      const res = await axios.get(`${ANALYTICS}/debtors-all-groups-by-stage`, {
        headers, responseType:"blob",
        params: { stage: allReportStage }
      });
      const cd = res.headers["content-disposition"]||"";
      let fn = `Должники_всех_групп_${allReportStage}.xlsx`;
      const m = cd.match(/filename\*=UTF-8''(.+)$/i);
      if (m) fn = decodeURIComponent(m[1]);
      saveAs(res.data, fn);
      setAllDebtorsOpen(false);
    } catch {
      alert("Ошибка формирования файла");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={()=>navigate("/deanery/dashboard")}
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
      >Назад</button>

      <h1 className="text-3xl font-bold text-center mb-6">Аналитика успеваемости</h1>

      {/* общий flex: левая 1/4, правая 3/4 */}
      <div className="flex gap-6">
        {/* левая панель */}
        <div className="w-1/4 flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-center text-gray-700">Успеваемость</h2>
          <button
            onClick={()=>setMode(m=>m==="dist"?"summary":"dist")}
            className="w-full bg-gray-200 px-4 py-2 rounded"
          >
            {mode==="dist"?"Переключить на сводку":"Переключить на распределение"}
          </button>

          <select
            value={course}
            onChange={e=>setCourse(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">– Курс –</option>
            {[1,2,3,4].map(c=><option key={c} value={c}>{c} курс</option>)}
          </select>

          <Select
            options={groupOptions}
            isMulti
            placeholder="– Группы –"
            styles={customSelectStyles}
            onChange={sel=>setGroupIds(sel.map(o=>o.value))}
            value={groupOptions.filter(o=>groupIds.includes(o.value))}
            className="w-full"
          />

          <select
            value={semId}
            onChange={e=>setSemId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">– Семестр –</option>
            {semesters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={subjectId}
            onChange={e=>setSubjectId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">– Предмет –</option>
            {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {mode==="dist"&&(  

            <select
              value={gradeField}
              onChange={e=>setGradeField(e.target.value)}
              className="w-full border p-2 rounded"
            >
              {[
                ["control_1","Контрольная 1"],
                ["control_2","Контрольная 2"],
                ["exam","Экзамен"],
                ["retake","Пересдача"],
                ["commission","Комиссия"],
              ].map(([k,l])=><option key={k} value={k}>{l}</option>)}
            </select>
          )}

          <button
            onClick={mode==="dist"?buildChart:buildSummary}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading?"Загрузка…":(mode==="dist"?"Распределение":"Сводка")}
          </button>
          <h2 className="text-xl font-semibold text-center text-gray-700">Списки должников</h2>

          <button
            onClick={()=>setDebtorsOpen(true)}
            className="w-full bg-red-600 text-white px-4 py-2 rounded"
          >Скачать список должников</button>

          <button
            onClick={()=>setAllDebtorsOpen(true)}
            className="w-full bg-green-600 text-white px-4 py-2 rounded"
          >Скачать должников всех групп</button>

          {error && <p className="text-red-600">{error}</p>}
        </div>

        <div className="w-3/4">
          {mode==="dist" && data.length>0 && (
            <>
              <h3 className="text-center text-gray-100 mb-2 text-4xl">
                {scopeLabel} / {subjectLabel} / {gradeLabels[gradeField]}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top:40, right:30, left:20, bottom:30 }}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="grade" tickFormatter={formatTick} tick={{ fontSize:20 }} label={{ value:"Оценка", fontSize:20, position:"insideBottom", dy:34, fill:"#4d4d4d" }}/>
                  <YAxis allowDecimals={false} label={{ value:"Количество", fontSize:20, angle:-90, position:"insideLeft", dx:10 }}/>
                  <Tooltip formatter={(v,n)=>(n==="percent"?`${v}%`:v)} />
                  <Bar dataKey="count">
                    {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    <LabelList dataKey="percent" position="top" formatter={v=>`${v}%`} fill="#4d4d4d" fontSize="20" />
                    <LabelList dataKey="count" position="insideBottom" offset={-40} fill="#4d4d4d" fontSize="20"/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {mode==="summary" && summaryData.length>0 && (
            <>
              <h3 className="text-center text-gray-700 mb-2">
                {scopeLabel} / {subjectLabel} (сводка)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryData} margin={{ top:40, right:30, left:20, bottom:30 }}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="category" tick={{ fontSize:16 }} label={{ value:"Оценка",fontSize:20, position:"insideBottom", dy:34 }}/>
                  <YAxis allowDecimals={false} label={{ value:"Количество", fontSize:20, angle:-90, position:"insideLeft", dx:10 }} />
                  <Tooltip formatter={(v,n)=>(n==="percent"?`${v}%`:v)}/>
                  <Bar dataKey="count">
                    {summaryData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    <LabelList dataKey="percent" position="top" formatter={v=>`${v}%`} fill="#4d4d4d" fontSize="20" />
                    <LabelList dataKey="count" position="insideBottom" offset={-40} fill="#4d4d4d" fontSize="20" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isDebtorsOpen}
        onRequestClose={()=>setDebtorsOpen(false)}
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
        <div className="bg-white p-6 rounded-lg mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Список должников</h2>
            <form onSubmit={e => { e.preventDefault(); exportDebtors(); }}>
              <label className="block mb-4 text-gray-700">
                Этап отчёта:
                <select
                  value={reportStage}
                  onChange={e => setReportStage(e.target.value)}
                  required
                  className="mt-1 block w-2/5 mx-auto border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="exam">После экзамена</option>
                  <option value="retake">После пересдачи</option>
                  <option value="commission">После комиссии</option>
                </select>
              </label>
              <label className=" text-center block mb-6 text-gray-700">
                Учебная группа:
                <select
                  value={debGroupId || ""}
                  onChange={e => setDebGroupId(+e.target.value)}
                  required
                  className="mt-1 block w-3/6 mx-auto text-center border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">— Выберите группу —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </label>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setDebtorsOpen(false)}
                  className="px-4 py-2 border border-gray-700 rounded text-gray-700 bg-gray-900 hover:bg-gray-300 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-gray-700 rounded text-gray-700 bg-gray-900 hover:bg-gray-300 transition"
                >
                  Скачать
                </button>
              </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isAllDebtorsOpen}
        onRequestClose={()=>setAllDebtorsOpen(false)}
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
        <div className="bg-white p-6 rounded-lg mx-auto text-center">
          <h2 className="text-xl mb-4 text-gray-800">Должники всех групп</h2>
          <form onSubmit={e=>{e.preventDefault();exportAllDebtors();}}>
            <label className="block mb-6 text-gray-700">
              Этап отчёта:
              <select
                value={allReportStage}
                onChange={e=>setAllReportStage(e.target.value)}
                className="mt-1 block w-4/6 mx-auto border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="exam">После экзамена</option>
                <option value="retake">После пересдачи</option>
                <option value="commission">После комиссии</option>
              </select>
            </label>
            <div className="flex justify-center gap-4">
              <button type="button" onClick={()=>setAllDebtorsOpen(false)}
                className="px-4 py-2 border rounded"
              >Отмена</button>
              <button type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded"
              >Скачать</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
