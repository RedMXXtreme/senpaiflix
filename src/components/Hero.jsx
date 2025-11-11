import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, Volume2 } from "lucide-react";

const HeroCarousel = () => {
  const [animeList, setAnimeList] = useState([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://senpai-di.vercel.app/meta/anilist/trending');
        const data = await response.json();
        setAnimeList(data.results);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // auto slide + progress
  useEffect(() => {
    if (animeList.length > 0) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setCurrent((prev) => (prev + 1) % animeList.length);
            return 0;
          }
          return p + (100 / 60); // ~6 seconds
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [animeList, current]);

  if (animeList.length === 0) return null;
  const safeCurrent = Math.min(current, animeList.length - 1);
  const anime = animeList[safeCurrent];

  const airedString = anime?.releaseDate || "Unknown";

  return (
    <section className="relative h-[90vh] w-full overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={anime.cover || anime.image}
          className="w-full h-full object-cover scale-110 blur-[20px] brightness-[.35] animate-[heroZoom_6s_ease-in-out_infinite]"
        />
        <img
          src={anime.cover || anime.image}
          className="w-full h-full object-cover brightness-[.9]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f1b] via-[#0f0f1b]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full px-6 md:px-16 py-10 flex flex-col justify-end md:justify-center max-w-screen-xl mx-auto">
        
        {/* mini poster */}
        <div className="mb-4">
          <img
            src={anime.image}
            className="w-20 h-28 sm:w-28 sm:h-40 object-cover rounded-xl shadow-xl border border-white/10"
          />
        </div>

        <p className="text-pink-400 text-sm mb-2">Spotlight {safeCurrent + 1}</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
          {anime.title.english || anime.title.romaji}
        </h1>

        <div className="flex items-center gap-3 text-sm text-white mb-4 flex-wrap">
          <span className="flex items-center gap-1"><span className="text-xs">🔘</span> {anime.type || "TV"}</span>
          <span>⏱️ {anime.duration || "?"} min</span>
          <span>📅 {airedString}</span>
          <span className="bg-pink-500 text-xs px-2 py-0.5 rounded">HD</span>
          <span className="bg-green-500 text-xs px-2 py-0.5 rounded">cc {anime.totalEpisodes || "?"}</span>
          <span className="bg-blue-600 text-xs px-2 py-0.5 rounded"><Volume2 size={12} className="inline-block" /> 8</span>
        </div>

        <p className="text-gray-300 max-w-2xl text-sm mb-6 line-clamp-3">
          {anime.description?.replace(/<[^>]+>/g, "")}
        </p>

        <div className="flex gap-4">
          <a href={`/watch/${anime.id}`} className="bg-pink-400 hover:bg-pink-500 text-white font-semibold text-sm px-6 py-2 rounded-full">▶️ Watch Now</a>
          <a href={`/anime/${anime.id}`} className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-6 py-2 rounded-full">Detail ➤</a>
        </div>

        {/* progress bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-pink-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2">
        <button onClick={() => setCurrent((prev) => (prev - 1 + animeList.length) % animeList.length)} className="bg-white/20 hover:bg-white/40 p-2 rounded-md transition">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => setCurrent((prev) => (prev + 1) % animeList.length)} className="bg-white/20 hover:bg-white/40 p-2 rounded-md transition">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* mobile dots right side (your existing) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 md:hidden">
        {animeList.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-3 h-3 rounded-full ${i === current ? "bg-pink-400" : "bg-white/40"}`} />
        ))}
      </div>

      {/* bottom dots desktop like HiAnime */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex gap-2 z-20">
        {animeList.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`h-[6px] rounded-full transition-all ${i === current ? "w-8 bg-pink-500" : "w-3 bg-white/40"}`} />
        ))}
      </div>
      {/* mobile bottom fade to dark for readability */}
<div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0f0f1b] via-[#0f0f1b]/90 to-transparent md:hidden pointer-events-none" />
    </section>
  );
};

export default HeroCarousel;

