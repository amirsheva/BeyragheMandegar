import ShowsData from "./ShowsData";
import ShowsGrid from "./ShowsGrid";
import LoadingState from "../common/LoadingState";
import ErrorState from "../common/ErrorState";

export default function HomeShowsSection() {
  return (
    <ShowsData>
      {({shows, loading, error}) => {
        if (loading) return <LoadingState />;
        if (error) return <ErrorState message={error} />;

        return <ShowsGrid shows={shows} />;
      }}
    </ShowsData>
  );
}
