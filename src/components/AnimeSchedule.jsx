import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

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
        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { start, end } }),
          signal,
        });
        const data = await response.json();
        setSchedule(data.data.Page.airingSchedules);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching schedule:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();

    return () => controller.abort();
  }, [selectedDate]);

  const goToPreviousWeek = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 2);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 2);
      return newDate;
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (date) => {
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  };

  const isSameDate = (d1, d2) => d1.toDateString() === d2.toDateString();

  return (
    <div className="bg-[#1a1a2e] text-white p-6 rounded-md max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousWeek}
          className="bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition"
          aria-label="Previous week"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex space-x-3 overflow-x-auto scrollbar-hide" style={{ overflowX: 'hidden' }}>
          {[...Array(3)].map((_, i) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const { day, date } = formatDateLabel(d);
            const selected = isSameDate(d, selectedDate);
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center justify-center min-w-[80px] py-3 px-4 rounded-lg cursor-pointer transition ${
                  selected ? 'bg-pink-400 text-white font-bold' : 'bg-gray-800 text-gray-400'
                }`}
              >
                <span className="text-sm">{day}</span>
                <span className="text-xs">{date}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={goToNextWeek}
          className="bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition"
          aria-label="Next week"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) : (
        <ul className="space-y-4">
          {schedule.length === 0 && <p className="text-center text-gray-400">No shows airing today.</p>}
          {(showAll ? schedule : schedule.slice(0, 5)).map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between border-b border-gray-700 pb-2"
            >
              <span className="w-16 text-gray-400 text-sm">{formatTime(item.airingAt)}</span>
              <span className="flex-1 text-white font-semibold truncate px-4">
                {item.media.title.english || item.media.title.romaji}
              </span>
              <span className="flex items-center text-gray-400 text-sm space-x-1">
                <Link to={`/watch/${item.media.idMal}`} className="hover:text-pink-400 transition duration-300"><span>Episode {item.episode}</span></Link>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </li>
          ))}
        </ul>
      )}
      {schedule.length > 5 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-pink-400 text-white px-4 py-2 rounded hover:bg-pink-500 transition"
          >
            {showAll ? 'Show Less' : 'Show More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AnimeSchedule;
