import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PpoLogin = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("username", data.email);
      formData.append("password", data.password);

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/login",
        formData,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true,
        }
      );

      const token = res.data.access_token;
      localStorage.setItem("access_token", token);
      localStorage.setItem("expires_at", Date.now() + 12 * 60 * 60 * 1000);

      alert("Вход успешен");
      navigate("/ppo/dashboard");
    } catch (error) {
      alert("Ошибка входа: " + (error.response?.data?.detail || error.message));
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
          Вход администратора ППО
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded-xl shadow-md space-y-4 w-full"
        >
          <input
            {...register("email")}
            placeholder="Email"
            className="block w-1/5 mx-auto p-2 border border-gray-300 rounded"
          />
          <input
            {...register("password")}
            type="password"
            placeholder="Пароль"
            className="block w-1/5 mx-auto p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            className="block w-1/5 mx-auto bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Войти
          </button>
        </form>
      </div>
    </>
  );
};

export default PpoLogin;