import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import MedicalRecord from "../models/MedicalRecord.js";

const router = express.Router();

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Upload record (Phase 1: plain file)
router.post("/", upload.single("recordFile"), async (req, res) => {
  try {
    const { patientUid, uploaderEmail, recordType, note } = req.body;
    if (!patientUid || !uploaderEmail || !recordType) {
      return res.status(400).json({ error: "patientUid, uploaderEmail, recordType required" });
    }
    if (!req.file) return res.status(400).json({ error: "recordFile required" });

    const doc = await MedicalRecord.create({
      patientUid,
      uploaderEmail,
      recordType,
      note: note || "",
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size
    });

    return res.status(201).json(doc);
  } catch (_e) {
    return res.status(500).json({ error: "Server error" });
  }
});

// List records for patientUid
router.get("/", async (req, res) => {
  const { patientUid } = req.query;
  if (!patientUid) return res.status(400).json({ error: "patientUid required" });

  const docs = await MedicalRecord.find({ patientUid }).sort({ createdAt: -1 }).lean();
  return res.json(docs);
});

// Record details
router.get("/:id", async (req, res) => {
  const doc = await MedicalRecord.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json(doc);
});

// Download record file
router.get("/:id/download", async (req, res) => {
  const doc = await MedicalRecord.findById(req.params.id).lean();
  if (!doc) return res.status(404).send("Not found");

  const filePath = path.join(uploadsDir, doc.storedFileName);
  return res.download(filePath, doc.originalFileName);
});

export default router;
