/**
 * AniList API client with rate limiting, caching, and error handling
 * @module anilistApi
 */

import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co';

// Configuration constants
const CONFIG = {
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  STALE_CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  DEFAULT_RATE_LIMIT: 90,
  DEFAULT_DELAY: 1500,
  MAX_RETRIES: 5,
  EXPONENTIAL_BACKOFF_BASE: 2000,
  MAX_BACKOFF_DELAY: 60000,
  JIKAN_DELAY: 350,
  RANDOM_ID_MAX: 150000,
  RANDOM_MAX_ATTEMPTS: 5,
  PER_PAGE_DEFAULT: 24,
  SEARCH_PER_PAGE: 10,
  ADVANCED_BROWSE_PER_PAGE: 20,
};

// Rate limiting state
class RateLimiter {
  constructor() {
    this.remaining = CONFIG.DEFAULT_RATE_LIMIT;
    this.limit = CONFIG.DEFAULT_RATE_LIMIT;
    this.reset = Date.now() + 60000;
    this.currentDelay = CONFIG.DEFAULT_DELAY;
  }

  updateFromHeaders(headers) {
    if (!headers || typeof headers.get !== 'function') return;

    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
    const reset = headers.get('x-ratelimit-reset');

    if (remaining !== null) this.remaining = parseInt(remaining, 10);
    if (limit !== null) this.limit = parseInt(limit, 10);
    if (reset !== null) this.reset = parseInt(reset, 10) * 1000;

    this.adjustDelay();
  }

  adjustDelay() {
    if (!this.limit || this.limit <= 0) {
      this.currentDelay = CONFIG.DEFAULT_DELAY;
      return;
    }

    if (this.remaining <= 0) {
      this.currentDelay = Math.max(5000, this.reset - Date.now());
      return;
    }

    const usageRatio = 1 - (this.remaining / this.limit);
    const safeRequestsPerMinute = Math.floor(this.remaining * 0.8);
    const minDelay = safeRequestsPerMinute > 0 ? Math.ceil(60000 / safeRequestsPerMinute) : 5000;

    if (usageRatio < 0.3) {
      this.currentDelay = Math.max(1000, minDelay);
    } else if (usageRatio < 0.6) {
      this.currentDelay = Math.max(1500, minDelay);
    } else if (usageRatio < 0.8) {
      this.currentDelay = Math.max(2500, minDelay);
    } else {
      this.currentDelay = Math.max(4000, minDelay);
    }
  }

  shouldWaitForReset() {
    return this.remaining <= 0 && Date.now() < this.reset;
  }

  getWaitTime() {
    return Math.max(0, this.reset - Date.now()) + 1000;
  }
}

// Cache management
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  getKey(query, variables) {
    return JSON.stringify({
      query: (query || '').trim(),
      variables: this.normalizeVariables(variables)
    });
  }

  normalizeVariables(variables) {
    // Remove undefined/null/empty values for consistent caching
    const normalized = {};
    for (const [key, value] of Object.entries(variables || {})) {
      if (value !== undefined && value !== null && value !== '') {
        normalized[key] = value;
      }
    }
    return normalized;
  }

  isValid(timestamp) {
    return Date.now() - timestamp < CONFIG.CACHE_DURATION;
  }

  isStale(timestamp) {
    return Date.now() - timestamp < CONFIG.STALE_CACHE_DURATION;
  }

  get(cacheKey) {
    return this.cache.get(cacheKey);
  }

  set(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  getStaleData(cacheKey) {
    const cached = this.get(cacheKey);
    return cached && this.isStale(cached.timestamp) ? cached.data : null;
  }
}

// Request queue for sequential processing
class RequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.rateLimiter = null;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, fn });
      // don't await process here - it runs asynchronously
      this.process();
    });
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { resolve, reject, fn } = this.queue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      if (this.queue.length > 0) {
        const delay = this.rateLimiter?.currentDelay || CONFIG.DEFAULT_DELAY;
        await sleep(delay);
      }
    }

    this.isProcessing = false;
  }
}

