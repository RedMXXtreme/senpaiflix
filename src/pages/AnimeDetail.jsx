import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Loader from '../components/Loader';
import { fetchAnimeVideos } from '../utils/api';

import {
  FaPlay,
  FaMicrophone,
  FaShareAlt,
  FaTelegramPlane,
  FaTwitter,
  FaFacebookF,
  FaRedditAlien,
} from "react-icons/fa";

const Genre = ({ genre }) => (
  <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs">
    {genre}
  </span>
);

const CACHE_KEY_PREFIX = 'anime_detail_cache_';
const CACHE_EXPIRY = 3600000; // 1 hour in milliseconds

function getCachedData(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
      return parsed.data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function setCachedData(key, data) {
  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(cacheEntry));
}

const AnimeDetail = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [promoVideoUrl, setPromoVideoUrl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAnime = async () => {
      const cacheKey = CACHE_KEY_PREFIX + id;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setAnime(cachedData);
        return;
      }
      try {
        const response = await axios.get(
          `https://api.jikan.moe/v4/anime/${id}`
        );
        const data = response.data.data;
        const animeData = {
          title: data.title_english,
          japaneseTitle: data.title_japanese,
          synonyms: data.title_synonyms,
          description: data.synopsis,
          coverImage: data.images.jpg.large_image_url,
          bannerImage:
            data.trailer?.images?.large || data.images.jpg.large_image_url,
          genres: data.genres.map((genre) => genre.name),
          episodes: data.episodes,
          status: data.status,
          aired: data.aired?.string || "Unknown",
          premiered:
            data.season && data.year
              ? `${data.season.charAt(0).toUpperCase() + data.season.slice(1)} ${
                  data.year
                }`
              : data.premiered || "Unknown",
          duration: data.duration || "Unknown",
          malScore: data.score || "N/A",
          studios: data.studios.map((studio) => studio.name).join(", ") || "Unknown",
          producers:
            data.producers.map((producer) => producer.name).join(", ") || "Unknown",
          rating: data.rating || "PG-13",
          type: data.type || "TV",
        };
        setAnime(animeData);
        setCachedData(cacheKey, animeData);
      } catch (err) {
        console.error("Error fetching anime detail from Jikan", err);
      }
    };

    fetchAnime();
  }, [id]);

  useEffect(() => {
    const fetchPromoVideo = async () => {
      try {
        const videosData = await fetchAnimeVideos(id);
        // The API response structure for videos is { promo: [...], episodes: [...], music_videos: [...] }
        // Each promo item has a trailer object with url and embed_url
        if (videosData && videosData.promo && videosData.promo.length > 0) {
          // Use the first promo trailer embed_url for iframe embed
          setPromoVideoUrl(videosData.promo[0].trailer.embed_url);
        } else if (videosData && videosData.promo && videosData.promo.length === 0 && videosData.trailer) {
          // fallback to trailer embed_url if promo not available
          setPromoVideoUrl(videosData.trailer.embed_url);
        } else {
          setPromoVideoUrl(null);
        }
      } catch (error) {
        console.error("Error fetching promo video:", error);
        setPromoVideoUrl(null);
      }
    };

    fetchPromoVideo();
  }, [id]);

  if (!anime) return <div className="p-4 text-white"><Loader /></div>;

  const badges = [
    { label: anime.rating, bgColor: "bg-white text-black" },
    { label: anime.type, bgColor: "bg-pink-400 text-white" },
    { label: anime.status, bgColor: "bg-green-400 text-black" },
    {
      label: anime.episodes
        ? `${anime.episodes} Episodes`
        : "Unknown Episodes",
      bgColor: "bg-blue-300 text-black",
      icon: <FaMicrophone className="ml-1" />,
    },
  ];

  const truncatedDescription =
    anime.description && anime.description.length > 300 && !descExpanded
      ? anime.description.slice(0, 300) + "..."
      : anime.description;

  return (
    <div className="relative min-h-screen text-white bg-gray-900">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30"
        style={{ backgroundImage: `url(${anime.bannerImage})` }}
        aria-hidden="true"
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Left */}
        <div className="flex-shrink-0 w-full md:w-64 flex flex-col items-center gap-4">
          <img
            src={anime.coverImage}
            alt={anime.title}
            className="rounded-xl shadow-lg w-full"
          />
          <div className="bg-black text-pink-400 w-full text-center py-2 rounded-b-xl font-semibold text-sm">
            <FaMicrophone className="inline mr-1" />
            Watch2gether
          </div>
          <div className="flex gap-4 w-full">
              <a href={`/watch/${id}`} className="flex items-center justify-center gap-2 bg-pink-400 hover:bg-pink-500 transition text-black font-semibold rounded-full px-6 py-2 w-full">
                <FaPlay /> Watch now
              </a>
            <button className="bg-white text-black font-semibold rounded-full px-6 py-2 w-full hover:bg-gray-200 transition">
              + Add to List
            </button>
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-sm text-gray-400">
            Home &bull; {anime.type} &bull; {anime.title || anime.japaneseTitle}
          </p>
          <h1 className="text-4xl font-extrabold">{anime.title || anime.japaneseTitle}</h1>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 items-center text-xs font-semibold">
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className={`${badge.bgColor} rounded-md px-3 py-1 flex items-center gap-1 shadow-sm`}
              >
                {badge.label}
                {badge.icon && badge.icon}
              </span>
            ))}
            <span className="text-gray-400 mx-2">&bull;</span>
            <span>{anime.type}</span>
            <span className="text-gray-400 mx-2">&bull;</span>
            <span>{anime.duration}</span>
          </div>

          {/* Description */}
          <p className="text-sm mt-4">
            {truncatedDescription}
            {anime.description && anime.description.length > 300 && (
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-pink-400 font-semibold ml-2"
              >
                {descExpanded ? "Less" : "+ More"}
              </button>
            )}
          </p>

          <p className="text-sm mt-4 text-gray-300">
            Senpai  is the best site to watch <strong>{anime.title || anime.japaneseTitle}</strong> SUB
            online, or you can even watch <strong>{anime.title || anime.japaneseTitle}</strong> DUB in
            HD quality. You can also find <strong>{anime.studios}</strong> anime on
            Senpai website.
          </p>

          {/* Share */}
          <div className="flex items-center gap-4 mt-8">
            <img
              src="https://i.pinimg.com/originals/fe/4f/be/fe4fbee33daaa301e2155702962fa927.gif"
              alt="avatar"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="text-pink-400 font-semibold">Share Anime</p>
              <p className="text-sm text-gray-300">to your friends</p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-gray-400 text-xs">
              <span>157 Shares</span>
              <button className="bg-blue-500 hover:bg-blue-600 rounded-full p-2">
                <FaTelegramPlane className="text-white" />
              </button>
              <button className="bg-black hover:bg-gray-800 rounded-full p-2">
                <FaTwitter className="text-white" />
              </button>
              <button className="bg-blue-700 hover:bg-blue-800 rounded-full p-2">
                <FaFacebookF className="text-white" />
              </button>
              <button className="bg-orange-500 hover:bg-orange-600 rounded-full p-2">
                <FaRedditAlien className="text-white" />
              </button>
              <button className="bg-green-600 hover:bg-green-700 rounded-full p-2">
                <FaShareAlt className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="w-72 flex-shrink-0 bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-6 text-sm space-y-3 border border-gray-700">
          <div>
            <span className="font-semibold">Japanese:</span>{" "}
            {anime.japaneseTitle || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Synonyms:</span>{" "}
            {anime.synonyms && anime.synonyms.length > 0 ? anime.synonyms.join(", ") : "N/A"}
          </div>
          <div>
            <span className="font-semibold">Aired:</span> {anime.aired}
          </div>
          <div>
            <span className="font-semibold">Premiered:</span> {anime.premiered}
          </div>
          <div>
            <span className="font-semibold">Duration:</span> {anime.duration}
          </div>
          <div>
            <span className="font-semibold">Status:</span> {anime.status}
          </div>
          <div>
            <span className="font-semibold">MAL Score:</span> {anime.malScore}
          </div>
          <div>
            <span className="font-semibold">Genres:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {anime.genres.map((genre) => (
                <Genre key={genre} genre={genre} />
              ))}
            </div>
          </div>
          <div>
            <span className="font-semibold">Studios:</span> {anime.studios}
          </div>
          <div>
            <span className="font-semibold">Producers:</span>{" "}
            {anime.producers}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {promoVideoUrl && (
          <>
            <img
              src={anime.coverImage}
              alt="Promo Video Thumbnail"
              className="cursor-pointer rounded-lg shadow-lg w-full max-h-[480px] object-cover"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
            />
            {isModalOpen && (
              <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                    &times;
                  </button>
                  <iframe
                    src={promoVideoUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-[480px]"
                  ></iframe>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnimeDetail;

{ /* Add modal styles */ }
<style jsx>{`
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .modal-content {
    position: relative;
    background: #000;
    padding: 1rem;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 80vh;
  }
  .modal-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: transparent;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
  }
`}</style>
