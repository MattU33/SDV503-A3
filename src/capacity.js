import { HUTS } from './index.js';

// Breaks down a stay into individual dates
export function generateDatesForStay(arrivalStr, nights) {
  const dates = [];
  const baseDate = new Date(arrivalStr);
  
  for (let i = 0; i < nights; i++) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + i);
    dates.push(nextDate.toISOString().split('T')[0]);
  }
  return dates;
}

// Counts up existing bookings night-by-night to see if a new group fits
export function checkCapacityForDates(hutId, arrivalStr, nights, requestedParty, currentBookings) {
  const hut = HUTS.find(h => h.id === hutId);
  if (!hut) return { allowed: false, errorDate: "Invalid Hut" };

  const stayDates = generateDatesForStay(arrivalStr, nights);

  // Check each individual night of the stay
  for (const date of stayDates) {
    let activeOccupancy = 0;

    // Loop through existing bookings to find overlaps on this specific date
    for (const b of currentBookings) {
      if (b.hutId === hutId) {
        const activeDates = generateDatesForStay(b.arrivalDate, b.nights);
        if (activeDates.includes(date)) {
          activeOccupancy += b.partySize;
        }
      }
    }

    // If a single night overflows, reject the whole booking right away
    if (activeOccupancy + requestedParty > hut.capacity) {
      return { 
        allowed: false, 
        errorDate: date, 
        currentOccupancy: activeOccupancy, 
        maxCapacity: hut.capacity 
      };
    }
  }

  return { allowed: true };
}