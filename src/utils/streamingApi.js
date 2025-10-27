import axios from "axios";

// Cache for HanimeHentai iframe URLs
const HanimeHentai = new Map();

// Utility function to fetch with proxy and retry
const fetchWithProxyRetry = async (url, options = {}, maxRetries = 3) => {
  const proxy1 = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const proxy2 = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;

  // Try the first proxy
  try {
    const response = await axios.get(proxy1);
    return response;
  } catch (error) {
    console.warn(`Proxy ${proxy1} failed, trying fallback proxy...`);
  }

  // Retry with the second proxy
  try {
    const response = await axios.get(proxy2);
    return response;
  } catch (error) {
    console.error(`Fallback proxy ${proxy2} also failed`);
    throw error;
  }
};

export async function fetchIframeUrlFromHanimeHentai(animeName, episode) {
  const cacheKey = `slugify(${animeName})-${episode}`;
  if (HanimeHentai.has(cacheKey)) {
    console.log("Returning cached GogoAnime iframe URL for:", cacheKey);
    return HanimeHentai.get(cacheKey);
  }
  try {
    const episodeUrl = `https://hanimehentai.tv/video/${animeName}/episode-${episode}/`;  //https://watchhentai.net/videos/${animeName}-episode-1/
    // Ensure the episodeUrl is properly formatted
    console.log("Fetching GogoAnime iframe URL from:", episodeUrl);

    // Removed sleep usage

    const response = await fetchWithProxyRetry(episodeUrl);
    console.log("Response status:", response.status);
    const html = response.data;

    // Updated regex to be more flexible and capture iframe src with or without quotes
    const iframeSrcMatch = html.match(/<iframe[^>]*src=(?:"|')?([^"'>\s]+)(?:"|')?[^>]*>/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      console.log("Iframe URL found:", iframeSrcMatch[1]);
      HanimeHentai.set(cacheKey, iframeSrcMatch[1]);
      return iframeSrcMatch[1];
    }
    console.warn("Iframe URL not found in animeworld-india page.");
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse animeworld-india episode page:", error);
    return null;
  }
}