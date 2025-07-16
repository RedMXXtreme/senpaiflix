import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft, Volume2 } from "lucide-react";
import { sendAniListQuery } from "../utils/anilistApi";

const HeroCarousel = () => {
  const [animeList, setAnimeList] = useState([]);
  const [current, setCurrent] = useState(0);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = `
          query {
            Page(perPage: 10) {
              media(
        sort: POPULARITY_DESC,
        type: ANIME,
        seasonYear: ${currentYear}
      ) {
                idMal
                title {
                  romaji
                  english
                }
                coverImage {
                  medium
                  extraLarge
                }
                episodes
                duration
                description(asHtml: false)
                averageScore
                season
                seasonYear
                startDate {
                  year
                  month
                  day
                }
                format
              }
            }
          }
        `;

        const data = await sendAniListQuery(query);
        setAnimeList(data.Page.media);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % animeList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [animeList]);

  if (animeList.length === 0) return null;
  const anime = animeList[current];

  const airedString = anime.startDate?.year
    ? `${anime.startDate.day || "??"}/${anime.startDate.month || "??"}/${anime.startDate.year}`
    : "Unknown";

  return (
    <section className="relative h-[90vh] w-full overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={anime.coverImage.extraLarge || anime.coverImage.medium}
          alt={anime.title.romaji}
          className="object-cover object-center w-full h-full brightness-[.9] transition duration-500"
          loading="lazy"
          style={{ imageResolution: "from-image 300dpi" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f1b] via-[#0f0f1b]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full px-6 md:px-16 py-10 flex flex-col justify-end md:justify-center max-w-screen-xl mx-auto">
        <p className="text-pink-400 text-sm mb-2">{anime.averageScore || "N/A"}#Spotlight</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
          {anime.title.english || anime.title.romaji}
        </h1>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-sm text-white mb-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="text-xs">🔘</span> {anime.format || "TV"}
          </span>
          <span className="flex items-center gap-1">⏱️ {anime.duration || "?"} min</span>
          <span className="flex items-center gap-1">📅 {airedString}</span>
          <span className="bg-pink-500 text-xs px-2 py-0.5 rounded">HD</span>
          <span className="bg-green-500 text-xs px-2 py-0.5 rounded">
            cc {anime.episodes || "?"}
          </span>
          <span className="bg-blue-600 text-xs px-2 py-0.5 rounded">
            <Volume2 size={12} className="inline-block" /> 8
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-300 max-w-2xl text-sm mb-6 line-clamp-3">
          {anime.description?.replace(/<[^>]+>/g, "")}
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          <a
            href={`/watch/${anime.idMal}`}
            className="bg-pink-400 hover:bg-pink-500 text-white font-semibold text-sm px-6 py-2 rounded-full"
          >
            ▶️ Watch Now
          </a>
          <a
            href={`/anime/${anime.idMal}`}
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

      {/* Dots Navigation for Mobile */}
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
