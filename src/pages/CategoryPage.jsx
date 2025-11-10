import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchNewReleases, fetchUpdates, fetchOngoing, fetchRecent, fetchTrending, fetchPopular } from '../utils/anilistApi';
import Loader from '../components/Loader';
import PageSlider from '../components/PageSlider';

const categoryFetchMap = {
  'new-releases': fetchNewReleases,
  updates: fetchUpdates,
  ongoing: fetchOngoing,
  recent: fetchRecent,
  trending: fetchTrending,
  popular: fetchPopular,
};

export default function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [animeData, setAnimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

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
        if (!data || !data.media) {
          console.warn(`No data received for category: ${category} page: ${currentPage}`);
          setAnimeData([]);
          setTotalPages(1);
        } else if (!Array.isArray(data.media)) {
          console.warn(`Data received is not an array for category: ${category} page: ${currentPage}`, data);
          setAnimeData([]);
          setTotalPages(1);
        } else {
          setAnimeData(data.media);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Error fetching category data:', err);
        setError('Failed to fetch data');
        setAnimeData([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [category, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ page: page.toString() });
  };

  if (loading) return <div> <Loader /></div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 text-white bg-[#19192c] min-h-screen">
      <h1 className="text-3xl font-bold mb-4 capitalize">{category.replace('-', ' ')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {animeData.length === 0 && <p>No data available.</p>}
        {animeData.map((anime, index) => (
          <div
            key={anime.id ? anime.id : `anime-${index}`}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate(`/anime/${anime.id}`)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate(`/anime/${anime.id}`);
              }
            }}
          >
            <img
              src={anime.coverImage?.large || anime.images?.jpg?.image_url || anime.images?.webp?.image_url || ''}
              alt={anime.title_english || anime.title || 'No Title Available'}
              className="w-36 h-52 object-cover rounded-md shadow-lg"
            />
            <p className="text-sm mt-2 text-center truncate w-full" title={anime.title?.english || anime.title?.romaji || anime.title?.native || 'No Title'}>
              {anime.title?.english || anime.title?.romaji || anime.title?.native || 'No Title'}
            </p>
          </div>
        ))}
      </div>
      <PageSlider
        page={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />
    </div>
  );
}
