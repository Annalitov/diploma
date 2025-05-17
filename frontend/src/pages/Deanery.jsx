import { useNavigate } from "react-router-dom";

const Deanery = () => {
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

      <div className="p-6 flex flex-col items-center">
        <h1 className="w-full text-center text-3xl font-bold mb-6">
          Академический учет — Авторизация
        </h1>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/deanery/login")}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Вход
          </button>
          <button
            onClick={() => navigate("/deanery/register")}
            className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Регистрация
          </button>
        </div>
      </div>
    </>
  );
};

export default Deanery;
