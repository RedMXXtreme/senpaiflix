import React from "react";
import HeroCarousel from "../components/Hero";
import TrendingCarousel from "../components/TrendingCarousel";
import UpComingCarousel from "../components/UpComingCarousel";
import ThreeColumnAnimeList from "../components/ThreeColumnAnimeList";
import AnimeSchedule from "../components/AnimeSchedule";

const Home = () => {
  return (
    <div className="bg-[#0f0f1b] text-white min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full">
        <HeroCarousel />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1b] via-transparent to-[#0f0f1b]/80 z-10 pointer-events-none" />
      </div>

      {/* Main + Sidebar Layout */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Latest Updates Grid */}
          <section>
            <UpComingCarousel />
          </section>

          {/* 3-tab list: New Releases, Upcoming, Completed */}
          <section>
            <ThreeColumnAnimeList />
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <TrendingCarousel />
          <AnimeSchedule />
        </div>
      </div>


    </div>
  );
};

export default Home;
