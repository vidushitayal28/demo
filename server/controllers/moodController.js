import mongoose from "mongoose";
import Mood from "../models/Mood.js";

const MOODS = ["Happy", "Excited", "Calm", "Neutral", "Sad", "Anxious", "Angry"];

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((tag) => String(tag).trim().slice(0, 30)).filter(Boolean))].slice(0, 8);
}

export async function createMood(req, res, next) {
  try {
    const { mood, intensity = 3, note = "", tags = [], createdAt } = req.body;
    if (!MOODS.includes(mood)) {
      return res.status(400).json({ message: "Please choose a valid mood." });
    }

    const parsedIntensity = Number(intensity);
    if (!Number.isInteger(parsedIntensity) || parsedIntensity < 1 || parsedIntensity > 5) {
      return res.status(400).json({ message: "Intensity must be a number from 1 to 5." });
    }

    const entry = await Mood.create({
      userId: req.user._id,
      mood,
      intensity: parsedIntensity,
      note: String(note).trim().slice(0, 1000),
      tags: cleanTags(tags),
      ...(createdAt ? { createdAt: new Date(createdAt) } : {})
    });

    res.status(201).json({ message: "Mood saved successfully.", mood: entry });
  } catch (error) {
    next(error);
  }
}

export async function getMoods(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    const filter = { userId: req.user._id };
    if (req.query.mood && MOODS.includes(req.query.mood)) filter.mood = req.query.mood;

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const moods = await Mood.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ moods, count: moods.length });
  } catch (error) {
    next(error);
  }
}

export async function getMoodById(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid mood entry ID." });
    }
    const mood = await Mood.findOne({ _id: req.params.id, userId: req.user._id });
    if (!mood) return res.status(404).json({ message: "Mood entry not found." });
    res.json({ mood });
  } catch (error) {
    next(error);
  }
}

export async function updateMood(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid mood entry ID." });
    }

    const updates = {};
    if (req.body.mood !== undefined) {
      if (!MOODS.includes(req.body.mood)) return res.status(400).json({ message: "Please choose a valid mood." });
      updates.mood = req.body.mood;
    }
    if (req.body.intensity !== undefined) {
      const intensity = Number(req.body.intensity);
      if (!Number.isInteger(intensity) || intensity < 1 || intensity > 5) {
        return res.status(400).json({ message: "Intensity must be a number from 1 to 5." });
      }
      updates.intensity = intensity;
    }
    if (req.body.note !== undefined) updates.note = String(req.body.note).trim().slice(0, 1000);
    if (req.body.tags !== undefined) updates.tags = cleanTags(req.body.tags);

    const mood = await Mood.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, {
      new: true,
      runValidators: true
    });
    if (!mood) return res.status(404).json({ message: "Mood entry not found." });
    res.json({ message: "Mood updated successfully.", mood });
  } catch (error) {
    next(error);
  }
}

export async function deleteMood(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid mood entry ID." });
    }
    const mood = await Mood.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!mood) return res.status(404).json({ message: "Mood entry not found." });
    res.json({ message: "Mood entry deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function getWeeklyAnalytics(req, res, next) {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const entries = await Mood.find({ userId: req.user._id, createdAt: { $gte: start, $lte: now } }).lean();
    const moodCounts = {};
    let totalIntensity = 0;

    for (const entry of entries) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      totalIntensity += entry.intensity;
    }

    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dayEntries = entries.filter((entry) => {
        const date = new Date(entry.createdAt);
        return date >= day && date < nextDay;
      });
      const average = dayEntries.length
        ? dayEntries.reduce((sum, entry) => sum + entry.intensity, 0) / dayEntries.length
        : 0;
      return {
        date: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString("en", { weekday: "short" }),
        count: dayEntries.length,
        averageIntensity: Number(average.toFixed(1))
      };
    });

    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    res.json({
      totalEntries: entries.length,
      averageIntensity: entries.length ? Number((totalIntensity / entries.length).toFixed(1)) : 0,
      topMood,
      moodCounts,
      days
    });
  } catch (error) {
    next(error);
  }
}
