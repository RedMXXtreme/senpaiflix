import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchResults = () => {
  const query = useQuery().get("query") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get("https://api.jikan.moe/v4/anime", {
          params: { q: query, limit: 20 },
        });
        setResults(response.data.data);
      } catch (error) {
        console.error("Error fetching search results from Jikan API:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

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
    <div className="min-h-screen bg-[#0f0f0f] text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Results for <span className="text-[#ff0055]">"{query}"</span>
      </h1>

      {results.length === 0 ? (
        <p className="text-center text-gray-500 text-lg mt-10">
          No anime found. Try another keyword!
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {results.map((anime) => (
            <div
              key={anime.mal_id}
              onClick={() => navigate(`/anime/${anime.mal_id}`)}
              className="group relative bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-md hover:shadow-[#ff0055]/30 hover:scale-[1.04] transition-all duration-300 cursor-pointer"
            >
              <img
                src={anime.images?.jpg?.image_url}
                alt={anime.title}
                className="w-full h-64 object-cover group-hover:opacity-80 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-70 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute bottom-0 w-full p-3 z-10">
                <h2 className="text-sm font-semibold truncate group-hover:text-[#ff0055] transition-colors">
                  {anime.title}
                </h2>
                <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] font-medium">
                  <span className="bg-green-600/80 px-2 py-[2px] rounded-full">
                    EP {anime.episodes || "?"}
                  </span>
                  <span className="bg-red-700/80 px-2 py-[2px] rounded-full">
                    {anime.type}
                  </span>
                  {anime.rating && (
                    <span className="bg-yellow-600/80 px-2 py-[2px] rounded-full">
                      {anime.rating.replace("R - ", "").replace("PG-", "PG")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
