import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SeasonSection from "../components/SeasonSelector/SeasonSection";
import Countdowm from "../components/countdown.jsx";
import { fetchAnimeWatch, fetchAnimeRecommendations, fetchEpisodesFromJikan, estimateEpisodes } from "../utils/anilistApi";
import { fetchIframeUrlFromHanimeHentai } from "../utils/streamingApi";

export default function Watch() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episode, setEpisode] = useState(1);
  const [sourceType, setSourceType] = useState("sub");
  const [activeServer, setActiveServer] = useState("HD-1");
  const [releasedEpisodes, setReleasedEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]); // ✅ New: store related seasons
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const episodesPerPage = 100;

  // Calculate pagination
  const totalPages = Math.ceil(releasedEpisodes.length / episodesPerPage);
  const startIndex = (currentPage - 1) * episodesPerPage;
  const endIndex = startIndex + episodesPerPage;
  const currentEpisodes = releasedEpisodes.slice(startIndex, endIndex);

  // Reset to page 1 when episodes change
  useEffect(() => {
    setCurrentPage(1);
  }, [releasedEpisodes]);

  // Fetch anime info + relations
  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const media = await fetchAnimeWatch(id);
        setAnime(media);

        // ✅ Extract and sort seasons from relations
        const related = media.relations.edges
          .filter(edge =>
            ["SEQUEL", "PREQUEL", "ALTERNATIVE"].includes(edge.relationType)
          )
          .map(edge => ({
            id: edge.node.id,
            title: edge.node.title.english || edge.node.title.romaji,
            cover: edge.node.coverImage.large,
            format: edge.node.format,
            season: edge.node.season,
            year: edge.node.seasonYear,
            relation: edge.relationType,
          }))
          .sort((a, b) => (a.year || 0) - (b.year || 0));

        // Include current anime as Season 1
        const allSeasons = [
          {
            id: media.id,
            title: media.title.english || media.title.romaji,
            cover: media.coverImage.large,
            format: media.format,
            season: media.season,
            year: media.seasonYear,
            relation: "CURRENT",
          },
          ...related,
        ];
        setSeasons(allSeasons);

        // Get ALL episodes (not just released ones)
        let allEpisodes = [];

        // Priority 1: Use total episode count if available
        if (media.episodes !== null && media.episodes > 0) {
          allEpisodes = Array.from({ length: media.episodes }, (_, i) => i + 1);
          console.log(`Showing all ${media.episodes} episodes`);
        } 
        // Priority 2: Check airing schedule for episode count
        else if (media.airingSchedule && media.airingSchedule.nodes && media.airingSchedule.nodes.length > 0) {
          const maxEpisode = Math.max(...media.airingSchedule.nodes.map(node => node.episode));
          allEpisodes = Array.from({ length: maxEpisode }, (_, i) => i + 1);
          console.log(`Found ${maxEpisode} episodes from airing schedule`);
        } 
        // Priority 3: Try Jikan API if we have MAL ID
        else if (media.idMal) {
          console.log(`Attempting to fetch episodes from Jikan API for MAL ID: ${media.idMal}`);
          const jikanEpisodes = await fetchEpisodesFromJikan(media.idMal);
          if (jikanEpisodes && jikanEpisodes.length > 0) {
            allEpisodes = jikanEpisodes;
            console.log(`Found ${jikanEpisodes.length} episodes from Jikan API`);
          }
        }
        
        // Final fallback: estimate based on format and status
        if (allEpisodes.length === 0) {
          console.log(`No episode data found, estimating based on format: ${media.format}, status: ${media.status}`);
          allEpisodes = estimateEpisodes(media.format, media.status);
          console.log(`Estimated ${allEpisodes.length} episodes`);
        }

        setReleasedEpisodes(allEpisodes);

        // Fetch recommendations
        const recs = await fetchAnimeRecommendations(id);
        setRecommendations(recs.filter(rec => rec));
        setIsRecommendationsLoading(false);
      } catch (err) {
        console.error("AniList fetch error:", err);
        setIsRecommendationsLoading(false);
      }
    };

    fetchAnime();
  }, [id]);

  const slugify = (str = "") =>
    str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

  // Check if anime is hentai
  const isHentai = anime?.genres?.includes("Hentai");

  // Set default source type for hentai
  useEffect(() => {
    if (isHentai) {
      setSourceType("hentai");
      setActiveServer("HD-1");
    }
  }, [isHentai]);

  // Fetch iframe URL for hentai
  useEffect(() => {
    if (isHentai && anime && episode) {
      const fetchUrl = async () => {
        setIsIframeLoading(true);
        try {
          const slug = slugify(anime.title?.english || anime.title?.romaji || "");
          const url = await fetchIframeUrlFromHanimeHentai(slug, episode);
          setIframeUrl(url);
        } catch (error) {
          console.error("Failed to fetch hentai iframe URL:", error);
          setIframeUrl(null);
        } finally {
          setIsIframeLoading(false);
        }
      };
      fetchUrl();
    } else {
      setIframeUrl(null);
    }
  }, [isHentai, anime, episode]);

  const getIframeUrl = () => {
    if (isHentai) {
      return iframeUrl || "";
    }

    const slug = slugify(anime?.title?.english || anime?.title?.romaji || "");
    const ep = episode;
    const aniId = anime?.id;

    if (sourceType === "sub") {
      switch (activeServer) {
        case "HD-1":
          return `https://vidsrc.cc/v2/embed/anime/ani${aniId}/${ep}/sub`;
        case "HD-2":
          return `https://player.videasy.net/anime/${aniId}/${ep}?dub=false`;
        case "HD-3":
          return `https://vidnest.fun/anime/${aniId}/${ep}/sub`;
        case "HD-4":
          return `https://vidnest.fun/animepahe/${aniId}/${ep}/sub`;
        default:
          return "";

          
      }
    } else if (sourceType === "dub") {
      switch (activeServer) {
        case "HD-1":
          return `https://vidsrc.cc/v2/embed/anime/ani${aniId}/${ep}/dub`;
        case "HD-2":
          return `https://player.videasy.net/anime/${aniId}/${ep}?dub=true`;
        case "HD-3":
          return `https://vidnest.fun/anime/${aniId}/${ep}/dub`;

      }
    } else if (sourceType === "hindi") {
      switch (activeServer) {
        case "HD-1":
          return `https://vidnest.fun/anime/${aniId}/${ep}/satoru`;
        case "HD-2":
          return `https://vidnest.fun/anime/${aniId}/${ep}/hindi`;
        default:
          return "";
      }
    }
  };

  if (!anime)
    return (
      <div className="relative min-h-screen font-inter text-white bg-[#0b0b0b] overflow-hidden">
        {/* Blurred gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-[#0b0b0b] to-black opacity-40 blur-3xl"></div>
        <div className="relative z-10 py-4 text-sm text-gray-300 flex items-center gap-1">
          <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
          <span className="text-gray-500">/</span>
          <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
          <span className="text-gray-500">/</span>
          <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
        </div>
        <div className="relative flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto p-4 z-10">
          {/* Left Sidebar Skeleton */}
          <div className="w-full md:w-[20%] bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
            <div className="h-6 bg-gray-700 rounded mb-3 animate-pulse"></div>
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          {/* Middle Section Skeleton */}
          <div className="flex-1">
            <div className="aspect-video bg-gray-700 rounded-2xl animate-pulse"></div>
            <div className="mt-4 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="mt-5 bg-[#141414]/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <div className="flex flex-wrap gap-3 items-center mb-3">
                <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-700 rounded w-12 animate-pulse"></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 items-center mb-3">
                <div className="h-4 bg-gray-700 rounded w-8 animate-pulse"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-700 rounded w-12 animate-pulse"></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="h-4 bg-gray-700 rounded w-12 animate-pulse"></div>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-700 rounded w-12 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          {/* Right Sidebar Skeleton */}
          <div className="w-full md:w-[25%] bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
            <div className="h-48 bg-gray-700 rounded-xl mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="flex flex-wrap gap-2 mb-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-6 bg-gray-700 rounded w-12 animate-pulse"></div>
              ))}
            </div>
            <div className="space-y-2 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-10 bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
            <div className="text-center">
              <div className="h-8 bg-gray-700 rounded w-16 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-20 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );

  const bgGradient = anime.coverImage.color
    ? `from-[${anime.coverImage.color}]`
    : "from-pink-600";

  return (
    <div className="relative min-h-screen font-inter text-white bg-[#0b0b0b] overflow-hidden">
      {/* Blurred gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${bgGradient} via-[#0b0b0b] to-black opacity-40 blur-3xl`}
      ></div>
           <div className="relative z-10 py-4 text-sm text-gray-300 flex items-center gap-1">
  <Link
    to="/home"
    className="text-pink-400 hover:text-pink-500 transition-colors duration-200"
  >
    Home
  </Link>
  <span className="text-gray-500">/</span>
  <Link
    to={`/anime/${anime.id}`}
    className="text-pink-400 hover:text-pink-500 transition-colors duration-200 truncate max-w-[150px]"
    title={anime.title.english || anime.title.romaji}
  >
    {anime.title.english || anime.title.romaji}
  </Link>
  <span className="text-gray-500">/</span>
  <span className="text-white font-semibold">Episode {episode}</span>
</div>

      <div className="relative flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto p-4 z-10">
        {/* --- Left Sidebar (Episodes) --- */}
        <div className="w-full md:w-[20%] bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
          <h2 className="text-lg font-semibold mb-3">Episodes</h2>
          
          {/* Pagination Controls - Top */}
          {totalPages > 1 && releasedEpisodes.length > 0 && (
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="Find"
            className="w-full mb-3 px-3 py-2 rounded-md bg-[#1e1e1e] text-sm outline-none focus:ring-1 focus:ring-pink-500"
          />
          <div className="max-h-[500px] overflow-y-auto pr-1 custom-scroll">
            {releasedEpisodes.length > 0 ? (
              <>
                {currentEpisodes.map((ep) => (
                  <button
                    key={ep}
                    onClick={() => setEpisode(ep)}
                    className={`w-full text-left px-3 py-2 mb-2 rounded-lg font-medium transition-all ${
                      episode === ep
                        ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.6)]"
                        : "bg-[#1e1e1e] hover:bg-[#2a2a2a]"
                    }`}
                  >
                    Episode {ep}
                  </button>
                ))}
                {/* Pagination Controls - Bottom */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded disabled:opacity-50 text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded disabled:opacity-50 text-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm">No episodes released yet.</p>
            )}
          </div>
        </div>

        {/* --- Middle Section (Player + Controls) --- */}
        <div className="flex-1">
          {/* Player */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(236,72,153,0.3)] border border-white/10">
            {getIframeUrl() ? (
              <iframe
                src={getIframeUrl()}
                allowFullScreen
                className="w-full h-full"
                title="Anime Player"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-lg font-semibold">
                Stream not available
              </div>
            )}
          </div>

          {/* Episode Info */}
          <div className="mt-4 bg-[#c7365f] text-center p-3 rounded-lg shadow-[0_0_10px_rgba(236,72,153,0.5)]">
            <p className="text-sm">
              You are Watching <strong>Episode {episode}</strong> <br />
              If current server doesn’t work, please try other servers beside.
            </p>
          </div>

          {/* Server Buttons */}
          <div className="mt-5 bg-[#141414]/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            {isHentai ? (
              <div className="flex flex-wrap gap-3 items-center">
                <span className="font-semibold">HENTAI:</span>
                <button
                  onClick={() => {
                    setActiveServer("HD-1");
                    setSourceType("hentai");
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                    activeServer === "HD-1" && sourceType === "hentai"
                      ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                      : "bg-[#222] hover:bg-[#333]"
                  }`}
                >
                  HD-1
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <span className="font-semibold">SUB:</span>
                  {["HD-1", "HD-2", "HD-3","HD-4"].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setActiveServer(s);
                        setSourceType("sub");
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                        activeServer === s && sourceType === "sub"
                          ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                          : "bg-[#222] hover:bg-[#333]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <span className="font-semibold">DUB:</span>
                  {["HD-1", "HD-2", "HD-3"].map((s) => (
                    <button
                      key={`${s}-dub`}
                      onClick={() => {
                        setActiveServer(s);
                        setSourceType("dub");
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                        activeServer === s && sourceType === "dub"
                          ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                          : "bg-[#222] hover:bg-[#333]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <span className="font-semibold">HINDI:</span>
                  {["HD-1", "HD-2"].map((s) => (
                    <button
                      key={`${s}-hindi`}
                      onClick={() => {
                        setActiveServer(s);
                        setSourceType("hindi");
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                        activeServer === s && sourceType === "hindi"
                          ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                          : "bg-[#222] hover:bg-[#333]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* ✅ Seasons Section */}
          <div className="mt-6">
            <SeasonSection animeId={anime.id} />
          </div>
          {/* ✅ Countdown Component */}
          <div className="mt-6">
            <Countdowm title={anime.title.romaji} />
          </div>
        </div>
        {/* --- Right Sidebar (Anime Info) --- */}
        <div className="w-full md:w-[25%] bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
          <img
            src={anime.coverImage.large}
            alt={anime.title.romaji}
            className="rounded-xl mb-4"
          />
          <h2 className="text-lg font-semibold mb-2">
            {anime.title.english || anime.title.romaji}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs mb-3">
            <span className="bg-gray-800 px-2 py-1 rounded">TV</span>
            <span className="bg-gray-800 px-2 py-1 rounded">HD</span>
            <span className="bg-gray-800 px-2 py-1 rounded">
              {anime.duration} min/ep
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-4 line-clamp-6">
            {anime.description?.replace(/<[^>]+>/g, "")}
          </p>
          <Link
            to={`/anime/${anime.id}`}
            className="block text-center bg-pink-600 hover:bg-pink-700 transition px-4 py-2 rounded-lg font-semibold mb-4 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
          >
            View Details
          </Link>

          <div className="text-center mt-4">
            <p className="text-2xl font-bold">
              {(anime.averageScore / 10).toFixed(1)}
            </p>
            <p className="text-sm text-gray-400">Vote now</p>
          </div>
        </div>
      </div>
{/* --- Recommendations Section --- */}
{(recommendations.length > 0 || isRecommendationsLoading) && (
  <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-8 mt-10 
                  bg-[#141414]/80 backdrop-blur-lg rounded-2xl 
                  border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
    <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white tracking-wide flex items-center gap-2">
      <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
      Recommendations
    </h2>

    {/* Responsive grid setup */}
    <div
      className="
        grid gap-4 sm:gap-5 md:gap-6
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8
      "
    >
      {isRecommendationsLoading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl bg-[#1c1c1c]">
            <div className="relative">
              <div className="w-full h-48 sm:h-56 md:h-60 lg:h-64 bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="absolute bottom-2 left-2 right-2 text-center text-xs sm:text-sm md:text-base font-semibold text-white leading-tight">
                <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))
      ) : (
        recommendations.map((rec) => (
          <Link
            key={rec.id}
            to={`/anime/${rec.id}`}
            className="
              group relative overflow-hidden rounded-xl
              bg-[#1c1c1c] transition-all duration-300
              hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]
            "
          >
            <div className="relative">
              <img
                src={rec.cover}
                alt={rec.title}
                className="
                  w-full h-48 sm:h-56 md:h-60 lg:h-64
                  object-cover rounded-xl
                  transition-transform duration-500 group-hover:scale-110
                "
              />
              <div className="absolute inset-0 bg-gradient-to-t
                              from-black/80 via-black/20 to-transparent
                              opacity-0 group-hover:opacity-100
                              transition-opacity duration-500"></div>
              <div className="absolute bottom-2 left-2 right-2
                              text-center text-xs sm:text-sm md:text-base
                              font-semibold text-white leading-tight">
                {rec.title ? (rec.title.length > 40 ? rec.title.slice(0, 40) + "..." : rec.title) : "Unknown Title"}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  </div>
)}


    </div>
  );
}
