import axios from "axios";
import { slugify } from "./slugify";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate animeId to be a positive integer string.
 * @param {string} animeId
 * @returns {boolean}
 */
function isValidAnimeId(animeId) {
  return /^\d+$/.test(animeId);
}

/**
 * Fetch anime details and episodes from Jikan API with caching and retry on 429.
 * @param {string} animeId - The MyAnimeList anime ID.
 * @returns {Promise<Object>} - Anime details including episodes.
 */
export async function fetchAnimeDetailsWithCache(animeId) {
  if (!isValidAnimeId(animeId)) {
    throw new Error("Invalid animeId: " + animeId);
  }
  let retries = 3;
  let delay = 1000; // start with 1 second
  while (retries > 0) {
    try {
      // Throttle request by waiting 1 second before API call
      await sleep(1000);

      // Fetch anime details
      const animeResponse = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
      const animeData = animeResponse.data.data;

      // Throttle request by waiting 1 second before API call
      await sleep(1000);

      // Fetch episodes list
      const episodesResponse = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
      const episodesData = episodesResponse.data.data;

      const result = {
        anime: animeData,
        episodes: episodesData,
      };

      return result;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.warn("Rate limited by Jikan API, retrying after delay...");
        await sleep(delay);
        delay *= 2; // exponential backoff
        retries--;
      } else {
        console.error("Error fetching anime details from Jikan API:", error);
        throw error;
      }
    }
  }
  throw new Error("Failed to fetch anime details after retries due to rate limiting.");
}

/**
 * Fetch anime recommendations from Jikan API with caching and retry on 429.
 * @param {string} animeId - The MyAnimeList anime ID.
 * @returns {Promise<Array>} - List of recommended anime.
 */
