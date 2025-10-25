import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRandomAnime } from '../utils/anilistApi';
import Loader from './Loader';

const Random = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRandomAnime = async () => {
      try {
        setLoading(true);
        const randomAnime = await fetchRandomAnime();
        if (randomAnime && randomAnime.id) {
          navigate(`/anime/${randomAnime.id}`);
        } else {
          // Fallback if the API response is not as expected
          navigate('/anime/21'); // One Piece as fallback
        }
      } catch (error) {
        console.error('Error fetching random anime:', error);
        // Fallback on any error
        navigate('/anime/21'); // One Piece as fallback
      } finally {
        setLoading(false);
      }
    };

    getRandomAnime();
  }, [navigate]);

  if (!loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0b1622] flex flex-col items-center justify-center">
      <div className="text-center">
        <Loader />
        <p className="text-white text-xl mt-6 animate-pulse">
          Finding a random anime for you...
        </p>
        <p className="text-gray-400 text-sm mt-2">
          This will only take a moment
        </p>
      </div>
    </div>
  );
};

export default Random;
