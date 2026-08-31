export const SHOWS = [
  {
    id: "b1",
    title: "نمایش ویژهٔ بیرق ماندگار",
    description: "یک اثر نمایشی با اجرای محدود",
    showtimes: [
      { id: "d1", date: "2025-11-01", time: "18:30", capacity: 40, price: 250000 },
      { id: "d2", date: "2025-11-02", time: "18:30", capacity: 40, price: 250000 },
      { id: "d3", date: "2025-11-03", time: "18:30", capacity: 40, price: 250000 },
      { id: "d4", date: "2025-11-04", time: "18:30", capacity: 40, price: 250000 },
      { id: "d5", date: "2025-11-05", time: "18:30", capacity: 40, price: 250000 },
      { id: "d6", date: "2025-11-06", time: "18:30", capacity: 40, price: 250000 },
    ],
  },
];
export function toPersianDigits(str) {
  return String(str).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}