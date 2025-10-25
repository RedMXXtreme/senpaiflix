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
        <Route path="/watch/:id/:episodeNumber?" element={<Watch />} />
        <Route path="/:category" element={<CategoryPage />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/waifu" element={<Waifu />} />

        {/* Add more routes as needed */}
      </Routes>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </Router>
  );
};

export default App;

