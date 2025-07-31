import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchAnimeWithFilters } from '../utils/api';
import Loader from '../components/Loader';

const genres = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 3, name: 'Cars' },
  { id: 4, name: 'Comedy' },
  { id: 5, name: 'Dementia' },
  { id: 6, name: 'Demons' },
  { id: 7, name: 'Mystery' },
  { id: 8, name: 'Drama' },
  { id: 9, name: 'Ecchi' },
  { id: 10, name: 'Fantasy' },
  { id: 11, name: 'Game' },
  { id: 12, name: 'Hentai' },
  { id: 13, name: 'Historical' },
  { id: 14, name: 'Horror' },
  { id: 15, name: 'Kids' },
  { id: 16, name: 'Magic' },
  { id: 17, name: 'Martial Arts' },
  { id: 18, name: 'Mecha' },
  { id: 19, name: 'Music' },
  { id: 20, name: 'Parody' },
  { id: 21, name: 'Samurai' },
  { id: 22, name: 'Romance' },
  { id: 23, name: 'School' },
  { id: 24, name: 'Sci-Fi' },
  { id: 25, name: 'Shoujo' },
  { id: 26, name: 'Shoujo Ai' },
  { id: 27, name: 'Shounen' },
  { id: 28, name: 'Shounen Ai' },
  { id: 29, name: 'Space' },
  { id: 30, name: 'Sports' },
  { id: 31, name: 'Super Power' },
  { id: 32, name: 'Vampire' },
  { id: 33, name: 'Yaoi' },
  { id: 34, name: 'Yuri' },
  { id: 35, name: 'Harem' },
  { id: 36, name: 'Slice of Life' },
  { id: 37, name: 'Supernatural' },
  { id: 38, name: 'Military' },
  { id: 39, name: 'Police' },
  { id: 40, name: 'Psychological' },
  { id: 41, name: 'Thriller' },
  { id: 42, name: 'Seinen' },
  { id: 43, name: 'Josei' },
];

const types = ['tv', 'movie', 'ova', 'special', 'ona', 'music'];
const statuses = ['airing', 'complete', 'upcoming'];
const ratings = ['g', 'pg', 'pg13', 'r17', 'r', 'rx'];

export default function FilterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type') || '';

  const [filters, setFilters] = useState({
    genre: '',
    type: typeParam,
    status: '',
    rating: '',
  });
  const [animeData, setAnimeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // Convert genre value to number if not empty string
    const newValue = name === 'genre' && value !== '' ? Number(value) : value;
    setFilters((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setPage(1);
  };

  const lastCallTimeRef = React.useRef(0);
  const throttleTimeoutRef = React.useRef(null);

  const fetchFilteredAnime = async () => {
    setLoading(true);
    setError(null);
    try {
      // Remove empty filters
      const activeFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) activeFilters[key] = value;
      });

      const now = Date.now();
      const throttleDelay = 1000; // 1000ms throttle delay
      const timeSinceLastCall = now - lastCallTimeRef.current;

      if (timeSinceLastCall < throttleDelay) {
        // Schedule the call after the remaining throttle delay
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current);
        }
        throttleTimeoutRef.current = setTimeout(async () => {
          lastCallTimeRef.current = Date.now();
          const data = await fetchAnimeWithFilters(activeFilters, page);
          setAnimeData(data || []);
          setLoading(false);
        }, throttleDelay - timeSinceLastCall);
      } else {
        lastCallTimeRef.current = now;
        const data = await fetchAnimeWithFilters(activeFilters, page);
        setAnimeData(data || []);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to fetch filtered anime');
      setAnimeData([]);
      setLoading(false);
      console.error('Error fetching filtered anime:', err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFilteredAnime();
    }, 500);

    return () => {
      clearTimeout(delayDebounceFn);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [filters, page]);

  // Update URL query parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // Update the URL without reloading the page
    navigate({ search: params.toString() }, { replace: true });
  }, [filters, navigate]);

  // Update filters state when URL query parameters change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newFilters = {
      genre: searchParams.get('genre') || '',
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      rating: searchParams.get('rating') || '',
    };
    setFilters(newFilters);
    setPage(1);
  }, [location.search]);

  return (
    <div className="p-4 text-white bg-[#19192c] min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Browse Anime</h1>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select name="genre" value={filters.genre} onChange={handleFilterChange} className="bg-gray-800 p-2 rounded">
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select name="type" value={filters.type} onChange={handleFilterChange} className="bg-gray-800 p-2 rounded">
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-gray-800 p-2 rounded">
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select name="rating" value={filters.rating} onChange={handleFilterChange} className="bg-gray-800 p-2 rounded">
          <option value="">All Ratings</option>
          {ratings.map((r) => (
            <option key={r} value={r}>{r.toUpperCase()}</option>
          ))}
        </select>
      </div>
      {loading && <Loader />}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {animeData.length === 0 && !loading && <p>No data available.</p>}
        {animeData.map((anime) => (
          <div
            key={anime.idMal || anime.id}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate(`/anime/${anime.id}`)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/anime/${anime.id}`);
              }
            }}
          >
            <img
              src={anime.images?.jpg?.image_url || anime.image_url || ''}
              alt={anime.title || anime.name}
              className="w-36 h-52 object-cover rounded-md shadow-lg"
            />
            <p className="text-sm mt-2 text-center truncate w-full" title={anime.title_english || anime.name}>
              {anime.title || anime.name}
            </p>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4 space-x-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="bg-gray-700 px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="bg-gray-700 px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
