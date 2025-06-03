import { useNavigate } from "react-router-dom";

const Deanery = () => {
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => navigate("/")}
        className="sticky top-5 left-5 bg-black text-white py-2 px-4 rounded z-50"
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
