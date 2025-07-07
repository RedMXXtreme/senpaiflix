import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Random = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRandomAnime = async () => {
      try {
        const response = await axios.get(`https://api.jikan.moe/v4/random/anime`);
        const randomAnime = response.data.data;
        if (randomAnime && randomAnime.mal_id) {
          navigate(`/anime/${randomAnime.mal_id}`);
        } else {
          // Fallback if the API response is not as expected
          navigate('/anime/34572');
        }
      } catch (error) {
        console.error('Error fetching random anime:', error);
        // Fallback on any error
        navigate('/anime/34572');
      }
    };

    fetchRandomAnime();
  }, [navigate]);

  return null; // No UI needed, just redirect
};

export default Random;
