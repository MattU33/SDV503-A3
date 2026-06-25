import readline from 'readline';
import fs from 'fs';
import { validateName, validateInteger, validateDate } from './validation.js';
import { checkCapacityForDates, generateDatesForStay } from './capacity.js';

export const HUTS = [
  { id: "hut-01", name: "Mintaro Hut", walk: "Milford Track", capacity: 40 },
  { id: "hut-02", name: "Clinton Hut", walk: "Milford Track", capacity: 40 },
  { id: "hut-03", name: "Luxmore Hut", walk: "Kepler Track", capacity: 50 },
  { id: "hut-04", name: "Routeburn Falls Hut", walk: "Routeburn Track", capacity: 48 }
];

const FOLDER_PATH = "./data";
const FILE_PATH = "./data/bookings.json";

const state = {
  huts: HUTS,
  bookings: []
};

// Safe data file loading - runs when the application turns on
function loadBookings() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      if (!fs.existsSync(FOLDER_PATH)) {
        fs.mkdirSync(FOLDER_PATH, { recursive: true });
      }
      fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.log("Could not load data file cleanly. Starting fresh.");
    return [];
  }
}

// Saves data whenever changes are finalized
function saveBookings(updatedBookings) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(updatedBookings, null, 2), 'utf8');
  } catch (e) {
    console.log("Error saving changes to disk.");
  }
}

// Initialize application state
state.bookings = loadBookings();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function mainMenu() {
  while (true) {
    console.log("\n=== DOC GREAT WALKS HUT BOOKING MANAGER ===");
    console.log("1. Record a New Booking");
    console.log("2. View Occupancy for a Hut and Date");
    console.log("3. Cancel an Existing Booking");
    console.log("4. View Hut Occupancy Summary Report");
    console.log("5. Exit Application");
    
    const choice = (await askQuestion("Select menu option (1-5): ")).trim();

    if (choice === "1") {
      await handleCreateBooking();
    } else if (choice === "2") {
      await handleViewOccupancy();
    } else if (choice === "3") {
      await handleCancelBooking();
    } else if (choice === "4") {
      handleViewSummary();
    } else if (choice === "5") {
      console.log("Exiting system. Goodbye.");
      rl.close();
      break;
    } else {
      console.log("Invalid option selection. Please enter a choice between 1 and 5.");
    }
  }
}

async function handleCreateBooking() {
  console.log("\n--- RECORD NEW BOOKING ---");
  
  const name = await askQuestion("Enter main tramper name: ");
  const nameErr = validateName(name);
  if (nameErr) return console.log(nameErr);

  console.log("\nAvailable Backcountry Huts:");
  HUTS.forEach(h => console.log(`  [${h.id}] ${h.name} (${h.walk}) - Max Cap: ${h.capacity}`));
  const hutId = (await askQuestion("Enter targeted Hut ID: ")).trim();
  const targetHut = HUTS.find(h => h.id === hutId);
  if (!targetHut) return console.log("Error: Booking failed. Chosen hut does not exist.");

  const dateStr = (await askQuestion("Enter arrival calendar date (YYYY-MM-DD): ")).trim();
  const dateErr = validateDate(dateStr);
  if (dateErr) return console.log(dateErr);

  const nightsStr = (await askQuestion("Enter total length of stay (number of nights): ")).trim();
  const nightsErr = validateInteger(nightsStr, "Nights count");
  if (nightsErr) return console.log(nightsErr);
  const nights = parseInt(nightsStr, 10);

  const partyStr = (await askQuestion("Enter headcount / party size: ")).trim();
  const partyErr = validateInteger(partyStr, "Party size");
  if (partyErr) return console.log(partyErr);
  const partySize = parseInt(partyStr, 10);

  const capacityCheck = checkCapacityForDates(hutId, dateStr, nights, partySize, state.bookings);
  if (!capacityCheck.allowed) {
    console.log(`\n[REJECTED]: Cannot accommodate booking.`);
    console.log(`Date failing capacity threshold: ${capacityCheck.errorDate}`);
    console.log(`Bunks remaining: ${(capacityCheck.maxCapacity ?? 0) - (capacityCheck.currentOccupancy ?? 0)}. Attempted to load: ${partySize}.`);
    return;
  }

  const newBooking = {
    id: `bk-${Date.now()}`,
    tramperName: name.trim(),
    hutId,
    arrivalDate: dateStr,
    nights,
    partySize
  };

  state.bookings.push(newBooking);
  saveBookings(state.bookings);
  console.log(`\n[SUCCESS]: Booking recorded under reference key: ${newBooking.id}`);
}

async function handleViewOccupancy() {
  console.log("\n--- VIEW OCCUPANCY PER NIGHT ---");
  HUTS.forEach(h => console.log(`  [${h.id}] ${h.name}`));
  const hutId = (await askQuestion("Enter Hut ID: ")).trim();
  const hut = HUTS.find(h => h.id === hutId);
  if (!hut) return console.log("Error: Target hut does not exist.");

  const dateStr = (await askQuestion("Enter query calendar date (YYYY-MM-DD): ")).trim();

  let bookedCount = 0;
  console.log(`\nActive rosters for ${hut.name} on evening of ${dateStr}:`);
  
  state.bookings.forEach(b => {
    if (b.hutId === hutId) {
      const activeDates = generateDatesForStay(b.arrivalDate, b.nights);
      if (activeDates.includes(dateStr)) {
        console.log(`  - Tramper: ${b.tramperName} | Party Size: ${b.partySize} (Ref: ${b.id})`);
        bookedCount += b.partySize;
      }
    }
  });

  console.log(`\nAggregate occupied bunks: ${bookedCount} / ${hut.capacity}`);
  console.log(`Remaining bunk availability: ${hut.capacity - bookedCount}`);
}

async function handleCancelBooking() {
  console.log("\n--- CANCEL ACTIVE BOOKING ---");
  const targetId = (await askQuestion("Enter unique booking identifier string to drop: ")).trim();
  
  const initialCount = state.bookings.length;
  state.bookings = state.bookings.filter(b => b.id !== targetId);

  if (state.bookings.length === initialCount) {
    console.log(`\n[ABORTED]: No booking registry matches the ID: "${targetId}".`);
  } else {
    saveBookings(state.bookings);
    console.log("\n[SUCCESS]: Booking cancelled instantly. Freed bunks restored.");
  }
}

function handleViewSummary() {
  console.log("\n--- HUT OCCUPANCY STATISTICS SUMMARY ---");
  HUTS.forEach(hut => {
    let bookingsCount = 0;
    let totalBedNights = 0;

    for (const b of state.bookings) {
      if (b.hutId === hut.id) {
        bookingsCount += 1;
        totalBedNights += (b.nights * b.partySize);
      }
    }

    console.log(`\n Hut: ${hut.name} [${hut.walk}]`);
    console.log(`  -> Total distinct group ledger registries: ${bookingsCount}`);
    console.log(`  -> Accumulated unit bed-nights allocated: ${totalBedNights}`);
  });
}

mainMenu();