import React, { useEffect, useState, useRef } from 'react';
import styles from './randomanimeimage.module.css';
import { RefreshCcw } from 'lucide-react';

const RandomAnimeImage = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastRequestTimeRef = useRef(0);

  const fetchRandomImage = async () => {
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 200) return;
    lastRequestTimeRef.current = now;

    setLoading(true);
    setError(null);
    try {
      const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=';
      const apiUrl = 'https://api.nekosapi.com/v4/images/random';
      const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data && data.length > 0) {
        const safeImage = data.find(img => img.rating === 'safe');
        if (safeImage) {
          setImageUrl(safeImage.url);
        } else {
          setError('No safe image found');
        }
      } else {
        setError('No image found');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch image');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomImage();
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        {loading && <div className={styles.loader}></div>}
        {error && (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <button onClick={fetchRandomImage}>Retry</button>
          </div>
        )}
        {!loading && !error && (
          <>
            <img src={imageUrl} alt="Random Anime" className={styles.image} />
            <button onClick={fetchRandomImage} className={styles.refreshButton}>
              <RefreshCcw size={18} /> Refresh Image
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RandomAnimeImage;
