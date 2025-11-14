import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Navbar from "./components/Navbar";
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
import SatoruEpisodePlayer from "./components/text";
import TestTitles from "./components/test";

const AppContent = () => {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" ? null : <Navbar />}
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/anime/:id" element={<AnimeDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/random" element={<Random />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/waifu" element={<Waifu />} />
        <Route path="/:category" element={<CategoryPage />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/satoru/:listId?" element={<SatoruEpisodePlayer />} />
        <Route path="/hindi" element={<TestTitles />} />

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

