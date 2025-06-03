import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeaneryRegister = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [units, setUnits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/attendance/units?format_id=2")
      .then((res) => setUnits(res.data))
      .catch((e) => alert("Не удалось загрузить подразделения: " + e.message));
  }, []);

  const onSubmit = async (data) => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/auth/attendance/register",
        {
          name: data.name,
          email: data.email,
          password: data.password,
          unit_id: Number(data.unit_id),
          role: data.role || "viewer",
        }
      );
      alert("Администратор зарегистрирован");
      reset();
      navigate("/deanery/login");
    } catch (e) {
      alert("Ошибка регистрации: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <>
      <button
        onClick={() => navigate("/deanery")}
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
      >
        Назад
      </button>

      <div className="p-6 flex flex-col items-center">
        <h1 className="w-full text-center text-3xl font-bold mb-6">
          Академический учёт — Регистрация
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-1/5 max-w-sm bg-white p-6 rounded-xl shadow-xl space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">ФИО</label>
            <input
              {...register("name", { required: "Введите ФИО" })}
              className="w-full p-2 border border-gray-300 rounded"
              type="text"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email", {
                required: "Введите email",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Некорректный email",
                },
              })}
              className="w-full p-2 border border-gray-300 rounded"
              type="email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              {...register("password", {
                required: "Введите пароль",
                minLength: { value: 6, message: "Минимум 6 символов" },
              })}
              className="w-full p-2 border border-gray-300 rounded"
              type="password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Подразделение
            </label>
            <select
              {...register("unit_id", { required: "Выберите подразделение" })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">— выбрать —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            {errors.unit_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.unit_id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Роль</label>
            <select
              style={{ marginBottom: "1.5rem" }}
              {...register("role")}
              className="w-full p-2 border border-gray-300 rounded"
              defaultValue="viewer"
            >
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Зарегистрироваться
          </button>
        </form>
      </div>
    </>
  );
};

export default DeaneryRegister;
