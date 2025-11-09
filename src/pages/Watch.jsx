import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Countdowm from "../components/countdown.jsx";
import SeasonsSection from "../components/SeasonsSection.jsx";
import Loader from "../components/Loader.jsx";
import { fetchAnimeWatch, fetchAnimeRecommendations, fetchAnimeInfoFromSteller, fetchEpisodesFromJikan } from "../utils/anilistApi";
import { fetchIframeUrlFromHanimeHentai, fetchIframeUrlFromWatchHentai, fetchTMDBId } from "../utils/streamingApi";

// Constants for server configurations
const SERVERS = {
  SUB: [
    { key: "HD-1", label: "HD-1", url: (aniId, ep) => `https://vidsrc.cc/v2/embed/anime/ani${aniId}/${ep}/sub` },
    { key: "HD-2", label: "HD-2", url: (aniId, ep, stellerEpisodes) => `https://megaplay.buzz/stream/s-2/${stellerEpisodes[ep - 1]?.id?.split("$episode$")[1]}/sub` },
    { key: "HD-3", label: "HD-3", url: (aniId, ep) => `https://vidnest.fun/anime/${aniId}/${ep}/sub` },
    { key: "HD-4", label: "HD-4", url: (aniId, ep) => `https://vidnest.fun/animepahe/${aniId}/${ep}/sub` },
    { key: "HD-5", label: "HD-5", url: (aniId, ep) => `https://api.cinetaro.buzz/anime/anilist/${aniId}/${ep}/sub` },
    { key: "HD-6", label: "HD-6", url: (aniId, ep, stellerEpisodes, tmdbId) => tmdbId ? `https://megaplay.buzz/stream/s-4/${stellerEpisodes[ep - 1]?.id?.split("$episode$")[1]}/sub` : null },
    { key: "MegaPlay", label: "MegaPlay", url: (aniId, ep, stellerEpisodes) => stellerEpisodes.length > 0 ? `https://vidwish.live/stream/s-2/${stellerEpisodes[ep - 1]?.id?.split("$episode$")[1]}/sub` : null },
  ],
  DUB: [
    { key: "HD-1", label: "HD-1", url: (aniId, ep) => `https://vidsrc.cc/v2/embed/anime/ani${aniId}/${ep}/dub` },
    { key: "HD-2", label: "HD-2", url: (aniId, ep, stellerEpisodes) => `https://megaplay.buzz/stream/s-2/${stellerEpisodes[ep - 1]?.id?.split("$episode$")[1]}/dub` },
    { key: "HD-3", label: "HD-3", url: (aniId, ep) => `https://vidnest.fun/anime/${aniId}/${ep}/dub` },
    { key: "HD-4", label: "HD-4", url: (aniId, ep) => `https://api.cinetaro.buzz/anime/anilist/${aniId}/${ep}/dub` },
    { key: "HD-5", label: "HD-5", url: (aniId, ep, stellerEpisodes, tmdbId) => tmdbId ? `https://megaplay.buzz/stream/s-4/${stellerEpisodes[ep - 1]?.id?.split("$episode$")[1]}/dub` : null },
    { key: "MegaPlay", label: "MegaPlay", url: (aniId, ep, stellerEpisodes) => stellerEpisodes.length > 0 ? `https://vidwish.live/stream/s-2/${stellerEpisodes[ep - 1]?.id?.split("$episode$")[1]}/dub` : null },
  ],
  HINDI: [
    { key: "HD-1", label: "HD-1", url: (aniId, ep) => `https://vidnest.fun/anime/${aniId}/${ep}/satoru` },
    { key: "HD-2", label: "HD-2", url: (aniId, ep) => `https://vidnest.fun/anime/${aniId}/${ep}/hindi` },
    { key: "HD-3", label: "HD-3", url: (aniId, ep) => `https://api.cinetaro.buzz/anime/anilist/${aniId}/${ep}/hindi` },
    { key: "HD-4", label: "HD-4", url: (aniId, ep, tmdbId, anime) => tmdbId ? (anime?.format === "MOVIE" ? `https://vid.techneo.fun/tmdb/movies/${tmdbId}` : `https://vid.techneo.fun/tmdb/tv/${tmdbId}/1/${ep}`) : null },
  ],
  HENTAI: [
    { key: "HD-1", label: "HD-1", source: "hanime" },
    { key: "HD-2", label: "HD-2", source: "watchhentai" },
  ],
};

