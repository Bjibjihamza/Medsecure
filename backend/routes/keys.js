import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import PublicKey from "../models/PublicKey.js";
import { validatePublicKeyPem } from "../utils/validatePem.js";

const router = express.Router();

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(), // on garde en RAM car on stocke PEM en DB
  limits: { fileSize: 100 * 1024 } // 100KB largement suffisant pour PEM
});

router.post("/", upload.single("pemFile"), async (req, res) => {
  try {
    const { uid, email, role, keyType, pemText } = req.body;

    if (!uid || !email || !role || !keyType) {
      return res.status(400).json({ error: "uid, email, role, keyType required" });
    }

    // PEM peut venir soit du textarea (pemText), soit d’un fichier uploadé (pemFile)
    let publicKeyPem = (pemText || "").trim();

    if (!publicKeyPem && req.file) {
      publicKeyPem = req.file.buffer.toString("utf-8").trim();
    }

    const v = validatePublicKeyPem(publicKeyPem);
    if (!v.ok) return res.status(400).json({ error: v.reason });

    const doc = await PublicKey.findOneAndUpdate(
      { uid },
      {
        uid,
        email: String(email).toLowerCase(),
        role,
        keyType,
        publicKeyPem
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      message: "Public key stored successfully",
      uid: doc.uid,
      id: doc._id
    });
  } catch (e) {
    // erreurs de clés uniques etc
    return res.status(500).json({ error: "Server error", details: String(e.message || e) });
  }
});

router.get("/", async (req, res) => {
  const { uid, email, keyType } = req.query;
  if (!uid && !email) return res.status(400).json({ error: "Provide uid or email" });

  const q = {};
  if (uid) q.uid = uid;
  if (email) q.email = String(email).toLowerCase();
  if (keyType) q.keyType = keyType;

  const docs = await PublicKey.find(q).sort({ createdAt: -1 }).lean();
  return res.json(docs);
});

router.get("/:id/download", async (req, res) => {
  const doc = await PublicKey.findById(req.params.id).lean();
  if (!doc) return res.status(404).send("Not found");

  res.setHeader("Content-Type", "application/x-pem-file");
  res.setHeader("Content-Disposition", `attachment; filename="${doc.uid}_${doc.keyType}_public.pem"`);
  return res.send(doc.publicKeyPem);
});

export default router;
