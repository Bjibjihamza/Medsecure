import express from "express";
import multer from "multer";
import PublicKey from "../models/PublicKey.js";
import { validatePublicKeyPem } from "../utils/validatePem.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 } });

router.post("/", upload.single("pemFile"), async (req, res) => {
  try {
    const { uid, email, role, keyType, publicKeyPem } = req.body;

    let pem = (publicKeyPem || "").trim();
    if (!pem && req.file?.buffer) pem = req.file.buffer.toString("utf-8").trim();

    if (!uid || !email || !role || !keyType) {
      return res.status(400).json({ error: "uid, email, role, keyType are required" });
    }

    const v = validatePublicKeyPem(pem);
    if (!v.ok) return res.status(400).json({ error: v.reason });

    const doc = await PublicKey.create({ uid, email, role, keyType, publicKeyPem: pem });
    return res.status(201).json(doc);
  } catch (e) {
    const msg = e?.code === 11000 ? "Duplicate uid or (email,keyType)" : "Server error";
    return res.status(400).json({ error: msg });
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
