import { useState } from "react";
import ReservationForm from "./ReservationForm";
import ReservationResult from "./ReservationResult";

export default function BookingFlow() {
  const [result, setResult] = useState(null);

  return (
    <div dir="rtl" className="space-y-6">
      {!result && <ReservationForm onSuccess={setResult} />}
      {result && <ReservationResult success reservation={result} />}
    </div>
  );
}
