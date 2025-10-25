import React, { useEffect, useState } from "react";
import { X, Clock } from "lucide-react";

const Countdowm = ({ title }) => {
  const [airingInfo, setAiringInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchAiringTime = async () => {
      const query = `
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            title {
              romaji
              english
            }
            nextAiringEpisode {
              airingAt
              episode
            }
          }
        }
      `;

      const variables = { search: title };

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      const media = data.data.Media;

      if (media && media.nextAiringEpisode) {
        setAiringInfo({
          title: media.title.english || media.title.romaji,
          airingAt: media.nextAiringEpisode.airingAt,
          episode: media.nextAiringEpisode.episode,
        });
      }
    };

    fetchAiringTime();
  }, [title]);

  useEffect(() => {
    if (!airingInfo) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = airingInfo.airingAt - now;

      if (secondsLeft < 0) {
        setTimeLeft("Aired");
        return;
      }

      const daysLeft = Math.floor(secondsLeft / 86400);
      const hoursLeft = Math.floor((secondsLeft % 86400) / 3600);
      const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
      const secs = String(secondsLeft % 60).padStart(2, "0");

      setTimeLeft(`${daysLeft}d ${hoursLeft}:${mins}:${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [airingInfo]);

  if (!airingInfo || !visible) return null;

  const airDate = new Date(airingInfo.airingAt * 1000).toLocaleString();

  return (
    <div className="relative overflow-hidden backdrop-blur-md bg-gradient-to-r from-sky-600/70 to-indigo-600/70 border border-white/20 text-white rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-cyan-300 animate-pulse" />
        <div>
          <div className="flex flex-col">
  <h3 className="font-semibold text-base sm:text-lg leading-tight max-w-[150px] sm:max-w-[250px]">
    <span className="truncate">{airingInfo.title.length > 30 ? airingInfo.title.slice(0, 30) + '...' : airingInfo.title}</span> —{" "}
    <span className="text-cyan-200">Episode {airingInfo.episode}</span>
  </h3>
  <p className="text-sm text-gray-200/90">
    Airs at <span className="text-white font-medium">{airDate}</span>
  </p>
</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="bg-sky-900/60 border border-white/10 text-sm sm:text-base px-3 py-1 rounded-xl shadow-inner font-mono">
          ⏳ {timeLeft}
        </span>
        <button
          onClick={() => setVisible(false)}
          className="hover:bg-white/10 transition rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Countdowm;
