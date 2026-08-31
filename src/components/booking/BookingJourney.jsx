import BookingHeader from "./BookingHeader";
import ReservationForm from "./ReservationForm";
import BookingReview from "./BookingReview";

export default function BookingJourney({data}) {
  return (
    <div dir="rtl" className="space-y-6">
      <BookingHeader />
      <ReservationForm />
      <BookingReview data={data} />
    </div>
  );
}
