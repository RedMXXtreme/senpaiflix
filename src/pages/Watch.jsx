import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchAnimeDetailsWithCache,
  fetchAnimeRecommendationsWithCache,
  get2AnimeEmbedUrl,
  get2AnimeEmbedUrl1,
  get2AnimeEmbedUrl2,
  get2AnimeEmbedUrl3,
  fetchIframeUrlFromDesiDub,
  fetchHindiDubEpisodeCount,
  fetchIframefromGogoAnime,
  fetchIframeFrom9AnimeDub,
  fetchIframeUrlFromHanimeHentai,
  fetchIframeUrlFromWatchhentai,
  fetchIframefromAniHQAnimeSubbed,
  fetchIframefromAniHQAnimeDubbed,
} from "../utils/streamingApis";
import "./watch.css";
import Countdowm from "../components/countdown";
import Loader from "../components/Loader";
import { slugify } from "../utils/slugify";

const Watch = () => {
  const { animeId, episodeNumber } = useParams();
  const navigate = useNavigate();
  const [animeDetails, setAnimeDetails] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(
    episodeNumber ? parseInt(episodeNumber) : 1
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisiblePage, setLastVisiblePage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [streamUrl1, setStreamUrl1] = useState("");
  const [streamUrl2, setStreamUrl2] = useState("");
  const [streamUrl3, setStreamUrl3] = useState("");
  const [streamUrlDesiDub, setStreamUrlDesiDub] = useState("");
  const [streamUrlGogoAnime, setStreamUrlGogoAnime] = useState("");
  const [streamUrl9AnimeDub, setStreamUrl9AnimeDub] = useState("");
  const [streamUrlHanimeHentai, setStreamUrlHanimeHentai] = useState("");
  const [streamUrlWatchHentai, setStreamUrlWatchHentai] = useState("");
  const [streamUrlAniHQSubbed, setStreamUrlAniHQSubbed] = useState("");
  const [streamUrlAniHQDubbed, setStreamUrlAniHQDubbed] = useState("");
  const [server, setServer] = useState("HD-1");
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hindiDubEpisodeCount, setHindiDubEpisodeCount] = useState(0);
  const [nineAnimeDubEpisodeCount, setNineAnimeDubEpisodeCount] = useState(0);
  const [isNotFound, setIsNotFound] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [relations, setRelations] = useState([]); // NEW: for Prequel & Sequel

  const fetchEpisodesPage = async (page) => {
    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/anime/${animeId}/episodes?page=${page}`
      );
      const data = await response.json();
      if (data && data.data) {
        setEpisodes(data.data);
        if (data.pagination) {
          setCurrentPage(data.pagination.current_page || page);
          setLastVisiblePage(data.pagination.last_visible_page);
          setHasNextPage(data.pagination.has_next_page);
        }
        if (data.data.length > 0) {
          setCurrentEpisode(data.data[0].mal_id);
          navigate(`/watch/${animeId}/${data.data[0].mal_id}`);
        }
      }
    } catch (error) {
      console.error("Error fetching episodes page:", error);
    }
  };

  useEffect(() => {
    if (!animeId) return;

    const fetchAnimeDetails = async () => {
      try {
        const details = await fetchAnimeDetailsWithCache(animeId);
        setAnimeDetails(details.anime);
        setIsNotFound(false);
        await fetchEpisodesPage(1);
      } catch (error) {
        console.error("Error fetching anime details:", error);
        if (
          error.response &&
          error.response.status === 404 &&
          error.response.data ===
            "Sorry, the page you are looking for could not be found."
        ) {
          setIsNotFound(true);
        }
      }
    };

    fetchAnimeDetails();
  }, [animeId]);

  // Fetch Prequel and Sequel
  useEffect(() => {
    if (!animeId) return;

    const fetchRelations = async () => {
      try {
        const response = await fetch(
          `https://api.jikan.moe/v4/anime/${animeId}/relations`
        );
        const data = await response.json();
        if (data && data.data) {
          const filtered = data.data.filter(
            (rel) => rel.relation === "Prequel" || rel.relation === "Sequel"
          );
          setRelations(filtered);
        }
      } catch (error) {
        console.error("Error fetching relations:", error);
      }
    };

    fetchRelations();
  }, [animeId]);

  useEffect(() => {
    if (!animeId) return;

    const recommendationsCache = new Map();

    const fetchRecommendations = async () => {
      if (recommendationsCache.has(animeId)) {
        setRecommendations(recommendationsCache.get(animeId));
        return;
      }
      try {
        // Throttle request by waiting 1 second before API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const recs = await fetchAnimeRecommendationsWithCache(animeId);
        recommendationsCache.set(animeId, recs);
        setRecommendations(recs);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [animeId]);

  useEffect(() => {
    if (!animeDetails || episodes.length === 0) return;

    if (animeDetails.title_english) {
      const url = get2AnimeEmbedUrl(animeDetails.title, currentEpisode);
      const url1 = get2AnimeEmbedUrl1(animeDetails.title_english, currentEpisode);
      const url2 = get2AnimeEmbedUrl2(animeDetails.title_english, currentEpisode);
      const url3 = get2AnimeEmbedUrl3(animeDetails.title, currentEpisode);
      setStreamUrl(url);
      setStreamUrl1(url1);
      setStreamUrl2(url2);
      setStreamUrl3(url3);
    }
  }, [animeDetails, episodes, currentEpisode]);

  // ... (ALL EXISTING useEffects for servers remain unchanged)

  const handleEpisodeChange = (epNum) => {
    setCurrentEpisode(epNum);
    navigate(`/watch/${animeId}/${epNum}`);
  };

  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.title.toLowerCase().includes(episodeSearch.toLowerCase()) ||
      ep.mal_id.toString().includes(episodeSearch)
  );

  if (!animeDetails) {
    return <Loader />;
  }

  const genreString = animeDetails.genres
    ? animeDetails.genres.map((g) => g.name).join(", ")
    : animeDetails.genre || "";

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30"
        style={{
          backgroundImage: `url(${animeDetails.images?.jpg?.large_image_url})`,
        }}
        aria-hidden="true"
      ></div>
      <div className="relative z-10">
        <div className="watch-page">
          <div className="breadcrumb">
            <Link to="/home">Home</Link> / <span>{animeDetails.type}</span> /{" "}
            <span>Watching {animeDetails.title_english || animeDetails.title}</span>
          </div>

                    <div className="main-content">
            {/* Left Sidebar - Episode List */}
          <div className="left-column">
            <div className="episode-list-header">
              <div className="episode-list-header-top">
                <strong className="episode-list-title">Episodes</strong>
                <div className="header-controls">
                  <button
                    className="header-icon-btn"
                    aria-label={showGrid ? "List" : "Grid"}
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    {showGrid ? "\u2630" : "\u2630"}
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Find"
                className="episode-search"
                value={episodeSearch}
                onChange={(e) => setEpisodeSearch(e.target.value)}
              />
              <div className="pagination-layout">
                <button
                  className="pagination-arrow"
                  onClick={() => {
                    if (currentPage > 1) {
                      fetchEpisodesPage(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <select
                  className="pagination-range-select"
                  value={currentPage}
                  onChange={(e) => fetchEpisodesPage(Number(e.target.value))}
                  aria-label="Select Page"
                >
                  {Array.from({ length: lastVisiblePage }, (_, i) => i + 1).map((pageNum) => (
                    <option key={pageNum} value={pageNum}>
                      {(() => {
                        const start = (pageNum - 1) * episodes.length + 1;
                        const end = Math.min(pageNum * episodes.length, animeDetails.episodes || 0);
                        return `${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}`;
                      })()}
                    </option>
                  ))}
                </select>

                <button
                  className="pagination-arrow"
                  onClick={() => {
                    if (hasNextPage) {
                      fetchEpisodesPage(currentPage + 1);
                    }
                  }}
                  disabled={!hasNextPage}
                  aria-label="Next Page"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
            {showGrid ? (
              <div className="episode-grid">
                {filteredEpisodes.map((ep) => (
                  <button
                    key={ep.mal_id}
                    className={`episode-grid-item ${ep.mal_id === currentEpisode ? "active" : ""}`}
                    
                    onClick={() => handleEpisodeChange(ep.mal_id)}
                  >
                    {ep.mal_id}
                  </button>
                ))}
              </div>
            ) : (
              <div className="episode-list">
                <ul>
                  {filteredEpisodes.map((ep) => (
                    <li
                      key={ep.mal_id}
                      className={ep.mal_id === currentEpisode ? "active" : ""}
                      onClick={() => handleEpisodeChange(ep.mal_id)}
                    >
                      <span className="episode-number">{ep.mal_id}</span>{" "}
                      {ep.title.length > 30
                        ? ep.title.slice(0, 30) + "..."
                        : ep.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Center - Video Player and Controls */}
              <div className={`center-column`}>
              <div className="video-player" style={{backgroundImage: !isPlaying ? `url(${animeDetails.images?.jpg?.large_image_url})` : 'none' }}>
                {!isPlaying ? (
                  <div
                    className="video-initial-overlay"
                    onClick={() => setIsPlaying(true)}
                  >
                    <div className="play-button-circle">
                      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="40" cy="40" r="40"/>
                        <path d="M32 26L56 40L32 54V26Z"/>
                      </svg>
                    </div>
                  </div>
) : (
  (server === "HD-1" && streamUrl) ||
  (server === "HD-2" && streamUrl1) ||
  (server === "HD-3" && streamUrl2) ||
  (server === "HD-4" && streamUrl3) ||
  (server === "DesiDub" && streamUrlDesiDub) ||
  (server === "GogoAnime" && streamUrlGogoAnime) ||
  (server === "9AnimeDub" && streamUrl9AnimeDub) ||
  (server === "AniHQSubbed" && streamUrlAniHQSubbed) ||
  (server === "AniHQDubbed" && streamUrlAniHQDubbed) ||
  (server === "HD_player" && streamUrlHanimeHentai) ||
  (server === "HD_player_2" && streamUrlWatchHentai)
) ? (
  <iframe
    key={`stream-${server}-${currentEpisode}`}
    title={`Episode ${currentEpisode}`}
    src={
      server === "HD-1" ? streamUrl :
      server === "HD-2" ? streamUrl1 :
      server === "HD-3" ? streamUrl2 :
      server === "HD-4" ? streamUrl3 :
      server === "DesiDub" ? streamUrlDesiDub :
      server === "GogoAnime" ? streamUrlGogoAnime :
      server === "9AnimeDub" ? streamUrl9AnimeDub :
      server === "AniHQSubbed" ? streamUrlAniHQSubbed :
      server === "AniHQDubbed" ? streamUrlAniHQDubbed :
      server === "HD_player" ? streamUrlHanimeHentai :
      server === "HD_player_2" ? streamUrlWatchHentai : ""
    }
    width="100%"
    height="500px"
    allowFullScreen
  ></iframe>
) : (
  <p>Loading stream...</p>
)}
              </div>

              <div className="video-controls">
                <button onClick={() => { setFocusMode(true); setIsPlaying(false); }} className={focusMode ? "active" : ""}>
                Focus
                </button>
                
              </div>

  <div className="watching-server-container">
              
<div className="server-selection-container">
  <div className="watching-message-container">
    <div className="watching-message">
      You are Watching <br />
      <strong>Episode {currentEpisode}</strong> <br />
      If current server doesn’t work <br />
      please try other servers beside.
    </div>
  </div>
  <div className="server-buttons-wrapper">
    <div className="server-row">
      <div className="server-label">
        <span role="img" aria-label="keyboard">⌨️</span> SUB:
      </div>
      <div className="server-buttons">
        {genreString.includes("Hentai") ? (
          <>
            <button className={server === "HD_player" ? "active" : ""} onClick={() => setServer("HD_player")}>HD_player</button>
            <button className={server === "HD_player_2" ? "active" : ""} onClick={() => setServer("HD_player_2")}>HD_player 2</button>
          </>
        ) : (
          <>
            <button className={server === "HD-1" ? "active" : ""} onClick={() => setServer("HD-1")}>HD-1</button>
            <button className={server === "HD-2" ? "active" : ""} onClick={() => setServer("HD-2")}>HD-2</button>
            <button className={server === "GogoAnime" ? "active" : ""} onClick={() => setServer("GogoAnime")}>zaza</button>
            <button className={server === "AniHQSubbed" ? "active" : ""} onClick={() => setServer("AniHQSubbed")}>zoro</button>
          </>
        )}
      </div>
    </div>
    {genreString.includes("Hentai") ? null : (
    <div className="server-row">
      <div className="server-label">
        <span role="img" aria-label="microphone">🎤</span> DUB:
      </div>
      <div className="server-buttons">
        
          <>
            <button className={server === "HD-3" ? "active" : ""} onClick={() => setServer("HD-3")}>HD-3</button>
            <button className={server === "HD-4" ? "active" : ""} onClick={() => setServer("HD-4")}>HD-4</button>
            {hindiDubEpisodeCount > 0 && streamUrlDesiDub !== "" && (
              <button className={server === "DesiDub" ? "active" : ""} onClick={() => setServer("DesiDub")}>Hindi</button>
            )}
            <button className={server === "9AnimeDub" ? "active" : ""} onClick={() => setServer("9AnimeDub")}>megg</button>
            <button className={server === "AniHQDubbed" ? "active" : ""} onClick={() => setServer("AniHQDubbed")}>bun</button>
          </>
        
      </div>
    </div>
    )}
  </div>
  {/* ✅ Seasons Section (Enhanced) */}
<div className="seasons-section" style={{ marginTop: "0.5rem" }}>
  <h3 className="text-2xl font-bold mb-4 text-white">Seasons</h3>
  <div className="flex gap-4 overflow-x-auto scrollbar-hide px-2">
    {relations.length === 0 && (
      <p className="text-gray-400">No related seasons available.</p>
    )}
    {relations.map((rel) =>
      rel.entry.map((item) => (
        <Link
          key={item.mal_id}
          to={`/watch/${item.mal_id}`}
          className="relative w-44 rounded-xl overflow-hidden flex-shrink-0 group transition-transform duration-300 hover:scale-105"
          style={{
            backgroundImage: `url(${
              item.images?.jpg?.large_image_url ||
              animeDetails.images?.jpg?.large_image_url
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "4rem",
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-90"></div>

          {/* Text Content */}
          <div className="absolute bottom-2 left-2 text-white">
            <p className="text-sm mt-1 font-medium">
              {item.name.length > 20 ? item.name.slice(0, 20) + "..." : item.name}
            </p>
          </div>

          {/* Hover Shine Effect */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      ))
    )}
  </div>
</div>
</div>
              </div>
              {/* Countdown Timer */} 
              <div className="countdown-container"> 
                <Countdowm
                  title={animeDetails.title_english || animeDetails.title}
                  episode={currentEpisode}
                />
              </div>
              </div>
              {/* Right Sidebar - Anime Info */}
        <div className="right-column">
          <div className="poster">
            <img src={animeDetails.images?.jpg?.large_image_url} alt={animeDetails.title_english || animeDetails.title} />
          </div>
            <div className="info-text">
              <h2>{animeDetails.title_english}</h2>
              <div className="meta">
                <div>
                  <strong>{animeDetails.type}</strong>
                </div>
                <div>
                  <strong>HD</strong>
                </div>
                <div>
                  <strong>{animeDetails.episodes}</strong>
                </div>
                <div>{animeDetails.duration}</div>
                <div>{genreString}</div>
              </div>
              <p>{animeDetails.synopsis}</p>
              <p>
                Senpai is the best site to watch <strong>{animeDetails.title_english}</strong> SUB online, or you can even watch <strong>{animeDetails.title_english}</strong> DUB in HD quality. You can also find Yokohama Animation Lab anime on Senpai Flix website.
              </p>
              <button className="view-detail-btn">View detail</button>
              <div className="rating">
                <h3>{animeDetails.score}</h3>
                <div>Vote now</div>
              </div>
            </div>
          </div> 
        </div>
         {focusMode && (
              <div className="modal-overlay" onClick={() => setFocusMode(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>   
                  {(server === "HD-1" && streamUrl) ||
(server === "HD-2" && streamUrl1) ||
(server === "HD-3" && streamUrl2) ||
(server === "HD-4" && streamUrl3) ||
(server === "DesiDub" && streamUrlDesiDub) ||
(server === "GogoAnime" && streamUrlGogoAnime) ||
(server === "9AnimeDub" && streamUrl9AnimeDub) ||
(server === "AniHQSubbed" && streamUrlAniHQSubbed) ||
(server === "AniHQDubbed" && streamUrlAniHQDubbed) ||
(server === "HD_player" && streamUrlHanimeHentai) ||
(server === "HD_player_2" && streamUrlWatchHentai) ? (
  <iframe
    key={`stream-${server}-${currentEpisode}`}
    title={`Episode ${currentEpisode}`}
    src={
      server === "HD-1" ? streamUrl :
      server === "HD-2" ? streamUrl1 :
      server === "HD-3" ? streamUrl2 :
      server === "HD-4" ? streamUrl3 :
      server === "DesiDub" ? streamUrlDesiDub :
      server === "GogoAnime" ? streamUrlGogoAnime :
      server === "9AnimeDub" ? streamUrl9AnimeDub :
      server === "AniHQSubbed" ? streamUrlAniHQSubbed :
      server === "AniHQDubbed" ? streamUrlAniHQDubbed :
      server === "HD_player" ? streamUrlHanimeHentai :
      server === "HD_player_2" ? streamUrlWatchHentai : ""
    }
    width="100%"
    height="100%"
    frameBorder="0"
    allowFullScreen
    allow="autoplay; fullscreen"
  ></iframe>
) : (
  <p>Loading stream...</p>
)}   
                  <button className="modal-close-btn" onClick={() => setFocusMode(false)}>×</button>
                </div>
              </div>
            )}

           {/* Recommendation Section */}
                      <div className="recommendation-section">
                        <h3 className="recommendation-title">Recommended for you</h3>
                        <div className="recommendation-list">
                          {recommendations.length === 0 && <p>No recommendations available.</p>}
                          {recommendations.map((rec) => (
                            <Link
                              to={`/anime/${rec.entry.mal_id}`}
                              key={rec.entry.mal_id}
                              className="recommendation-item"
                            >
                              <div className="recommendation-image-wrapper">
                                <img
                                  src={rec.entry.images?.jpg?.image_url}
                                  alt={rec.entry.title}
                                  className="recommendation-image"
                                />
                                {/* Badges */}
                                <div className="recommendation-badges">
                                  {rec.entry.rating && rec.entry.rating.includes("R18") && (
                                    <div className="recommendation-badge">18+</div>
                                  )}
                                  {rec.entry.rating && !rec.entry.rating.includes("R18") && (
                                    <>
                                      <div className="recommendation-badge cc">cc</div>
                                      <div className="recommendation-badge mic">🎤</div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="recommendation-title-text">
                                {rec.entry.title.length > 20
                                  ? rec.entry.title.slice(0, 20) + "..."
                                  : rec.entry.title}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
