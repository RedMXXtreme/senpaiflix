const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // base delay in ms for exponential backoff
const THROTTLE_DELAY = 1000; // 1 second delay between consecutive API calls

let lastApiCallTime = 0;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function throttle() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  if (timeSinceLastCall < THROTTLE_DELAY) {
    await delay(THROTTLE_DELAY - timeSinceLastCall);
  }
  lastApiCallTime = Date.now();
}

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

// Caching utility for Jikan API requests
const CACHE_EXPIRY = 3600000; // 1 hour in ms

function getCachedData(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
      return parsed.data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function setCachedData(key, data) {
  // Clean up expired cache entries before setting new cache data
  cleanExpiredCache();

  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(cacheEntry));
}

// Function to clean expired cache entries from localStorage
function cleanExpiredCache() {
  const now = Date.now();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('jikan_cache_')) {
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp > CACHE_EXPIRY) {
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Generic fetch with caching for Jikan API with throttling
export async function fetchWithCache(url, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = url + (queryString ? `?${queryString}` : '');
  console.log(`[fetchWithCache] Fetching URL: ${fullUrl}`);
  const cacheKey = `jikan_cache_${fullUrl}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log(`[fetchWithCache] Returning cached data for URL: ${fullUrl}`);
    return cachedData;
  }
  try {
    await throttle();
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`[fetchWithCache] Fetched data for URL: ${fullUrl}`, data);
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching from Jikan API:', error);
    throw error;
  }
};


export async function fetchNewReleases(page = 1) {
  const url = `${JIKAN_API_BASE_URL}/top/anime`;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const data = await fetchWithCache(url, { page });
      return removeDuplicates(data.data);
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      console.error('Error fetching new releases from Jikan:', error);
      throw error;
    }
  }
}

export async function fetchUpdates(page = 1) {
  const url = `${JIKAN_API_BASE_URL}/seasons/upcoming`;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const data = await fetchWithCache(url, { page });
      return removeDuplicates(data.data);
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      console.error('Error fetching updates from Jikan:', error);
      throw error;
    }
  }
}

export async function fetchOngoing(page = 1) {
  const url = `${JIKAN_API_BASE_URL}/top/anime`;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const data = await fetchWithCache(url, { filter: 'airing', page });
      console.log('[fetchOngoing] Data received:', data);
      return removeDuplicates(data.data);
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      console.error('Error fetching ongoing from Jikan:', error);
      throw error;
    }
  }
}

export async function fetchRecent(page = 1) {
  const url = `${JIKAN_API_BASE_URL}/seasons/now`;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const data = await fetchWithCache(url, { page });
      return removeDuplicates(data.data);
    } catch (error) {
      if (error.message.includes('rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      console.error('Error fetching recent from Jikan:', error);
      throw error;
    }
  }
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
