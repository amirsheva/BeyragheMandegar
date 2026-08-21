import { useParams } from "react-router-dom";
import PerformanceHero from "../components/performance/PerformanceHero";
import PerformanceInfo from "../components/performance/PerformanceInfo";
import PerformanceMeta from "../components/performance/PerformanceMeta";
import PerformanceGallery from "../components/performance/PerformanceGallery";
import PerformanceActions from "../components/performance/PerformanceActions";

export default function Performance() {
  const {id} = useParams();

  const show = { id };

  return (
    <div className="space-y-8 p-6">
      <PerformanceHero show={show}/>
      <PerformanceInfo show={show}/>
      <PerformanceMeta show={show}/>
      <PerformanceGallery />
      <PerformanceActions id={id}/>
    </div>
  );
}
