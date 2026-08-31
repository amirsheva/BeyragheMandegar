import HeroSection from "../components/home/HeroSection";
import StatsSection from "../components/home/StatsSection";
import UpcomingPerformances from "../components/home/UpcomingPerformances";
import AboutSection from "../components/home/AboutSection";
import NewsSection from "../components/home/NewsSection";
import ArchiveSection from "../components/home/ArchiveSection";
import HomeFooterCTA from "../components/home/HomeFooterCTA";

import "./home.css";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <UpcomingPerformances />
      <AboutSection />
      <NewsSection />
      <ArchiveSection />
      <HomeFooterCTA />
    </>
  );
}
