// Simple checks to make sure user data is typed correctly
export function validateName(name) {
  if (!name || name.trim().length === 0) {
    return "Error: Tramper name cannot be blank.";
  }
  return null;
}

export function validateInteger(value, fieldName) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return `Error: ${fieldName} must be a positive whole integer.`;
  }
  return null;
}

export function validateDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return "Error: Date must follow the format YYYY-MM-DD.";
  }

  const inputDate = new Date(dateString);
  if (isNaN(inputDate.getTime())) {
    return "Error: The entry does not resolve to a valid calendar day.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    return "Error: Booking dates cannot reside in the past.";
  }

  return null;
}