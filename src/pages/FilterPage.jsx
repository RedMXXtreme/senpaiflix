import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdvancedBrowse } from '../utils/anilistApi';
import Loader from '../components/Loader';
import PageSlider from '../components/PageSlider';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

const FORMATS = [
  { value: '', label: 'Any' },
  { value: 'TV', label: 'TV' },
  { value: 'TV_SHORT', label: 'TV Short' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'MUSIC', label: 'Music' }
];

const SEASONS = [
  { value: '', label: 'Any' },
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' }
];

const YEARS = [
  { value: '', label: 'Any' },
  ...Array.from({ length: new Date().getFullYear() - 1939 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  })
];

const SORT_OPTIONS = [
  { value: 'POPULARITY_DESC', label: 'Popularity' },
  { value: 'SCORE_DESC', label: 'Score' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'START_DATE_DESC', label: 'Newest' },
  { value: 'START_DATE', label: 'Oldest' },
  { value: 'TITLE_ROMAJI', label: 'A-Z' },
  { value: 'TITLE_ROMAJI_DESC', label: 'Z-A' }
];

export default function FilterPage() {
  const navigate = useNavigate();
  const [animeData, setAnimeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    genres: [],
    year: '',
    season: '',
    format: '',
    sort: 'POPULARITY_DESC'
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {};

      if (filters.search) apiFilters.search = filters.search;
      if (filters.format) apiFilters.format = [filters.format];
      if (filters.season) apiFilters.season = filters.season;
      if (filters.year) apiFilters.seasonYear = parseInt(filters.year);
      if (filters.genres.length > 0) apiFilters.genres = filters.genres;
      if (filters.sort) apiFilters.sort = [filters.sort];

      const data = await fetchAdvancedBrowse(apiFilters, currentPage);
      setAnimeData(data.media || []);
      setTotalPages(data.pageInfo?.lastPage || 1);
    } catch (err) {
      console.error('Error fetching filtered anime:', err);
      setError('Failed to fetch anime data');
      setAnimeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleGenreToggle = (genre) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1622] to-[#0f1b2d] text-white">
      {/* --- Filter Header --- */}
      <div className="sticky top-0 z-30 bg-[#111b29]/95 backdrop-blur-lg border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <h1 className="text-2xl font-semibold text-white tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            Advanced Filters
          </h1>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {/* Year */}
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="px-3 py-2 bg-[#0b1622] border border-gray-700 rounded-lg hover:border-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              {YEARS.map(year => <option key={year.value} value={year.value}>{year.label}</option>)}
            </select>

            {/* Season */}
            <select
              value={filters.season}
              onChange={(e) => handleFilterChange('season', e.target.value)}
              className="px-3 py-2 bg-[#0b1622] border border-gray-700 rounded-lg hover:border-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              {SEASONS.map(season => <option key={season.value} value={season.value}>{season.label}</option>)}
            </select>

            {/* Format */}
            <select
              value={filters.format}
              onChange={(e) => handleFilterChange('format', e.target.value)}
              className="px-3 py-2 bg-[#0b1622] border border-gray-700 rounded-lg hover:border-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              {FORMATS.map(format => <option key={format.value} value={format.value}>{format.label}</option>)}
            </select>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 bg-[#0b1622] border border-gray-700 rounded-lg hover:border-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          {/* Genre Toggle */}
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-400">
              {filters.genres.length > 0 ? `${filters.genres.length} genres selected` : 'No genres selected'}
            </p>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
            >
              {showAdvanced ? 'Hide Genres' : 'Show Genres'}
            </button>
          </div>

          {/* Genre Selector */}
          {showAdvanced && (
            <div className="flex flex-wrap gap-2 mt-3 max-h-[200px] overflow-y-auto pb-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.genres.includes(genre)
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-[#1a2332] hover:bg-[#223043] text-gray-300'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Anime Results --- */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-center py-32 text-red-400 text-lg">{error}</div>
        ) : (
          <>
            {animeData.length > 0 && (
              <p className="text-sm text-gray-400 mb-4">
                {animeData.length} results • Page {currentPage} of {totalPages}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {animeData.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-400 text-lg">
                  No anime found. Try adjusting filters.
                </div>
              ) : (
                animeData.map((anime) => (
                  <div
                    key={anime.id}
                    onClick={() => navigate(`/anime/${anime.id}`)}
                    className="group relative bg-[#111b29] rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:scale-[1.03] transition-all cursor-pointer"
                  >
                    <img
                      src={anime.coverImage?.large || anime.coverImage?.extraLarge}
                      alt={anime.title?.romaji}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-1 rounded">
                      ⭐ {anime.averageScore ?? 'N/A'}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="text-sm font-medium truncate text-white">
                        {anime.title?.english || anime.title?.romaji}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {anime.seasonYear || ''} {anime.episodes ? `• ${anime.episodes} eps` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {animeData.length > 0 && (
              <div className="mt-10">
                <PageSlider
                  page={currentPage}
                  totalPages={totalPages}
                  handlePageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
