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

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();

      if (data.titles && data.titles.length > 0) {
        setResults(data.titles);
      } else {
        setError("No results found");
      }
    } catch (err) {
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">IMDb Search</h1>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
      >
        <input
          type="text"
          placeholder="Enter title to search"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="flex-grow px-4 py-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-pink-600 rounded-md hover:bg-pink-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid gap-4 sm:gap-6 w-full max-w-7xl px-2 sm:px-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col items-center p-2"
            >
              <div className="relative w-full h-64 sm:h-72 overflow-hidden rounded">
                {result.primaryImage?.url ? (
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

              <h2 className="mt-2 text-center font-medium text-sm sm:text-base truncate w-full px-1">
                {result.primaryTitle}
              </h2>

              <span className="mt-1 px-2 py-0.5 bg-gray-700 rounded text-xs text-white">
                {result.type?.toUpperCase() || "N/A"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Imbd;
