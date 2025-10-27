import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAdvancedBrowse } from '../utils/anilistApi';
import Loader from '../components/Loader';
import PageSlider from '../components/PageSlider';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Hentai', 'Fantasy', 'Horror',
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
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Initialize filters from URL on component mount
  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search') || '',
      genres: searchParams.get('genres') ? searchParams.get('genres').split(',') : [],
      year: searchParams.get('year') || '',
      season: searchParams.get('season') || '',
      format: searchParams.get('format') || '',
      sort: searchParams.get('sort') || 'POPULARITY_DESC'
    };
    
    const urlPage = searchParams.get('page');
    if (urlPage) {
      setCurrentPage(parseInt(urlPage));
    }
    
    setFilters(urlFilters);
    
    // Show advanced filters if genres are selected
    if (urlFilters.genres.length > 0) {
      setShowAdvanced(true);
    }
  }, []);

  // Update URL when filters or page changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.genres.length > 0) params.set('genres', filters.genres.join(','));
    if (filters.year) params.set('year', filters.year);
    if (filters.season) params.set('season', filters.season);
    if (filters.format) params.set('format', filters.format);
    if (filters.sort && filters.sort !== 'POPULARITY_DESC') params.set('sort', filters.sort);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  useEffect(() => {
    fetchData();
  }, [currentPage, filters]);

  const fetchData = async () => {
    setAnimeData([]); // Clear previous data immediately
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {};

      if (filters.search) apiFilters.search = filters.search;
      if (filters.format) apiFilters.format = [filters.format];
      if (filters.season) apiFilters.season = filters.season;
      if (filters.year) apiFilters.seasonYear = parseInt(filters.year);
      if (filters.genres.length > 0) apiFilters.genres = filters.genres;
      if (filters.genres.includes('Hentai')) apiFilters.isAdult = true;
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
    <div className="min-h-screen bg-[#0b1622] text-white">
      {/* Filter Bar */}
      <div className="bg-[#151f2e] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Genres */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Genres</label>
              <div className="relative">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-4 py-2.5 bg-[#0b1622] rounded border border-gray-600 hover:border-blue-500 focus:outline-none text-left flex items-center justify-between"
                >
                  <span className={filters.genres.length > 0 ? 'text-white' : 'text-gray-500'}>
                    {filters.genres.length > 0 ? `${filters.genres.length} selected` : 'Any'}
                  </span>
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Year</label>
              <div className="relative">
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0b1622] rounded border border-gray-600 hover:border-blue-500 focus:border-blue-500 focus:outline-none appearance-none text-white"
                >
                  {YEARS.map(year => (
                    <option key={year.value} value={year.value} className="bg-[#0b1622]">
                      {year.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Season */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Season</label>
              <div className="relative">
                <select
                  value={filters.season}
                  onChange={(e) => handleFilterChange('season', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0b1622] rounded border border-gray-600 hover:border-blue-500 focus:border-blue-500 focus:outline-none appearance-none text-white"
                >
                  {SEASONS.map(season => (
                    <option key={season.value} value={season.value} className="bg-[#0b1622]">
                      {season.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Format</label>
              <div className="relative">
                <select
                  value={filters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0b1622] rounded border border-gray-600 hover:border-blue-500 focus:border-blue-500 focus:outline-none appearance-none text-white"
                >
                  {FORMATS.map(format => (
                    <option key={format.value} value={format.value} className="bg-[#0b1622]">
                      {format.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Advanced Filters - Genre Selection */}
          {showAdvanced && (
            <div className="mt-4 p-4 bg-[#0b1622] rounded border border-gray-700">
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-4 py-2 rounded text-sm transition-colors ${
                      filters.genres.includes(genre)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-[#151f2e] hover:bg-[#1a2332] text-gray-300'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort and Filter Toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-1.5 bg-[#0b1622] rounded border border-gray-600 hover:border-blue-500 focus:border-blue-500 focus:outline-none text-sm text-white"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} className="bg-[#0b1622]">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#0b1622] hover:bg-[#151f2e] rounded border border-gray-600 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {showAdvanced ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <>
            <div className="mb-4 text-gray-400 text-sm">
              <div className="h-4 bg-gray-700 rounded animate-pulse w-48"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {Array.from({ length: 20 }).map((_, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="relative overflow-hidden rounded-lg shadow-lg bg-gray-700 animate-pulse h-64"></div>
                  <div className="mt-2">
                    <div className="h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2 mb-2"></div>
                    <div className="flex gap-1">
                      <div className="h-3 bg-gray-700 rounded animate-pulse w-12"></div>
                      <div className="h-3 bg-gray-700 rounded animate-pulse w-16"></div>
                      <div className="h-3 bg-gray-700 rounded animate-pulse w-14"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-400 text-sm">
              {animeData.length > 0 && (
                <p>{animeData.length} results • Page {currentPage} of {totalPages}</p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {animeData.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-gray-400 text-lg">No anime found. Try adjusting your filters.</p>
                </div>
              ) : (
                animeData.map((anime) => (
                  <div
                    key={anime.id}
                    className="flex flex-col cursor-pointer group"
                    onClick={() => navigate(`/anime/${anime.id}`)}
                  >
                    <div className="relative overflow-hidden rounded-lg shadow-lg">
                      <img
                        src={anime.coverImage?.large || anime.coverImage?.extraLarge}
                        alt={anime.title?.english || anime.title?.romaji}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {anime.averageScore && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-sm font-bold">
                          ⭐ {anime.averageScore}%
                        </div>
                      )}
                      {anime.format && (
                        <div className="absolute top-2 left-2 bg-blue-600 bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
                          {anime.format}
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium line-clamp-2" title={anime.title?.english || anime.title?.romaji}>
                        {anime.title?.english || anime.title?.romaji}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        {anime.seasonYear && <span>{anime.seasonYear}</span>}
                        {anime.episodes && <span>• {anime.episodes} eps</span>}
                      </div>
                      {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {anime.genres.slice(0, 3).map((genre, idx) => (
                            <span key={idx} className="text-xs bg-[#151f2e] px-2 py-0.5 rounded">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {animeData.length > 0 && (
              <PageSlider
                page={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
