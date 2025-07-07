import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Loader from '../components/Loader';
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

const AnimeDetail = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [promoVideoUrl, setPromoVideoUrl] = useState(null);
  const [promoVideos, setPromoVideos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAnime = async () => {
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
      } catch (err) {
        console.error("Error fetching anime detail from Jikan", err);
      }
    };

    fetchAnime();
  }, [id]);

  useEffect(() => {
    // Fetch promo videos when id changes
    if (id) {
      fetchPromoVideos();
    }
  }, [id]);

  const fetchPromoVideos = async () => {
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}/videos`);
      const promoVideos = response.data.data.promo;
      if (promoVideos && promoVideos.length > 0) {
        setPromoVideos(promoVideos);
      } else {
        console.log("No promo videos available.");
      }
    } catch (error) {
      console.error("Error fetching promo videos:", error);
    }
  };

 
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
          <div className="bg-black text-pink-400 w-full text-center py-2 rounded-b-xl font-semibold text-sm mt-2">
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
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Trailers</h2>
            {promoVideos.length === 0 && (
              <p className="text-gray-400">No promo videos available.</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {promoVideos.map((promo, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer rounded-lg overflow-hidden shadow-lg"
                  onClick={() => {
                    setPromoVideoUrl(promo.trailer.embed_url);
                    setIsModalOpen(true);
                  }}
                >
                  <img
                    src={promo.trailer.images.maximum_image_url}
                    alt={`Trailer ${index + 1}`}
                    className="w-full h-auto object-cover rounded-lg"
                    style={{ aspectRatio: "16/9" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    <FaPlay className="text-white text-3xl sm:text-4xl md:text-5xl" />
                  </div>
                  <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-60 rounded px-2 py-1">
                    PV {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 sm:p-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white text-3xl sm:text-4xl font-bold z-50 hover:text-pink-400 transition-colors"
              onClick={() => {
                setIsModalOpen(false);
                setPromoVideoUrl(null);
              }}
              aria-label="Close video modal"
            >
              &times;
            </button>
            <iframe
              src={promoVideoUrl}
              title="Promo Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
              frameBorder="0"
            ></iframe>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnimeDetail;
