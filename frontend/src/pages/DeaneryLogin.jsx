import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeaneryLogin = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("username", data.email);
      formData.append("password", data.password);

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/attendance/login",
        formData,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      localStorage.setItem("attendance_token", res.data.access_token);
      localStorage.setItem("attendance_expires", Date.now() + 12 * 60 * 60 * 1000);

      navigate("/deanery/dashboard");
    } catch (e) {
      alert("Ошибка входа: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <>
      <button
        onClick={() => navigate("/deanery")}
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

      <div className="p-6 flex flex-col items-center">
        {/* Заголовок, крупный, как на других страницах */}
        <h1 className="w-full text-center text-3xl font-bold mb-8">
          Вход администратора Академического учёта
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-1/5 max-w-sm bg-white p-6 rounded-xl shadow-xl space-y-4"
        >
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded"
          />

          <input
            {...register("password")}
            type="password"
            placeholder="Пароль"
            className="w-full p-2 border border-gray-300 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Войти
          </button>
        </form>
      </div>
    </>
  );
};

export default DeaneryLogin;
