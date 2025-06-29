import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

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
          params: {
            q: query,
            limit: 20,
          },
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

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!query) return <div className="p-4 text-center">Please enter a search query.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
      {results.length === 0 ? (
        <p className="text-center text-gray-400">No results found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {results.map((anime) => (
            <div
              key={anime.mal_id}
              onClick={() => navigate(`/anime/${anime.mal_id}`)}
              className="cursor-pointer group relative rounded-xl overflow-hidden bg-[#111] hover:scale-105 transition transform duration-300"
            >
              <img
                src={anime.images?.jpg?.image_url}
                alt={anime.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-2">
                <h2 className="text-sm font-semibold truncate">{anime.title}</h2>
                <div className="flex flex-wrap items-center gap-1 mt-1 text-xs text-white">
                  <span className="bg-green-600 px-2 py-0.5 rounded-full">
                    {anime.episodes || "?"}
                  </span>
                  <span className="bg-red-700 px-2 py-0.5 rounded-full">
                    {anime.type}
                  </span>
                  {anime.rating && (
                    <span className="bg-yellow-600 px-2 py-0.5 rounded-full">
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
