import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SeasonsSection({ seasons }) {
  const navigate = useNavigate();
  const [episodeCounts, setEpisodeCounts] = useState({});
  const [selectedSeason, setSelectedSeason] = useState(null);

  // Fetch episode counts from Steller API
  useEffect(() => {
    const fetchEpisodeCounts = async () => {
      const counts = {};
      for (const season of seasons) {
        try {
          const response = await fetch(
            `https://steller-tau.vercel.app/meta/anilist/info/${season.id}`
          );
          if (response.ok) {
            const data = await response.json();
            counts[season.id] = data.totalEpisodes || "?";
          } else {
            counts[season.id] = "?";
          }
        } catch (error) {
          console.error(`Failed to fetch episode count for ${season.id}:`, error);
          counts[season.id] = "?";
        }
      }
      setEpisodeCounts(counts);
    };

    if (seasons.length > 0) fetchEpisodeCounts();
  }, [seasons]);

  return (
    <div className="mt-8 relative w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Seasons</h3>
      </div>

      {/* Grid Layout for Seasons */}
      <div
        className="
          grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 
          xl:grid-cols-6 gap-4
        "
      >
        {seasons.map((season, index) => (
          <div
            key={index}
            onClick={async () => {
              setSelectedSeason(season.id);
              try {
                const res = await fetch(
                  `https://zorime-api.vercel.app/api/info?id=${season.id}`
                );
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                const anilistId = data.results?.data?.anilistId;
                if (anilistId) navigate(`/anime/${anilistId}`);
              } catch (err) {
                console.error("Error fetching season:", err);
                setSelectedSeason(null);
              }
            }}
            className={`relative rounded-2xl overflow-hidden cursor-pointer
              backdrop-blur-md bg-white/5 border transition-all duration-300
              ${
                selectedSeason === season.id
                  ? "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                  : season.isCurrent
                  ? "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                  : "border-transparent hover:border-pink-400 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]"
              }`}
          >
            <img
              src={season.season_poster}
              alt={season.title}
              className="w-full h-32 sm:h-36 object-cover opacity-70 hover:opacity-90 transition-opacity duration-300"
              style={{height:'3rem'}}
              onError={(e) => (e.target.style.display = "none")}
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/30">
              <h4 className="font-semibold text-sm mb-1">
               {season.season || 1}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeasonsSection;
