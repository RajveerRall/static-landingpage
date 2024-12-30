require('dotenv').config();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("Missing AWS credentials in .env");
  process.exit(1);
}

console.log("Environment variables loaded successfully!");
