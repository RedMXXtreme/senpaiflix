import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendAniListQuery } from '../utils/anilistApi';

export default function UpComingGrid() {
  const [animeData, setAnimeData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const query = `
          query {
            Page(perPage: 24) {
              media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
                idMal
                title {
                  romaji
                }
                coverImage {
                  large
                }
                episodes
                format
                averageScore
              }
            }
          }
        `;
        const data = await sendAniListQuery(query);
        setAnimeData(data.Page.media);
      } catch (error) {
        console.error('Error fetching anime data:', error);
      }
    };
    fetchAnime();
  }, []);

  return (
    <div className="bg-[#0f0f1c] min-h-screen text-white py-8 px-4">
      <h2 className="text-3xl font-bold mb-6 max-w-screen-xl mx-auto">Latest Update</h2>

      <div className="max-w-screen-xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {animeData.map((anime, index) => (
          <div
            key={anime.idMal}
            className="relative cursor-pointer flex flex-col items-center"
            onClick={() => navigate(`/anime/${anime.idMal}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/anime/${anime.idMal}`);
            }}
          >
            <div className="relative cursor-pointer flex flex-col items-center">
  {/* Top-left tags */}
  <div className="absolute top-1 left-1 flex gap-1 z-10">
    <span className="bg-orange-600 text-xs px-1 py-0.5 rounded text-white font-bold">
      CC {anime.averageScore ? Math.floor(anime.averageScore / 10) : 'NR'}
    </span>
    {anime.episodes && (
      <span className="bg-green-600 text-xs px-1 py-0.5 rounded text-white font-bold">
        {anime.episodes}
      </span>
    )}
  </div>

  {/* Image */}
  <img
    src={anime.coverImage.large}
    alt={anime.title.romaji}
    className="w-full h-52 object-cover rounded-lg shadow-md transition-transform transform hover:scale-105"
  />

  {/* Title */}
  <p
    className="font-medium text-sm text-center w-full mt-2 px-2 line-clamp-1"
    title={anime.title.romaji}
  >
    {anime.title.romaji}
  </p>

  {/* Format */}
  <div className="mt-1 flex gap-1 items-center text-xs font-semibold">
    {anime.format && (
      <span className="bg-white text-black px-2 py-0.5 rounded shadow">
        {anime.format}
      </span>
    )}
  </div>
</div>
          </div>
        ))}
      </div>
    </div>
  );
}
