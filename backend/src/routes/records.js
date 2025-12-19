import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import MedicalRecord from "../models/MedicalRecord.js";
import PublicKey from "../models/PublicKey.js";
import { buildSecurePackage, readPemFromPath } from "../utils/securePackage.js";

const router = express.Router();

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ---------- Fallback file (demo mode) ----------
const DEFAULT_FALLBACK_FILE = path.join(uploadsDir, "default_record.pdf");

function getFallbackFileInfo() {
  if (!fs.existsSync(DEFAULT_FALLBACK_FILE)) return null;
  const stat = fs.statSync(DEFAULT_FALLBACK_FILE);

  return {
    originalname: "default_record.pdf",
    filename: path.basename(DEFAULT_FALLBACK_FILE),
    mimetype: "application/pdf",
    size: stat.size,
    filepath: DEFAULT_FALLBACK_FILE,
    usedFallback: true,
  };
}

// ---------- Multer storage (normal upload) ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// ---------- Transport (Ethereal OR normal SMTP) ----------
async function makeTransport() {
  const nodemailer = (await import("nodemailer")).default;

  // ✅ Ethereal test SMTP (no Google needed)
  if (String(process.env.USE_ETHEREAL || "false") === "true") {
    const testAcc = await nodemailer.createTestAccount();
    const transport = nodemailer.createTransport({
      host: testAcc.smtp.host,
      port: testAcc.smtp.port,
      secure: testAcc.smtp.secure,
      auth: { user: testAcc.user, pass: testAcc.pass },
    });
    return { transport, mode: "ethereal", nodemailer, testAcc };
  }

  // Normal SMTP (Gmail etc.)
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  return { transport, mode: "smtp", nodemailer, testAcc: null };
}

/**
 * Auto-send secure package to patient:
 * - Find patient's RSA public key in DB (by uid OR email) with keyType=RSA
 * - Encrypt+sign the uploaded file
 * - Send email with attachments
 * - For Ethereal, return preview URL for screenshots
 */
async function autoSendToPatient({ rec, fileBuffer }) {
  const patientUid = String(rec.patientUid || "").trim();
  if (!patientUid) return { ok: false, error: "Missing patientUid in record" };

  // Find patient's RSA public key
  const q = patientUid.includes("@")
    ? { email: patientUid.toLowerCase(), keyType: "RSA" }
    : { uid: patientUid, keyType: "RSA" };

  const patientKey = await PublicKey.findOne(q).lean();
  if (!patientKey) return { ok: false, error: "Patient RSA public key not found in DB" };

  // Sender Ed25519 keys (server signing identity)
  const privPath = process.env.SENDER_ED25519_PRIVATE_PEM_PATH;
  const pubPath = process.env.SENDER_ED25519_PUBLIC_PEM_PATH;
  if (!privPath || !pubPath) return { ok: false, error: "Missing sender Ed25519 PEM env paths" };

  const senderPrivPem = readPemFromPath(privPath);
  const senderPubPem = readPemFromPath(pubPath);

  // Encrypt + sign
  const { packageBytes, signatureB64 } = buildSecurePackage({
    fileBuffer,
    recipientRsaPublicPem: patientKey.publicKeyPem,
    senderEd25519PrivatePem: senderPrivPem,
  });

  // Recipient email (from DB)
  const toEmail = String(patientKey.email || "").trim();
  if (!toEmail.includes("@")) return { ok: false, error: "Patient email missing/invalid in DB" };

  const subject = `MedSecure — Encrypted record (${rec.recordType}) for ${rec.patientUid}`;
  const text =
    `Hi,\n\n` +
    `A new medical record has been securely sent to you.\n` +
    `Attachments: encrypted package + signature + sender public key.\n\n` +
    `MedSecure`;

  const attachments = [
    {
      filename: `record_${rec._id}.package.json`,
      content: packageBytes,
      contentType: "application/json",
    },
    {
      filename: `record_${rec._id}.signature.b64.txt`,
      content: signatureB64,
      contentType: "text/plain",
    },
    {
      filename: `sender_ed25519_public.pem`,
      content: senderPubPem,
      contentType: "application/x-pem-file",
    },
  ];

  // Send
  const { transport, mode, nodemailer, testAcc } = await makeTransport();

  const info = await transport.sendMail({
    from: process.env.MAIL_FROM || "MedSecure <no-reply@medsecure.local>",
    to: toEmail,
    subject,
    text,
    attachments,
  });

  // Ethereal preview link (great for TP screenshots)
  let previewUrl = null;
  if (mode === "ethereal") {
    previewUrl = nodemailer.getTestMessageUrl(info);
  }

  return {
    ok: true,
    to: toEmail,
    signatureB64,
    mode,
    previewUrl,
    etherealUser: testAcc?.user || null,
  };
}

