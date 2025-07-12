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
  const [streamUrlAniHQSubbed, setStreamUrlAniHQSubbed] = useState("");
  const [streamUrlAniHQDubbed, setStreamUrlAniHQDubbed] = useState("");
  const [autoNext, setAutoNext] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [autoSkip, setAutoSkip] = useState(true);
  const [expand, setExpand] = useState(false);
  const [server, setServer] = useState("HD-1");
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hindiDubEpisodeCount, setHindiDubEpisodeCount] = useState(0);
  const [nineAnimeDubEpisodeCount, setNineAnimeDubEpisodeCount] = useState(0);
  const [isNotFound, setIsNotFound] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  

  const fetchEpisodesPage = async (page) => {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes?page=${page}`);
      const data = await response.json();
      if (data && data.data) {
        setEpisodes(data.data);
        if (data.pagination) {
          setCurrentPage(data.pagination.current_page || page);
          setLastVisiblePage(data.pagination.last_visible_page);
          setHasNextPage(data.pagination.has_next_page);
        }
        // Reset current episode to first episode of new page
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
        // Fetch first page of episodes from paginated API
        await fetchEpisodesPage(1);
      } catch (error) {
        console.error("Error fetching anime details:", error);
        if (error.response && error.response.status === 404 && error.response.data === "Sorry, the page you are looking for could not be found.") {
          setIsNotFound(true);
        }
      }
    };

    fetchAnimeDetails();
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

  useEffect(() => {
    // Removed animegg related useEffect
  }, [animeDetails, currentEpisode]);

useEffect(() => {
  const iframeCache = new Map();

  const fetchWithRetry = async (slug, episode, retries = 3, delay = 1000) => {
    const cacheKey = `${slug}-${episode}`;
    if (iframeCache.has(cacheKey)) {
      return iframeCache.get(cacheKey);
    }
    try {
      const url = await fetchIframeUrlFromDesiDub(slug, episode);
      if (url) {
        iframeCache.set(cacheKey, url);
      }
      return url;
    } catch (error) {
      if (retries > 0) {
        await new Promise((res) => setTimeout(res, delay));
        return fetchWithRetry(slug, episode, retries - 1, delay * 2);
      }
      return null;
    }
  };

  const fetchDesiDubUrl = async () => {
    if (!animeDetails) return;

    // Try with original title
    let slugifiedName = slugify(animeDetails.title);
    let iframeUrl = await fetchWithRetry(slugifiedName, currentEpisode);

    // If not found and English title exists, try with that
    if (!iframeUrl && animeDetails.title_english) {
      const fallbackSlug = slugify(animeDetails.title_english);
      iframeUrl = await fetchWithRetry(fallbackSlug, currentEpisode);
    }

    setStreamUrlDesiDub(iframeUrl || "");
  };

  fetchDesiDubUrl();

  }, [animeDetails, currentEpisode]);

  useEffect(() => {
    if (!animeDetails) return;

    const fetchGogoAnimeUrl = async () => {
      // Try with original title
      let slugifiedName = slugify(animeDetails.title);
      let iframeUrl = await fetchIframefromGogoAnime(slugifiedName, currentEpisode);

      // If not found and English title exists, try with that
      if (!iframeUrl && animeDetails.title_english) {
        const fallbackSlug = slugify(animeDetails.title_english);
        iframeUrl = await fetchIframefromGogoAnime(fallbackSlug, currentEpisode);
      }

      setStreamUrlGogoAnime(iframeUrl || "");
    };

    fetchGogoAnimeUrl();
  }, [animeDetails, currentEpisode]);

  useEffect(() => {
    if (!animeDetails) return;

    const fetch9AnimeDubUrl = async () => {
      let slugifiedName = slugify(animeDetails.title);
      let iframeUrl = await fetchIframeFrom9AnimeDub(slugifiedName, currentEpisode);

      if (!iframeUrl && animeDetails.title_english) {
        const fallbackSlug = slugify(animeDetails.title_english);
        iframeUrl = await fetchIframeFrom9AnimeDub(fallbackSlug, currentEpisode);
      }

      setStreamUrl9AnimeDub(iframeUrl || "");
    };

    fetch9AnimeDubUrl();
  }, [animeDetails, currentEpisode]);
  
  useEffect(() => {
    if (!animeDetails) return;

    const fetchHanimeHentaiUrl = async () => {
      // Try with original title
      let slugifiedName = slugify(animeDetails.title);
      let iframeUrl = await fetchIframeUrlFromHanimeHentai(slugifiedName, currentEpisode);

      // If not found and English title exists, try with that
      if (!iframeUrl && animeDetails.title_english) {
        const fallbackSlug = slugify(animeDetails.title_english);
        iframeUrl = await fetchIframeUrlFromHanimeHentai(fallbackSlug, currentEpisode);
      }

      setStreamUrlHanimeHentai(iframeUrl || "");
    };

    fetchHanimeHentaiUrl();
  }, [animeDetails, currentEpisode]);

  useEffect(() => {
    if (!animeDetails) return;

    const fetchAniHQSubbedUrl = async () => {
      let slugifiedName = slugify(animeDetails.title);
      let iframeUrl = await fetchIframefromAniHQAnimeSubbed(slugifiedName, currentEpisode);

      if (!iframeUrl && animeDetails.title_english) {
        const fallbackSlug = slugify(animeDetails.title_english);
        iframeUrl = await fetchIframefromAniHQAnimeSubbed(fallbackSlug, currentEpisode);
      }

      setStreamUrlAniHQSubbed(iframeUrl || "");
    };

    fetchAniHQSubbedUrl();
  }, [animeDetails, currentEpisode]);

  useEffect(() => {
    if (!animeDetails) return;

    const fetchAniHQDubbedUrl = async () => {
      let slugifiedName = slugify(animeDetails.title);
      let iframeUrl = await fetchIframefromAniHQAnimeDubbed(slugifiedName, currentEpisode);

      if (!iframeUrl && animeDetails.title_english) {
        const fallbackSlug = slugify(animeDetails.title_english);
        iframeUrl = await fetchIframefromAniHQAnimeDubbed(fallbackSlug, currentEpisode);
      }

      setStreamUrlAniHQDubbed(iframeUrl || "");
    };

    fetchAniHQDubbedUrl();
  }, [animeDetails, currentEpisode]);


  useEffect(() => {
    if (!animeDetails || !animeDetails.title) return;

    const fetchHindiDubCount = async () => {
      try {
        const slugifiedName = slugify(animeDetails.title);
        const count = await fetchHindiDubEpisodeCount(slugifiedName, currentEpisode);
        setHindiDubEpisodeCount(count);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setHindiDubEpisodeCount(0);
        } else {
          console.error("Error fetching Hindi Dub episode count:", error);
        }
      }
    };

    const fetchNineAnimeDubCount = async () => {
      try {
        const slugifiedName = slugify(animeDetails.title);
        const count = await nineAnimeDubEpisodeCount(slugifiedName);
        setNineAnimeDubEpisodeCount(count);
      } catch (error) {
        console.error("Error fetching 9Anime Dub episode count:", error);
        setNineAnimeDubEpisodeCount(0);
      }
    };

    fetchHindiDubCount();
    fetchNineAnimeDubCount();
  }, [animeDetails, currentEpisode]);
  useEffect(() => {
    if (autoNext && currentEpisode < episodes.length) {
      const timer = setTimeout(() => {
        handleEpisodeChange(currentEpisode + 1);
      }, 1440*1000); // 5 seconds delay before auto next
      return () => clearTimeout(timer);
    }
  }, [autoNext, currentEpisode, episodes.length]);

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


  const handleEpisodeChange = (epNum) => {
    setCurrentEpisode(epNum);
    // Removed setShowGrid(false) to prevent switching to list view on episode click
    navigate(`/watch/${animeId}/${epNum}`);
  };

  const toggleAutoNext = () => setAutoNext(!autoNext);
  const toggleAutoPlay = () => setAutoPlay(!autoPlay);
  const toggleAutoSkip = () => setAutoSkip(!autoSkip);
  const toggleExpand = () => setExpand(!expand);


  const filteredEpisodes = episodes.filter((ep) =>
    ep.title.toLowerCase().includes(episodeSearch.toLowerCase()) ||
    ep.mal_id.toString().includes(episodeSearch)
  );

  if (!animeDetails) {
    return <Loader />;
  }

  // Helper to get genre string
  const genreString = animeDetails.genres
    ? animeDetails.genres.map((g) => g.name).join(", ")
    : animeDetails.genre || "";

  return (
    <div className="relative min-h-screen text-white">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30"
        style={{ backgroundImage: `url(${animeDetails.images?.jpg?.large_image_url})` }}
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
            <div className="episode-list-header" style={{flexDirection: "column", alignItems: "flex-start", gap: "0.5rem"}}>
                <div style={{display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center",height: "41px"}}>
                <strong style={{fontSize: "1.25rem", color: "white"}}>Episodes</strong>
                <div style={{display: "flex", gap: "0.5rem"}}>
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
                style={{width: "100%", maxWidth: "200px"}}
              />
              <div className="pagination-layout" style={{width: "100%", justifyContent: "center"}}>
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
              <div className={`center-column ${expand ? "expanded" : ""}`}>
              <div className="video-player" style={{ position: "relative", width: "100%", height: "500px", background: !isPlaying ? `url(${animeDetails.images?.jpg?.large_image_url}) center center / cover no-repeat` : "black" }}>
              {!isPlaying ? (
                <div
                  className="video-initial"
                  onClick={() => setIsPlaying(true)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div className="play-button-circle" style={{ zIndex: 2 }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="40" cy="40" r="40" fill="#F97316"/>
                      <path d="M32 26L56 40L32 54V26Z" fill="white"/>
                    </svg>
                  </div>
                </div>
              ) : streamUrl ? (
                <>
              <iframe
              key={`stream-${server}-${currentEpisode}`}
                title={`Episode ${currentEpisode}`}
              src={
                server === "HD-1"
                  ? streamUrl
                  : server === "HD-2"
                  ? streamUrl1
                  : server === "HD-3"
                  ? streamUrl2
              : server === "HD-4"
              ? streamUrl3
              : server === "DesiDub"
              ? streamUrlDesiDub
              : server === "GogoAnime"
              ? streamUrlGogoAnime
              : server === "9AnimeDub"
              ? streamUrl9AnimeDub
              : server === "AniHQSubbed"
              ? streamUrlAniHQSubbed
              : server === "AniHQDubbed"
              ? streamUrlAniHQDubbed
              : server === "HD_player"
              ? streamUrlHanimeHentai
              : streamUrl
                  

                }
                width="100%"
                height="500px"
                allowFullScreen
              ></iframe>
                </>
                ) : (
                <p>Loading stream...</p>
                )} 
              </div>

              <div className="video-controls">
                <button onClick={toggleExpand} className={expand ? "active" : ""}>
                Expand
                </button>
                <button onClick={() => setFocusMode(true)} className={focusMode ? "active" : ""}>
                Focus
                </button>
                <button onClick={toggleAutoPlay} className={autoPlay ? "active" : ""}>
                Auto Play {autoPlay ? "On" : "Off"}
                </button>
                <button onClick={toggleAutoNext} className={autoNext ? "active" : ""}>
                Auto Next {autoNext ? "On" : "Off"}
                </button>
                <button onClick={toggleAutoSkip} className={autoSkip ? "active" : ""}>
                Auto Skip Intro {autoSkip ? "On" : "Off"}
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
          <button className={server === "HD_player" ? "active" : ""} onClick={() => setServer("HD_player")}>HD_player</button>
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
</div>
              </div>
              {/* Countdown Timer */} 
              <div className="countdown-container"> 
                <Countdowm
                  title={animeDetails.title_english || animeDetails.title}
                  episode={currentEpisode}
                  autoNext={autoNext}
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
                  {streamUrl ? (
                    <iframe
              key={`stream-${server}-${currentEpisode}`}
                title={`Episode ${currentEpisode}`}
              src={
                server === "HD-1"
                  ? streamUrl
                  : server === "HD-2"
                  ? streamUrl1
                  : server === "HD-3"
                  ? streamUrl2
              : server === "HD-4"
              ? streamUrl3
              : server === "DesiDub"
              ? streamUrlDesiDub
              : server === "GogoAnime"
              ? streamUrlGogoAnime
              : server === "9AnimeDub"
              ? streamUrl9AnimeDub
              : streamUrl

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
