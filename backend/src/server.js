import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import keysRouter from "./routes/keys.js";
import recordsRouter from "./routes/records.js";

import shareRouter from "./routes/share.js";



dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: false
}));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/keys", keysRouter);
app.use("/api/records", recordsRouter);
app.use("/api/share", shareRouter);

const port = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => console.log(`✅ API running on http://localhost:${port}`));
  })
  .catch((e) => {
    console.error("❌ DB connection failed", e);
    process.exit(1);
  });
