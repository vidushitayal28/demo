import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import moodRoutes from "./routes/moodRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ]
}));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "FLEXI Mood Tracker API",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
