import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

// Constants
const VIDEO_URLS = [
  "https://motionbgs.com/media/8760/zenitsu-white.960x540.mp4",
  "https://motionbgs.com/media/8800/itachi-uchiha-crimson-rainfall.960x540.mp4",
  "https://motionbgs.com/media/8752/blade-of-the-rising-sun.960x540.mp4",
  "https://motionbgs.com/media/392/son-goku-ultra-power.960x540.mp4",
  "https://motionbgs.com/media/1402/goku-unleashed.960x540.mp4",
  "https://motionbgs.com/media/8742/smiling-professor-blue-archive.960x540.mp4",
  "https://v1.pinimg.com/videos/mc/720p/f6/3b/b8/f63bb8d17fe2c624412287df221a076b.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/9c/2f/09/9c2f095e92dffd9848338e3cc500821d_720w.mp4",
  "https://v1.pinimg.com/videos/iht/720p/c4/ef/6f/c4ef6f8f2ca196e430b0a37c97aa629a.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/05/40/70/054070ffa0eb0314cf3d9f80a271abf4_720w.mp4",
  "https://v1.pinimg.com/videos/mc/720p/92/e6/0f/92e60f0b442860324b155fe025b2d1eb.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/98/1f/f9/981ff96105c30c7dbe25b7f6cf203ad9_720w.mp4",
  "https://v1.pinimg.com/videos/mc/720p/91/72/6a/91726ac4a96b0a57002d17a4946909f4.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/dd/25/4a/dd254ade1aa50158926b43446fa5c19a_720w.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/a6/99/d1/a699d16895becaa353e3a540112f30a2_720w.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/51/5f/9f/515f9f9615d37a06e78c3ef2fca95a17_720w.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/d3/a8/e8/d3a8e8880e76819d559a222bd308e0bd_720w.mp4",
  "https://v1.pinimg.com/videos/mc/720p/4d/57/4a/4d574af08afe8c677c017df133a65c7c.mp4",
  "https://v1.pinimg.com/videos/iht/expMp4/46/73/4c/46734c1ea7f46d68bb2137be5e9383d8_720w.mp4",
  
];

const TRENDING_ANIME_QUERY = `
  query {
    Page(perPage: 6) {
      media(sort: TRENDING_DESC, type: ANIME) {
        id
        title { romaji english }
      }
    }
  }
`;

const ANILIST_API_URL = "https://graphql.anilist.co";