export async function fetchAnimeRecommendationsWithCache(animeId) {
  if (!isValidAnimeId(animeId)) {
    console.warn("Invalid animeId for recommendations: " + animeId);
    return [];
  }
  let retries = 3;
  let delay = 1000;
  while (retries > 0) {
    try {
      const response = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}/recommendations`);
      const recommendations = response.data.data;
      return recommendations;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.warn("Rate limited by Jikan API (recommendations), retrying after delay...");
        await sleep(delay);
        delay *= 2;
        retries--;
      } else {
        console.error("Error fetching anime recommendations from Jikan API:", error);
        return [];
      }
    }
  }
  console.error("Failed to fetch anime recommendations after retries due to rate limiting.");
  return [];
}


/**
 * Fetch English title of anime by ID using Jikan API.
 * @param {string} animeId - The MyAnimeList anime ID.
 * @returns {Promise<string|null>} - English title or null if not available.
 */
export async function fetchEnglishTitleById(animeId) {
  try {
    const { anime } = await fetchAnimeDetailsWithCache(animeId);
    // If English title is missing or empty, fall back to original title
    if (anime.title_english && anime.title_english.trim() !== "") {
      return anime.title_english;
    }
    return anime.title || null;
  } catch (error) {
    console.error("Error fetching English title from Jikan API:", error);
    return null;
  }
}

/**
 * Get stream URL from megaplay.buzz endpoint.
 * @param {string} hianimeEpId - The hianime episode ID.
 * @param {string} language - Language code (e.g., "sub", "dub").
 * @returns {string} - Stream URL.
 */
export function getMegaplayStreamUrl(hianimeEpId, language) {
  return `https://megaplay.buzz/stream/s-2/${hianimeEpId}/sub`;
}



/**
 * Get stream URL from 2anime.xyz embed endpoint.
 * @param {string} animeName - Anime name in English (URL friendly).
 * @param {number} episodeNumber - Episode number.
 * @returns {string} - Embed URL.
 */

export function get2AnimeEmbedUrl(animeName, episodeNumber) {
  // Use slugify function from slugify.js to convert animeName to URL friendly format
  const formattedName = slugify(animeName);
  return `https://2anime.xyz/embed/${formattedName}-episode-${episodeNumber}`;
}

export function get2AnimeEmbedUrl1(animeName, episodeNumber) {
  // Convert animeName to URL friendly format (lowercase, hyphens)
  const formattedName = slugify(animeName);
  return `https://2anime.xyz/embed/${formattedName}-episode-${episodeNumber}`;
}

export function get2AnimeEmbedUrl2(animeName, episodeNumber) {
  // Convert animeName to URL friendly format (lowercase, hyphens)
  const formattedName = slugify(animeName);
  return `https://2anime.xyz/embed/${formattedName}-dub-episode-${episodeNumber}`;
}

export function get2AnimeEmbedUrl3(animeName, episodeNumber) {
  // Convert animeName to URL friendly format (lowercase, hyphens)
  const formattedName = slugify(animeName);
  return `https://2anime.xyz/embed/${formattedName}-dub-episode-${episodeNumber}`;
} 

/**
 * Fetch iframe URL from animeworld-india episode page by scraping iframe src.
 * @param {string} animeName - The anime name in URL format.
 * @param {number|string} episode - The episode number.
 * @returns {Promise<string|null>} - The iframe URL if found, otherwise null.
 */
export async function fetchIframeUrlFromDesiDub(animeName, episode) {
  try {
    const episodeUrl = `https://www.desidubanime.me/watch/${animeName}-episode-${episode}/`;
    console.log("Fetching AnimeWorld iframe URL from:", episodeUrl);

    // Throttle request by waiting 1 secon before API calld
    await sleep(1000);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(episodeUrl)}`;
    const response = await axios.get(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    console.log("Response status:", response.status);
    const html = response.data;

    // Updated regex to be more flexible and capture iframe src with or without quotes
    const iframeSrcMatch = html.match(/<iframe[^>]*src=(?:"|')?([^"'>\s]+)(?:"|')?[^>]*>/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      console.log("Iframe URL found:", iframeSrcMatch[1]);
      return iframeSrcMatch[1];
    }
    console.warn("Iframe URL not found in animeworld-india page.");
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse animeworld-india episode page:", error);
    return null;
  }
}

/**
 * Fetch iframe URL from GogoAnime-india episode page by scraping iframe src.
 * @param {string} animeName - The anime name in URL format.
 * @param {number|string} episode - The episode number.
 * @returns {Promise<string|null>} - The iframe URL if found, otherwise null.
 */
const GogoAnime = new Map();

export async function fetchIframefromGogoAnime(animeName, episode) {
  const cacheKey = `slugify(${animeName})-${episode}`;
  if (GogoAnime.has(cacheKey)) {
    console.log("Returning cached GogoAnime iframe URL for:", cacheKey);
    return GogoAnime.get(cacheKey);
  }
  try {
    const episodeUrl = `https://9anime.org.lv/${animeName}-episode-${episode}/`;
    console.log("Fetching GogoAnime iframe URL from:", episodeUrl);

    // Throttle request by waiting 1 second before API call
    await sleep(1000);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(episodeUrl)}`;
    const response = await axios.get(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    console.log("Response status:", response.status);
    const html = response.data;

    // Updated regex to be more flexible and capture iframe src with or without quotes
    const iframeSrcMatch = html.match(/<iframe[^>]*src=(?:"|')?([^"'>\s]+)(?:"|')?[^>]*>/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      console.log("Iframe URL found:", iframeSrcMatch[1]);
      GogoAnime.set(cacheKey, iframeSrcMatch[1]);
      return iframeSrcMatch[1];
    }
    console.warn("Iframe URL not found in animeworld-india page.");
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse animeworld-india episode page:", error);
    return null;
  }
}

/**
 * Fetch the total number of Hindi dub episodes available for an anime from desidubanime.me.
 * @param {string} animeName - The slugified anime name.
 * @returns {Promise<number>} - The number of Hindi dub episodes available.
 * @param {number|string} episode - The episode number.

 */
export async function fetchHindiDubEpisodeCount(animeName, episode) {
  try {
    const animeUrl = `https://www.desidubanime.me/watch/${animeName}-episode-${episode}/`;

    // Throttle request by waiting 1 second before API call
    await sleep(1000);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(animeUrl)}`;
    const response = await axios.get(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const html = response.data;

    // Regex to find all episode links for Hindi dub episodes
    // Assuming episodes are listed with URLs like /watch/${animeName}-episode-${episode}/
    const episodeRegex = new RegExp(`/watch/${animeName}-episode-(\\d+)/`, 'g');
    const episodes = new Set();
    let match;
    while ((match = episodeRegex.exec(html)) !== null) {
      episodes.add(match[1]);
    }
    return episodes.size;
  } catch (error) {
    console.error("Failed to fetch or parse desidubanime anime page for episode count:", error);
    return 0;
  }
}

/**
 * Fetch iframe URL from 9anime.org.lv dub episode page by scraping iframe src.
 * @param {string} animeName - The anime name in URL format.
 * @param {number|string} episode - The episode number.
 * @returns {Promise<string|null>} - The iframe URL if found, otherwise null.
 */
const nineAnimeDubCache = new Map();

export async function fetchIframeFrom9AnimeDub(animeName, episode) {
  const cacheKey = `slugify(${animeName})-dub-${episode}`;
  if (nineAnimeDubCache.has(cacheKey)) {
    console.log("Returning cached 9anime dub iframe URL for:", cacheKey);
    return nineAnimeDubCache.get(cacheKey);
  }
  try {
    const episodeUrl = `https://9anime.org.lv/${animeName}-dub-episode-${episode}/`;
    console.log("Fetching 9anime dub iframe URL from:", episodeUrl);

    // Throttle request by waiting 1 second before API call
    await sleep(1000);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(episodeUrl)}`;
    const response = await axios.get(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    console.log("Response status:", response.status);
    const html = response.data;

    // Regex to capture iframe src with or without quotes
    const iframeSrcMatch = html.match(/<iframe[^>]*src=(?:"|')?([^"'>\s]+)(?:"|')?[^>]*>/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      console.log("Iframe URL found:", iframeSrcMatch[1]);
      nineAnimeDubCache.set(cacheKey, iframeSrcMatch[1]);
      return iframeSrcMatch[1];
    }
    console.warn("Iframe URL not found in 9anime dub page.");
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse 9anime dub episode page:", error);
    return null;
  }
}

/**
 * Fetch iframe URL from hanimehentai.tv episode page by scraping iframe src.
 * @param {string} animeName - The anime name in URL format.
 * @param {number|string} episode - The episode number.
 * @returns {Promise<string|null>} - The iframe URL if found, otherwise null.
 */
export async function fetchIframeUrlFromHanimeHentai(animeName, episode) {
  try {
    const episodeUrl = `https://hanimehentai.tv/video/${animeName}/episode-${episode}`;
    console.log("Fetching hanimehentai iframe URL from:", episodeUrl);

    // Throttle request by waiting 1 second before API call
    await sleep(1000);

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(episodeUrl)}`;
    const response = await axios.get(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    console.log("Response status:", response.status);
    const html = response.data;

    // Regex to capture iframe src with or without quotes
    const iframeSrcMatch = html.match(/<iframe[^>]*src=(?:"|')?([^"'>\\s]+)(?:"|')?[^>]*>/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      console.log("Iframe URL found:", iframeSrcMatch[1]);
      return iframeSrcMatch[1];
    }
    console.warn("Iframe URL not found in hanimehentai page.");
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse hanimehentai episode page:", error);
    return null;
  }
}