// Custom error classes
class AniListError extends Error {
  constructor(message, status, originalError = null) {
    super(message);
    this.name = 'AniListError';
    this.status = status;
    this.originalError = originalError;
  }
}

class RateLimitError extends AniListError {
  constructor(message, retryAfter = null) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

class NetworkError extends AniListError {
  constructor(message, originalError = null) {
    super(message, 0, originalError);
    this.name = 'NetworkError';
  }
}

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const validateId = (id, fieldName = 'id') => {
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`, fieldName);
  }
  return numId;
};

const validatePage = (page) => {
  const numPage = parseInt(page, 10);
  if (isNaN(numPage) || numPage < 1) {
    throw new ValidationError('Page must be a positive integer', 'page');
  }
  return numPage;
};

const validateSearchQuery = (search) => {
  if (!search || typeof search !== 'string' || search.trim().length === 0) {
    throw new ValidationError('Search query must be a non-empty string', 'search');
  }
  return search.trim();
};

// Logger utility
const logger = {
  warn: (message, ...args) => console.warn(`[AniList API] ${message}`, ...args),
  error: (message, ...args) => console.error(`[AniList API] ${message}`, ...args),
  info: (message, ...args) => console.info(`[AniList API] ${message}`, ...args),
};

// Initialize singletons
const rateLimiter = new RateLimiter();
const cacheManager = new CacheManager();
const requestQueue = new RequestQueue();

// Bind rate limiter to queue
requestQueue.rateLimiter = rateLimiter;

/**
 * Internal function to send GraphQL queries to AniList
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} Query result data
 * @throws {AniListError|RateLimitError|NetworkError}
 */
const sendAniListQueryInternal = async (query, variables = {}, retryCount = 0) => {
  const cacheKey = cacheManager.getKey(query, variables);

  // Check cache first
  const cached = cacheManager.get(cacheKey);
  if (cached && cacheManager.isValid(cached.timestamp)) {
    return cached.data;
  }

  // Check rate limit
  if (rateLimiter.shouldWaitForReset()) {
    const waitTime = rateLimiter.getWaitTime();
    logger.warn(`Rate limit exhausted. Waiting ${Math.ceil(waitTime / 1000)}s until reset...`);
    await sleep(waitTime);
  }

  // Rate limiting delay
  await sleep(rateLimiter.currentDelay);

  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    // Update rate limiting from headers
    rateLimiter.updateFromHeaders(response.headers);

    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount >= CONFIG.MAX_RETRIES) {
        const staleData = cacheManager.getStaleData(cacheKey);
        if (staleData) {
          logger.warn('Rate limit exceeded after max retries, using stale cached data');
          return staleData;
        }
        throw new RateLimitError('Rate limit exceeded and no cached data available');
      }

      const backoffDelay = Math.min(
        Math.pow(2, retryCount) * CONFIG.EXPONENTIAL_BACKOFF_BASE,
        CONFIG.MAX_BACKOFF_DELAY
      );
      const resetWait = Math.max(0, rateLimiter.reset - Date.now());
      const waitTime = Math.max(backoffDelay, resetWait) + 1000;

      logger.warn(`Rate limited (429). Retry ${retryCount + 1}/${CONFIG.MAX_RETRIES} after ${Math.ceil(waitTime / 1000)}s...`);
      await sleep(waitTime);
      return sendAniListQueryInternal(query, variables, retryCount + 1);
    }

    if (!response.ok) {
      throw new AniListError(`HTTP error! status: ${response.status}`, response.status);
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new AniListError(data.errors[0].message, response.status);
    }

    if (!data.data) {
      throw new AniListError('Invalid response: missing data field', response.status);
    }

    // Cache successful response
    cacheManager.set(cacheKey, data.data);
    return data.data;

  } catch (error) {
    if (error instanceof AniListError || error instanceof RateLimitError) {
      throw error;
    }

    // Network or other errors - try stale cache
    const staleData = cacheManager.getStaleData(cacheKey);
    if (staleData) {
      logger.warn('Network error, using stale cached data:', error?.message || error);
      return staleData;
    }

    throw new NetworkError(`Request failed: ${error?.message || error}`, error);
  }
};

/**
 * Public API for sending GraphQL queries with queuing
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @returns {Promise<Object>} Query result data
 */
export const sendAniListQuery = async (query, variables = {}) => {
  if (!query || typeof query !== 'string') {
    throw new ValidationError('Query must be a non-empty string', 'query');
  }

  return requestQueue.add(() => sendAniListQueryInternal(query, variables));
};

/**
 * Fetch new releases (RELEASING status, sorted by start date)
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const fetchNewReleases = async (page = 1) => {
  const validatedPage = validatePage(page);
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: ${CONFIG.PER_PAGE_DEFAULT}) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(status: RELEASING, type: ANIME, sort: START_DATE_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { page: validatedPage });
  return {
    media: data.Page.media || [],
    totalPages: data.Page.pageInfo.lastPage || 1
  };
};

/**
 * Fetch upcoming releases (NOT_YET_RELEASED status, sorted by start date)
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const fetchUpdates = async (page = 1) => {
  const validatedPage = validatePage(page);
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: ${CONFIG.PER_PAGE_DEFAULT}) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(status: NOT_YET_RELEASED, type: ANIME, sort: START_DATE_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { page: validatedPage });
  return {
    media: data.Page.media || [],
    totalPages: data.Page.pageInfo.lastPage || 1
  };
};

/**
 * Fetch ongoing anime (RELEASING status, sorted by popularity)
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const fetchOngoing = async (page = 1) => {
  const validatedPage = validatePage(page);
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: ${CONFIG.PER_PAGE_DEFAULT}) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { page: validatedPage });
  return {
    media: data.Page.media || [],
    totalPages: data.Page.pageInfo.lastPage || 1
  };
};

/**
 * Fetch recently updated anime (sorted by update time)
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const fetchRecent = async (page = 1) => {
  const validatedPage = validatePage(page);
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: ${CONFIG.PER_PAGE_DEFAULT}) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(type: ANIME, sort: UPDATED_AT_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { page: validatedPage });
  return {
    media: data.Page.media || [],
    totalPages: data.Page.pageInfo.lastPage || 1
  };
};

/**
 * Fetch trending anime from meta API
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const fetchTrending = async (page = 1) => {
  const validatedPage = validatePage(page);

  try {
    const response = await fetch(`https://steller-tau.vercel.app/meta/anilist/trending?page=${validatedPage}&perPage=25`);

    if (!response.ok) {
      throw new AniListError(`HTTP error! status: ${response.status}`, response.status);
    }

    const data = await response.json();

    // Transform results to match AniList format
    const media = (data.results || []).map(item => ({
      id: parseInt(item.id, 10),
      title: {
        romaji: item.title.romaji,
        english: item.title.english
      },
      coverImage: {
        large: item.image
      },
      // Add other fields as needed
      rating: item.rating,
      genres: item.genres,
      status: item.status,
      type: item.type
    }));

    // Since total is not provided, estimate totalPages
    const totalPages = data.hasNextPage ? validatedPage + 1 : validatedPage;

    return {
      media,
      totalPages
    };
  } catch (error) {
    if (error instanceof AniListError) throw error;
    logger.error('Error fetching trending:', error);
    throw new NetworkError(`Failed to fetch trending: ${error?.message || error}`, error);
  }
};

