// This script tests if the private key can be parsed correctly
require('dotenv').config();

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

console.log("Raw key length:", privateKey.length);
console.log("Raw key first 50 chars:", privateKey.substring(0, 50));
console.log("Raw key last 50 chars:", privateKey.substring(privateKey.length - 50));

// Remove quotes
let key = privateKey;
if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
  key = key.slice(1, -1);
}

console.log("\nAfter quote removal:");
console.log("Key length:", key.length);
console.log("First 50 chars:", key.substring(0, 50));
console.log("Last 50 chars:", key.substring(key.length - 50));

// Handle escaped newlines
key = key.replace(/\\\\n/g, "\n");
key = key.replace(/\\n/g, "\n");

console.log("\nAfter newline conversion:");
console.log("Key length:", key.length);
console.log("Number of lines:", key.split("\n").length);
console.log("First 100 chars:");
console.log(key.substring(0, 100));
console.log("\nLast 100 chars:");
console.log(key.substring(key.length - 100));

console.log("\nValidation:");
console.log("Has BEGIN marker:", key.includes("BEGIN PRIVATE KEY"));
console.log("Has END marker:", key.includes("END PRIVATE KEY"));

// Try to validate PEM format
const lines = key.split("\n");
console.log("Total lines:", lines.length);
console.log("First line:", lines[0]);
console.log("Last line:", lines[lines.length - 1]);

// Check if all lines are present and valid
const beginIdx = key.indexOf("BEGIN PRIVATE KEY");
const endIdx = key.indexOf("END PRIVATE KEY");
console.log("BEGIN index:", beginIdx);
console.log("END index:", endIdx);
console.log("Key content between markers length:", endIdx - beginIdx);
