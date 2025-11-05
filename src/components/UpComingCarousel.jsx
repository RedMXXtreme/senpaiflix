import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlay, FaClosedCaptioning } from "react-icons/fa";
import { MdSubtitles } from "react-icons/md";

const TABS = [
  { label: "All", code: "ALL" },
  { label: "Japan", code: "JP" },
  { label: "China", code: "CN" },
  { label: "South Korea", code: "KR" },
];

const UpComingCarousel = () => {
  const [animeList, setAnimeList] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLatest();
  }, [activeTab, currentPage]);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const filter =
        activeTab !== "ALL" ? `, countryOfOrigin: ${JSON.stringify(activeTab)}` : "";

      const query = `
      query {
        Page(page: ${currentPage}, perPage: 20) {
          media(sort: POPULARITY_DESC, type: ANIME${filter}) {
            id
            title {
              romaji
              english
            }
            coverImage {
              large
            }
            countryOfOrigin
            episodes
            format
            type
            status
          }
        }
      }`;

      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        setAnimeList([]);
      } else {
        setAnimeList(data?.data?.Page?.media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4 md:p-6">
      {/* Header + Tabs */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className="flex flex-col items-center md:items-start gap-4">
          <h2 className="text-white text-xl md:text-2xl font-bold">LATEST UPDATES</h2>
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {/* Prev Button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all duration-200
                ${currentPage === 1
                  ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md hover:shadow-lg"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>

            {/* Page Indicator */}
            <span className="text-white bg-gray-800 px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold shadow-inner select-none">
              Page {currentPage}
            </span>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-sm md:text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                hover:from-indigo-500 hover:to-purple-500 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 text-gray-400">
          {TABS.map((tab) => (
            <button
              key={tab.code}
              className={`text-xs md:text-sm font-medium ${
                activeTab === tab.code
                  ? "text-green-400 border-b-2 border-green-400"
                  : "hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.code)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loader or Anime Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="w-full max-w-[180px] mx-auto rounded-2xl overflow-hidden bg-[#0f1117]"
            >
              <div className="relative h-[200px] sm:h-[220px] md:h-[250px] w-full overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1b1d25] via-[#2a2d37] to-[#1b1d25] animate-shimmer bg-[length:200%_100%]" />
              </div>
              <div className="p-2">
                <div className="h-3 bg-[#2a2d37] rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-[#2a2d37] rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {animeList.map((anime) => (
            <Link
              key={anime.id}
              to={`/anime/${anime.id}`}
              className="w-full max-w-[180px] mx-auto bg-[#0f1117] rounded-2xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-300"
            >
              <div className="relative">
                <img
                  src={anime.coverImage.large}
                  alt={anime.title.english || anime.title.romaji}
                  className="w-full h-[200px] sm:h-[220px] md:h-[250px] object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <FaPlay className="text-green-400" /> {anime.format || "TV"}
                </div>
              </div>

              <div className="p-2">
                <h3 className="text-white text-xs sm:text-sm font-semibold leading-tight line-clamp-2">
                  {anime.title.english || anime.title.romaji}
                </h3>

                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MdSubtitles className="text-green-400" />{" "}
                    {anime.episodes || "?"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaClosedCaptioning className="text-green-400" />{" "}
                    {anime.countryOfOrigin}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default UpComingCarousel;
