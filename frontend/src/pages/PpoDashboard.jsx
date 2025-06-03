import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../utils/auth";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  Legend as PieLegend,
  ResponsiveContainer as PieResponsiveContainer,
} from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as BarTooltip,
  ResponsiveContainer as BarResponsiveContainer,
  LabelList,
} from "recharts";

const PpoDashboard = () => {
  const [members, setMembers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [stats, setStats] = useState([]);
  const [barData, setBarData] = useState([]);
  const navigate = useNavigate();

  const PIE_COLORS = ["#82ca9d", "#8884d8", "#ff5b58"];
  const STACKED_COLORS = {
    known: "#82ca9d",
    unknown: "#ff5b58",
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      alert("Сессия истекла. Пожалуйста, войдите снова.");
      return navigate("/ppo/login");
    }

    const fetchMembers = async () => {
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

    const fetchPeriodsAndStats = async () => {
      try {
        const pr = await axios.get(
          "http://127.0.0.1:8000/api/union/payments/periods",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const arr = Array.isArray(pr.data) ? pr.data : [];
        setPeriods(arr);

        if (arr.length > 0) {
          const lastPeriod = arr[arr.length - 1];

          const payRes = await axios.get(
            `http://127.0.0.1:8000/api/union/payments?period=${encodeURIComponent(
              lastPeriod
            )}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const payList = Array.isArray(payRes.data) ? payRes.data : [];

          const countPaid = payList.filter((m) => m.paid === "1").length;
          const countNotPaid = payList.filter((m) => m.paid === "0").length;
          const countUnknown = payList.filter((m) => m.paid === "-").length;
          setStats([
            { name: "Оплатили", value: countPaid },
            { name: "Не оплатили", value: countNotPaid },
            { name: "Не установлено", value: countUnknown },
          ]);

          const groupStatuses = {};
          payList.forEach((m) => {
            const grp = m.group_name;
            if (!groupStatuses[grp]) {
              groupStatuses[grp] = [];
            }
            groupStatuses[grp].push(m.paid);
          });

          const groupFinalStatus = {};
          Object.entries(groupStatuses).forEach(([grp, statuses]) => {
            const hasKnown = statuses.some((st) => st === "1" || st === "0");
            groupFinalStatus[grp] = hasKnown ? "known" : "unknown";
          });

          const coursesMap = {};
          Object.entries(groupFinalStatus).forEach(([grp, finalSt]) => {
            let courseNum = "?";
            const parts = grp.split("-");
            if (parts.length >= 2) {
              const core = parts[1];
              const digits = core.match(/^(\d+)/);
              if (digits) {
                courseNum = String(digits[1])[0];
              }
            }
            const courseKey = `Курс ${courseNum}`;

            if (!coursesMap[courseKey]) {
              coursesMap[courseKey] = {
                course: courseKey,
                knownGroups: new Set(),
                unknownGroups: new Set(),
              };
            }

            if (finalSt === "known") {
              coursesMap[courseKey].knownGroups.add(grp);
            } else {
              coursesMap[courseKey].unknownGroups.add(grp);
            }
          });

          const barArray = Object.values(coursesMap)
            .map((entry) => {
              const obj = { course: entry.course };
              entry.knownGroups.forEach((grp) => {
                obj[`${grp}_known`] = 1;
              });
              entry.unknownGroups.forEach((grp) => {
                obj[`${grp}_unknown`] = 1;
              });
              return obj;
            })
            .sort((a, b) => {
              const aNum = parseInt(a.course.replace(/\D/g, ""), 10) || 0;
              const bNum = parseInt(b.course.replace(/\D/g, ""), 10) || 0;
              return aNum - bNum;
            });

          setBarData(barArray);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMembers();
    fetchPeriodsAndStats();
  }, [navigate]);

  const allGroupKeys = new Set();
  barData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== "course") {
        allGroupKeys.add(key);
      }
    });
  });

  const renderGroupLabel = (props, groupName) => {
    const { x, y, width, height } = props;
    if (width < 20 || height < 20) return null;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#000000"
        fontSize={14}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontWeight="bold"
      >
        {groupName}
      </text>
    );
  };

  return (
    <>
      <button
        onClick={() => navigate("/ppo")}
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
      >
        Назад
      </button>

      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Профсоюзный учёт
          </h1>

          <div className="flex flex-row gap-8">
            <div className="w-1/2">
              <h2 className="text-xl font-semibold mb-4">
                Последние зарегистрированные студенты:
              </h2>
              {members.length === 0 ? (
                <p>Загрузка данных…</p>
              ) : (
                <table className="w-full table-auto border-collapse mb-6">
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
                        <td className="border px-4 py-2">{m.group_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <h2 className="text-xl font-semibold mb-4">
                Оплаты за последний период ({periods.slice(-1)[0] || "—"})
              </h2>
              {stats.length > 0 ? (
                <PieResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {stats.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <PieTooltip formatter={(value) => `${value}`} />
                    <PieLegend verticalAlign="bottom" height={46} />
                  </PieChart>
                </PieResponsiveContainer>
              ) : (
                <p>Нет данных для круговой диаграммы</p>
              )}

              <h2 className="text-xl text-center font-semibold mt-8 mb-4">
                Распределение оплат по группам
              </h2>
              {barData.length > 0 ? (
                <BarResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={barData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="course"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      label={{
                        value: "Количество групп",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <BarTooltip />

                    {Array.from(allGroupKeys).map((groupKey) => {
                      const [groupName, status] = groupKey.split("_");
                      const fillColor =
                        status === "known"
                          ? STACKED_COLORS.known
                          : STACKED_COLORS.unknown;
                      return (
                        <Bar
                          key={groupKey}
                          dataKey={groupKey}
                          stackId="a"
                          fill={fillColor}
                          name={groupName}
                        >
                          <LabelList
                            content={(props) =>
                              renderGroupLabel(props, groupName)
                            }
                          />
                        </Bar>
                      );
                    })}
                  </BarChart>
                </BarResponsiveContainer>
              ) : (
                <p>Нет данных для гистограммы</p>
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
