import React from "react";
import AnimeSchedule from "../components/AnimeSchedule";
import HeroCarousel from "../components/Hero";
import TrendingCarousel from "../components/TrendingCarousel";
import UpComingCarousel from "../components/UpComingCarousel";

const Home = () => {
  return (
    <div className="bg-[#0f0f1b] min-h-screen text-white">
      <HeroCarousel />
      <TrendingCarousel />
      <UpComingCarousel />
      <div className="max-w-screen-xl mx-auto px-4 py-8 flex justify-end">
        <div className="w-full md:w-1/3">
          <AnimeSchedule />
        </div>
      </div>
    </div>
  );
};

export default Home;
