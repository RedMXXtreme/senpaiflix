import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";

const ImbdPlayer = () => {
  const { id } = useParams();
  const [type, setType] = useState("tv");
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");
  const [domain, setDomain] = useState("vidsrc.xyz"); // default domain

  // Construct iframe URL dynamically
  let iframeUrl = `https://${domain}/embed/${type}?imdb=${id}&ds_lang=de`;
  if (type === "tv") {
    if (season) iframeUrl += `&season=${season}`;
    if (episode) iframeUrl += `&episode=${episode}`;
  }

  const domains = ["vidsrc.in", "vidsrc.pm", "vidsrc.xyz", "vidsrc.net"];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">IMDb Player</h1>
      <p className="mb-4 text-center text-sm">
        Now playing IMDb ID: <span className="font-mono text-pink-400">{id}</span>
      </p>

      {/* Type, Season, Episode Selection */}
      <div className="mb-6 flex flex-wrap justify-center gap-4 items-center">
        <div>
          <label htmlFor="type" className="mr-2">Type:</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-black p-1 rounded"
          >
            <option value="movie">Movie</option>
            <option value="tv">TV</option>
          </select>
        </div>

        {type === "tv" && (
          <>
            <div>
              <label htmlFor="season" className="mr-2">Season:</label>
              <input
                id="season"
                type="number"
                min="1"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="text-black p-1 rounded w-16"
                placeholder="1"
              />
            </div>

            <div>
              <label htmlFor="episode" className="mr-2">Episode:</label>
              <input
                id="episode"
                type="number"
                min="1"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                className="text-black p-1 rounded w-16"
                placeholder="1"
              />
            </div>
          </>
        )}
      </div>

      {/* Domain Switcher */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {domains.map((d) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-4 py-1 rounded-md border ${
              domain === d
                ? "bg-pink-600 text-white border-pink-700"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            } transition`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Back Button */}
      <Link to="/imbd" className="text-pink-400 hover:underline mb-4">
        ← Back to Search
      </Link>

      {/* Iframe Player */}
      <div className="w-full max-w-6xl aspect-video mb-6">
        <iframe
          src={iframeUrl}
          frameBorder="0"
          allowFullScreen
          title="IMDb Player"
          className="w-full h-full rounded-lg shadow-lg"
        ></iframe>
      </div>
    </div>
  );
};

export default ImbdPlayer;
