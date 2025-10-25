import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { sendAniListQuery } from "../../utils/anilistApi";
import "./SeasonSection.css";


const SeasonSection = ({ animeId }) => {
  const [seasons, setSeasons] = useState([]);
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const { id: currentId } = useParams(); // Get current watch page ID

  // Fetch all seasons from AniList
  useEffect(() => {
    if (!animeId) return;

    const fetchSeasons = async () => {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title {
              romaji
              english
            }
            episodes
            seasonYear
            coverImage {
              large
            }
            relations {
              edges {
                relationType
                node {
                  id
                  title {
                    romaji
                    english
                  }
                  episodes
                  seasonYear
                  coverImage {
                    large
                  }
                }
              }
            }
          }
        }
      `;

      const variables = { id: animeId };

      try {
        const data = await sendAniListQuery(query, variables);
        const mainAnime = data?.Media;
        if (!mainAnime) return;

        // Gather related seasons
        const related = mainAnime.relations.edges
          .filter((edge) => ["SEQUEL", "PREQUEL"].includes(edge.relationType))
          .map((edge) => ({
            id: edge.node.id,
            title: edge.node.title.english || edge.node.title.romaji,
            episodes: edge.node.episodes,
            cover: edge.node.coverImage.large,
            year: edge.node.seasonYear,
          }));

        // Include main anime
        const allSeasons = [
          {
            id: mainAnime.id,
            title: mainAnime.title.english || mainAnime.title.romaji,
            episodes: mainAnime.episodes,
            cover: mainAnime.coverImage.large,
            year: mainAnime.seasonYear,
          },
          ...related,
        ];

        const sorted = allSeasons.sort((a, b) => (a.year || 0) - (b.year || 0));
        setSeasons(sorted);
      } catch (err) {
        console.error("Error fetching seasons:", err);
      }
    };

    fetchSeasons();
  }, [animeId]);

  const scroll = (dir) => {
    if (carouselRef.current) {
      const amount = dir === "left" ? -400 : 400;
      carouselRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (seasons.length === 0) return null;

  return (
    <div className="season-container">
      <h2 className="season-title">Seasons</h2>

      <div className="carousel-wrapper">
        <button className="nav-btn left" onClick={() => scroll("left")}>
          <ChevronLeft size={20} />
        </button>

        <div className="season-carousel" ref={carouselRef}>
          {seasons.map((s, i) => {
            const isActive = parseInt(currentId) === s.id;
            return (
              <div
                key={s.id}
                className={`season-card ${isActive ? "active" : ""}`}
                onClick={() => navigate(`/anime/${s.id}`)}
              >
                <img src={s.cover} alt={s.title} className="season-img" />
                <div className="season-overlay">
                  <h3>Season {i + 1}</h3>
                  <span className="episode-badge">
                    {s.episodes ? `${s.episodes} Eps` : "N/A"}
                  </span>
                  {isActive && <span className="watching-tag">Now Watching</span>}
                </div>
              </div>
            );
          })}
        </div>

        <button className="nav-btn right" onClick={() => scroll("right")}>
          <ChevronRight size={20} />
        </button>
      </div>
      
    </div>
  );
};

export default SeasonSection;


