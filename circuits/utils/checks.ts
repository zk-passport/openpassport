export function checkInputs(
  passportNumber: string,
  dateOfBirth: string,
  dateOfExpiry: string,
): boolean {
  if (passportNumber.length !== 9) {
    throw new Error('Passport number must be 9 characters long');
  }
  if (dateOfBirth.length !== 6) {
    throw new Error('Date of birth must be 6 characters long');
  }
  if (dateOfExpiry.length !== 6) {
    throw new Error('Date of expiry must be 6 characters long');
  }
  return true;
}

export function getFirstName(mrzInfo: any): string {
  const firstName = mrzInfo.secondaryIdentifier.split('<')[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}
