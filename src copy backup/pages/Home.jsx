import Header from "../components/layout/Header";
import HeroSection from "../components/home/HeroSection";
import UpcomingPerformances from "../components/home/UpcomingPerformances";
import AboutSection from "../components/home/AboutSection";
import NewsSection from "../components/home/NewsSection";
import ArchiveSection from "../components/home/ArchiveSection";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#111] text-white">
      <Header />

      <main>
        <HeroSection />
        <UpcomingPerformances />
        <AboutSection />
        <NewsSection />
        <ArchiveSection />
      </main>

      <Footer />
    </div>
  );
}
