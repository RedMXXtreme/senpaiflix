const ANILIST_API_URL = 'https://graphql.anilist.co';

const RATE_LIMIT = 90; // requests per minute
const REQUEST_INTERVAL = 60000 / RATE_LIMIT; // milliseconds between requests (~666ms)

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // base delay in ms for exponential backoff

let lastRequestTime = 0;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function throttle() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_INTERVAL) {
    await delay(REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
}

/**
 * Sends a GraphQL query to the AniList API with rate limiting and retry on rate limit errors.
 * @param {string} query - The GraphQL query string.
 * @param {object} variables - Variables for the GraphQL query.
 * @returns {Promise<object>} - The response data from AniList API.
 */
export async function sendAniListQuery(query, variables = {}) {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      await throttle();

      const response = await fetch(ANILIST_API_URL, {
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

      if (response.status === 429) {
        // Rate limit error
        throw new Error('Rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      if (json.errors) {
        throw new Error(`AniList API error: ${JSON.stringify(json.errors)}`);
      }

      return json.data;
    } catch (error) {
      if (error.message.includes('Rate limit') && attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.warn(`Retrying due to rate limit error after ${delayTime} ms...`);
        await delay(delayTime);
        attempt++;
        continue;
      }
      console.error('Error sending AniList query:', error);
      throw error;
    }
  }
}
