import dayjs from "dayjs";
import jalaliday from "jalaliday";
dayjs.extend(jalaliday);

export function toPersianFullDate(dateStr) {
  return dayjs(dateStr)
    .calendar("jalali")
    .locale("fa")
    .format("dddd D MMMM YYYY");
}