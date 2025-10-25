const ANILIST_URL = 'https://graphql.anilist.co';

// Rate limiting and caching configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STALE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days - use stale data as fallback

// Rate limiting state
let rateLimitRemaining = 90; // Default assumption
let rateLimitLimit = 90;
let rateLimitReset = Date.now() + 60000; // 1 minute from now
let currentDelay = 1500; // Start with 1.5 second delay (more conservative)

// Request queue to prevent concurrent bursts
const requestQueue = [];
let isProcessingQueue = false;

// Cache storage
const cache = new Map();

// Utility functions
const getCacheKey = (query, variables) => {
  return JSON.stringify({ query: query.trim(), variables });
};

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const isCacheStale = (timestamp) => {
  return Date.now() - timestamp < STALE_CACHE_DURATION;
};

// Process request queue one at a time
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const { resolve, reject, fn } = requestQueue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    // Add delay between queued requests
    if (requestQueue.length > 0) {
      await sleep(currentDelay);
    }
  }

  isProcessingQueue = false;
};

// Add request to queue
const queueRequest = (fn) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, fn });
    processQueue();
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateRateLimitFromHeaders = (headers) => {
  const remaining = headers.get('x-ratelimit-remaining');
  const limit = headers.get('x-ratelimit-limit');
  const reset = headers.get('x-ratelimit-reset');

  if (remaining) rateLimitRemaining = parseInt(remaining);
  if (limit) rateLimitLimit = parseInt(limit);
  if (reset) rateLimitReset = parseInt(reset) * 1000; // Convert to milliseconds

  // Dynamically adjust delay based on remaining requests
  if (rateLimitRemaining > 0) {
    const usageRatio = 1 - (rateLimitRemaining / rateLimitLimit);
    const timeToReset = Math.max(1000, rateLimitReset - Date.now());
    
    // Calculate safe delay to avoid hitting rate limit
    const safeRequestsPerMinute = Math.floor(rateLimitRemaining * 0.8); // Use only 80% of remaining
    const minDelay = safeRequestsPerMinute > 0 ? Math.ceil(60000 / safeRequestsPerMinute) : 5000;

    // Adjust delay based on usage ratio
    if (usageRatio < 0.3) {
      currentDelay = Math.max(1000, minDelay); // More aggressive when plenty remaining
    } else if (usageRatio < 0.6) {
      currentDelay = Math.max(1500, minDelay); // Moderate
    } else if (usageRatio < 0.8) {
      currentDelay = Math.max(2500, minDelay); // Conservative
    } else {
      currentDelay = Math.max(4000, minDelay); // Very conservative when low
    }
  } else {
    // No requests remaining, wait until reset
    const waitTime = Math.max(5000, rateLimitReset - Date.now());
    currentDelay = waitTime;
  }
};

const sendAniListQueryInternal = async (query, variables = {}, retryCount = 0) => {
  const cacheKey = getCacheKey(query, variables);

  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    // Don't delete stale cache - keep it as fallback
  }

  // Check if we should wait for rate limit reset
  if (rateLimitRemaining <= 0 && Date.now() < rateLimitReset) {
    const waitTime = rateLimitReset - Date.now() + 1000; // Add 1s buffer
    console.warn(`Rate limit exhausted. Waiting ${Math.ceil(waitTime / 1000)}s until reset...`);
    await sleep(waitTime);
  }

  // Rate limiting delay before request
  await sleep(currentDelay);

  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    // Update rate limiting from headers
    updateRateLimitFromHeaders(response.headers);

    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      const maxRetries = 5;
      if (retryCount < maxRetries) {
        // Exponential backoff: 2^retryCount * 2000ms
        const backoffDelay = Math.min(Math.pow(2, retryCount) * 2000, 60000); // Max 60s
        const resetWait = Math.max(0, rateLimitReset - Date.now());
        const waitTime = Math.max(backoffDelay, resetWait) + 1000; // Add 1s buffer
        
        console.warn(`Rate limited (429). Retry ${retryCount + 1}/${maxRetries} after ${Math.ceil(waitTime / 1000)}s...`);
        await sleep(waitTime);
        return sendAniListQueryInternal(query, variables, retryCount + 1);
      } else {
        // Max retries exceeded - try to use stale cache
        const cached = cache.get(cacheKey);
        if (cached && isCacheStale(cached.timestamp)) {
          console.warn('Rate limit exceeded after max retries, using stale cached data');
          return cached.data;
        }
        throw new Error('Rate limit exceeded and no cached data available');
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    // Cache the result
    cache.set(cacheKey, {
      data: data.data,
      timestamp: Date.now(),
    });

    return data.data;
  } catch (error) {
    // Offline fallback for network errors - use stale cache if available
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (isCacheStale(cached.timestamp)) {
        console.warn('Network error, using stale cached data:', error.message);
        return cached.data;
      }
    }
    throw error;
  }
};

