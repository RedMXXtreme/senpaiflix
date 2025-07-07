import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, Volume2 } from "lucide-react";
const HeroCarousel = () => {
  const [animeList, setAnimeList] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const CACHE_KEY = "top_anime_ona_bypopularity_10";
    const getCachedData = (key) => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        return JSON.parse(cached);
      } catch {
        return null;
      }
    };
    const setCachedData = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    };

    const cachedData = getCachedData(CACHE_KEY);
    if (cachedData) {
      setAnimeList(cachedData);
      return;
    }
    // Throttle API call by introducing a delay of 1 second before fetching
    const delay = 1000; // 1 second delay
    const timer = setTimeout(() => {
      fetch("https://api.jikan.moe/v4/top/anime?type=ona&filter=bypopularity&limit=10")
        .then((res) => res.json())
        .then((data) => {
          setAnimeList(data.data);
          setCachedData(CACHE_KEY, data.data);
        })
        .catch((err) => console.error(err));
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % animeList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [animeList]);

  if (animeList.length === 0) return null;
  const anime = animeList[current];

  return (
    <section className="relative h-[90vh] w-full overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={anime.images.jpg.large_image_url}
          alt={anime.title}
          className="object-cover object-center w-full h-full brightness-[.9] transition duration-500"
          loading="lazy"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f1b] via-[#0f0f1b]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full px-6 md:px-16 py-10 flex flex-col justify-end md:justify-center max-w-screen-xl mx-auto">
        <p className="text-pink-400 text-sm mb-2">{anime.score}#Spotlight</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
          {anime.title_english || anime.title}
        </h1>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-sm text-white mb-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="text-xs">🔘</span> TV
          </span>
          <span className="flex items-center gap-1">⏱️ {anime.duration}</span>
          <span className="flex items-center gap-1">
            📅 {anime.aired?.string || "Unknown"}
          </span>
          <span className="bg-pink-500 text-xs px-2 py-0.5 rounded">HD</span>
          <span className="bg-green-500 text-xs px-2 py-0.5 rounded">
            cc {anime.episodes}
          </span>
          <span className="bg-blue-600 text-xs px-2 py-0.5 rounded">
            <Volume2 size={12} className="inline-block" /> 8
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-300 max-w-2xl text-sm mb-6 line-clamp-3">
          {anime.synopsis}
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          <a
            href={`/watch/${anime.mal_id}`}
            className="bg-pink-400 hover:bg-pink-500 text-white font-semibold text-sm px-6 py-2 rounded-full"
          >
            ▶️ Watch Now
          </a>
          <a
            href={`/anime/${anime.mal_id}`}
            className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-6 py-2 rounded-full"
          >
            Detail ➤
          </a>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 hidden md:flex flex-col gap-2">
        <button
          onClick={() =>
            setCurrent((prev) => (prev - 1 + animeList.length) % animeList.length)
          }
          className="bg-white/20 hover:bg-white/40 p-2 rounded-md transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % animeList.length)}
          className="bg-white/20 hover:bg-white/40 p-2 rounded-md transition"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Vertical Dots Navigation for Mobile */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-3 md:hidden">
        {animeList.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition ${
              index === current ? "bg-pink-400" : "bg-white/40"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
