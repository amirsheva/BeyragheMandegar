import useShows from "../../hooks/useShows";

export default function ShowsData({children}) {
  const data = useShows();

  return children(data);
}
