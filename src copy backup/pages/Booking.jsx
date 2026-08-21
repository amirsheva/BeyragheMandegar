import BookingFlow from "../components/booking/BookingFlow";
import BookingSummary from "../components/booking/BookingSummary";

export default function Booking() {
  const show = {
    title: "بیرق ماندگار"
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#111] text-white px-6 py-24"
    >
      <div className="max-w-5xl mx-auto space-y-8">

        <h1 className="text-4xl font-black text-[#d4af37]">
          رزرو بلیت
        </h1>

        <BookingSummary show={show} />

        <BookingFlow show={show} />

      </div>
    </main>
  );
}
