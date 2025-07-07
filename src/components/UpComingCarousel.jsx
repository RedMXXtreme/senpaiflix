import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpComingCarousel() {
  const [animeData, setAnimeData] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchAnime = async () => {
        try {
          const response = await axios.get('https://api.jikan.moe/v4/seasons/2022/spring?sfw');
          const dataToSet = response.data.data.slice(0, 16);
          setAnimeData(dataToSet);
        } catch (error) {
          console.error('Error fetching anime data:', error);
        }
      };

      fetchAnime();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(4);
      } else {
        setItemsPerPage(8);
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const handleNext = () => {
    if (startIndex + itemsPerPage < animeData.length) {
      setStartIndex(startIndex + itemsPerPage);
    }
  };

  const handlePrev = () => {
    if (startIndex - itemsPerPage >= 0) {
      setStartIndex(startIndex - itemsPerPage);
    }
  };

  return (
    <div className="bg-[#19192c] text-white px-6 py-4 rounded-lg shadow-lg max-w-screen-xl mx-auto my-8">
      <h2 className="text-pink-400 text-3xl font-bold mb-4">UPCOMING</h2>
      <div className="relative flex items-center">
        <button
          onClick={handlePrev}
          className="absolute left-0 z-10 bg-[#2c2c4c] p-2 rounded-full hover:bg-pink-500"
          aria-label="Previous"
        >
          <ChevronLeft className="text-white w-6 h-6" />
        </button>
        <div className="flex gap-4 overflow-hidden w-full justify-center">
          {animeData.slice(startIndex, startIndex + itemsPerPage).map((anime, index) => (
            <div
              key={anime.mal_id}
              className="flex flex-col items-center cursor-pointer"
              style={{ minWidth: '9rem' }}
              onClick={() => navigate(`/anime/${anime.mal_id}`)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/anime/${anime.mal_id}`);
                }
              }}
            >
              <img
                src={anime.images.jpg.image_url}
                alt={anime.title}
                className="w-full h-52 object-cover rounded-md shadow-lg transition-transform transform hover:scale-105"
                style={{ maxWidth: '144px' }}
              />
              <p className="text-sm mt-2 text-center truncate w-full" title={anime.title}>{anime.title}</p>
              <p className="text-pink-400 text-lg font-bold">{String(index + 1 + startIndex).padStart(2, '0')}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleNext}
          className="absolute right-0 z-10 bg-[#2c2c4c] p-2 rounded-full hover:bg-pink-500"
          aria-label="Next"
        >
          <ChevronRight className="text-white w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
