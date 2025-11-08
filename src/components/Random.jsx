import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const Random = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (hasFetched) return;

    const getRandomMedia = async () => {
      try {
        setLoading(true);
        setHasFetched(true);
        const response = await fetch('https://steller-tau.vercel.app/meta/anilist/random-anime');
        if (!response.ok) {
          throw new Error('Failed to fetch random anime');
        }
        const randomMedia = await response.json();
        if (randomMedia && randomMedia.id) {
          navigate(`/anime/${randomMedia.id}`, { replace: true });
        } else {
          // Fallback if the API response is not as expected
          navigate('/anime/21'); // One Piece as fallback
        }
      } catch (error) {
        console.error('Error fetching random media:', error);
        // Fallback on any error
        navigate('/anime/21'); // One Piece as fallback
      } finally {
        setLoading(false);
      }
    };

    getRandomMedia();
  }, [navigate, hasFetched]);

  if (!loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b1622] flex flex-col items-center justify-center">
      <div className="text-center">
        <Loader />
        <p className="text-white text-xl mt-6 animate-pulse">
          Finding a random media for you...
        </p>
        <p className="text-gray-400 text-sm mt-2">
          This will only take a moment
        </p>
      </div>
    </div>
  );
};

export default Random;
