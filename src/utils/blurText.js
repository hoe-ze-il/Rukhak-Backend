// Function to apply blur effect to text
function blurText(text) {
  if (text.length > 0) {
    // Replace all characters except the first one with '*'
    return text.slice(0, 3) + "*".repeat(text.length - 3);
  } else {
    return text; // Handle empty strings or single character strings as needed
  }
}

export default blurText;
