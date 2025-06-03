import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getAuthToken } from "../utils/auth";

const AddPpoMember = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) navigate("/ppo/login");
  }, [navigate]);

  const handleDateInput = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 2) v = v.slice(0, 2) + "." + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + "." + v.slice(5, 9);
    e.target.value = v.slice(0, 10);
    setValue("birth_date", e.target.value, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      const re = /^(\d{2})\.(\d{2})\.(\d{4})$/;
      if (!re.test(data.birth_date)) {
        alert("Некорректный формат даты рождения");
        return;
      }
      const [, d, m, y] = data.birth_date.match(re);
      const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      if (isNaN(new Date(iso))) {
        alert("Некорректная дата рождения");
        return;
      }
      const payload = { ...data, birth_date: iso };
      const token = getAuthToken();
      await axios.post(
        "http://127.0.0.1:8000/api/union/members/add",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Член профсоюза успешно добавлен!");
      reset();
      navigate("/ppo/dashboard");
    } catch (e) {
      console.error(e);
      alert("Ошибка при добавлении: " + (e.response?.data?.detail || e.message));
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

      <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-24 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Добавить нового члена профсоюза
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded-xl shadow-md space-y-4 w-1/5 flex flex-col items-center"
        >
          <div className="w-full">
            <label className="block text-sm font-medium mb-1">ФИО *</label>
            <input
              {...register("full_name", { required: "Это поле обязательно" })}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">Группа *</label>
            <input
              {...register("group_input", { required: "Укажите группу" })}
              placeholder="М8О-112БВ-24"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.group_input && (
              <p className="text-red-500 text-sm mt-1">
                {errors.group_input.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">
              Год поступления *
            </label>
            <input
              {...register("year", {
                required: "Введите год поступления",
                min: { value: 2000, message: "Мин. 2000" },
                max: {
                  value: new Date().getFullYear() + 1,
                  message: "Некорректный год",
                },
              })}
              type="number"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.year && (
              <p className="text-red-500 text-sm mt-1">
                {errors.year.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">
              Дата рождения *
            </label>
            <input
              {...register("birth_date", {
                required: "Обязательное поле",
                pattern: {
                  value: /^\d{2}\.\d{2}\.\d{4}$/,
                  message: "Формат: дд.мм.гггг",
                },
              })}
              placeholder="дд.мм.гггг"
              maxLength={10}
              onInput={handleDateInput}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.birth_date && (
              <p className="text-red-500 text-sm mt-1">
                {errors.birth_date.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">Пол *</label>
            <select
              {...register("gender", { required: "Выберите пол" })}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите пол</option>
              <option value="м">Мужской</option>
              <option value="ж">Женский</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <input
              {...register("phone")}
              placeholder="+7 (XXX) XXX-XX-XX"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              {...register("email", {
                required: "Введите email",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Некорректный email",
                },
              })}
              type="email"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">
              Тип финансирования *
            </label>
            <select
              {...register("funding_type", {
                required: "Выберите тип финансирования",
              })}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите тип</option>
              <option value="Бюджет">Бюджет</option>
              <option value="Платное">Платное</option>
            </select>
            {errors.funding_type && (
              <p className="text-red-500 text-sm mt-1">
                {errors.funding_type.message}
              </p>
            )}
          </div>

          <div className="flex space-x-4 pt-4 w-full">
            <button
              type="button"
              onClick={() => navigate("/ppo/dashboard")}
              className="w-3/5 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="w-3/5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
  </>
  );
};

export default AddPpoMember;