/**
 * Fetch popular anime from meta API
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const fetchPopular = async (page = 1) => {
  const validatedPage = validatePage(page);

  try {
    const response = await fetch(`https://steller-tau.vercel.app/meta/anilist/popular?page=${validatedPage}&perPage=25`);

    if (!response.ok) {
      throw new AniListError(`HTTP error! status: ${response.status}`, response.status);
    }

    const data = await response.json();

    // Transform results to match AniList format
    const media = (data.results || []).map(item => ({
      id: parseInt(item.id, 10),
      title: {
        romaji: item.title.romaji,
        english: item.title.english
      },
      coverImage: {
        large: item.image
      },
      // Add other fields as needed
      rating: item.rating,
      genres: item.genres,
      status: item.status,
      type: item.type
    }));

    // Since total is not provided, estimate totalPages
    const totalPages = data.hasNextPage ? validatedPage + 1 : validatedPage;

    return {
      media,
      totalPages
    };
  } catch (error) {
    if (error instanceof AniListError) throw error;
    logger.error('Error fetching popular:', error);
    throw new NetworkError(`Failed to fetch popular: ${error?.message || error}`, error);
  }
};

/**
 * Fetch anime with basic filters
 * NOTE: you asked for AND mode for multiple genres. AniList does not provide a direct "genre AND"
 * filter server-side, so we request with genre_in to reduce the candidate set, then post-filter results
 * to only keep entries that include ALL requested genres.
 *
 * @param {Object} filters - Filter object
 * @param {string|Array<string>} filters.genre - Genre filter (string or array)
 * @param {string} filters.type - Format filter
 * @param {string} filters.status - Status filter
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Array>} Media array
 */
