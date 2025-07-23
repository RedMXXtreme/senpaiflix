import React, { useState } from "react";
import { Link } from "react-router-dom";

const Imbd = () => {
  const [searchTitle, setSearchTitle] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTitle.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const response = await fetch(
        `https://api.imdbapi.dev/search/titles?query=${encodeURIComponent(
          searchTitle
        )}&limit=50`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      if (data.titles && data.titles.length > 0) {
        setResults(data.titles);
      } else {
        setResults([]);
        setError("No results found");
      }
    } catch (err) {
      setError(err.message || "Error fetching data");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">IMDb Search</h1>
      <form
        onSubmit={handleSearch}
        className="w-full max-w-md flex gap-2 mb-6"
        aria-label="Search form"
      >
        <input
          type="text"
          placeholder="Enter title to search"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="flex-grow px-4 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
          aria-label="Search input"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-pink-600 rounded-md hover:bg-pink-700 transition disabled:opacity-50"
          disabled={loading}
          aria-label="Search button"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {results.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", minWidth: "91rem" }}
        >
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-gray-800 rounded-md p-2 shadow-lg flex flex-col items-center"
            >
              <div className="relative w-48 h-64 rounded overflow-hidden">
                {/* Image */}
                {result.primaryImage && result.primaryImage.url ? (
                  <Link to={`/imbd/${result.id}/${result.primaryTitle}`} className="block w-full h-full">
                    <img
                      src={result.primaryImage.url}
                      alt={result.primaryTitle}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="mt-3 text-center text-white font-semibold text-base truncate w-full">
                {result.primaryTitle}
              </h2>

              {/* Type badge */}
              <span className="mt-1 px-2 py-0.5 bg-gray-700 rounded text-xs text-white select-none">
                {result.type ? result.type.toUpperCase() : "N/A"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Imbd;
