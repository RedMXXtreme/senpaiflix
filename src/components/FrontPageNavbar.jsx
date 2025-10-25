import React, { useState } from "react";
import { Link } from "react-router-dom";

const FrontPageNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-[#0f0f1b] p-4 flex justify-between items-center fixed w-full top-0 z-50 shadow-md border-b border-gray-800">
      <Link to="/" className="text-3xl font-extrabold flex items-center gap-1 select-none whitespace-nowrap">
        <span>S</span>
        <span className="text-pink-500">!</span>
        <span>anime</span>
      </Link>

      {/* Hamburger menu button for small screens */}
      <button
        onClick={toggleMenu}
        className="text-white md:hidden focus:outline-none"
        aria-label="Toggle menu"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Menu links */}
      <ul
        className={`flex-col md:flex-row md:flex gap-8 text-white font-semibold text-base select-none mr-8 absolute md:static top-full left-0 w-full md:w-auto bg-[#0f0f1b] md:bg-transparent border-t border-gray-800 md:border-none transition-all duration-300 ease-in-out ${
          isOpen ? "flex" : "hidden"
        } md:flex`}
      >
        <li>
          <Link to="/home" className="block px-4 py-2 hover:text-pink-400 transition duration-300">
            Home
          </Link>
        </li>
        <li>
          <Link to="/filter?format=MOVIE" className="block px-4 py-2 hover:text-pink-400 transition duration-300">
            Movies
          </Link>
        </li>
        <li>
          <Link to="/filter?format=TV" className="block px-4 py-2 hover:text-pink-400 transition duration-300">
            TV Series
          </Link>
        </li>
        <li>
          <Link to="/recent" className="block px-4 py-2 hover:text-pink-400 transition duration-300">
            Most Popular
          </Link>
        </li>
        <li>
          <Link to="/imbd" className="block px-4 py-2 hover:text-pink-400 transition duration-300">
            IMBD Player
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default FrontPageNavbar;
