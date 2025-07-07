import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchNewReleases, fetchUpdates, fetchOngoing, fetchRecent } from '../utils/api';
import Loader from '../components/Loader';

const categoryFetchMap = {
  'new-releases': fetchNewReleases,
  updates: fetchUpdates,
  ongoing: fetchOngoing,
  recent: fetchRecent,
};

export default function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [animeData, setAnimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchFunction = categoryFetchMap[category];
        if (!fetchFunction) {
          navigate("*", { replace: true });
          return;
        }
        const data = await fetchFunction(currentPage);
        console.log('Fetched data for category:', category, 'page:', currentPage, data);
        if (category === 'ongoing') {
          console.log('Ongoing category raw data:', data);
        }
        if (!data) {
          console.warn(`No data received for category: ${category} page: ${currentPage}`);
          setAnimeData([]);
          setHasMore(false);
        } else if (!Array.isArray(data)) {
          console.warn(`Data received is not an array for category: ${category} page: ${currentPage}`, data);
          setAnimeData([]);
          setHasMore(false);
        } else {
          setAnimeData(data);
          if (data.length === 0) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }
        }
      } catch (err) {
        console.error('Error fetching category data:', err);
        setError('Failed to fetch data');
        setAnimeData([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [category, currentPage]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (loading) return <div> <Loader /> {category}...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 text-white bg-[#19192c] min-h-screen">
      <h1 className="text-3xl font-bold mb-4 capitalize">{category.replace('-', ' ')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {animeData.length === 0 && <p>No data available.</p>}
        {animeData.map((anime, index) => (
          <div
            key={anime.mal_id ? anime.mal_id : `anime-${index}`}
            className="flex flex-col items-center cursor-pointer"
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
              src={anime.images?.jpg?.image_url || anime.image_url || ''}
              alt={anime.title_english || anime.title || 'No Title Available'}
              className="w-36 h-52 object-cover rounded-md shadow-lg"
            />
            <p className="text-sm mt-2 text-center truncate w-full" title={anime.title_english || anime.title}>
              {anime.title_english || anime.title}
            </p>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6 space-x-4">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed`}
        >
          Previous
        </button>
        <span className="text-white self-center">Page {currentPage}</span>
        <button
          onClick={handleNext}
          disabled={!hasMore || loading}
          className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
