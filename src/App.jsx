import {
  Routes,
  Route,
} from "react-router-dom";

import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import Performance from "./pages/Performance";
import Booking from "./pages/Booking";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Ticket from "./pages/Ticket";
import NotFound from "./components/common/NotFound";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/performance/:id"
          element={<Performance />}
        />

        <Route
          path="/booking"
          element={<Booking />}
        />

        <Route
          path="/news"
          element={<News />}
        />

        <Route
          path="/news/:slug"
          element={<NewsDetail />}
        />

        <Route
          path="/ticket/:trackingCode"
          element={<Ticket />}
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </AppShell>
  );
}
