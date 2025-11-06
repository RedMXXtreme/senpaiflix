import axios from "axios";

// Cache for iframe URLs
const iframeCache = new Map();

// Utility function to fetch with proxy and retry
const fetchWithProxyRetry = async (url, options = {}, maxRetries = 3) => {
  const proxy1 = `https://aniversehd.com/api/v1/streamingProxy?url=${encodeURIComponent(url)}`;
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

export async function fetchIframeUrlFromWatchHentai(animeName, episode) {
  const cacheKey = `${animeName}-${episode}`;
  if (iframeCache.has(cacheKey)) {
    console.log("Returning cached WatchHentai iframe URL for:", cacheKey);
    return iframeCache.get(cacheKey);
  }
  try {
    const episodeUrl = `https://watchhentai.net/videos/${animeName}-episode-${episode}-id-01/`; //https://watchhentai.net/videos/ane-wa-yanmama-junyuu-chuu-episode-1-id-01/
    // Ensure the episodeUrl is properly formatted
    console.log("Fetching WatchHentai iframe URL from:", episodeUrl);

    // Removed sleep usage

    const response = await fetchWithProxyRetry(episodeUrl);
    console.log("Response status:", response.status);
    const html = response.data;

    // Updated regex to be more flexible and capture iframe src with or without quotes
    const iframeSrcMatch = html.match(/<iframe[^>]*src=(?:"|')?([^"'>\s]+)(?:"|')?[^>]*>/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      console.log("Iframe URL found:", iframeSrcMatch[1]);
      iframeCache.set(cacheKey, iframeSrcMatch[1]);
      return iframeSrcMatch[1];
    }
    console.warn("Iframe URL not found in watchhentai.net page.");
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse watchhentai.net episode page:", error);
    return null;
  }
}

export async function fetchIframeUrlFromHanimeHentai(animeName, episode) {
  const cacheKey = `${animeName}-${episode}`;
  if (iframeCache.has(cacheKey)) {
    console.log("Returning cached HanimeHentai iframe URL for:", cacheKey);
    return iframeCache.get(cacheKey);
  }
  try {
    const episodeUrl = `https://hanimehentai.tv/video/${animeName}/episode-${episode}/`;
    // Ensure the episodeUrl is properly formatted
    console.log("Fetching HanimeHentai iframe URL from:", episodeUrl);

    // Removed sleep usage

    const response = await fetchWithProxyRetry(episodeUrl);
    console.log("Response status:", response.status);
    const html = response.data;

    // Updated regex to be more flexible and capture iframe src with or without quotes
    const iframeSrcMatch = html.match(/<iframe[^>]*src=(?:"|')?([^"'>\s]+)(?:"|')?[^>]*>/i);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      console.log("Iframe URL found:", iframeSrcMatch[1]);
      iframeCache.set(cacheKey, iframeSrcMatch[1]);
      return iframeSrcMatch[1];
    }
    console.warn("Iframe URL not found in hanimehentai.tv page.");
    return null;
  } catch (error) {
    console.error("Failed to fetch or parse hanimehentai.tv episode page:", error);
    return null;
  }
}
