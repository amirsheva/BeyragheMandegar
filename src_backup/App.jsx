import { useEffect, useState } from "react";
import Home from "./pages/Home";
import PersonalInfoModal from "./components/common/PersonalInfoModal";

export default function App() {
  const [shows, setShows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/shows")
      .then((res) => res.json())
      .then(setShows)
      .catch(() => {});
  }, []);

  return (
    <>
      <Home />

      <PersonalInfoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onNext={() => setModalOpen(false)}
      />
    </>
  );
}
