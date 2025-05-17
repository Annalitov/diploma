import { useNavigate } from "react-router-dom";

const PpoChoice = () => {
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => navigate("/")}
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
          Профсоюзный учёт — Авторизация
        </h1>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/ppo/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Вход
          </button>
          <button
            onClick={() => navigate("/ppo/register")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Регистрация
          </button>
        </div>
      </div>
    </>
  );
};

export default PpoChoice;