// =========================================================
// POST /api/records
// - Accepts file upload OR fallback file
// - Saves record metadata
// - Auto-sends encrypted package if enabled
// =========================================================
router.post("/", upload.single("recordFile"), async (req, res) => {
  try {
    const { patientUid, uploaderEmail, recordType, note } = req.body;

    if (!patientUid || !uploaderEmail || !recordType) {
      return res.status(400).json({ error: "patientUid, uploaderEmail, recordType required" });
    }

    // ✅ accept file OR fallback
    let fileInfo = null;

    if (req.file) {
      fileInfo = {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filepath: path.join(uploadsDir, req.file.filename),
        usedFallback: false,
      };
    } else {
      const fb = getFallbackFileInfo();
      if (!fb) {
        return res.status(400).json({
          error: "recordFile required (and fallback file missing)",
          hint: "Put backend/uploads/default_record.pdf",
        });
      }
      fileInfo = fb;
    }

    // Save record metadata
    const doc = await MedicalRecord.create({
      patientUid,
      uploaderEmail,
      recordType,
      note: note || "",
      originalFileName: fileInfo.originalname,
      storedFileName: fileInfo.filename,
      mimeType: fileInfo.mimetype,
      sizeBytes: fileInfo.size,
    });

    // Auto-send?
    const autoEnabled = String(process.env.AUTO_SEND_ON_UPLOAD || "false") === "true";

    if (autoEnabled) {
      try {
        const fileBuffer = fs.readFileSync(fileInfo.filepath);

        const sendResult = await autoSendToPatient({ rec: doc, fileBuffer });

        if (sendResult.ok) {
          await MedicalRecord.findByIdAndUpdate(doc._id, {
            isEncrypted: true,
            signatureBase64: sendResult.signatureB64,
          });
        }

        return res.status(201).json({
          ...doc.toObject(),
          usedFallback: fileInfo.usedFallback,
          autoSend: sendResult,
        });
      } catch (e) {
        return res.status(201).json({
          ...doc.toObject(),
          usedFallback: fileInfo.usedFallback,
          autoSend: { ok: false, error: String(e?.message || e) },
        });
      }
    }

    return res.status(201).json({ ...doc.toObject(), usedFallback: fileInfo.usedFallback });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e?.message || e) });
  }
});

// =========================================================
// GET /api/records?patientUid=...
// =========================================================
router.get("/", async (req, res) => {
  const { patientUid } = req.query;
  if (!patientUid) return res.status(400).json({ error: "patientUid required" });

  const docs = await MedicalRecord.find({ patientUid }).sort({ createdAt: -1 }).lean();
  return res.json(docs);
});

// =========================================================
// GET /api/records/:id
// =========================================================
router.get("/:id", async (req, res) => {
  const doc = await MedicalRecord.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  return res.json(doc);
});

// =========================================================
// GET /api/records/:id/download
// =========================================================
router.get("/:id/download", async (req, res) => {
  const doc = await MedicalRecord.findById(req.params.id).lean();
  if (!doc) return res.status(404).send("Not found");

  const filePath = path.join(uploadsDir, doc.storedFileName);
  return res.download(filePath, doc.originalFileName);
});

export default router;
