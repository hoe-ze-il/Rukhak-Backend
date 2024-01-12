export function generateString() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let randomString = "";

  // Generate 4 random letters
  for (let i = 0; i < 4; i++) {
    randomString += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate 4 random numbers
  for (let i = 0; i < 4; i++) {
    randomString += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return randomString;
}
