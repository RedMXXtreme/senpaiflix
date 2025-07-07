import React from "react";
import { useNavigate } from "react-router-dom";  ///https://hentaihaven.xxx/watch/${animeName}/episode-${episode}/
                                                                                  //https://watchhentai.net/videos/${animeName}-episode-${episode}/

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f1b] text-white p-4">
      <img
        src="https://i.pinimg.com/736x/a1/2c/f2/a12cf2c96f075303f57bedc3e5faa5cb.jpg"
        alt="Saitama 404"
        className="w-48 h-48 mb-6"
        style={{ filter: "brightness(0.8)", objectFit: "contain", borderRadius: "50%", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)" }}
      />
      <h1 className="text-4xl font-bold mb-2">Oops! 404</h1>
      <p className="text-lg mb-6">404 Not Found</p>
      <button
        onClick={() => navigate("/home")}
        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded"
      >
        ← Go home
      </button>
    </div>
  );
};

export default NotFound;
