import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar";

const FrontPage = () => {
  const videoUrls = [
    "https://v1.pinimg.com/videos/mc/720p/f6/3b/b8/f63bb8d17fe2c624412287df221a076b.mp4",
    "https://v1.pinimg.com/videos/iht/expMp4/9c/2f/09/9c2f095e92dffd9848338e3cc500821d_720w.mp4",
    "https://v1.pinimg.com/videos/iht/720p/c4/ef/6f/c4ef6f8f2ca196e430b0a37c97aa629a.mp4",
    "https://v1.pinimg.com/videos/iht/expMp4/05/40/70/054070ffa0eb0314cf3d9f80a271abf4_720w.mp4",
    "https://v1.pinimg.com/videos/mc/720p/92/e6/0f/92e60f0b442860324b155fe025b2d1eb.mp4",
    "https://v1.pinimg.com/videos/iht/expMp4/98/1f/f9/981ff96105c30c7dbe25b7f6cf203ad9_720w.mp4",
    "https://v1.pinimg.com/videos/mc/720p/91/72/6a/91726ac4a96b0a57002d17a4946909f4.mp4",   // Add more video URLs as needed
  ];

  const [randomVideo, setRandomVideo] = useState(videoUrls[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * videoUrls.length);
    setRandomVideo(videoUrls[randomIndex]);
  }, []);

  return (
    <div className="text-white min-h-screen flex flex-col items-center justify-start px-4 md:pt-16" style={{ fontFamily: "Poppins, sans-serif" , paddingTop: "9rem" }}>
      {/* Header Section */}
      <div className="relative w-full max-w-6xl rounded-2xl overflow-hidden text-center">
        {/* Background */}
        <div className="absolute inset-0 z-0 grid grid-cols-6 gap-0 h-full">
          <video
            src={randomVideo}
            type="video/mp4"
            className="col-span-6 w-full h-full object-cover"
            autoPlay
            loop
            muted
          >
          </video>
        </div>

        {/* Overlay */}
        <div className="relative z-10 px-4 py-20 bg-black/70 rounded-2xl">
          {/* Logo */}
          <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-4">
            Senpai<span className="text-white">Flix</span>
          </h1>

          {/* Search bar */}
          <div className="relative flex justify-center items-center max-w-xl mx-auto mb-4">
            <SearchBar
              placeholder="Search anime"
              className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur text-white focus:outline-none"
            />
          </div>

          {/* Top search */}
          <p className="text-sm text-gray-300 animate-pulse px-4 mb-6">
            One Piece, Lord Of Mysteries, Lazarus, To Be Hero, Witch Watch
          </p>

          {/* Watch now */}
          <button
            onClick={() => window.location.href = "/home"}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            WATCH NOW
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-3 mt-6 flex-wrap">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">1k</button>
        <button className="bg-black hover:bg-gray-800 text-white px-3 py-2 rounded">1.5k</button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded">923</button>
        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded">3.3k</button>
        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded">236</button>
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mt-10 text-left text-gray-300 space-y-6 px-2 md:px-0">
        <h2 className="text-2xl font-bold text-white uppercase">
          THE BEST SITE TO WATCH ANIME ONLINE FOR FREE
        </h2>
        <p>
          Anime is not just about stories drawn with pen strokes; it’s a gateway to worlds full of emotions and creativity...
        </p>
        <h3 className="text-lg text-white font-bold">1. What is SenpaiFlix?</h3>
        <p>
          SenpaiFlix Lib is a free anime streaming site where you can watch anime in HD quality...
        </p>
        <h3 className="text-lg text-white font-bold">2. What makes SenpaiFlix the best site to watch anime free online?</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Safety</li>
          <li>Content Library</li>
          <li>Quality/Resolution</li>
          <li>Streaming experience</li>
          <li>Updates</li>
          <li>User interface</li>
          <li>Device Compatibility</li>
        </ul>
        <h3 className="text-lg text-white font-bold">3. How does SenpaiFlix compare to 9Anime, AnimeVibe, HiAnime, and GogoAnime?</h3>
        <p>
          We have a larger library than HiAnime and Gogo...
        </p>
        <p>
          Thank you!
        </p>
      </div>
    </div>
  );
};

export default FrontPage;