// Public API with request queuing
export const sendAniListQuery = async (query, variables = {}) => {
  return queueRequest(() => sendAniListQueryInternal(query, variables));
};

export const fetchNewReleases = async (page = 1) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 24) {
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
  const variables = { page };
  const data = await sendAniListQuery(query, variables);
  return { media: data.Page.media, totalPages: data.Page.pageInfo.lastPage };
};

export const fetchUpdates = async (page = 1) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 24) {
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
  const variables = { page };
  const data = await sendAniListQuery(query, variables);
  return { media: data.Page.media, totalPages: data.Page.pageInfo.lastPage };
};

export const fetchOngoing = async (page = 1) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 24) {
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
  const variables = { page };
  const data = await sendAniListQuery(query, variables);
  return { media: data.Page.media, totalPages: data.Page.pageInfo.lastPage };
};

export const fetchRecent = async (page = 1) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 24) {
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
  const variables = { page };
  const data = await sendAniListQuery(query, variables);
  return { media: data.Page.media, totalPages: data.Page.pageInfo.lastPage };
};

export const fetchAnimeWithFilters = async (filters, page = 1) => {
  const query = `
    query ($page: Int, $genre: String, $type: MediaFormat, $status: MediaStatus, $rating: String) {
      Page(page: $page, perPage: 24) {
        media(
          type: ANIME,
          genre: $genre,
          format: $type,
          status: $status,
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
          mal_id
        }
      }
    }
  `;

  const variables = {
    page,
    genre: filters.genre ? undefined : filters.genre,
    type: filters.type ? filters.type.toUpperCase() : undefined,
    status: filters.status ? filters.status.toUpperCase() : undefined,
    rating: filters.rating ? filters.rating.toUpperCase() : undefined,
  };

  // Remove undefined values
  Object.keys(variables).forEach(key => variables[key] === undefined && delete variables[key]);

  const data = await sendAniListQuery(query, variables);
  return data.Page.media;
};

export const fetchAdvancedBrowse = async (filters = {}, page = 1) => {
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
      Page(page: $page, perPage: 20) {
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
    page,
    type: 'ANIME',
    ...filters
  };

  // Remove undefined values
  Object.keys(variables).forEach(key => 
    (variables[key] === undefined || variables[key] === null || variables[key] === '') && delete variables[key]
  );

  const data = await sendAniListQuery(query, variables);
  return {
    media: data.Page.media,
    pageInfo: data.Page.pageInfo
  };
};

export const fetchAnimeDetail = async (id) => {
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

  const variables = { id: parseInt(id) };
  const data = await sendAniListQuery(query, variables);
  return data.Media;
};

export const fetchAnimeWatch = async (id) => {
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

  const variables = { id: parseInt(id) };
  const data = await sendAniListQuery(query, variables);
  return data.Media;
};

