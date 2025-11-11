import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TrendingCarousel() {
  const [animeData, setAnimeData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const response = await fetch('https://senpai-di.vercel.app/meta/anilist/trending?page=2&perPage=10');
        const data = await response.json();
        setAnimeData(data.results);
      } catch (error) {
        console.error('Error fetching anime data:', error);
      }
    };

    fetchAnime();
  }, []);

  return (
    <div className="bg-[#0f0f1b] text-white w-full max-w-md mx-auto rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-orange-400">🏆</span> Top Trending
        </h2>
        <span className="bg-orange-500 text-xs font-bold px-2 py-1 rounded-full">NOW</span>
      </div>
      <div className="space-y-3">
        {animeData.map((anime, index) => (
          <div
            key={anime.id}
            onClick={() => navigate(`/anime/${anime.id}`)}
            className="flex items-center bg-[#1c1c2e] p-2 rounded-lg shadow-sm hover:bg-[#2a2a40] transition cursor-pointer"
          >
            <div className="text-2xl font-bold text-green-400 w-6 text-center">{index + 1}</div>
            <img
              src={anime.image}
              alt={anime.title.romaji}
              className="w-16 h-16 object-cover rounded-md mx-3"
            />
            <div className="flex-1">
              <p className="font-medium text-sm max-w-[120px] leading-snug">
  {anime.title.english
    ? anime.title.english.length > 20
      ? anime.title.english.slice(0, 20) + "…"
      : anime.title.english
    : "No Title"}
</p>

              <div className="flex items-center gap-1 mt-1 text-xs">
                <span className="bg-red-600 px-2 py-0.5 rounded-full text-white font-semibold text-[10px]">
                  CC {anime.totalEpisodes ?? '—'}
                </span>
                <span className="bg-green-600 px-2 py-0.5 rounded-full text-white font-semibold text-[10px]">
                  🔍 {anime.rating ?? '—'}
                </span>
                <span className="bg-gray-700 px-2 py-0.5 rounded-full text-white font-semibold text-[10px]">
                  {anime.type ?? '—'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

