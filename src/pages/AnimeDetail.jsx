// AnimeDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FaPlay,
  FaPlus,
  FaShareAlt,
  FaTelegramPlane,
  FaTwitter,
  FaFacebookF,
  FaRedditAlien,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const Genre = ({ genre }) => (
  <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full text-xs font-semibold">
    {genre}
  </span>
);

const Skeleton = () => (
  <div className="min-h-screen bg-gray-900 text-white">
    <div className="h-56 bg-gray-800 animate-pulse" />
    <div className="max-w-6xl mx-auto px-4 -mt-20 relative">
      <div className="flex gap-8">
        <div className="w-48 h-72 bg-gray-800 rounded-xl shadow-lg animate-pulse" />
        <div className="flex-1 space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-gray-800 rounded w-1/2 animate-pulse" />
          <div className="h-6 bg-gray-800 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const AnimeDetail = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [promoVideos, setPromoVideos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promoUrl, setPromoUrl] = useState(null);

  useEffect(() => {
    setAnime(null);
    setPromoVideos([]);
    setIsModalOpen(false);
    setPromoUrl(null);

    const fetchAnime = async () => {
      try {
        const res = await axios.get(`https://steller-tau.vercel.app/meta/anilist/info/${id}`);
        const d = res.data;

        const animeData = {
          id: d.id,
          title: d.title?.english || d.title?.romaji || "Unknown Title",
          romaji: d.title?.romaji || d.title?.english,
          japaneseTitle: d.title?.native || d.title?.romaji,
          synonyms: d.synonyms || [],
          description: d.description || "No description available.",
          coverImage: d.image || "",
          bannerImage: d.cover || d.image || "",
          genres: d.genres || [],
          totalEpisodes: d.totalEpisodes || d.episodes || null,
          status: d.status || "Unknown",
          startDate: d.startDate || null,
          endDate: d.endDate || null,
          releaseDate: d.releaseDate || null,
          duration: d.duration ? `${d.duration} min/ep` : d.duration || "Unknown",
          ratingPercentage: d.rating ? `${d.rating}%` : d.rating || "N/A",
          popularity: d.popularity || 0,
          studios: d.studios || [],
          type: d.type || "TV",
          season: d.season || null,
          trailer: d.trailer || null,
          recommendations: d.recommendations || [],
        };

        setAnime(animeData);

        // set promoVideos from trailer ONLY (no MAL/Jikan)
        if (d.trailer && d.trailer.id) {
          const video = {
            trailer: {
              embed_url: `https://www.youtube.com/embed/${d.trailer.id}`,
              images: { maximum_image_url: d.trailer.thumbnail || `https://img.youtube.com/vi/${d.trailer.id}/maxresdefault.jpg` },
            },
          };
          setPromoVideos([video]);
        } else {
          setPromoVideos([]);
        }
      } catch (err) {
        console.error("Error fetching anime (steller-tau):", err);
      }
    };

    fetchAnime();
  }, [id]);

  if (!anime) return <Skeleton />;

  const truncated = anime.description && anime.description.length > 350 && !descExpanded
    ? anime.description.replace(/<[^>]+>/g, "").slice(0, 350) + "..."
    : anime.description.replace(/<[^>]+>/g, "");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Banner */}
      <div
        className="w-full h-56 md:h-72 lg:h-96 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(7,7,7,0.6), rgba(7,7,7,0.85)), url(${anime.bannerImage})`,
        }}
      >
        {/* optional small overlay content could go here */}
      </div>

      {/* Main area */}
      <div className="max-w-6xl mx-auto px-4 -mt-28 relative">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left: Poster + buttons */}
          <div className="relative z-20 md:w-56 w-44 flex-shrink-0">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700">
              <img src={anime.coverImage} alt={anime.title} className="w-full h-auto object-cover" />
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                to={`/watch/${id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-black font-bold py-3 rounded-full shadow"
                aria-label="Watch now"
              >
                <FaPlay /> Watch
              </Link>

              <button
                className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700"
                title="Add to list"
              >
                <FaPlus />
              </button>
            </div>

            <div className="mt-3 flex gap-2 items-center">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700"
                onClick={() => {
                  if (promoVideos.length > 0) {
                    setPromoUrl(promoVideos[0].trailer.embed_url);
                    setIsModalOpen(true);
                  }
                }}
                aria-label="Open trailer"
              >
                Trailer
              </button>

              <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700">
                <FaShareAlt /> Share
              </button>
            </div>
          </div>

          {/* Middle: Title, badges, desc */}
          <div className="flex-1 z-20">
            <p className="text-sm text-gray-400 mb-1">
              <Link to="/home" className="text-gray-400 hover:underline">Home</Link> &nbsp;•&nbsp; {anime.type} {anime.season ? `• ${anime.season}` : ""}
            </p>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{anime.title}</h1>
            <p className="text-sm text-gray-400 mt-1">{anime.japaneseTitle}</p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="bg-white text-black px-3 py-1 rounded-md text-xs font-semibold">Score: {anime.ratingPercentage}</span>
              <span className="bg-pink-500 text-white px-3 py-1 rounded-md text-xs font-semibold">{anime.type}</span>
              <span className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold">{anime.status}</span>
              <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-md text-xs font-semibold">
                {anime.totalEpisodes ? `${anime.totalEpisodes} Episodes` : "Episodes: N/A"}
              </span>
              <span className="text-gray-400 text-xs ml-1">• {anime.duration}</span>
            </div>

            {/* Description */}
            <div className="mt-6 text-gray-200 max-w-3xl">
              <p className="text-sm leading-relaxed">
                {truncated}
                {anime.description && anime.description.length > 350 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="ml-2 text-pink-400 font-semibold inline-flex items-center gap-1"
                  >
                    {descExpanded ? <><FaChevronUp /> Less</> : <><FaChevronDown /> More</>}
                  </button>
                )}
              </p>

              {/* small promo text */}
              <p className="text-xs text-gray-500 mt-3">
                Senpai — Watch <strong>{anime.title}</strong> in high quality. Posters and banners are provided by AniList data via your API.
              </p>
            </div>

            {/* Social / Share row */}
            <div className="mt-8 flex items-center gap-3">
              <div className="text-sm text-pink-400 font-semibold">Share</div>
              <div className="flex items-center gap-2">
                <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full"><FaTelegramPlane /></button>
                <button className="bg-black hover:bg-gray-800 p-2 rounded-full"><FaTwitter /></button>
                <button className="bg-blue-700 hover:bg-blue-800 p-2 rounded-full"><FaFacebookF /></button>
                <button className="bg-orange-500 hover:bg-orange-600 p-2 rounded-full"><FaRedditAlien /></button>
              </div>
              <div className="ml-auto text-sm text-gray-400">Popularity: {anime.popularity.toLocaleString?.() ?? anime.popularity}</div>
            </div>
          </div>

          {/* Right column: meta card */}
          <aside className="w-80 hidden lg:block z-20">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3 text-sm">
              <div><span className="font-semibold">Japanese:</span> <span className="text-gray-300">{anime.japaneseTitle}</span></div>
              <div><span className="font-semibold">Synonyms:</span> <span className="text-gray-300">{anime.synonyms.length ? anime.synonyms.join(", ") : "N/A"}</span></div>
              <div><span className="font-semibold">Aired:</span> <span className="text-gray-300">{anime.startDate?.year ? `${anime.startDate.year}` : "N/A"}</span></div>
              <div><span className="font-semibold">Duration:</span> <span className="text-gray-300">{anime.duration}</span></div>
              <div><span className="font-semibold">Status:</span> <span className="text-gray-300">{anime.status}</span></div>
              <div><span className="font-semibold">MAL Score:</span> <span className="text-gray-300">{anime.ratingPercentage}</span></div>
              <div>
                <span className="font-semibold">Genres:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {anime.genres.map((g) => <Genre key={g} genre={g} />)}
                </div>
              </div>
              <div><span className="font-semibold">Studios:</span> <span className="text-gray-300">{anime.studios.length ? anime.studios.join(", ") : "Unknown"}</span></div>
              <div><span className="font-semibold">Type:</span> <span className="text-gray-300">{anime.type}</span></div>
            </div>
          </aside>
        </div>
      </div>

      {/* Trailer modal */}
      {isModalOpen && promoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => {
            setIsModalOpen(false);
            setPromoUrl(null);
          }}
        >
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-3 right-4 text-white text-3xl font-bold z-50"
              onClick={() => { setIsModalOpen(false); setPromoUrl(null); }}
              aria-label="Close"
            >&times;</button>

            <iframe
              src={promoUrl}
              title="Promo"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
              frameBorder="0"
            />
          </div>
        </div>
      )}

      {/* if trailer thumbnails exist show small row under main (optional) */}
      {promoVideos.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <h3 className="text-lg font-semibold mb-3">Trailers</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {promoVideos.map((p, i) => (
              <div
                key={i}
                className="cursor-pointer rounded overflow-hidden relative"
                onClick={() => {
                  setPromoUrl(p.trailer.embed_url);
                  setIsModalOpen(true);
                }}
                style={{ aspectRatio: "16/9" }}
              >
                <img src={p.trailer.images.maximum_image_url || anime.coverImage} alt={`Trailer ${i+1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <FaPlay className="text-white text-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* === RECOMMENDATIONS === */}
{anime?.recommendations && anime.recommendations.length > 0 && (
  <div className="max-w-6xl mx-auto px-4 mt-10 mb-16">
    <h2 className="text-2xl font-bold mb-4">Recommended Anime</h2>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      {anime.recommendations.map((rec) => (
        <Link
          key={rec.id}
          to={`/anime/${rec.id}`} // open another anime page
          className="group relative bg-gray-800 rounded-lg overflow-hidden shadow hover:scale-[1.06] transition-transform"
        >
          <img
            src={rec.image}
            alt={rec.title?.english || rec.title?.romaji}
            className="w-full h-auto object-cover aspect-[3/4]"
          />
          <div className="p-2 text-xs font-semibold text-gray-200">
            {(rec.title?.english || rec.title?.romaji)?.slice(0,40)}
          </div>
        </Link>
      ))}
    </div>
  </div>
)}

    </div>
  );
};

export default AnimeDetail;
