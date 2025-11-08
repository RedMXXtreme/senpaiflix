import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SeasonsSection({ seasons }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [episodeCounts, setEpisodeCounts] = useState({});
  const [selectedSeason, setSelectedSeason] = useState(null);

  // Fetch episode counts from Steller API
  useEffect(() => {
    const fetchEpisodeCounts = async () => {
      const counts = {};
      for (const season of seasons) {
        try {
          const response = await fetch(`https://steller-tau.vercel.app/meta/anilist/info/${season.id}`);
          if (response.ok) {
            const data = await response.json();
            counts[season.id] = data.totalEpisodes || "?";
          } else {
            counts[season.id] = "?";
          }
        } catch (error) {
          console.error(`Failed to fetch episode count for season ${season.id}:`, error);
          counts[season.id] = "?";
        }
      }
      setEpisodeCounts(counts);
    };

    if (seasons.length > 0) {
      fetchEpisodeCounts();
    }
  }, [seasons]);

  // check scroll visibility
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mt-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Seasons</h3>
      </div>

      {/* Scroll Buttons (auto-hide + fade) */}
      <button
        onClick={() => scroll("left")}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 ${
          canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <i className="ri-arrow-left-s-line text-xl text-gray-200"></i>
      </button>

      <button
        onClick={() => scroll("right")}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 ${
          canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <i className="ri-arrow-right-s-line text-xl text-gray-200"></i>
      </button>

      {/* Seasons List */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
      >
        {seasons.map((season, index) => (
          <div
            style={{height:'4rem'}}
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
                if (anilistId) navigate(`/watch/${anilistId}`);
              } catch (err) {
                console.error("Error fetching season:", err);
                setSelectedSeason(null);
              }
            }}
            className={`flex-shrink-0 w-40 sm:w-44 md:w-48 rounded-2xl overflow-hidden cursor-pointer relative
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
              className="w-full h-24 sm:h-28 object-cover opacity-60 hover:opacity-80 transition-opacity duration-300"
              onError={(e) => (e.target.style.display = "none")}
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
              <h4 className="font-semibold text-sm mb-2">
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