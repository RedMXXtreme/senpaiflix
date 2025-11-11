import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FaSpinner, FaDatabase } from "react-icons/fa";
import { MdOutlineError } from "react-icons/md";

const TestTitles = () => {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  function parseHtmlString(htmlOrObj) {
    try {
      const htmlString =
        typeof htmlOrObj === "string"
          ? htmlOrObj
          : htmlOrObj?.html ?? "";
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

  const fetchTitles = async () => {
    setLoading(true);
    setTitles([]);
    const newTitles = [];

    for (let id = 1; id <= 1000; id++) {
      try {
        const resp = await axios.get(
          `https://api.codetabs.com/v1/proxy/?quest=https://satoru.one/ajax/episode/list/${id}`
        );
        const doc = parseHtmlString(resp?.data);
        if (doc) {
          const episodeEls = Array.from(doc.querySelectorAll(".ep-item"));
          if (episodeEls.length > 0) {
            const href = episodeEls[0].getAttribute("href");
            if (href) {
              try {
                const pathname = new URL(href).pathname;
                const slugWithDash = pathname.split("/")[2] || "";
                const slug = slugWithDash.replace("--", "");
                const title = slug
                  .split("-")
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                  )
                  .join(" ");
                newTitles.push({ id, title });
              } catch {
                // Skip on parse error
              }
            }
          }
        }
      } catch {
        // Skip on fetch error
      }

      // update every 10 requests
      if (id % 10 === 0) {
        setTitles([...newTitles]);
        setProgress(Math.round((id / 1000) * 100));
      }
    }

    setTitles(newTitles);
    setLoading(false);
    setProgress(100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-5xl"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <FaDatabase /> Anime Titles Finder
          </h1>
          <button
            onClick={fetchTitles}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Fetching..." : "Start Fetch"}
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center text-gray-300 mb-6">
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

        <div className="max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800">
          {titles.length === 0 && !loading ? (
            <p className="text-gray-400 text-center py-8">
              No titles fetched yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {titles.map((item) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 py-2 hover:bg-gray-700/60 rounded-md transition-all"
                >
                  <span className="text-gray-400 text-sm font-mono">
                    #{item.id}
                  </span>{" "}
                  {item.title.includes("error") ||
                  item.title.includes("No ") ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <MdOutlineError /> {item.title}
                    </span>
                  ) : (
                    <Link
                      to={`/satoru/${item.id}`}
                      className="text-purple-300 hover:text-purple-100 transition"
                    >
                      {item.title}
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TestTitles;
