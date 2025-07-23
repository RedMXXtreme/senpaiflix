import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";

const ImbdPlayer = () => {
  const { id } = useParams();
  const [type, setType] = useState("tv");
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");

  let iframeUrl = `https://vidsrc.xyz/embed/${type}?imdb=${id}&ds_lang=de`;
  if (type === "tv") {
    if (season) {
      iframeUrl += `&season=${season}`;
    }
    if (episode) {
      iframeUrl += `&episode=${episode}`;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">IMDb Player</h1>
      <p className="mb-4">
        Now playing title with ID: <span className="font-mono">{id}</span>
      </p>
      <div className="mb-4 flex space-x-4 items-center">
        <label htmlFor="type" className="mr-2">
          Type:
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-black p-1 rounded"
        >
          <option value="movie">Movie</option>
          <option value="tv">TV</option>
        </select>
        {type === "tv" && (
          <>
            <label htmlFor="season" className="ml-4 mr-2">
              Season:
            </label>
            <input
              id="season"
              type="number"
              min="1"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="text-black p-1 rounded w-16"
              placeholder="1"
            />
            <label htmlFor="episode" className="ml-4 mr-2">
              Episode:
            </label>
            <input
              id="episode"
              type="number"
              min="1"
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              className="text-black p-1 rounded w-16"
              placeholder="1"
            />
          </>
        )}
      </div>
      <Link to="/imbd" className="text-pink-500 hover:underline mb-4">
        Back to Search
      </Link>

      <iframe
        src={iframeUrl}
        frameBorder="0"
        allowFullScreen
        width="100%"
        height="100%"
        title="IMDb Player"
        className="rounded-lg shadow-lg"
        style={{ aspectRatio: "16/9" }} // Maintain 16:9 aspect
      ></iframe>
    </div>
  );
};

export default ImbdPlayer;
