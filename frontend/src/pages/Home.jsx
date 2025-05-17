import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const navigate = useNavigate();
  const [formats, setFormats] = useState([]);

  useEffect(() => {
    const fetchFormats = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/formats");
        setFormats(res.data);
      } catch (err) {
        alert("Не удалось загрузить форматы: " + err.message);
      }
    };
    fetchFormats();
  }, []);

  const handleChooseFormat = (formatId) => {
    localStorage.setItem("selected_format_id", formatId);
    if (formatId === 1) {
      navigate("/ppo");
    } else if (formatId === 2) {
      navigate("/deanery");
    } else {
      navigate(`/format/${formatId}`);
    }
  };

  return (
    <div className="pt-6 px-4 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Выберите формат учёта
      </h1>

      {formats.length === 0 ? (
        <p className="text-center">Загрузка...</p>
      ) : (
        <div className="space-y-4">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => handleChooseFormat(format.id)}
              className="block w-1/5 max-w-xs mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {format.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
