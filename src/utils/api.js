import { sendAniListQuery } from './anilistApi.js';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

// Simple in-memory cache for fetchWithCache
const cache = new Map();

async function fetchWithCache(url, params = {}) {
  // Create a cache key based on url and params
  const key = url + JSON.stringify(params);
  if (cache.has(key)) {
    return cache.get(key);
  }
  // Build query string from params
  const queryString = new URLSearchParams(params).toString();
  const fetchUrl = queryString ? `${url}?${queryString}` : url;
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  cache.set(key, data);
  return data;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // base delay in ms for exponential backoff

// Utility function to remove duplicate anime objects based on mal_id
function removeDuplicates(animeArray) {
  if (!Array.isArray(animeArray)) return animeArray;
  const seen = new Set();
  return animeArray.filter(anime => {
    if (!anime || !anime.mal_id) return true;
    if (seen.has(anime.mal_id)) {
      return false;
    } else {
      seen.add(anime.mal_id);
      return true;
    }
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWrapper(fn) {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      throw error;
    }
  }
}

export async function fetchNewReleases(page = 1) {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 30) {
        media(type: ANIME, sort: TRENDING_DESC) {
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          episodes
          status
          startDate {
            year
            month
            day
          }
          description
          genres
          averageScore
          siteUrl
        }
      }
    }
  `;

  return retryWrapper(async () => {
    const data = await sendAniListQuery(query, { page });
    // Map idMal to mal_id for compatibility
    const mediaWithMalId = data.Page.media.map(item => ({ ...item, mal_id: item.idMal }));
    return removeDuplicates(mediaWithMalId);
  });
}

export async function fetchUpdates(page = 1) {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 30) {
        media(type: ANIME, sort: START_DATE_DESC, status: NOT_YET_RELEASED) {
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          episodes
          status
          startDate {
            year
            month
            day
          }
          description
          genres
          averageScore
          siteUrl
        }
      }
    }
  `;

  return retryWrapper(async () => {
    const data = await sendAniListQuery(query, { page });
    const mediaWithMalId = data.Page.media.map(item => ({ ...item, mal_id: item.idMal }));
    return removeDuplicates(mediaWithMalId);
  });
}

export async function fetchOngoing(page = 1) {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 30) {
        media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          episodes
          status
          startDate {
            year
            month
            day
          }
          description
          genres
          averageScore
          siteUrl
        }
      }
    }
  `;

  return retryWrapper(async () => {
    const data = await sendAniListQuery(query, { page });
    const mediaWithMalId = data.Page.media.map(item => ({ ...item, mal_id: item.idMal }));
    return removeDuplicates(mediaWithMalId);
  });
}

export async function fetchRecent(page = 1) {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 30) {
        media(type: ANIME, sort: UPDATED_AT_DESC, status: RELEASING) {
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          episodes
          status
          startDate {
            year
            month
            day
          }
          description
          genres
          averageScore
          siteUrl
        }
      }
    }
  `;

  return retryWrapper(async () => {
    const data = await sendAniListQuery(query, { page });
    const mediaWithMalId = data.Page.media.map(item => ({ ...item, mal_id: item.idMal }));
    return removeDuplicates(mediaWithMalId);
  });
}

export async function fetchRecommended() {
  const url = `${JIKAN_API_BASE_URL}/recommendations/anime`;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const data = await fetchWithCache(url);
      return removeDuplicates(data.data);
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      console.error('Error fetching recommended from Jikan:', error);
      throw error;
    }
  }
}

// New function to fetch anime with flexible filters
export async function fetchAnimeWithFilters(filters = {}, page = 1) {
  const url = `${JIKAN_API_BASE_URL}/anime`;
  let attempt = 0;

  // Map filters to Jikan API query parameters
  const params = {
    page,
    ...filters,
  };

  // Fix genre key to genres for Jikan API
  if (params.genre) {
    params.genres = params.genre;
    delete params.genre;
  }

  while (attempt <= MAX_RETRIES) {
    try {
      const data = await fetchWithCache(url, params);
      return removeDuplicates(data.data);
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      console.error('Error fetching anime with filters from Jikan:', error);
      throw error;
    }
  }
}
