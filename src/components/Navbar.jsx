import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import React, { useState, useEffect } from "react";
import { FaRandom, FaBell, FaUserCircle } from "react-icons/fa";

// Icons for navbar right side
const SearchIcon = () => (
  <SearchBar
    className="w-6 h-6 text-white cursor-pointer"
    placeholder="Search..."
    aria-label="Search"
  />
);

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
<nav className="bg-[#0f111a] p-4 flex items-center justify-between sticky top-0 z-50 flex-wrap md:flex-nowrap">
  {/* Left: Hamburger + Logo */}
  <div className="flex items-center gap-4">
    <button
      className="text-white focus:outline-none"
      onClick={toggleDropdown}
      aria-label="Toggle menu"
    >
      {/* Hamburger SVG */}
      <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <Link to="/" className="text-3xl font-extrabold flex items-center gap-1 select-none whitespace-nowrap">
      <span>S</span><span className="text-pink-500">!</span><span>anime</span>
    </Link>
  </div>

  {/* Right: Search & Icons */}
  <div className="flex items-center gap-4 md:gap-6">
    {/* Search Icon or Full SearchBar based on width */}
    {windowWidth < 768 ? (
      <button
        aria-label="Toggle Search"
        className="text-white focus:outline-none"
        onClick={toggleSearch}
      >
        {/* Search Icon SVG */}
        <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    ) : (
      <div className="relative flex justify-center items-center max-w-xl mx-auto mb-4">
            <SearchBar
              placeholder="Search anime"
              className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur text-white focus:outline-none"
            />
          </div>
    )}

    {/* Random Icon */}
    <Link to="/random" className="hover:opacity-80">
      <FaRandom className="w-6 h-6 text-white cursor-pointer" />
    </Link>

    {/* Notification Bell */}
    <button aria-label="Notifications" className="hover:opacity-80 flex-shrink-0">
      <FaBell className="w-6 h-6 text-white cursor-pointer" />
    </button>

    {/* User Avatar */}
    <button aria-label="User Profile" className="hover:opacity-80 flex-shrink-0">
      <FaUserCircle className="w-7 h-7 text-white cursor-pointer rounded-full" />
    </button>

    {/* Language Toggle (Desktop only) */}
    <div className="hidden md:flex items-center gap-2">
      <button className="bg-orange-500 text-white px-3 py-1 rounded text-xs font-semibold">en</button>
      <button className="bg-gray-700 text-white px-3 py-1 rounded text-xs font-semibold">jp</button>
    </div>
  </div>

  {/* Mobile Search Bar (Separate layer) */}
  {isSearchOpen && windowWidth < 768 && (
    <div className="fixed top-16 inset-x-0 px-4 z-50">
      <div className="relative flex justify-center items-center max-w-xl mx-auto mb-4">
            <SearchBar
              placeholder="Search anime"
              className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur text-white focus:outline-none"
            />
          </div>
    </div>
  )}

  {/* Dropdown Menu */}
  {isDropdownOpen && (
    <div className="absolute top-14 left-4 bg-gray-800 rounded shadow-lg py-2 w-40 z-50 flex flex-col space-y-2">
      <Link to="/new-releases" className="px-4 py-2 hover:bg-gray-700 text-white font-semibold" onClick={() => setIsDropdownOpen(false)}>NEW RELEASES</Link>
      <Link to="/updates" className="px-4 py-2 hover:bg-gray-700 text-white font-semibold" onClick={() => setIsDropdownOpen(false)}>UPDATES</Link>
      <Link to="/ongoing" className="px-4 py-2 hover:bg-gray-700 text-white font-semibold" onClick={() => setIsDropdownOpen(false)}>ONGOING</Link>
      <Link to="/recent" className="px-4 py-2 hover:bg-gray-700 text-white font-semibold" onClick={() => setIsDropdownOpen(false)}>RECENT</Link>
      <button
            className="px-4 py-2 hover:bg-gray-700 text-white font-semibold"
            onClick={() => window.location.href = '/waifu'}
          >
            Waifu Anime
          </button>    
          <button
            className="px-4 py-2 hover:bg-gray-700 text-white font-semibold"
            onClick={() => window.location.href = '/imbd'}
          >
            IMDb Search
          </button>
          </div>
  )}
</nav>

  );
};

export default Navbar;
