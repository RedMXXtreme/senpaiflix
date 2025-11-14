import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FrontPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleArrowRight,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";


// Static nav links
const NAV_LINKS = [
  { to: "/home", label: "Home" },
  { to: "/filter?format=MOVIE", label: "Movies" },
  { to: "/filter?format=TV", label: "TV Series" },
  { to: "/popular", label: "Most Popular" },
  { to: "/trending", label: "Top Airing" },
  { to: "/hindi", label: "Hindi_Anime" },
];

const logoTitle = "SenpaiFlix";

// Custom hook to fetch top search items

const useTopSearch = () => {
  const [topSearch, setTopSearch] = useState([]);
  useEffect(() => {
    const fetchTopSearch = async () => {
      try {
        const res = await fetch("https://steller-tau.vercel.app/meta/anilist/trending?page=1&perPage=10");
        const json = await res.json();
        if (json.results) {
          setTopSearch(json.results.map(item => ({
            title: item.title?.english || item.title?.romaji || item.title?.native || "Unknown Title",
            link: `/anime/${item.id}`
          })));
        }
      } catch (err) {
        console.error("Error fetching top search:", err);
        setTopSearch([]);
      }
    };
    fetchTopSearch();
  }, []);
  return topSearch;
};

function FrontPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debounceRef = useRef(null);
  const suggestionRefs = useRef([]);
  const topSearch = useTopSearch();

  const searchAniList = async (searchValue) => {
    setLoading(true);
    try {
      const response = await fetch(`https://steller-tau.vercel.app/meta/anilist/${searchValue}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error fetching from AniList:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Random image from Waifu API
  const [randomImage, setRandomImage] = useState(null);

  useEffect(() => {
    const fetchRandomImage = async () => {
      try {
        const res = await fetch("https://api.waifu.im/search?is_nsfw=false");
        const data = await res.json();
        if (data?.images?.length > 0) {
          setRandomImage(data.images[0].url);
        }
      } catch (err) {
        console.error("Error fetching Waifu image:", err);
      }
    };

    fetchRandomImage();
  }, []);


  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Clear old debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Wait 400ms before fetching
    debounceRef.current = setTimeout(() => {
      if (value.length > 2) {
        searchAniList(value);
      } else {
        setResults([]);
      }
    }, 400);
  };

  const handleSearchSubmit = useCallback(() => {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return;
    const queryParam = encodeURIComponent(trimmedSearch);
    navigate(`/search?keyword=${queryParam}`);
  }, [search, navigate]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit]
  );

  return (
    <div className="w-full">
      <div className="w-[1300px] mx-auto pt-12 relative overflow-hidden max-[1350px]:w-full max-[1350px]:px-8 max-[1200px]:pt-8 max-[1200px]:min-h-fit max-[780px]:px-4 max-[520px]:px-0 max-[520px]:pt-6">
        <nav className="relative w-full">
          <div className="w-fit flex gap-x-12 mx-auto font-semibold max-[780px]:hidden">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-[#ffbade]">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="max-[780px]:block hidden max-[520px]:px-4 max-[520px]:text-sm">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 focus:outline-none flex items-center gap-x-2 transition-colors duration-200 group"
            >
              <svg
                className="w-6 h-6 text-white transition-colors duration-200 max-[520px]:w-5 max-[520px]:h-5 group-hover:text-[#ffbade] group-focus:text-[#ffbade] group-active:text-[#ffbade]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span className="text-white font-semibold transition-colors duration-200 group-hover:text-[#ffbade] group-focus:text-[#ffbade] group-active:text-[#ffbade]">
                Menu
              </span>
            </button>
          </div>

          {isModalOpen && (
            <div className="max-[780px]:block w-full hidden absolute z-50 top-10">
              <div className="bg-[#101010fa] w-full p-6 rounded-2xl flex flex-col gap-y-6 items-center">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="self-end text-black text-xl absolute top-0 right-0 bg-white px-3 py-1 rounded-tr-xl rounded-bl-xl font-bold"
                >
                  &times;
                </button>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsModalOpen(false)}
                    className="hover:text-[#ffbade] text-white text-lg"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="splashscreen min-h-[480px] min-[1200px]:min-h-[520px] rounded-[40px] flex relative mt-7 max-[780px]:w-full items-stretch max-[780px]:rounded-[30px] max-[520px]:rounded-none max-[520px]:min-h-fit max-[520px]:pb-4 max-[520px]:mt-4">
          <div className="splashscreen-content bg-[#2B2A3C] h-auto flex flex-col w-[700px] relative z-40 px-20 py-20 left-0 max-[1200px]:py-12 max-[780px]:px-12 max-[520px]:py-4 max-[520px]:px-8" style={{ borderTopLeftRadius: '40px', borderBottomLeftRadius: '40px' }}>
            <Link
              to="/home"
              className="text-[45px] font-extrabold tracking-wide max-[520px]:text-[38px] max-[520px]:text-center"
            >
              {logoTitle.slice(0, 3)}
              <span className="text-[#FFBADE]">{logoTitle.slice(3, 4)}</span>
              {logoTitle.slice(4)}
            </Link>
            <div className="w-full mt-6 relative">
              <div className="flex gap-x-3">
                <input
                  type="text"
                  placeholder="Search anime..."
                  className="w-full py-3 px-6 rounded-xl bg-white text-[18px] text-black focus:outline-none"
                  value={search}
                  onChange={handleSearch}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && search.trim().length > 2) {
                      navigate(`/search?keyword=${encodeURIComponent(search.trim())}`);
                      setSearch("");
                      setResults([]);
                    }
                  }}
                />
                <button
                  className="bg-[#FFBADE] text-white py-3 px-4 rounded-xl font-extrabold"
                  onClick={handleSearchSubmit}
                >
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="text-lg text-black hover:text-white max-[600px]:mt-[7px]"
                  />
                </button>
              </div>
            </div>
            <div className="mt-8 text-[15px] leading-[1.6] max-[520px]:text-[13px] max-[520px]:leading-[1.4]">
              <span className="splashitem font-[600]">Top search: </span>
              {topSearch.map((item, index) => (
                <span key={index} className="splashitem font-[400]">
                  <Link to={item.link}>{item.title}</Link>
                  {index < topSearch.length - 1 && <span>, </span>}
                </span>
              ))}
            </div>
            <div className="mt-8 flex max-[780px]:left-10">
              <Link to="/home" className="max-[520px]:w-full">
                <div className="bg-[#FFBADE] text-black py-4 px-10 rounded-xl font-bold text-[20px] max-[520px]:text-center max-[520px]:font-medium max-[520px]:text-[17px]">
                  Watch anime
                  <FontAwesomeIcon
                    icon={faCircleArrowRight}
                    className="ml-6 text-black"
                  />
                </div>
              </Link>
            </div>
          </div>

          <div className="h-full w-[600px] absolute right-0 max-[780px]:hidden">
            <div className="splashoverlay"></div>
            {randomImage && (
              <img
                src={randomImage}
                alt="Splash"
                className="bg-cover rounded-r-[40px] w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
      <div className="mt-10 text-[14px] text-center pb-4">
        © {logoTitle} All rights reserved.
      </div>

      {/* Informational Section */}
       <section className="content-section">
<div className="content-container">
  <div className="content-left">
    <h2>SenpaiFlix – Your #1 Place to Watch Anime Online for Free</h2>

    <p>
      Did you know that Google reports over <strong>1 billion monthly searches</strong> related to anime? 
      Anime has become a worldwide phenomenon, and naturally, the demand for free anime-streaming platforms 
      has skyrocketed.
    </p>

    <p>
      Just like with movie-streaming websites, not all anime sites offer a smooth and safe experience. 
      That’s exactly why we built <strong>SenpaiFlix</strong> — a clean, fast, and reliable platform designed 
      specifically for anime lovers.
    </p>

    <h3>1/ What is SenpaiFlix?</h3>
    <p>
      SenpaiFlix is a free anime-streaming website where you can watch and download both subbed and dubbed 
      anime in <strong>ultra-high quality</strong> — all without registration or hidden fees. With extremely 
      minimal ads, we aim to deliver a smooth, uninterrupted viewing experience.
    </p>

    <h3>2/ Is SenpaiFlix safe?</h3>
    <p>
      Yes! We only use safe, necessary ads to support server costs. Our system monitors all ads 
      <strong>24/7</strong> to ensure they are clean and secure. If you ever notice anything suspicious, 
      report it and we’ll remove it immediately.
    </p>

    <h3>3/ Why is SenpaiFlix one of the best anime-streaming platforms?</h3>
    <p>
      Before building SenpaiFlix, we analyzed dozens of anime websites. We took their best features and 
      removed everything users complained about. Here’s why SenpaiFlix stands out:
    </p>

    <ul>
      <li><strong>Safety:</strong> We work continuously to ensure harmful or misleading ads never appear.</li>
      <li><strong>Huge anime library:</strong> From trending hits to timeless classics, we offer anime across 
          genres like action, romance, fantasy, school life, horror, comedy, drama, music, and more — in both sub and dub.</li>
      <li><strong>HD Streaming Quality:</strong> Enjoy smooth streaming in 360p, 480p, 720p, or full 1080p HD depending 
          on your connection.</li>
      <li><strong>Fast streaming servers:</strong> Our high-performance servers ensure <strong>almost zero buffering</strong>.</li>
      <li><strong>Daily updates:</strong> New episodes, seasonal anime, and fan requests are added every single day.</li>
      <li><strong>Clean UI:</strong> A modern, minimalistic interface designed for easy browsing and quick navigation.</li>
      <li><strong>Cross-device compatibility:</strong> Works smoothly on both mobile and desktop (desktop recommended for best experience).</li>
      <li><strong>24/7 customer support:</strong> Need help or want to request an anime? We're always available.</li>
    </ul>

    <p>
      If you’re looking for a safe, fast, and reliable anime-streaming platform, try SenpaiFlix today. 
      If you enjoy the experience, don’t forget to bookmark the site and share it with other anime fans!
    </p>

    <p>Thank you for supporting us!</p>
    <p>© SenpaiFlix. All rights reserved.</p>
  </div>

<div className="content-right">
  <h3>Trending Posts</h3>

  <div className="post">
    <div className="post-header">
      <span className="post-category">#General</span>
      <span className="post-time">1 hour ago</span>
      <span className="post-comments">32</span>
    </div>
    <div className="post-title">Solo Leveling: Arise anime event is going crazy!</div>
    <div className="post-author">
      The new trailer just dropped and fans are losing their minds—A-1 Pictures really went all-out this time.
      What are your thoughts on the animation quality?
    </div>
  </div>

  <div className="post">
    <div className="post-header">
      <span className="post-category">#Discussion</span>
      <span className="post-time">2 hours ago</span>
      <span className="post-comments">58</span>
    </div>
    <div className="post-title">Is 2025 the best anime year since 2019?</div>
    <div className="post-author">
      With One Punch Man S3, Chainsaw Man Movie, Blue Lock S2, and JJK S3 coming soon—this year feels stacked.
      Which one are you hyped for the most?
    </div>
  </div>

  <div className="post">
    <div className="post-header">
      <span className="post-category">#General</span>
      <span className="post-time">3 hours ago</span>
      <span className="post-comments">21</span>
    </div>
    <div className="post-title">Anime recommendations for people feeling “post-series depression”?</div>
    <div className="post-author">
      Finished your comfort anime and now feel empty? Drop your recommendations for shows that heal, relax,
      or pull you into a new world instantly.
    </div>
  </div>

  <div className="post">
    <div className="post-header">
      <span className="post-category">#News</span>
      <span className="post-time">5 hours ago</span>
      <span className="post-comments">47</span>
    </div>
    <div className="post-title">Attack on Titan: Special Edition Blu-ray leaks artwork</div>
    <div className="post-author">
      New exclusive illustrations featuring Eren, Levi, and Mikasa have leaked online.
      Fans can’t stop talking about the final visual style!
    </div>
  </div>

  <div className="post">
    <div className="post-header">
      <span className="post-category">#Discussion</span>
      <span className="post-time">7 hours ago</span>
      <span className="post-comments">103</span>
    </div>
    <div className="post-title">Why is rom-com anime dominating again in 2025?</div>
    <div className="post-author">
      From “Shy Girl Next Door” to “Our Summer Melody,” rom-coms seem to be taking over again.
      What changed? Why are people loving them more than ever?
    </div>
  </div>

  <div className="post">
    <div className="post-header">
      <span className="post-category">#General</span>
      <span className="post-time">10 hours ago</span>
      <span className="post-comments">64</span>
    </div>
    <div className="post-title">Is Kagurabachi still worth the hype?</div>
    <div className="post-author">
      The anime adaptation is performing better than expected.
      Do you think it deserves the memes and hype, or is it overrated?
    </div>
  </div>

  <button className="read-more-btn">Read more</button>
</div>

</div>


      </section>
    </div>
  );
}

export default FrontPage;
