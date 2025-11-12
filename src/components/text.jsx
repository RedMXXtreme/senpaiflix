import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const SatoruEpisodePlayer = () => {
  const { listId: paramListId } = useParams();
  const listId = paramListId || 54;

  const [episodes, setEpisodes] = useState([]);
  const [iframeUrl, setIframeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [error, setError] = useState(null);
  const [animeTitle, setAnimeTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdblockDetected, setIsAdblockDetected] = useState(false);
  const [showAdblockBadge, setShowAdblockBadge] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const episodesPerPage = 100;
  const mountedRef = useRef(true);

  // 🔸 Safe mount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 🔸 Detect AdBlock (once per session)
  useEffect(() => {
    const checkAdBlock = async () => {
      if (sessionStorage.getItem("adblockBadgeShown")) return;

      try {
        const bait = document.createElement("div");
        bait.className = "adsbox";
        bait.style.display = "none";
        document.body.appendChild(bait);
        await new Promise((r) => setTimeout(r, 100));
        if (window.getComputedStyle(bait).display === "none") {
          setIsAdblockDetected(true);
          setShowAdblockBadge(true);
          sessionStorage.setItem("adblockBadgeShown", "true");

          // auto hide after 5 seconds
          setTimeout(() => setShowAdblockBadge(false), 5000);
        }
        bait.remove();
      } catch {
        bait.remove();
      }
    };
    checkAdBlock();
  }, []);

  // 🔸 Initialize modal visibility
  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem("adblockWarningDate");
    const sessionShown = sessionStorage.getItem("adblockWarningShown");
    setShowModal(!sessionShown && lastShown !== today);
  }, []);

  // 🔸 HTML parsing utils
  function parseHtmlString(htmlOrObj) {
    try {
      const htmlString =
        typeof htmlOrObj === "string" ? htmlOrObj : htmlOrObj?.html ?? "";
      if (!htmlString) return null;
      const parser = new DOMParser();
      return parser.parseFromString(htmlString, "text/html");
    } catch (err) {
      console.error("parseHtmlString error:", err);
      return null;
    }
  }

  function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  // 🔸 Fetch episodes
  useEffect(() => {
    const fetchEpisodes = async () => {
      setError(null);
      try {
        setLoading(true);
        const resp = await axios.get(
          `https://api.codetabs.com/v1/proxy/?quest=https://satoru.one/ajax/episode/list/${listId}`
        );
        const doc = parseHtmlString(resp?.data);
        if (!doc) throw new Error("Failed to parse episode list");

        const episodeEls = Array.from(doc.querySelectorAll(".ep-item"));
        const episodesList = episodeEls
          .map((el) => ({
            id: el.getAttribute("data-id") || el.getAttribute("data-ep-id"),
            number:
              el.getAttribute("data-number") ||
              el.querySelector(".ssli-order")?.textContent?.trim() ||
              "",
            title:
              stripHtml(el.querySelector(".ep-name")?.innerHTML || "") ||
              el.getAttribute("title") ||
              "",
            href: el.getAttribute("href") || "",
          }))
          .filter((ep) => ep.id);

        let animeTitle = "Unknown Anime";
        if (episodesList.length > 0) {
          const href = episodesList[0].href;
          if (href) {
            try {
              const pathname = new URL(href).pathname;
              const slugWithDash = pathname.split("/")[2] || "";
              const slug = slugWithDash.replace("--", "");
              animeTitle = slug
                .split("-")
                .map(
                  (word) => word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ");
            } catch {}
          }
        }
        setAnimeTitle(animeTitle);

        if (!mountedRef.current) return;
        setEpisodes(episodesList);
        const ep1 = episodesList.find((ep) => ep.number === "1");
        handleSelectEpisode(ep1 ? ep1.id : episodesList[0]?.id);
      } catch (err) {
        if (mountedRef.current) setError(err.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    fetchEpisodes();
  }, [listId]);

  // 🔸 Reset pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [episodes]);

  // 🔸 Pagination + Search
  const totalPages = Math.ceil(episodes.length / episodesPerPage);
  const startIndex = (currentPage - 1) * episodesPerPage;
  const currentEpisodes = episodes.slice(
    startIndex,
    startIndex + episodesPerPage
  );
  const filteredEpisodes = currentEpisodes.filter(
    (ep) =>
      ep.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔸 Episode selection
  async function handleSelectEpisode(episodeId) {
    if (!episodeId) return;
    setSelectedEpisode(episodeId);
    setError(null);
    try {
      setLoading(true);
      const resp = await axios.get(
        `https://api.codetabs.com/v1/proxy/?quest=https://satoru.one/ajax/episode/servers?episodeId=${episodeId}`
      );
      const doc = parseHtmlString(resp?.data);
      if (!doc) throw new Error("Failed to parse server HTML");

      const serverEl = doc.querySelector(".server-item");
      if (!serverEl) throw new Error("No server-item found");

      const sourceId = serverEl.getAttribute("data-id");
      if (!sourceId) throw new Error("Missing data-id");

      const sourceResp = await axios.get(
        `https://api.codetabs.com/v1/proxy/?quest=https://satoru.one/ajax/episode/sources?id=${sourceId}`
      );
      const link = sourceResp?.data?.link ?? sourceResp?.data?.url;
      if (!link) throw new Error("No playable link returned");
      if (!mountedRef.current) return;
      setIframeUrl(link);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // 🔸 Modal close logic
  const handleCloseModal = () => {
    const modal = document.getElementById("adblock-warning-modal");
    if (!modal) return;
    modal.classList.add("animate-fadeOut");
    setTimeout(() => {
      sessionStorage.setItem("adblockWarningShown", "true");
      const skipToday = document.getElementById("adblock-checkbox").checked;
      if (skipToday) {
        localStorage.setItem("adblockWarningDate", new Date().toDateString());
      }
      setShowModal(false);
    }, 400);
  };

  const today = new Date().toDateString();
  const lastShown = localStorage.getItem("adblockWarningDate");
  const sessionShown = sessionStorage.getItem("adblockWarningShown");

  return (
    <div className="relative min-h-screen font-inter text-white bg-[#0b0b0b] overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-[#0b0b0b] to-black opacity-40 blur-3xl"></div>

      <div className="relative flex flex-col md:flex-row gap-6 max-w-[1400px] mx-auto p-4 z-10">
        {/* Sidebar */}
        <div className="w-full md:w-[25%] bg-[#131313]/90 backdrop-blur-md rounded-2xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 h-fit">
          <h2 className="text-lg font-semibold mb-3">Episodes</h2>

          {totalPages > 1 && (
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
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-md bg-[#1e1e1e] text-sm outline-none focus:ring-1 focus:ring-purple-500"
          />

          <div className="max-h-[500px] overflow-y-auto pr-1 custom-scroll">
            {filteredEpisodes.length === 0 && !loading && (
              <p className="text-gray-400 text-sm">No episodes found</p>
            )}

            {filteredEpisodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => handleSelectEpisode(ep.id)}
                className={`w-full text-left px-3 py-2 mb-2 rounded-lg font-medium transition-all flex items-center gap-3 ${
                  selectedEpisode === ep.id
                    ? "bg-purple-600 shadow-[0_0_10px_rgba(236,72,153,0.6)]"
                    : "bg-[#1e1e1e] hover:bg-[#2a2a2a]"
                }`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span>Episode {ep.number}</span>
                  {ep.title && (
                    <span className="text-xs text-gray-400 truncate">
                      {ep.title}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Section */}
        <div className="flex-1 relative">
          {showAdblockBadge && isAdblockDetected && (
            <div
              className="absolute top-3 left-3 bg-green-600/80 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg backdrop-blur-md"
              style={{
                animation:
                  "pulseGlow 2s infinite ease-in-out, fadeOut 0.5s ease-out 4.5s forwards",
              }}
            >
              ✅ AdBlock Active
            </div>
          )}

          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold tracking-wide text-purple-400 drop-shadow-md">
              🎬 {animeTitle}
            </h1>
            <p className="text-gray-400 mt-1">Satoru Episode Player</p>
          </div>

          {loading && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />
            </div>
          )}
          {error && (
            <p className="text-red-400 text-center bg-red-900/30 px-4 py-2 rounded-lg mb-4">
              ⚠️ {error}
            </p>
          )}

          {/* Video Player */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-xl">
            {!iframeUrl ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading player...
              </div>
            ) : (
              <>
                {showModal && (
                  <div
                    id="adblock-warning-modal"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn"
                  >
                    <div className="bg-[#141414] border border-purple-700/50 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] max-w-md w-full text-center p-6">
                      <h2 className="text-2xl font-bold text-yellow-400 mb-3">
                        ⚠️ Important Notice
                      </h2>
                      <p className="text-gray-200 text-sm mb-5 leading-relaxed">
                        The video player may show{" "}
                        <span className="text-red-400 font-medium">vulgar</span>{" "}
                        or{" "}
                        <span className="text-red-400 font-medium">
                          inappropriate ads
                        </span>{" "}
                        from third-party sources. Please use an{" "}
                        <a
                          href="https://getadblock.com/en/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-purple-400"
                        >
                          AdBlock
                        </a>{" "}
                        or{" "}
                        <a
                          href="https://ublockorigin.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-purple-400"
                        >
                          uBlock
                        </a>{" "}
                        extension for a safer experience.
                      </p>

                      <label className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-4">
                        <input
                          id="adblock-checkbox"
                          type="checkbox"
                          className="accent-purple-500"
                        />
                        Don’t show this again today
                      </label>

                      <button
                        onClick={handleCloseModal}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all"
                      >
                        I Understand, Continue
                      </button>
                    </div>
                  </div>
                )}

                <iframe
                  src={iframeUrl}
                  allowFullScreen
                  className="w-full h-full rounded-xl border-0"
                  title="Satoru Player"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatoruEpisodePlayer;
