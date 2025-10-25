import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchAnimeSearch } from "../utils/anilistApi";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 2) {
      try {
        const results = await fetchAnimeSearch(value);
        setResults(results);
      } catch (error) {
        console.error("Error fetching from AniList API:", error);
        setResults([]);
      }
    } else {
      setResults([]);
    }
  };

  return (
    <div className="relative flex flex-col w-80" style={{ zIndex: 9999, width: "31rem" }}>
      <div className="flex items-center border border-gray-700 rounded-md overflow-hidden bg-[#1a1a2e]">
        <input
          type="text"
          placeholder="Search anime..."
          value={query}
          onChange={handleSearch}
          className="w-full px-4 py-2 pr-10 text-white bg-transparent placeholder-gray-500 focus:outline-none"
          style={{ position: "relative", zIndex: 10000 }}
        />
        {/* Search Icon */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 pointer-events-none"
          style={{ zIndex: 10000, right: "5rem" }}
        >
          <svg
            className="w-5 h-5 text-pink-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Filter Button */}
        <Link
          to="/filter"
          className="hover:opacity-80 text-white absolute right-1 font-semibold px-3 py-1 rounded border border-pink-500 hover:bg-pink-600 transition"
          style={{ zIndex: 10000, right: "0.5rem" }}
        >
          Filter
        </Link>
      </div>

      {results.length > 0 && (
        <ul
          className="absolute bg-[#1a1a2e] text-white w-full max-w-full rounded max-h-[60vh] overflow-auto shadow-lg"
          style={{ zIndex: 10000, marginTop: "3.25rem" }}
        >
          {results.map((anime) => (
            <li
              key={anime.id}
              onClick={() => {
                navigate(`/anime/${anime.id}`);
                setQuery("");
                setResults([]);
              }}
              className="flex items-center gap-3 p-2 hover:bg-gray-700 cursor-pointer"
            >
              {/* Thumbnail */}
              <img
                src={anime.coverImage?.large}
                alt={anime.title.english || anime.title.romaji}
                className="w-12 h-16 object-cover rounded"
              />

              {/* Info */}
              <div className="flex flex-col flex-grow">
                <span className="font-semibold text-white">
                  {anime.title.english || anime.title.romaji}
                </span>
                <div className="flex flex-wrap gap-1 mt-1 text-xs text-gray-300">
                  <span>
                    {anime.description
                      ? anime.description.replace(/<[^>]+>/g, "").slice(0, 50) + "..."
                      : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1 text-xs text-gray-400">
                  <span>{anime.seasonYear || "?"}</span>
                  <span>•</span>
                  <span>{anime.format || "?"}</span>
                  <span>•</span>
                  <span>{anime.duration ? `${anime.duration}m` : "?"}</span>
                </div>
              </div>
            </li>
          ))}
          <li
            onClick={() => {
              navigate(`/search?query=${query}`);
              setQuery("");
              setResults([]);
            }}
            className="p-2 mt-2 text-center text-sm font-semibold text-pink-500 hover:underline cursor-pointer"
          >
            View all results &rarr;
          </li>
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
