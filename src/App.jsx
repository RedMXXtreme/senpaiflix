import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import FrontPageNavbar from "./components/FrontPageNavbar";
import AnimeDetail from "./pages/AnimeDetail";
import SearchResults from "./pages/SearchResults";
import Footer from "./components/Footer";
import FrontPage from "./components/FrontPage";
import CategoryPage from "./pages/CategoryPage";
import FilterPage from "./pages/FilterPage";
import Random from "./components/Random";
import Watch from "./pages/Watch";
import NotFound from "./pages/NotFound";
import Waifu from "./pages/waifu";
import Imbd from "./pages/imbd"; // Adjusted import path
import ImbdPlayer from "./pages/imbd_player";
import SecurityProvider from "./components/SecurityProvider";

const AppContent = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" ? <FrontPageNavbar /> : <Navbar />}
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/anime/:id" element={<AnimeDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/random" element={<Random />} />
        <Route path="/watch/:animeId/:episodeNumber?" element={<Watch />} />
        <Route path="/:category" element={<CategoryPage />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/waifu" element={<Waifu />} />
        <Route path="/imbd" element={<Imbd />} />
        <Route path="/imbd/:id/:primaryTitle" element={<ImbdPlayer />} />
        {/* Add more routes as needed */}
      </Routes>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <SecurityProvider>
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </Router>
      </SecurityProvider>
  );
};

export default App;

