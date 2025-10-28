import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThreeDMarquee from "../components/3DMARQUEE/ThreeDMarquee";
import { sendAniListQuery } from "../utils/anilistApi";  ///https://hentaihaven.xxx/watch/${animeName}/episode-${episode}/
                                                                                   //https://watchhentai.net/videos/${animeName}-episode-${episode}/

const NotFound = () => {
  const navigate = useNavigate();
  const [marqueeImages, setMarqueeImages] = useState([]);

  useEffect(() => {
    const fetchMarqueeImages = async () => {
      try {
        const query = `
          query {
            Page(perPage: 20) {
              media(type: ANIME, sort: POPULARITY_DESC) {
                coverImage {
                  extraLarge
                }
              }
            }
          }
        `;
        const data = await sendAniListQuery(query);
        const images = data.Page.media.map(anime => anime.coverImage.extraLarge).filter(Boolean);
        setMarqueeImages(images);
      } catch (error) {
        console.error("Failed to fetch marquee images:", error);
        // Fallback images
        setMarqueeImages([
          "https://i.pinimg.com/736x/a1/2c/f2/a12cf2c96f075303f57bedc3e5faa5cb.jpg",
          "https://via.placeholder.com/600x400?text=Anime+1",
          "https://via.placeholder.com/600x400?text=Anime+2",
          "https://via.placeholder.com/600x400?text=Anime+3",
          "https://via.placeholder.com/600x400?text=Anime+4",
          "https://via.placeholder.com/600x400?text=Anime+5",
          "https://via.placeholder.com/600x400?text=Anime+6",
          "https://via.placeholder.com/600x400?text=Anime+7",
          "https://via.placeholder.com/600x400?text=Anime+8",
        ]);
      }
    };

    fetchMarqueeImages();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0f0f1b] text-white p-4 overflow-hidden">
      {/* Blurred 3D Marquee Background */}
      <div className="absolute inset-0 z-0">
        <ThreeDMarquee
          images={marqueeImages}
          className="opacity-30 blur-sm scale-110"
          aspect="poster"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
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
    </div>
  );
};

export default NotFound;