export const fetchAnimeWithFilters = async (filters = {}, page = 1) => {
  const validatedPage = validatePage(page);

  // Normalize genres: accept string or array
  let genresArr = [];
  if (filters.genre) {
    if (Array.isArray(filters.genre)) {
      genresArr = filters.genre.map(g => (typeof g === 'string' ? g.trim() : '')).filter(Boolean);
    } else if (typeof filters.genre === 'string') {
      genresArr = filters.genre.split(',').map(g => g.trim()).filter(Boolean);
    }
  }

  const query = `
    query ($page: Int, $genres: [String], $type: MediaFormat, $status: MediaStatus) {
      Page(page: $page, perPage: ${CONFIG.PER_PAGE_DEFAULT}) {
        media(
          type: ANIME,
          format: $type,
          status: $status,
          genre_in: $genres,
          sort: POPULARITY_DESC
        ) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          images {
            jpg {
              image_url
            }
          }
          idMal
          genres
        }
      }
    }
  `;

  const variables = {
    page: validatedPage,
    genres: genresArr.length ? genresArr : undefined,
    type: filters.type ? filters.type.toUpperCase() : undefined,
    status: filters.status ? filters.status.toUpperCase() : undefined,
  };

  // Remove undefined values
  Object.keys(variables).forEach(key => {
    if (variables[key] === undefined) delete variables[key];
  });

  const data = await sendAniListQuery(query, variables);
  const media = data.Page.media || [];

  // Post-filter for AND mode (ensure each returned media contains all requested genres)
  if (genresArr.length > 0) {
    const wantedSet = new Set(genresArr.map(g => g.toLowerCase()));
    return media.filter(m => {
      if (!Array.isArray(m.genres)) return false;
      const mediaGenresLower = m.genres.map(x => x.toLowerCase());
      return Array.from(wantedSet).every(g => mediaGenresLower.includes(g));
    });
  }

  return media;
};

/**
 * Advanced browse with comprehensive filters
 * @param {Object} filters - Advanced filter object
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Object>} Media list with pagination info
 */
