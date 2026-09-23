// Format date into YYYYMMDD string format
function formatDatePart(currentDate: Date): string {
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const currentDay = currentDate.getDate().toString().padStart(2, "0");
  return `${currentYear}${currentMonth}${currentDay}`;
}

// Generate random uppercase alphanumeric 4-character suffix
function generateRandomSuffix(): string {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomResult = "";
  for (let characterIndex = 0; characterIndex < 4; characterIndex++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomResult += characters.charAt(randomIndex);
  }
  return randomResult;
}

// Generate unique LPN code matching format LPN-YYYYMMDD-XXXX
export function createLpnCode(referenceDate = new Date()): string {
  const dateSegment = formatDatePart(referenceDate);
  const randomSegment = generateRandomSuffix();
  return `LPN-${dateSegment}-${randomSegment}`;
}

// Validate whether a string conforms to LPN code format
export function validateLpnCode(targetCode: string): boolean {
  const lpnPattern = /^LPN-\d{8}-[A-Z0-9]{4}$/;
  return lpnPattern.test(targetCode);
}