// Custom hook for anime data fetching
const useAnimeData = (id) => {
  const [anime, setAnime] = useState(null);
  const [episode, setEpisode] = useState(1);
  const [releasedEpisodes, setReleasedEpisodes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [stellerEpisodes, setStellerEpisodes] = useState([]);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(true);
  const [relations, setRelations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [tmdbId, setTmdbId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const media = await fetchAnimeWatch(id);
        setAnime(media);

        const isHentaiGenre = media?.genres?.includes("Hentai");
        const query = media.title.english || media.title.romaji;
        const tmdb = await fetchTMDBId(query);
        setTmdbId(tmdb);

        let allEpisodes = [];
        let episodesData = [];

        if (isHentaiGenre) {
          episodesData = await fetchEpisodesForHentai(id, media);
        } else {
          episodesData = await fetchEpisodesForRegular(id);
        }

        setStellerEpisodes(episodesData.episodes || []);
        allEpisodes = Array.from({ length: episodesData.count || 1 }, (_, i) => i + 1);
        setReleasedEpisodes(allEpisodes);
        setIsEpisodesLoading(false);

        if (!isHentaiGenre) {
          setRelations(episodesData.relations || []);
          setSeasons(episodesData.seasons || []);
        }

        const recs = await fetchAnimeRecommendations(id);
        setRecommendations(recs.filter(rec => rec));
        setIsRecommendationsLoading(false);
      } catch (err) {
        console.error("Error fetching anime data:", err);
        setError("Failed to load anime data. Please try again.");
        setIsEpisodesLoading(false);
        setIsRecommendationsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return {
    anime,
    episode,
    setEpisode,
    releasedEpisodes,
    recommendations,
    isRecommendationsLoading,
    stellerEpisodes,
    isEpisodesLoading,
    relations,
    seasons,
    tmdbId,
    error,
  };
};

// Helper functions for episode fetching
const fetchEpisodesForHentai = async (id, media) => {
  try {
    const episodeData = await fetchAnimeInfoFromSteller(id);
    if (episodeData?.episodes?.length > 0) {
      return { episodes: episodeData.episodes, count: episodeData.episodes.length };
    }
  } catch (error) {
    console.error("Steller API failed for hentai:", error);
  }

  try {
    const jikanEpisodes = await fetchEpisodesFromJikan(media.idMal);
    if (jikanEpisodes?.length > 0) {
      const episodes = jikanEpisodes.map(epId => ({ id: `${id}$episode$${epId}`, title: `Episode ${epId}` }));
      return { episodes, count: jikanEpisodes.length };
    }
  } catch (error) {
    console.error("Jikan API failed for hentai:", error);
  }

  return { episodes: [], count: 1 };
};

const fetchEpisodesForRegular = async (id) => {
  try {
    const episodeData = await fetchAnimeInfoFromSteller(id);
    if (episodeData?.episodes?.length > 0) {
      return {
        episodes: episodeData.episodes,
        count: episodeData.episodes.length,
        relations: episodeData.relations,
        seasons: await fetchSeasons(episodeData.episodes[0]?.id, id),
      };
    }
  } catch (error) {
    console.error("Steller API failed:", error);
  }
  return { episodes: [], count: 1 };
};

const fetchSeasons = async (firstEpisodeId, animeId) => {
  if (!firstEpisodeId?.includes('$episode$')) return [];
  try {
    const response = await fetch(`https://zorime-api.vercel.app/api/info?id=${firstEpisodeId.split('$episode$')[0]}`);
    if (response.ok) {
      const data = await response.json();
      return data.results?.seasons || [];
    }
  } catch (error) {
    console.error("Error fetching seasons:", error);
  }
  return [];
};

// Custom hook for iframe URL
const useIframeUrl = (isHentai, anime, episode, activeServer, sourceType, slug, stellerEpisodes, tmdbId) => {
  const [iframeUrl, setIframeUrl] = useState(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);

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

  const getUrl = useCallback(() => {
    if (isHentai) return iframeUrl || "";

    const ep = episode;
    const aniId = anime?.id;
    const tmdb = tmdbId || aniId;

    const servers = SERVERS[sourceType.toUpperCase()] || [];
    const server = servers.find(s => s.key === activeServer);
    if (server) {
      return server.url(aniId, ep, stellerEpisodes, tmdb, anime) || "";
    }
    return "";
  }, [isHentai, iframeUrl, episode, anime, tmdbId, sourceType, activeServer, stellerEpisodes]);

  return { getUrl, isIframeLoading };
};

// Sub-components
const Player = ({ getIframeUrl, isIframeLoading }) => (
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
);

const ServerSelector = ({ isHentai, activeServer, setActiveServer, sourceType, setSourceType, tmdbId, stellerEpisodes }) => {
  const getFilteredServers = (type) => {
    return SERVERS[type].filter(server => {
      if (type === 'SUB' && server.key === 'HD-6' && !tmdbId) return false;
      if (type === 'SUB' && server.key === 'MegaPlay' && stellerEpisodes.length === 0) return false;
      if (type === 'DUB' && server.key === 'HD-5' && !tmdbId) return false;
      if (type === 'DUB' && server.key === 'MegaPlay' && stellerEpisodes.length === 0) return false;
      if (type === 'HINDI' && server.key === 'HD-4' && !tmdbId) return false;
      return true;
    });
  };

  return (
    <div className="mt-5 bg-[#141414]/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
      {isHentai ? (
        <div className="flex flex-wrap gap-3 items-center">
          <span className="font-semibold">HENTAI:</span>
          {SERVERS.HENTAI.map((server) => (
            <button
              key={server.key}
              onClick={() => {
                setActiveServer(server.key);
                setSourceType("hentai");
              }}
              className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                activeServer === server.key && sourceType === "hentai"
                  ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                  : "bg-[#222] hover:bg-[#333]"
              }`}
            >
              {server.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <span className="font-semibold">SUB:</span>
            {getFilteredServers('SUB').map((server) => (
              <button
                key={server.key}
                onClick={() => {
                  setActiveServer(server.key);
                  setSourceType("sub");
                }}
                className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                  activeServer === server.key && sourceType === "sub"
                    ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                    : "bg-[#222] hover:bg-[#333]"
                }`}
              >
                {server.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <span className="font-semibold">DUB:</span>
            {getFilteredServers('DUB').map((server) => (
              <button
                key={`${server.key}-dub`}
                onClick={() => {
                  setActiveServer(server.key);
                  setSourceType("dub");
                }}
                className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                  activeServer === server.key && sourceType === "dub"
                    ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                    : "bg-[#222] hover:bg-[#333]"
                }`}
              >
                {server.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-semibold">HINDI:</span>
            {getFilteredServers('HINDI').map((server) => (
              <button
                key={`${server.key}-hindi`}
                onClick={() => {
                  setActiveServer(server.key);
                  setSourceType("hindi");
                }}
                className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                  activeServer === server.key && sourceType === "hindi"
                    ? "bg-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.7)]"
                    : "bg-[#222] hover:bg-[#333]"
                }`}
              >
                {server.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const EpisodeList = ({ releasedEpisodes, stellerEpisodes, episode, setEpisode, isEpisodesLoading, currentPage, setCurrentPage, totalPages, currentEpisodes }) => (
  <div className="mt-6 bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
    <h2 className="text-lg font-semibold mb-3">Episodes</h2>

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
                {stellerEpisode?.image && (
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
                  {stellerEpisode?.title && (
                    <span className="text-xs text-gray-400 truncate">
                      {stellerEpisode.title}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
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
);

const AnimeInfo = ({ anime }) => (
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
);

const Relations = ({ relations }) => (
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
);

const Recommendations = ({ recommendations, isRecommendationsLoading }) => (
  <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-8 mt-10
                  bg-[#141414]/80 backdrop-blur-lg rounded-2xl
                  border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
    <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white tracking-wide flex items-center gap-2">
      <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
      Recommendations
    </h2>
    <div className="
      grid gap-4 sm:gap-5 md:gap-6
      grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8
    ">
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
);

// Main component
export default function Watch() {
  const { id } = useParams();
  const [sourceType, setSourceType] = useState("sub");
  const [activeServer, setActiveServer] = useState("HD-1");
  const [currentPage, setCurrentPage] = useState(1);
  const episodesPerPage = 100;

  const {
    anime,
    episode,
    setEpisode,
    releasedEpisodes,
    recommendations,
    isRecommendationsLoading,
    stellerEpisodes,
    isEpisodesLoading,
    relations,
    seasons,
    tmdbId,
    error,
  } = useAnimeData(id);

  const slugify = (str = "") =>
    str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

  const slug = useMemo(() => slugify(anime?.title?.romaji || anime?.title?.english || ""), [anime]);

  const isHentai = useMemo(() => anime?.genres?.includes("Hentai"), [anime]);

  const { getUrl: getIframeUrl, isIframeLoading } = useIframeUrl(isHentai, anime, episode, activeServer, sourceType, slug, stellerEpisodes, tmdbId);

  // Set default source type for hentai
  useEffect(() => {
    if (isHentai) {
      setSourceType("hentai");
      setActiveServer("HD-1");
    }
  }, [isHentai]);

  // Reset to page 1 when episodes change
  useEffect(() => {
    setCurrentPage(1);
  }, [releasedEpisodes]);

  // Calculate pagination
  const totalPages = Math.ceil(releasedEpisodes.length / episodesPerPage);
  const startIndex = (currentPage - 1) * episodesPerPage;
  const endIndex = startIndex + episodesPerPage;
  const currentEpisodes = releasedEpisodes.slice(startIndex, endIndex);

  if (error) {
    return (
      <div className="relative min-h-screen font-inter text-white bg-[#0b0b0b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-pink-600 px-4 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!anime) {
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
  }

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

      <Player getIframeUrl={getIframeUrl} isIframeLoading={isIframeLoading} />

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

          <ServerSelector
            isHentai={isHentai}
            activeServer={activeServer}
            setActiveServer={setActiveServer}
            sourceType={sourceType}
            setSourceType={setSourceType}
            tmdbId={tmdbId}
            stellerEpisodes={stellerEpisodes}
          />

          {seasons.length > 0 && <SeasonsSection seasons={seasons} />}

          {/* ✅ Countdown Component */}
          <div className="mt-6">
            <Countdowm title={anime.title.english || anime.title.romaji} />
          </div>

          <EpisodeList
            releasedEpisodes={releasedEpisodes}
            stellerEpisodes={stellerEpisodes}
            episode={episode}
            setEpisode={setEpisode}
            isEpisodesLoading={isEpisodesLoading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            currentEpisodes={currentEpisodes}
          />
        </div>
        {/* --- Right Sidebar (Anime Info) --- */}
        <div className="w-full md:w-[25%] space-y-4">
          <AnimeInfo anime={anime} />

          {relations.length > 0 && <Relations relations={relations} />}
        </div>
      </div>

      <Recommendations recommendations={recommendations} isRecommendationsLoading={isRecommendationsLoading} />
    </div>
  );
}