const FrontPage = () => {
  const navigate = useNavigate();
  const [topSearches, setTopSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize random video selection to avoid unnecessary re-renders
  const randomVideoUrl = useMemo(() => {
    if (VIDEO_URLS.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * VIDEO_URLS.length);
    return VIDEO_URLS[randomIndex];
  }, []); // Empty dependency array - only compute once on mount

  // Handle video load error by falling back to a default or next video
  const handleVideoError = useCallback((e) => {
    console.warn("Video failed to load:", e);
    // Could implement fallback logic here if needed
  }, []);

  // Fetch trending anime with proper error handling
  const fetchTrendingAnime = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(ANILIST_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ query: TRENDING_ANIME_QUERY })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors[0].message);
      }

      if (!json.data?.Page?.media) {
        throw new Error("Invalid response structure");
      }

      setTopSearches(json.data.Page.media);
    } catch (err) {
      console.error("Failed to fetch trending anime:", err);
      setError(err.message || "Failed to load trending anime");
      setTopSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendingAnime();
  }, [fetchTrendingAnime]);

  // Helper components
  const TopSearchButtons = React.memo(() => {
    if (isLoading) {
      return (
        <div className="flex gap-2 flex-wrap justify-center mb-6 px-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse bg-white/10 rounded-full px-3 py-1.5 h-8 w-20"></div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="mb-6 px-4 text-red-400 text-sm">
          Failed to load trending anime. Please try again later.
        </div>
      );
    }

    return (
      <div className="flex gap-2 flex-wrap justify-center mb-6 px-4">
        {topSearches.map(a => (
          <button
            key={a.id}
            onClick={() => navigate(`/anime/${a.id}`)}
            className="
              text-xs md:text-sm
              px-3 py-1.5
              rounded-full
              bg-white/12
              backdrop-blur-sm
              border border-white/10
              text-gray-200
              hover:bg-green-500/50
              hover:text-white
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            disabled={!a.id}
            aria-label={`View details for ${a.title?.english || a.title?.romaji || "Unknown anime"}`}
          >
            {(a.title?.english || a.title?.romaji || "Unknown anime")
         .slice(0, 30) + ((a.title?.english || a.title?.romaji || "Unknown anime").length > 30 ? "..." : "")}
   
          </button>
        ))}
      </div>
    );
  });

  const ShareButtons = React.memo(() => (
    <div className="flex gap-3 mt-6 flex-wrap">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
        aria-label="Share on social media"
      >
        1k
      </button>
      <button
        className="bg-black hover:bg-gray-800 text-white px-3 py-2 rounded transition-colors"
        aria-label="Share on social media"
      >
        1.5k
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors"
        aria-label="Share on social media"
      >
        923
      </button>
      <button
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
        aria-label="Share on social media"
      >
        3.3k
      </button>
      <button
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
        aria-label="Share on social media"
      >
        236
      </button>
    </div>
  ));

  const InfoSection = React.memo(() => (
    <div className="max-w-4xl mt-10 text-left text-gray-300 space-y-6 px-2 md:px-0">
      <h2 className="text-2xl font-bold text-white uppercase">
        THE BEST SITE TO WATCH ANIME ONLINE FOR FREE
      </h2>
      <p>
        Anime is not just about stories drawn with pen strokes; it's a gateway to worlds full of emotions and creativity...
      </p>
      <h3 className="text-lg text-white font-bold">1. What is SenpaiFlix?</h3>
      <p>
        SenpaiFlix Lib is a free anime streaming site where you can watch anime in HD quality...
      </p>
      <h3 className="text-lg text-white font-bold">2. What makes SenpaiFlix the best site to watch anime free online?</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Safety</li>
        <li>Content Library</li>
        <li>Quality/Resolution</li>
        <li>Streaming experience</li>
        <li>Updates</li>
        <li>User interface</li>
        <li>Device Compatibility</li>
      </ul>
      <h3 className="text-lg text-white font-bold">3. How does SenpaiFlix compare to 9Anime, AnimeVibe, HiAnime, and GogoAnime?</h3>
      <p>
        We have a larger library than HiAnime and Gogo...
      </p>
      <p>
        Thank you!
      </p>
    </div>
  ));

  return (
    <div className="text-white min-h-screen flex flex-col items-center justify-start px-4 md:pt-16" style={{ fontFamily: "Poppins, sans-serif", paddingTop: "9rem" }}>
      {/* Header Section */}
      <div className="relative w-full max-w-6xl rounded-2xl overflow-hidden text-center">
        {/* Background */}
        <div className="absolute inset-0 z-0 grid grid-cols-6 gap-0 h-full">
          <video
            src={randomVideoUrl}
            type="video/mp4"
            className="col-span-6 w-full h-full object-cover"
            autoPlay
            loop
            muted
            onError={handleVideoError}
            preload="metadata"
            playsInline
          />
        </div>

        {/* Overlay */}
        <div className="relative z-10 px-4 py-20 bg-black/70 rounded-2xl">
          {/* Logo */}
          <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-4">
            Senpai<span className="text-white">Flix</span>
          </h1>

          {/* Search bar */}
          <div className="relative flex justify-center items-center max-w-xl mx-auto mb-4">
            <SearchBar
              placeholder="Search anime"
              className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              aria-label="Search for anime"
            />
          </div>

          {/* Top search */}
          <TopSearchButtons />

          {/* Watch now */}
          <button
            onClick={() => navigate("/home")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label="Navigate to home page to start watching anime"
          >
            WATCH NOW
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <ShareButtons />

      {/* Info Section */}
      <InfoSection />
    </div>
  );
};

export default FrontPage;
