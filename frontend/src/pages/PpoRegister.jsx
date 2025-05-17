import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const PpoRegister = () => {
  const { register, handleSubmit, reset } = useForm();
  const [formatId, setFormatId] = useState(null);
  const [ppos, setPpos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("selected_format_id");
    if (!stored) {
      alert("Формат учёта не выбран. Вернитесь на главную.");
      return;
    }
    const id = +stored;
    setFormatId(id);
    axios
      .get(`http://127.0.0.1:8000/api/union/ppos?format_id=${id}`)
      .then(res => setPpos(res.data))
      .catch(err => console.error("Не удалось загрузить ППО:", err));
  }, []);

  const onSubmit = async (data) => {
    if (!formatId) {
      alert("Формат учёта не найден");
      return;
    }
    try {
      const payload = {
        ...data,
        format_id: formatId,
        role: "viewer",
      };
      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/register",
        payload
      );
      alert(`Администратор зарегистрирован: ${res.data.name}`);
      reset();
      navigate("/ppo/login");
    } catch (error) {
      alert(
        "Ошибка регистрации: " +
        (error.response?.data?.detail || error.message)
      );
    }
  };

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

      <div className="pt-6 px-4 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Регистрация администратора ППО
        </h1>
        
        <form
          onSubmit={handleSubmit(onSubmit)}
          className=" w-1/5 bg-white p-6 rounded-xl shadow-md space-y-4 w-full"
        >
          <input
            {...register("name", { required: true })}
            placeholder="Имя"
            className="block w-1/5 mx-auto p-2 border border-gray-300 rounded"
          />

          <input
            {...register("email", { required: true })}
            type="email"
            placeholder="Email"
            className="block w-1/5 mx-auto p-2 border border-gray-300 rounded"
          />

          <input
            {...register("password", { required: true })}
            type="password"
            placeholder="Пароль"
            className="block w-1/5 mx-auto p-2 border border-gray-300 rounded"
          />

          <select
            style={{ marginBottom: "1.5rem" }}
            {...register("ppo_id", { required: true })}
            className="block w-1/5 mx-auto p-2 border border-gray-300 rounded"
          >
            <option value="">Выберите ППО</option>
            {ppos.map(ppo => (
              <option key={ppo.id} value={ppo.id}>
                {ppo.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="block w-1/5 mx-auto bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Зарегистрироваться
          </button>
        </form>
      </div>
    </>
  );
};

export default PpoRegister;
