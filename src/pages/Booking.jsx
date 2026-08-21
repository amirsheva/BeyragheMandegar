import BookingHeader from "../components/booking/BookingHeader";
import BookingSteps from "../components/booking/BookingSteps";
import ReservationForm from "../components/booking/ReservationForm";

export default function Booking() {
  return (
    <div className="space-y-8 p-6">
      <BookingHeader />
      <BookingSteps step={1}/>
      <ReservationForm />
    </div>
  );
}
