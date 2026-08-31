import { saveItem } from "../../lib/storage";

export default function BookingPersistence({data}) {
  if (data) {
    saveItem("lastBooking", data);
  }

  return null;
}
