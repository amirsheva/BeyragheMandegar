import { createContext, useContext, useState } from "react";

const BookingContext = createContext();

export function BookingProvider({children}) {
  const [selectedShow, setSelectedShow] = useState(null);

  return (
    <BookingContext.Provider value={{selectedShow, setSelectedShow}}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
