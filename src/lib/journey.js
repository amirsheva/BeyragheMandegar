export const journeySteps = [
  "Home",
  "Performance",
  "Booking",
  "Reservation"
];

export function getNextStep(step) {
  const index = journeySteps.indexOf(step);
  return journeySteps[index + 1] || null;
}
