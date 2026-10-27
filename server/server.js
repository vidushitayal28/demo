import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`FLEXI Mood Tracker API running at http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Could not start backend:", error.message);
  console.error("Check that MongoDB is running and server/.env has a valid MONGODB_URI.");
  process.exit(1);
}
