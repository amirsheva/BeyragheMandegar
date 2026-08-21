import PerformanceRouteLink from "../performance/PerformanceRouteLink";

export default function HomeNavigationFlow({show}) {
  if (!show) return null;

  return <PerformanceRouteLink id={show.id} />;
}
