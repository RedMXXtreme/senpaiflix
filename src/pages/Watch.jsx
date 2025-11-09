import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Countdowm from "../components/countdown.jsx";
import SeasonsSection from "../components/SeasonsSection.jsx";
import Loader from "../components/Loader.jsx";
import { fetchAnimeWatch, fetchAnimeRecommendations, fetchAnimeInfoFromSteller } from "../utils/anilistApi";
import { fetchIframeUrlFromHanimeHentai, fetchIframeUrlFromWatchHentai, fetchTMDBId } from "../utils/streamingApi";

export default function Watch() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episode, setEpisode] = useState(1);
  const [sourceType, setSourceType] = useState("sub");
  const [activeServer, setActiveServer] = useState("HD-1");
  const [releasedEpisodes, setReleasedEpisodes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [tmdbId, setTmdbId] = useState(null);
  const [stellerEpisodes, setStellerEpisodes] = useState([]);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(true);
  const [relations, setRelations] = useState([]);
  const [seasons, setSeasons] = useState([]);
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


        // Fetch TMDB ID
        const query = media.title.english || media.title.romaji;
        const tmdb = await fetchTMDBId(query);
        setTmdbId(tmdb);

        // Fetch episodes from Steller API
        let stellerData = null;
        try {
          stellerData = await fetchAnimeInfoFromSteller(id);
          if (stellerData.episodes && Array.isArray(stellerData.episodes)) {
            setStellerEpisodes(stellerData.episodes);
            console.log(`Fetched ${stellerData.episodes.length} episodes from Steller API`);
          }
        } catch (error) {
          console.error("Failed to fetch episodes from Steller API:", error);
        } finally {
          setIsEpisodesLoading(false);
        }

        // Set relations from Steller API
        if (stellerData && stellerData.relations && Array.isArray(stellerData.relations)) {
          setRelations(stellerData.relations);
        }

        // Fetch seasons from Zorime API
        if (stellerData && stellerData.episodes && stellerData.episodes.length > 0) {
          const firstEpisodeId = stellerData.episodes[0].id;
          if (firstEpisodeId && firstEpisodeId.includes('$episode$')) {
            const animeId = firstEpisodeId.split('$episode$')[0];
            try {
              const seasonsResponse = await fetch(`https://zorime-api.vercel.app/api/info?id=${animeId}`);
              if (seasonsResponse.ok) {
                const seasonsData = await seasonsResponse.json();
                setSeasons(seasonsData.results?.seasons || []);
                console.log(`Fetched seasons from Zorime API:`, seasonsData.results?.seasons);
              } else {
                console.error("Failed to fetch seasons from Zorime API:", seasonsResponse.status);
              }
            } catch (error) {
              console.error("Error fetching seasons from Zorime API:", error);
            }
          }
        }

        // Get episodes from Steller API only
        let allEpisodes = [];

        if (stellerData && stellerData.episodes && Array.isArray(stellerData.episodes) && stellerData.episodes.length > 0) {
          allEpisodes = Array.from({ length: stellerData.episodes.length }, (_, i) => i + 1);
          console.log(`Using ${stellerData.episodes.length} episodes from Steller API episodes array`);
        } else {
          // Fallback to 1 episode if no data available
          allEpisodes = [1];
          console.log(`No episode data from Steller API, defaulting to 1 episode`);
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

  const slug = slugify(anime?.title?.romaji || anime?.title?.english || "");

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
          let url;
          if (activeServer === "HD-1") {
            url = await fetchIframeUrlFromHanimeHentai(slug, episode);
          } else if (activeServer === "HD-2") {
            url = await fetchIframeUrlFromWatchHentai(slug, episode);
          }
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
  }, [isHentai, anime, episode, activeServer, slug]);

  const getIframeUrl = () => {
    if (isHentai) {
      return iframeUrl || "";
    }

    const ep = episode;
    const aniId = anime?.id;
    const tmdb = tmdbId || aniId; // Use TMDB ID if available, fallback to AniList ID

    if (sourceType === "sub") {
      switch (activeServer) {
        case "HD-1":
          return `https://vidsrc.cc/v2/embed/anime/ani${aniId}/${ep}/sub`;
        case "HD-3":
          return `https://vidnest.fun/anime/${aniId}/${ep}/sub`;
        case "HD-4":
          return `https://vidnest.fun/animepahe/${aniId}/${ep}/sub`;
        case "HD-5":
          return `https://api.cinetaro.buzz/anime/anilist/${aniId}/${ep}/sub`;
        case "HD-6":
          const episodeIdIni = stellerEpisodes[ep - 1]?.id?.split("$episode$")[1];
          return `https://megaplay.buzz/stream/s-4/${episodeIdIni}/sub`;
        case "HD-2":
          const episodeIdSub = stellerEpisodes[ep - 1]?.id?.split("$episode$")[1];
          return `https://megaplay.buzz/stream/s-2/${episodeIdSub}/sub`;
        case "MegaPlay":
          const episodeId = stellerEpisodes[ep - 1]?.id?.split("$episode$")[1];
          return `https://vidwish.live/stream/s-2/${episodeId}/sub`;
        default:
          return "";

      }
    } else if (sourceType === "dub") {
      switch (activeServer) {
        case "HD-1":
          return `https://vidsrc.cc/v2/embed/anime/ani${aniId}/${ep}/dub`;
        case "HD-3":
          return `https://vidnest.fun/anime/${aniId}/${ep}/dub`;
        case "HD-4":
          return `https://api.cinetaro.buzz/anime/anilist/${aniId}/${ep}/dub`;
        case "HD-5":
          const episodeIdIni = stellerEpisodes[ep - 1]?.id?.split("$episode$")[1];
          return `https://megaplay.buzz/stream/s-4/${episodeIdIni}/dub`;
        case "HD-2":
          const episodeIdDub = stellerEpisodes[ep - 1]?.id?.split("$episode$")[1];
          return `https://megaplay.buzz/stream/s-2/${episodeIdDub}/dub`;
        case "MegaPlay":
          const episodeId = stellerEpisodes[ep - 1]?.id?.split("$episode$")[1];
          return `https://vidwish.live/stream/s-2/${episodeId}/dub`;
        default:
          return "";

      }
    } else if (sourceType === "hindi") {
      switch (activeServer) {
        case "HD-1":
          return `https://vidnest.fun/anime/${aniId}/${ep}/satoru`;
        case "HD-2":
          return `https://vidnest.fun/anime/${aniId}/${ep}/hindi`;
        case "HD-3":
          return `https://api.cinetaro.buzz/anime/anilist/${aniId}/${ep}/hindi`;
        case "HD-4":
          // Check if it's a movie format
          if (anime?.format === "MOVIE") {
            return `https://vid.techneo.fun/tmdb/movies/${tmdb}`;
          } else {
            return `https://vid.techneo.fun/tmdb/tv/${tmdb}/1/${ep}`;
          }
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

      {/* Player at the top */}
      <div className="relative max-w-[1400px] mx-auto p-4 z-10 mb-6">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(236,72,153,0.3)] border border-white/10">
          {isIframeLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader />
            </div>
          ) : getIframeUrl() ? (
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
      </div>

      <div className="relative flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto p-4 z-10">
        {/* --- Middle Section (Controls + Episodes) --- */}
        <div className="flex-1">

          {/* Episode Info */}
          <div className="mt-4 bg-[#c7365f] text-center p-3 rounded-lg shadow-[0_0_10px_rgba(236,72,153,0.5)]">
            <p className="text-sm">
              You are Watching <strong>Episode {episode}</strong>
              {stellerEpisodes.length > 0 && (() => {
                const currentStellerEp = stellerEpisodes[episode - 1];
                return currentStellerEp ? ` - ${currentStellerEp.title}` : '';
              })()}
              <br />
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
                <button
                  onClick={() => {
                    setActiveServer("HD-2");
                    setSourceType("hentai");
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                    activeServer === "HD-2" && sourceType === "hentai"
                      ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                      : "bg-[#222] hover:bg-[#333]"
                  }`}
                >
                  HD-2
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 items-center mb-3">
                  <span className="font-semibold">SUB:</span>
                  {["HD-1", "HD-2", "HD-3","HD-4", "HD-5", "HD-6", "MegaPlay"].filter(s => (s !== "HD-6" || tmdbId) && (s !== "MegaPlay" || stellerEpisodes.length > 0)).map((s) => (
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
                  {["HD-1", "HD-2", "HD-3","HD-4", "HD-5", "MegaPlay"].filter(s => (s !== "HD-5" || tmdbId) && (s !== "MegaPlay" || stellerEpisodes.length > 0)).map((s) => (
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
                  {["HD-1", "HD-2", "HD-3", "HD-4"].filter(s => s !== "HD-4" || tmdbId).map((s) => (
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

{/* Seasons Section */}
{seasons.length > 0 && (
  <SeasonsSection seasons={seasons} />
)}



          {/* ✅ Countdown Component */}
          <div className="mt-6">
            <Countdowm title={anime.title.romaji} />
          </div>

          {/* --- Episodes Section --- */}
          <div className="mt-6 bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
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
              placeholder="Find episode"
              className="w-full mb-3 px-3 py-2 rounded-md bg-[#1e1e1e] text-sm outline-none focus:ring-1 focus:ring-pink-500"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                if (searchTerm) {
                  const foundIndex = stellerEpisodes.findIndex(ep =>
                    ep.title?.toLowerCase().includes(searchTerm) ||
                    ep.id?.toString().includes(searchTerm)
                  );
                  if (foundIndex !== -1) {
                    setEpisode(foundIndex + 1);
                  }
                }
              }}
            />
            <div className="max-h-[500px] overflow-y-auto pr-1 custom-scroll">
              {isEpisodesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : releasedEpisodes.length > 0 ? (
                <>
                  {currentEpisodes.map((ep) => {
                    // Find episode by index (ep-1 since episodes are 1-indexed but array is 0-indexed)
                    const stellerEpisode = stellerEpisodes[ep - 1];

                    return (
                      <button
                        key={ep}
                        onClick={() => setEpisode(ep)}
                        className={`w-full text-left px-3 py-2 mb-2 rounded-lg font-medium transition-all flex items-center gap-3 ${
                          episode === ep
                            ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.6)]"
                            : "bg-[#1e1e1e] hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {stellerEpisode && stellerEpisode.image && (
                          <img
                            src={stellerEpisode.image}
                            alt={`Episode ${ep}`}
                            className="w-12 h-8 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span>Episode {ep}</span>
                          {stellerEpisode && stellerEpisode.title && (
                            <span className="text-xs text-gray-400 truncate">
                              {stellerEpisode.title}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
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
        </div>
        {/* --- Right Sidebar (Anime Info) --- */}
        <div className="w-full md:w-[25%] space-y-4">
          <div className="bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
            <img
              src={anime.coverImage.large}
              alt={anime.title.romaji}
              className="rounded-xl mb-4"
            />
            <h2 className="text-lg font-semibold mb-2">
              {anime.title.english || anime.title.romaji}
            </h2>
            <div className="flex flex-wrap gap-2 text-xs mb-3">
              <span className="bg-gray-800 px-2 py-1 rounded">{anime.format || "TV"}</span>
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

          {/* Relations Section */}
          {relations.length > 0 && (
            <div className="bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Related Anime</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scroll">
                {relations.map((relation) => (
                  <Link
                    key={relation.id}
                    to={`/anime/${relation.id}`}
                    className="block bg-[#1a1a1a] hover:bg-[#222] rounded-lg p-3 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={relation.image}
                        alt={relation.title.english || relation.title.romaji}
                        className="w-10 h-14 object-cover rounded"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {relation.title.english || relation.title.romaji}
                        </h4>
                        <p className="text-xs text-gray-400 capitalize">
                          {relation.relationType.toLowerCase().replace('_', ' ')}
                        </p>
                        {relation.type && (
                          <span className="inline-block bg-gray-800 px-2 py-0.5 rounded text-xs mt-1">
                            {relation.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
