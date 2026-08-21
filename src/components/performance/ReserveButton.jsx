import { useNavigate } from "react-router-dom";
import { useBooking } from "../booking/BookingContext";

export default function ReserveButton({show}) {
  const navigate = useNavigate();
  const {setSelectedShow} = useBooking();

  function reserve() {
    setSelectedShow(show);
    navigate("/booking");
  }

  return (
    <button
      onClick={reserve}
      className="bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold"
    >
      رزرو این اجرا
    </button>
  );
}
