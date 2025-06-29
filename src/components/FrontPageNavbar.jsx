import React from "react";
import { Link } from "react-router-dom";

const FrontPageNavbar = () => {
  return (
    <nav className="bg-[#0f0f1b] p-4 flex justify-between items-center fixed w-full top-0 z-50 shadow-md border-b border-gray-800">
       <Link to="/" className="text-3xl font-extrabold flex items-center gap-1 select-none whitespace-nowrap">
          <span>S</span>
          <span className="text-pink-500">!</span>
          <span>anime</span>
        </Link>
      <ul className="flex gap-8 text-white font-semibold text-base select-none mr-8">
        <li>
          <Link to="/home" className="hover:text-pink-400 transition duration-300">
            Home
          </Link>
        </li>
        <li>
          <Link to="/filter?type=movie" className="hover:text-pink-400 transition duration-300">
            Movies
          </Link>
        </li>
        <li>
          <Link to="/filter?type=tv" className="hover:text-pink-400 transition duration-300">
            TV Series
          </Link>
        </li>
        <li>
          <Link to="/recent" className="hover:text-pink-400 transition duration-300">
            Most Popular
          </Link>
        </li>
        <li>
          <Link to="/new-releases" className="hover:text-pink-400 transition duration-300">
            Top Airing
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default FrontPageNavbar;
