import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const Countdowm = ({ title }) => {
  const [airingInfo, setAiringInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
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

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setTimeLeft('Aired');
        return;
      }

      const daysLeft = Math.floor(secondsLeft / 86400);
      const hoursLeft = Math.floor((secondsLeft % 86400) / 3600);
      const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
      const secs = String(secondsLeft % 60).padStart(2, '0');

      setTimeLeft(`${daysLeft}d ${hoursLeft}:${mins}:${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [airingInfo]);

  if (!airingInfo || !visible) return null;

  const airDate = new Date(airingInfo.airingAt * 1000).toLocaleString();

  return (
    <div className="bg-sky-600 text-white rounded-md p-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-lg">🚀</span>
        <span className="font-semibold">
          {airingInfo.title} Episode {airingInfo.episode} airs at {airDate}
        </span>
        <span className="bg-sky-800 text-xs px-2 py-1 rounded ml-2">
          ⏳ {timeLeft}
        </span>
      </div>
      <button onClick={() => setVisible(false)} className="hover:text-gray-300">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Countdowm;