export const fetchAnimeSearch = async (search) => {
  const query = `
    query ($search: String) {
      Page(perPage: 10) {
        media(search: $search, type: ANIME) {
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

  const variables = { search };
  const data = await sendAniListQuery(query, variables);
  return data.Page.media;
};

export const fetchAnimeRecommendations = async (id) => {
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

  const variables = { id: parseInt(id) };
  const data = await sendAniListQuery(query, variables);
  return data.Media.recommendations?.nodes?.map((r) => ({
    id: r.mediaRecommendation?.id,
    title: r.mediaRecommendation?.title?.english || r.mediaRecommendation?.title?.romaji,
    cover: r.mediaRecommendation?.coverImage?.large,
    score: r.mediaRecommendation?.averageScore,
  })) || [];
};

// Jikan API rate limiting (3 requests per second, 60 per minute)
let jikanLastRequest = 0;
const JIKAN_DELAY = 350; // 350ms between requests (safe margin)

export const fetchEpisodesFromJikan = async (idMal) => {
  if (!idMal) {
    console.warn('No MAL ID provided for Jikan API');
    return [];
  }

  try {
    // Rate limiting for Jikan API
    const now = Date.now();
    const timeSinceLastRequest = now - jikanLastRequest;
    if (timeSinceLastRequest < JIKAN_DELAY) {
      await sleep(JIKAN_DELAY - timeSinceLastRequest);
    }
    jikanLastRequest = Date.now();

    const response = await fetch(`https://api.jikan.moe/v4/anime/${idMal}/episodes`);
    
    if (response.status === 429) {
      console.warn('Jikan API rate limited, waiting 2 seconds...');
      await sleep(2000);
      // Retry once
      const retryResponse = await fetch(`https://api.jikan.moe/v4/anime/${idMal}/episodes`);
      if (!retryResponse.ok) {
        throw new Error(`Jikan API error: ${retryResponse.status}`);
      }
      const retryData = await retryResponse.json();
      return retryData.data?.map(ep => ep.mal_id) || [];
    }

    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.map(ep => ep.mal_id) || [];
  } catch (error) {
    console.error('Error fetching episodes from Jikan:', error);
    return [];
  }
};

// Helper function to estimate episodes based on anime format and status
export const estimateEpisodes = (format, status) => {
  // Provide reasonable defaults based on format
  if (status === 'RELEASING') {
    // For currently airing shows, assume at least 1 episode
    return [1];
  }

  switch (format) {
    case 'TV':
      // Most TV anime have 12-13 or 24-26 episodes
      return Array.from({ length: 12 }, (_, i) => i + 1);
    case 'TV_SHORT':
      // Short format usually 12-13 episodes
      return Array.from({ length: 12 }, (_, i) => i + 1);
    case 'MOVIE':
      return [1];
    case 'SPECIAL':
      return [1];
    case 'OVA':
    case 'ONA':
      // OVAs typically have 1-6 episodes
      return Array.from({ length: 6 }, (_, i) => i + 1);
    default:
      // Default fallback
      return Array.from({ length: 12 }, (_, i) => i + 1);
  }
};

// Fetch a random anime from AniList (optimized for speed)
export const fetchRandomAnime = async () => {
  // Generate a random ID between 1 and 150000 (AniList's approximate range)
  // We'll try a few times to find a valid anime
  const maxAttempts = 5;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomId = Math.floor(Math.random() * 150000) + 1;
    
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
          }
        }
      }
    `;

    try {
      const data = await sendAniListQuery(query, { id: randomId });
      
      if (data && data.Media && data.Media.id) {
        console.log(`Random anime found: ${data.Media.title?.english || data.Media.title?.romaji} (ID: ${data.Media.id})`);
        return data.Media;
      }
    } catch (error) {
      // ID doesn't exist, try next attempt
      continue;
    }
  }
  
  // If all attempts fail, use a fallback popular anime
  console.warn('Could not find random anime after multiple attempts, using fallback');
  return { 
    id: 16498, // Attack on Titan
    title: {
      romaji: 'Shingeki no Kyojin',
      english: 'Attack on Titan'
    }
  };
};