export const fetchAdvancedBrowse = async (filters = {}, page = 1) => {
  const validatedPage = validatePage(page);

  // Ensure format is an array if supplied as single value
  const sanitizedFilters = { ...filters };
  if (sanitizedFilters.format && !Array.isArray(sanitizedFilters.format)) {
    sanitizedFilters.format = [sanitizedFilters.format];
  }

  const query = `
    query (
      $page: Int = 1
      $id: Int
      $type: MediaType
      $isAdult: Boolean = false
      $search: String
      $format: [MediaFormat]
      $status: MediaStatus
      $countryOfOrigin: CountryCode
      $source: MediaSource
      $season: MediaSeason
      $seasonYear: Int
      $year: String
      $onList: Boolean
      $yearLesser: FuzzyDateInt
      $yearGreater: FuzzyDateInt
      $episodeLesser: Int
      $episodeGreater: Int
      $durationLesser: Int
      $durationGreater: Int
      $chapterLesser: Int
      $chapterGreater: Int
      $volumeLesser: Int
      $volumeGreater: Int
      $licensedBy: [Int]
      $isLicensed: Boolean
      $genres: [String]
      $excludedGenres: [String]
      $tags: [String]
      $excludedTags: [String]
      $minimumTagRank: Int
      $sort: [MediaSort] = [POPULARITY_DESC, SCORE_DESC]
    ) {
      Page(page: $page, perPage: ${CONFIG.ADVANCED_BROWSE_PER_PAGE}) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(
          id: $id
          type: $type
          season: $season
          format_in: $format
          status: $status
          countryOfOrigin: $countryOfOrigin
          source: $source
          search: $search
          onList: $onList
          seasonYear: $seasonYear
          startDate_like: $year
          startDate_lesser: $yearLesser
          startDate_greater: $yearGreater
          episodes_lesser: $episodeLesser
          episodes_greater: $episodeGreater
          duration_lesser: $durationLesser
          duration_greater: $durationGreater
          chapters_lesser: $chapterLesser
          chapters_greater: $chapterGreater
          volumes_lesser: $volumeLesser
          volumes_greater: $volumeGreater
          licensedById_in: $licensedBy
          isLicensed: $isLicensed
          genre_in: $genres
          genre_not_in: $excludedGenres
          tag_in: $tags
          tag_not_in: $excludedTags
          minimumTagRank: $minimumTagRank
          sort: $sort
          isAdult: $isAdult
        ) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
            color
          }
          bannerImage
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          description
          season
          seasonYear
          type
          format
          status
          episodes
          duration
          chapters
          volumes
          genres
          isAdult
          averageScore
          popularity
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
          studios(isMain: true) {
            edges {
              isMain
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    page: validatedPage,
    type: 'ANIME',
    ...sanitizedFilters
  };

  // Remove undefined/null/empty values
  Object.keys(variables).forEach(key => {
    const value = variables[key];
    if (value === undefined || value === null || value === '') {
      delete variables[key];
    }
  });

  const data = await sendAniListQuery(query, variables);
  return {
    media: data.Page.media || [],
    pageInfo: data.Page.pageInfo || {}
  };
};

/**
 * Fetch detailed anime information
 * @param {number|string} id - Anime ID
 * @returns {Promise<Object>} Anime details
 */
export const fetchAnimeDetail = async (id) => {
  const validatedId = validateId(id);
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
        }
        bannerImage
        description(asHtml: false)
        averageScore
        episodes
        status
        season
        seasonYear
        genres
        duration
        studios(isMain: true) {
          nodes {
            name
          }
        }
        trailer {
          site
          id
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { id: validatedId });
  return data.Media;
};

/**
 * Fetch anime watch information (for streaming)
 * @param {number|string} id - Anime ID
 * @returns {Promise<Object>} Anime watch data
 */
export const fetchAnimeWatch = async (id) => {
  const validatedId = validateId(id);
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
        }
        episodes
        coverImage {
          large
          color
        }
        description(asHtml: false)
        genres
        averageScore
        duration
        format
        airingSchedule {
          nodes {
            episode
            airingAt
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              format
              season
              seasonYear
            }
          }
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { id: validatedId });
  return data.Media;
};

/**
 * Search for anime
 * @param {string} search - Search query
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Array>} Search results
 */
export const fetchAnimeSearch = async (search, page = 1) => {
  const validatedSearch = validateSearchQuery(search);
  const validatedPage = validatePage(page);

  const query = `
    query ($search: String, $page: Int = 1) {
      Page(page: $page, perPage: ${CONFIG.SEARCH_PER_PAGE}) {
        media(
          type: ANIME,
          search: $search,
          sort: POPULARITY_DESC
        ) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          description(asHtml: false)
          format
          duration
          seasonYear
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { search: validatedSearch, page: validatedPage });
  return data.Page.media || [];
};

/**
 * Fetch anime recommendations
 * @param {number|string} id - Anime ID
 * @returns {Promise<Array>} Recommendations array
 */
export const fetchAnimeRecommendations = async (id) => {
  const validatedId = validateId(id);
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        recommendations {
          nodes {
            mediaRecommendation {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              averageScore
            }
          }
        }
      }
    }
  `;

  const data = await sendAniListQuery(query, { id: validatedId });
  const recommendations = data.Media.recommendations?.nodes || [];

  return recommendations.map(r => ({
    id: r.mediaRecommendation?.id,
    title: r.mediaRecommendation?.title?.english || r.mediaRecommendation?.title?.romaji,
    cover: r.mediaRecommendation?.coverImage?.large,
    score: r.mediaRecommendation?.averageScore,
  })).filter(rec => rec.id); // Filter out invalid recommendations
};

// Jikan API integration
let jikanLastRequest = 0;

/**
 * Fetch episode list from Jikan API (MyAnimeList)
 * @param {number|string} idMal - MyAnimeList ID
 * @returns {Promise<Array>} Episode IDs array
 */
export const fetchEpisodesFromJikan = async (idMal) => {
  const validatedIdMal = validateId(idMal, 'idMal');

  try {
    // Rate limiting for Jikan API
    const now = Date.now();
    const timeSinceLastRequest = now - jikanLastRequest;
    if (timeSinceLastRequest < CONFIG.JIKAN_DELAY) {
      await sleep(CONFIG.JIKAN_DELAY - timeSinceLastRequest);
    }
    jikanLastRequest = Date.now();

    const response = await fetch(`https://api.jikan.moe/v4/anime/${validatedIdMal}/episodes`);

    if (response.status === 429) {
      logger.warn('Jikan API rate limited, waiting 2 seconds...');
      await sleep(2000);
      // Retry once
      const retryResponse = await fetch(`https://api.jikan.moe/v4/anime/${validatedIdMal}/episodes`);
      if (!retryResponse.ok) {
        throw new AniListError(`Jikan API error: ${retryResponse.status}`, retryResponse.status);
      }
      const retryData = await retryResponse.json();
      return retryData.data?.map(ep => ep.mal_id) || [];
    }

    if (!response.ok) {
      throw new AniListError(`Jikan API error: ${response.status}`, response.status);
    }

    const data = await response.json();
    return data.data?.map(ep => ep.mal_id) || [];
  } catch (error) {
    if (error instanceof AniListError) throw error;
    logger.error('Error fetching episodes from Jikan:', error);
    return [];
  }
};

