import { useNavigate } from "react-router-dom";

const PpoChoice = () => {
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => navigate("/")}
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
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
