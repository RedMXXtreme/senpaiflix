import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Frontpage.css";
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
                      navigate(`/search?query=${encodeURIComponent(search.trim())}`);
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
    <h2>SenpaiFlix – The best site to watch anime online for Free</h2>
    <p>
      Did you know that according to Google, the monthly search volume for anime-related topics exceeds over 1 billion? Anime is globally loved, and it’s no surprise that free anime streaming sites have exploded in popularity.
    </p>
    <p>
      Similar to free movie-streaming platforms, not all anime sites are built the same—some truly stand out. That’s why we created SenpaiFlix, aiming to become one of the top free anime-streaming destinations for fans worldwide.
    </p>

    <h3>1/ What is SenpaiFlix?</h3>
    <p>
      SenpaiFlix is a free platform where you can watch and even download subbed or dubbed anime in ultra HD quality—no registration, no payments required. With minimal ads, we ensure a safe, smooth anime-watching experience.
    </p>

    <h3>2/ Is SenpaiFlix safe?</h3>
    <p>
      Yes! We use only minimal, necessary ads to cover server costs, and our system scans them 24/7 to ensure they are clean. If you ever find suspicious ads, please report them and we will remove them immediately.
    </p>

    <h3>3/ What makes SenpaiFlix the best place to watch free anime online?</h3>
    <p>
      Before building SenpaiFlix, we studied many anime sites closely—kept the best features and eliminated everything annoying. Here’s what makes us confident about being one of the top anime-streaming sites:
    </p>

    <ul>
      <li><strong>Safety:</strong> We work hard to ensure no harmful ads appear on SenpaiFlix.</li>
      <li><strong>Content library:</strong> Our focus is purely anime. You’ll find popular hits, classics, and the latest releases across genres like action, fantasy, romance, school, horror, drama, comedy, music, mystery, and more—available in sub or dub.</li>
      <li><strong>Quality/Resolution:</strong> All titles stream in excellent quality. SenpaiFlix supports multiple resolutions—from smooth 360p for slow Internet to crisp 720p and 1080p HD for a premium experience.</li>
      <li><strong>Streaming experience:</strong> Our servers are configured for fast loading and uninterrupted streaming. Downloading episodes is also easy and reliable.</li>
      <li><strong>Updates:</strong> New episodes and requested titles are added daily, so you’ll never run out of anime to watch.</li>
      <li><strong>User interface:</strong> Our clean, modern UI makes navigation effortless for everyone. Search instantly, explore categories, or scroll for new releases.</li>
      <li><strong>Device compatibility:</strong> SenpaiFlix works smoothly on both mobile and desktop. However, we recommend desktop for the best experience.</li>
      <li><strong>Customer care:</strong> We’re active 24/7. Need help, have questions, or want to request an anime? We’re always ready to respond quickly.</li>
    </ul>

    <p>
      If you're searching for a safe and reliable anime-streaming platform, give SenpaiFlix a try. If you enjoy our service, don’t forget to bookmark the site and share it with other anime lovers.
    </p>

    <p>Thank you!</p>
    <p>© SenpaiFlix. All rights reserved.</p>
  </div>

  <div className="content-right">
    <h3>Trending Posts</h3>

    <div className="post">
      <div className="post-header">
        <span className="post-category">#General</span>
        <span className="post-time">3 hours ago</span>
        <span className="post-comments">19</span>
      </div>
      <div className="post-title">Can we bring this community back to its prime?</div>
      <div className="post-author">Everyone reply with your country name;</div>
    </div>

    <div className="post">
      <div className="post-header">
        <span className="post-category">#General</span>
        <span className="post-time">4 hours ago</span>
        <span className="post-comments">23</span>
      </div>
      <div className="post-title">Bye 👋👋👋</div>
      <div className="post-author">
        The community feels dead. The most recent active post has only around 15 comments, and most of my bros aren't even active anymore (Weeb Warrior, Cucumber Boy,…)
      </div>
    </div>

    <div className="post">
      <div className="post-header">
        <span className="post-category">#General</span>
        <span className="post-time">5 hours ago</span>
        <span className="post-comments">27</span>
      </div>
      <div className="post-title">How to get rid of that feeling after finishing an anime?</div>
      <div className="post-author">
        How do you deal with that empty feeling after finishing an anime? Even if it ends happily, it feels like you’ve been thrown out of that world…
      </div>
    </div>

    <div className="post">
      <div className="post-header">
        <span className="post-category">#General</span>
        <span className="post-time">6 hours ago</span>
        <span className="post-comments">14</span>
      </div>
      <div className="post-title">Tencent is flexing their ultimate budget</div>
      <div className="post-author">
        LORD OF THE MYSTERIES WILL GET A FULL ADAPTATION—6 SEASONS AND A MOVIE! Season 2 in 2027, Season 3 in 2030, Season 4 in 2032…
      </div>
    </div>

    <div className="post">
      <div className="post-header">
        <span className="post-category">#Discussion</span>
        <span className="post-time">21 hours ago</span>
        <span className="post-comments">171</span>
      </div>
      <div className="post-title">
        What’s with all the hating culture? (Counter post to “rom-coms are sh*t”)
      </div>
      <div className="post-author">
        First of all, I'm not jobless—I wrote this in 5 minutes on my PC. Here’s the post I’m talking about:
      </div>
    </div>

    <div className="post">
      <div className="post-header">
        <span className="post-category">#Discussion</span>
        <span className="post-time">5 hours ago</span>
        <span className="post-comments">42</span>
      </div>
      <div className="post-title">Waguri vs Sung Jin-Woo fandom</div>
      <div className="post-author">
        Not comparing the characters—just the fandoms. When Solo Leveling season 1 came out, Instagram was flooded with Sung Jin-Woo posts. Now it's all Waguri…
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



