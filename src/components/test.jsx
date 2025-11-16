// --- SAME IMPORTS ---
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FaSpinner, FaDatabase } from "react-icons/fa";
import { MdOutlineError } from "react-icons/md";

// Constants
const MAX_ID = 1000;
const BATCH_SIZE = 10;
const UI_UPDATE_INTERVAL = 50;

const SATORU_BASE_URL =
  "https://api.codetabs.com/v1/proxy/?quest=https://satoru.one/ajax/episode/list/";

const ANILIST_GRAPHQL_URL =
  "https://steller-tau.vercel.app/meta/anilist/{animeName}";

const STORAGE_KEY = "satoru_titles_cache";

const TestTitles = () => {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const parseHtmlString = (htmlOrObj) => {
    try {
      const htmlString =
        typeof htmlOrObj === "string" ? htmlOrObj : htmlOrObj?.html ?? "";
      if (!htmlString) return null;
      return new DOMParser().parseFromString(htmlString, "text/html");
    } catch {
      return null;
    }
  };

  const fetchAniListFull = async (title) => {
    if (!title || title === "Unknown") return { anilistId: null, image: null };

    try {
      const url = ANILIST_GRAPHQL_URL.replace(
        "{animeName}",
        encodeURIComponent(title)
      );
      const resp = await axios.get(url);
      const first = resp.data?.results?.[0];
      if (!first) return { anilistId: null, image: null };
      return {
        anilistId: first.id || null,
        image: first.image || null,
      };
    } catch {
      return { anilistId: null, image: null };
    }
  };

  const fetchTitleData = async (id) => {
    let title = "Unknown";

    try {
      const resp = await axios.get(`${SATORU_BASE_URL}${id}`);
      const doc = parseHtmlString(resp?.data);

      if (doc) {
        const epItems = doc.querySelectorAll(".ep-item");
        if (epItems.length > 0) {
          const href = epItems[0].getAttribute("href");
          if (href) {
            try {
              const pathname = new URL(href).pathname;
              const slugWithDash = pathname.split("/")[2] || "";
              const slug = slugWithDash.replace("--", "");
              title = slug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
            } catch {}
          }
        }
      }
    } catch {}

    const { anilistId, image } = await fetchAniListFull(title);
    return { id, title, anilistId, image };
  };

  const fetchTitles = useCallback(async () => {
    setLoading(true);
    setError(null);

    let tempList = [];

    let cached = [];
    try {
      const cacheStr = localStorage.getItem(STORAGE_KEY);
      cached = cacheStr ? JSON.parse(cacheStr) : [];
    } catch (e) {
      console.warn("Failed to load cache:", e);
    }

    if (cached.length > 0) {
      tempList = [...cached];
      setTitles(cached);
      setProgress(Math.round((cached.length / MAX_ID) * 100));
    }

    try {
      for (let i = tempList.length; i < MAX_ID; i += BATCH_SIZE) {
        const batch = [];

        for (let j = 0; j < BATCH_SIZE && i + j < MAX_ID; j++) {
          batch.push(fetchTitleData(i + j + 1));
        }

        const results = await Promise.allSettled(batch);

        const cleaned = results.map((res, idx) =>
          res.status === "fulfilled"
            ? res.value
            : {
                id: i + idx + 1,
                title: "Unknown",
                anilistId: null,
                image: null,
              }
        );

        tempList.push(...cleaned);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(tempList));
        } catch (e) {
          console.warn("Failed to save cache:", e);
        }

        if (tempList.length % UI_UPDATE_INTERVAL === 0) {
          setTitles([...tempList]);
        }

        setProgress(Math.round((tempList.length / MAX_ID) * 100));
      }

      setTitles([...tempList]);
      setProgress(100);
    } catch (err) {
      setError(err.message || "Failed to fetch titles.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  const filteredTitles = useMemo(
    () => titles.filter((item) => item.title !== "Unknown"),
    [titles]
  );

  // ---------------------------
  //        UPDATED UI
  // ---------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-6xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <FaDatabase /> Hindi Anime Database
          </h1>
        </div>

        {error && (
          <div className="text-red-400 text-center mb-6">
            <MdOutlineError /> {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center text-gray-300 mb-10">
            <FaSpinner className="animate-spin text-3xl mb-2 text-purple-400" />
            <p className="text-sm">Fetching titles... please wait</p>
            <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs mt-1">{progress}% complete</p>
          </div>
        )}

        {/* --- NEW GRID UI --- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 place-items-center">
          {filteredTitles.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center cursor-pointer"
            >
              <Link
                to={`/satoru/${item.id}`}
                target="_blank"
                className="
                  w-[150px] h-[220px]
                  rounded-xl overflow-hidden
                  shadow-lg
                  bg-gray-700/40 border border-gray-600
                  hover:scale-105 hover:shadow-2xl
                  transition-all duration-300
                "
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white  text-xs">
                   {item.title}
                  </div>
                )}
              </Link>

              <p className="mt-3 text-center text-gray-300 text-sm font-semibold w-[150px] truncate">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TestTitles;
