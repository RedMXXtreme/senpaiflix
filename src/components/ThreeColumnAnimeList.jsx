import React, { useEffect, useState } from "react";
import { sendAniListQuery } from "../utils/anilistApi";

const fetchAnimeByStatus = async (status) => {
  const query = `
    query ($status: MediaStatus) {
      Page(perPage: 6) {
        media(status: $status, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
          }
          coverImage {
            medium
          }
          episodes
          format
          averageScore
        }
      }
    }
  `;
  const variables = { status };
  const data = await sendAniListQuery(query, variables);
  return data.Page.media;
};

const AnimeSection = ({ title, data, tag }) => (
  <div className="bg-[#111] p-4 rounded-lg w-full md:w-1/3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-xl font-semibold">{title}</h2>
        <a
          href={`/${tag}`}
          className="text-white/60 text-sm hover:text-white transition-colors"
          aria-label={`Go to ${title} category`}
        >
          🔗
        </a>
      </div>
    <ul className="space-y-4">
      {data.map((anime) => (
        <li key={anime.id} className="flex items-center gap-3">
          <img
            src={anime.coverImage.medium}
            alt={anime.title.romaji}
            className="w-12 h-12 rounded-full object-cover border border-gray-600"
          />
          <div className="flex flex-col text-white text-sm">
            <a href={`/anime/${anime.id}`} className="font-semibold line-clamp-1">
              {anime.title.romaji}
            </a>
            <div className="flex gap-2 mt-1 text-xs text-gray-400 flex-wrap">
              <span className="bg-gray-700 px-2 py-0.5 rounded">CC {anime.episodes || "?"}</span>
              <span className="bg-gray-700 px-2 py-0.5 rounded">{anime.format}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default function ThreeColumnAnimeList() {
  const [newReleases, setNewReleases] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [newData, upcomingData, completedData] = await Promise.all([
          fetchAnimeByStatus("RELEASING"),
          fetchAnimeByStatus("NOT_YET_RELEASED"),
          fetchAnimeByStatus("FINISHED"),
        ]);
        setNewReleases(newData);
        setUpcoming(upcomingData);
        setCompleted(completedData);
      } catch (err) {
        console.error("Error loading anime:", err);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 rounded-lg max-w-screen-xl mx-auto">
      <AnimeSection title="New Releases" data={newReleases} tag="new-releases" />
      <AnimeSection title="Upcoming" data={upcoming} tag="updates" />
      <AnimeSection title="Completed" data={completed} tag="ongoing" />
    </div>
  );
}
