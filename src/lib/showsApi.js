import { getShows } from "./api";

export async function fetchShows() {
  return getShows();
}
