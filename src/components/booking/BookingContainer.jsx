import BookingSteps from "./BookingSteps";
import ReservationForm from "./ReservationForm";

export default function BookingContainer({show}) {
  return (
    <div dir="rtl" className="space-y-8">
      <BookingSteps step={2}/>
      <ReservationForm show={show}/>
    </div>
  );
}
