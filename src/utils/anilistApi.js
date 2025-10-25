const ANILIST_URL = 'https://graphql.anilist.co';

// Rate limiting and caching configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting state
let rateLimitRemaining = 90; // Default assumption
let rateLimitLimit = 90;
let rateLimitReset = Date.now() + 60000; // 1 minute from now
let currentDelay = 1000; // Start with 1 second delay

// Cache storage
const cache = new Map();

// Utility functions
const getCacheKey = (query, variables) => {
  return JSON.stringify({ query: query.trim(), variables });
};

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
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
    const timeToReset = Math.max(0, rateLimitReset - Date.now());
    const requestsPerSecond = rateLimitLimit / (timeToReset / 1000);

    // Adjust delay: more aggressive when we have plenty remaining, more conservative when low
    if (usageRatio < 0.5) {
      currentDelay = Math.max(500, currentDelay - 200); // Decrease delay
    } else if (usageRatio > 0.8) {
      currentDelay = Math.min(5000, currentDelay + 500); // Increase delay
    }

    // Ensure we don't exceed the rate limit
    const minDelay = Math.ceil(1000 / requestsPerSecond);
    currentDelay = Math.max(currentDelay, minDelay);
  } else {
    // No requests remaining, wait until reset
    currentDelay = Math.max(5000, rateLimitReset - Date.now());
  }
};

export const sendAniListQuery = async (query, variables = {}, retryCount = 0) => {
  const cacheKey = getCacheKey(query, variables);

  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (isCacheValid(cached.timestamp)) {
      return cached.data;
    } else {
      cache.delete(cacheKey);
    }
  }

  // Rate limiting delay
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

    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount < 3) {
        // Wait until reset time or current delay, whichever is longer
        const waitTime = Math.max(currentDelay, rateLimitReset - Date.now());
        await sleep(waitTime);
        return sendAniListQuery(query, variables, retryCount + 1);
      } else {
        // Offline fallback - return cached data if available
        const cached = cache.get(cacheKey);
        if (cached && isCacheValid(cached.timestamp)) {
          console.warn('Rate limited, using cached data');
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
    // Offline fallback for network errors
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (isCacheValid(cached.timestamp)) {
        console.warn('Network error, using cached data:', error.message);
        return cached.data;
      }
    }
    throw error;
  }
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
    genre: filters.genre ? undefined : filters.genre, // AniList uses genre names, not IDs
    type: filters.type ? filters.type.toUpperCase() : undefined,
    status: filters.status ? filters.status.toUpperCase() : undefined,
    rating: filters.rating ? filters.rating.toUpperCase() : undefined,
  };

  // Remove undefined values
  Object.keys(variables).forEach(key => variables[key] === undefined && delete variables[key]);

  const data = await sendAniListQuery(query, variables);
  return data.Page.media;
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

export const fetchEpisodesFromJikan = async (idMal) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${idMal}/episodes`);
    if (!response.ok) {
      throw new Error(`Jikan API error: ${response.status}`);
    }
    const data = await response.json();
    return data.data.map(ep => ep.mal_id);
  } catch (error) {
    console.error('Error fetching episodes from Jikan:', error);
    return [];
  }
};
