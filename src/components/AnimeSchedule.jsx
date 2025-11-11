import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// --- Helper: Convert date to Unix start/end range ---
const getUnixRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000),
  };
};

const AnimeSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  });
  const [showAll, setShowAll] = useState(false);

  // --- Fetch Schedule from AniList GraphQL ---
  useEffect(() => {
    const controller = new AbortController();

    const fetchSchedule = async () => {
      setLoading(true);
      const { start, end } = getUnixRange(selectedDate);

      const query = `
        query ($start: Int, $end: Int) {
          Page(perPage: 50) {
            airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
              airingAt
              episode
              media {
                id
                idMal
                title {
                  romaji
                  english
                }
              }
            }
          }
        }
      `;

      try {
        const response = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables: { start, end } }),
          signal: controller.signal,
        });

        const data = await response.json();
        const schedules = data?.data?.Page?.airingSchedules || [];
        setSchedule(schedules);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching schedule:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
    return () => controller.abort();
  }, [selectedDate]);

  // --- Navigation handlers (7-day jumps) ---
  const goToPreviousWeek = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  // --- Formatting utilities ---
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateLabel = (date) => ({
    day: date.toLocaleDateString(undefined, { weekday: "short" }),
    date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  });

  const isSameDate = (d1, d2) => d1.toDateString() === d2.toDateString();

  return (
    <div className="bg-[#1f1f2e] rounded-xl p-4 text-sm">
      {/* --- Sticky Date Navigation --- */}
      <div className="sticky top-0 z-10 bg-[#1f1f2e]/95 backdrop-blur-md py-2 mb-4 flex items-center justify-between">
        <button
          onClick={goToPreviousWeek}
          className="bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition flex-shrink-0"
          aria-label="Previous week"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* --- Date Selector Scrollable --- */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide mx-2 px-1 py-2 sm:space-x-3">
          {[...Array(7)].map((_, i) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const { day, date } = formatDateLabel(d);
            const selected = isSameDate(d, selectedDate);

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center justify-center min-w-[64px] sm:min-w-[72px] py-2 px-3 rounded-lg cursor-pointer transition ${
                  selected
                    ? "bg-pink-500 text-white font-bold"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className="text-xs sm:text-sm">{day}</span>
                <span className="text-[11px] sm:text-xs">{date}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={goToNextWeek}
          className="bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition flex-shrink-0"
          aria-label="Next week"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* --- Schedule List --- */}
      {loading ? (
        <p className="text-center text-gray-400 py-4">Loading...</p>
      ) : schedule.length === 0 ? (
        <p className="text-center text-gray-400 py-4">No shows airing today.</p>
      ) : (
        <ul className="space-y-3 sm:space-y-4">
          {(showAll ? schedule : schedule.slice(0, 6)).map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between bg-gradient-to-r from-gray-800/80 to-gray-900/70 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 hover:border-pink-500 transition"
            >
              <span className="w-16 text-gray-400 text-xs sm:text-sm">
                {formatTime(item.airingAt)}
              </span>
              <span className="flex-1 text-white font-semibold truncate px-2 sm:px-4 text-sm sm:text-base">
                {item.media.title.english || item.media.title.romaji}
              </span>
              <Link
                to={`/watch/${item.media.id}`}
                className="flex items-center text-gray-300 hover:text-pink-400 transition duration-300 text-xs sm:text-sm"
              >
                <span>Ep {item.episode}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* --- Show More / Less --- */}
      {schedule.length > 6 && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="bg-pink-500 text-white px-5 py-2 rounded-lg text-sm hover:bg-pink-600 transition"
          >
            {showAll ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AnimeSchedule;
