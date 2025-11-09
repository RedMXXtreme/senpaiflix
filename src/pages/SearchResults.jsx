import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom";
import { FaPlay, FaClosedCaptioning } from "react-icons/fa";
import { MdSubtitles } from "react-icons/md";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`https://steller-tau.vercel.app/meta/anilist/${query}?page=${currentPage}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const data = await response.json();
        setResults(data.results || []);
        setHasNextPage(data.hasNextPage || false);
      } catch (error) {
        console.error("Error fetching search results from API:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300 text-lg font-medium">
        Loading anime results...
      </div>
    );

  if (!query)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-lg">
        Please enter a search query.
      </div>
    );

  return (
    <section className="p-4 md:p-6">
      {/* Header + Pagination */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <div className="flex flex-col items-center md:items-start gap-4">
          <h1 className="text-white text-xl md:text-2xl font-bold">
            Results for <span className="text-[#ff0055]">"{query}"</span>
          </h1>

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
      ) : results.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-10">
          No anime found. Try another keyword!
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {results.map((anime) => (
            <Link
              key={anime.id}
              to={`/anime/${anime.id}`}
              className="w-full max-w-[180px] mx-auto bg-[#0f1117] rounded-2xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-300"
            >
              <div className="relative">
                <img
                  src={anime.image}
                  alt={anime.title.userPreferred || anime.title.romaji}
                  className="w-full h-[200px] sm:h-[220px] md:h-[250px] object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <FaPlay className="text-green-400" /> {anime.type || "TV"}
                </div>
              </div>

              <div className="p-2">
                <h3 className="text-white text-xs sm:text-sm font-semibold leading-tight line-clamp-2">
                  {anime.title.userPreferred || anime.title.romaji}
                </h3>

                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MdSubtitles className="text-green-400" />{" "}
                    {anime.totalEpisodes || "?"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaClosedCaptioning className="text-green-400" />{" "}
                    {anime.releaseDate || "?"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom Pagination */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Prev Button */}
          <button
            onClick={() => {
              const newPage = Math.max(1, currentPage - 1);
              setCurrentPage(newPage);
              setSearchParams({ query, page: newPage.toString() });
            }}
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
            onClick={() => {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
              setSearchParams({ query, page: newPage.toString() });
            }}
            disabled={!hasNextPage}
            className={`flex items-center gap-1 px-3 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-all duration-200
              ${!hasNextPage
                ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md hover:shadow-lg"
              }`}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default SearchResults;