/**
 * Estimate episode count based on format and status
 * @param {string} format - Anime format
 * @param {string} status - Anime status
 * @returns {Array<number>} Array of episode numbers
 */
export const estimateEpisodes = (format, status) => {
  if (status === 'RELEASING') {
    return [1]; // At least 1 episode for airing shows
  }

  switch (format) {
    case 'TV':
      return Array.from({ length: 12 }, (_, i) => i + 1);
    case 'TV_SHORT':
      return Array.from({ length: 12 }, (_, i) => i + 1);
    case 'MOVIE':
      return [1];
    case 'SPECIAL':
      return [1];
    case 'OVA':
    case 'ONA':
      return Array.from({ length: 6 }, (_, i) => i + 1);
    default:
      return Array.from({ length: 12 }, (_, i) => i + 1);
  }
};

/**
 * Fetch a random media (anime or manga)
 * @returns {Promise<Object>} Random media data
 */
export const fetchRandomMedia = async () => {
  for (let attempt = 0; attempt < CONFIG.RANDOM_MAX_ATTEMPTS; attempt++) {
    const randomId = Math.floor(Math.random() * CONFIG.RANDOM_ID_MAX) + 1;
    const randomType = Math.random() < 0.5 ? 'ANIME' : 'MANGA';

    const query = `
      query ($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          id
          type
          title {
            romaji
            english
          }
        }
      }
    `;

    try {
      const data = await sendAniListQuery(query, { id: randomId, type: randomType });

      if (data?.Media?.id) {
        logger.info(`Random media found: ${data.Media.title?.english || data.Media.title?.romaji} (ID: ${data.Media.id}, Type: ${data.Media.type})`);
        return data.Media;
      }
    } catch (error) {
      // Continue to next attempt
      continue;
    }
  }

  // Fallback
  logger.warn('Could not find random media after multiple attempts, using fallback');
  return {
    id: 16498, // Attack on Titan
    type: 'ANIME',
    title: {
      romaji: 'Shingeki no Kyojin',
      english: 'Attack on Titan'
    }
  };
};

