import React, { useState, useEffect } from 'react';
import RandomAnimeImage from './randomanimeimage';
import styles from './waifu.module.css';

// Simulated API response based on user provided JSON
const apiResponse = {
  versatile: [
    "maid",
    "waifu",
    "marin-kitagawa",
    "mori-calliope",
    "raiden-shogun",
    "oppai",
    "selfies",
    "uniform",
    "kamisato-ayaka"
  ],
  nsfw: [
    "ass",
    "hentai",
    "milf",
    "oral",
    "paizuri",
    "ecchi",
    "ero"
  ]
};

const Waifu = () => {
  const [tags, setTags] = useState({ versatile: [], nsfw: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState(null);

  // Simulate fetching data from API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        // Here we simulate the API call with the provided JSON response
        // In real scenario, you would fetch from the API endpoint
        setTags(apiResponse);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tags');
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const lastRequestTimeRef = React.useRef(0);

  const fetchImages = async (tag) => {
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 200) {
      // Ignore request if last request was less than 200ms ago
      return;
    }
    lastRequestTimeRef.current = now;

    setImagesLoading(true);
    setImagesError(null);
    try {
      const response = await fetch(`https://api.waifu.im/search?included_tags=${tag}`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      setImagesError(err.message);
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  if (loading) {
    return <div>Loading tags...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.imagesSection}>
        {imagesLoading && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', minHeight: '100px', fontSize: '1.2rem'
          }}>
            🔄 Loading images...
          </div>
        )}
        {imagesError && (
          <div style={{
            color: 'red', fontWeight: 'bold',
            padding: '1rem', backgroundColor: '#ffe5e5',
            borderRadius: '8px'
          }}>
            ❌ Error: {imagesError}
          </div>
        )}
        {!imagesLoading && !imagesError && images.length > 0 && (
          <div className={styles.imagesList}>
            {images.map(image => (
              <div key={image.image_id}>
                <img
                  src={image.url}
                  alt={image.tags.map(t => t.name).join(', ')}
                  className={styles.image}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.tagsSection}>
        <div>
          <div style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>🔥 Versatile Tags</h2>
        </div>
          <div className={styles.tagsGroup}>
            {tags.versatile.map(tag => (
              <button
                key={tag}
                className={styles.tagButton}
                onClick={() => fetchImages(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>🚫 NSFW Tags</h2>
        </div>
          <div className={styles.tagsGroup}>
            {tags.nsfw.map(tag => (
              <button
                key={tag}
                className={styles.tagButton}
                onClick={() => fetchImages(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <p className={styles.nsfwNote}>
            If you are 18+ then only click the NSFW tags
          </p>
        </div>

        <div>
          <div style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0 }}>🎲 Random Anime Image</h2>
        </div>
          <RandomAnimeImage />
        </div>
      </div>
    </div>
  );
};

export default Waifu;
