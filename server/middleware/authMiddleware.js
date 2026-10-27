import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Please sign in to continue." });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Authentication is not configured on the server." });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email");
    if (!user) return res.status(401).json({ message: "Your session is no longer valid. Please sign in again." });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    next(error);
  }
}