/**
 * Fetch a random anime
 * @returns {Promise<Object>} Random anime data
 */
export const fetchRandomAnime = async () => {
  for (let attempt = 0; attempt < CONFIG.RANDOM_MAX_ATTEMPTS; attempt++) {
    const randomId = Math.floor(Math.random() * CONFIG.RANDOM_ID_MAX) + 1;

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          type
          title {
            romaji
            english
          }
        }
      }
    `;

    try {
      const data = await sendAniListQuery(query, { id: randomId });

      if (data?.Media?.id) {
        logger.info(`Random anime found: ${data.Media.title?.english || data.Media.title?.romaji} (ID: ${data.Media.id})`);
        return data.Media;
      }
    } catch (error) {
      // Continue to next attempt
      continue;
    }
  }

  // Fallback
  logger.warn('Could not find random anime after multiple attempts, using fallback');
  return {
    id: 16498, // Attack on Titan
    type: 'ANIME',
    title: {
      romaji: 'Shingeki no Kyojin',
      english: 'Attack on Titan'
    }
  };
};

// Export error classes for external use
export { AniListError, RateLimitError, NetworkError, ValidationError };

/**
 * Fetch anime info from Steller API
 * @param {number|string} id - Anime ID
 * @returns {Promise<Object>} Anime info with episodes
 */
export const fetchAnimeInfoFromSteller = async (id) => {
  try {
    // Primary source: Steller API
    const response = await axios.get(`https://senpai-di.vercel.app/meta/anilist/info/${id}`);
    const data = response.data;

    // ✅ If Steller returns valid episodes
    if (data && data.episodes && data.episodes.length > 0) {
      return data;
    }

    // 🚨 Fallback if no episodes found
    console.warn("No episodes from Steller, switching to AniList...");
    return await fetchAnimeInfoFromAniList(id);

  } catch (error) {
    console.error("Steller API failed:", error);
    // 🚨 Fallback on network or other errors
    return await fetchAnimeInfoFromAniList(id);
  }
};

/**
 * Fetch anime info from AniList API
 * @param {number|string} id - Anime ID
 * @returns {Promise<Object>} Anime info with all episodes
 */
export const fetchAnimeInfoFromAniList = async (id) => {
  try {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english native }
          episodes
          coverImage { large }
          description
        }
      }
    `;

    const response = await axios.post("https://graphql.anilist.co", {
      query,
      variables: { id: Number(id) },
    });

    const media = response.data.data.Media;

    // Generate all episodes based on total episode count
    const totalEpisodes = media.episodes || 0;
    const episodes = Array.from({ length: totalEpisodes }, (_, i) => ({
      number: i + 1,
      title: `Episode ${i + 1}`,
      url: null, // No URL from AniList
    }));

    // Convert AniList structure to match expected shape
    const mappedData = {
      id: media.id,
      title: media.title,
      coverImage: media.coverImage,
      description: media.description,
      episodes,
    };

    return mappedData;
  } catch (err) {
    console.error("AniList API failed:", err);
    return null;
  }
};


