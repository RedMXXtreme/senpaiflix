import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaPlay, FaClosedCaptioning } from "react-icons/fa";
import { MdSubtitles } from "react-icons/md";
import { fetchAdvancedBrowse } from "../utils/anilistApi";
import PageSlider from "../components/PageSlider";

const GENRES = [
  "Action","Adventure","Comedy","Drama","Ecchi","Hentai","Fantasy","Horror",
  "Mahou Shoujo","Mecha","Music","Mystery","Psychological","Romance",
  "Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"
];

const FORMATS = [
  { value: "", label: "Any" },
  { value: "TV", label: "TV" },
  { value: "TV_SHORT", label: "TV Short" },
  { value: "MOVIE", label: "Movie" },
  { value: "SPECIAL", label: "Special" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "MUSIC", label: "Music" },
];

const SEASONS = [
  { value: "", label: "Any" },
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];

const YEARS = [
  { value: "", label: "Any" },
  ...Array.from({ length: new Date().getFullYear() - 1939 + 1 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  }),
];

const SORT_OPTIONS = [
  { value: "POPULARITY_DESC", label: "Popularity" },
  { value: "SCORE_DESC", label: "Score" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "START_DATE", label: "Oldest" },
  { value: "TITLE_ROMAJI", label: "A-Z" },
  { value: "TITLE_ROMAJI_DESC", label: "Z-A" },
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

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const [filters, setFilters] = useState({
    search: "",
    genres: [],
    year: "",
    season: "",
    format: "",
    sort: "POPULARITY_DESC",
  });

  useEffect(() => {
    const urlFilters = {
      search: searchParams.get("search") || "",
      genres: searchParams.get("genres")
        ? searchParams.get("genres").split(",")
        : [],
      year: searchParams.get("year") || "",
      season: searchParams.get("season") || "",
      format: searchParams.get("format") || "",
      sort: searchParams.get("sort") || "POPULARITY_DESC",
    };
    const urlPage = searchParams.get("page");
    if (urlPage) setCurrentPage(parseInt(urlPage));
    setFilters(urlFilters);
    if (urlFilters.genres.length > 0) setShowAdvanced(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.genres.length > 0)
      params.set("genres", filters.genres.join(","));
    if (filters.year) params.set("year", filters.year);
    if (filters.season) params.set("season", filters.season);
    if (filters.format) params.set("format", filters.format);
    if (filters.sort && filters.sort !== "POPULARITY_DESC")
      params.set("sort", filters.sort);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const newP = params.toString();
    const oldP = searchParams.toString();
    if (newP !== oldP) setSearchParams(params, { replace: true });
  }, [filters, currentPage]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchData(), 400);
  }, [filters, currentPage]);

  const fetchData = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setAnimeData([]);
    setLoading(true);
    setError(null);
    try {
      const apiFilters = {};
      if (filters.search) apiFilters.search = filters.search;
      if (filters.format) apiFilters.format = [filters.format];
      if (filters.season) apiFilters.season = filters.season;
      if (filters.year) apiFilters.seasonYear = parseInt(filters.year);
      if (filters.genres.length > 0) apiFilters.genres = filters.genres;
      if (filters.genres.includes("Hentai")) apiFilters.isAdult = true;
      if (filters.sort) apiFilters.sort = [filters.sort];
      const data = await fetchAdvancedBrowse(
        apiFilters,
        currentPage,
        abortRef.current.signal
      );
      setAnimeData(data.media || []);
      setTotalPages(data.pageInfo?.lastPage || 1);
    } catch (err) {
      if (err.name !== "AbortError") setError("Failed to fetch anime data");
      setAnimeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleGenreToggle = (genre) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#090e17] text-white">
      {/* Filter Bar */}
      <div className="top-0 z-40 bg-[#0b1622]/70 backdrop-blur-md border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Genre Button */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Genres</label>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500 transition-all text-left"
              >
                {filters.genres.length > 0
                  ? `${filters.genres.length} selected`
                  : "Any"}
              </button>
            </div>

            {/* Year */}
            <SelectBox
              label="Year"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              options={YEARS}
            />

            {/* Season */}
            <SelectBox
              label="Season"
              value={filters.season}
              onChange={(e) => handleFilterChange("season", e.target.value)}
              options={SEASONS}
            />

            {/* Format */}
            <SelectBox
              label="Format"
              value={filters.format}
              onChange={(e) => handleFilterChange("format", e.target.value)}
              options={FORMATS}
            />
          </div>

          {/* Genre Dropdown */}
          {showAdvanced && (
            <div className="mt-4 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      filters.genres.includes(genre)
                        ? "bg-blue-600 text-white shadow-[0_0_10px_#3b82f6]"
                        : "bg-white/10 hover:bg-white/20 text-gray-300"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm hover:border-blue-500 transition-all text-white"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0b1622]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500 transition-all text-sm"
            >
              {showAdvanced ? "Hide" : "Show"} Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : (
          <>
            {animeData.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-lg">
                No anime found. Try adjusting your filters.
              </div>
            ) : (
              <>
                <div className="mb-4 text-gray-400 text-sm">
                  {animeData.length} results • Page {currentPage} of {totalPages}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {animeData.map((anime) => (
                    <Link
                      key={anime.id}
                      to={`/anime/${anime.id}`}
                      className="w-full max-w-[180px] mx-auto bg-[#0f1117] rounded-2xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-300"
                    >
                      <div className="relative">
                        <img
                          src={anime.coverImage.large}
                          alt={anime.title.english || anime.title.romaji}
                          className="w-full h-[200px] sm:h-[220px] md:h-[250px] object-cover"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                          <FaPlay className="text-green-400" /> {anime.format || "TV"}
                        </div>
                      </div>

                      <div className="p-2">
                        <h3 className="text-white text-xs sm:text-sm font-semibold leading-tight line-clamp-2">
                          {anime.title.english || anime.title.romaji}
                        </h3>

                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MdSubtitles className="text-green-400" />{" "}
                            {anime.episodes || "?"}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClosedCaptioning className="text-green-400" />{" "}
                            {anime.format || "TV"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <PageSlider
                  page={currentPage}
                  totalPages={totalPages}
                  handlePageChange={handlePageChange}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

const SelectBox = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm text-gray-400 mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500 transition-all text-white"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0b1622]">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const LoadingGrid = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
    {Array.from({ length: 10 }).map((_, idx) => (
      <div
        key={idx}
        className="w-full max-w-[180px] mx-auto rounded-2xl overflow-hidden bg-[#0f1117]"
      >
        <div className="relative h-[200px] sm:h-[220px] md:h-[250px] w-full overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b1d25] via-[#2a2d37] to-[#1b1d25] animate-shimmer bg-[length:200%_100%]" />
        </div>
        <div className="p-2">
          <div className="h-3 bg-[#2a2d37] rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-3 bg-[#2a2d37] rounded w-1/2 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);
