import express from "express";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

import MedicalRecord from "../models/MedicalRecord.js";
import PublicKey from "../models/PublicKey.js";
import { buildSecurePackage, readPemFromPath } from "../utils/securePackage.js";

const router = express.Router();
const uploadsDir = path.resolve("uploads");

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

router.post("/", async (req, res) => {
  try {
    const { recordId, recipientUidOrEmail, recipientEmail } = req.body;

    if (!recordId || !recipientUidOrEmail || !recipientEmail) {
      return res
        .status(400)
        .json({ error: "recordId, recipientUidOrEmail, recipientEmail required" });
    }

    // 1) Find record
    const rec = await MedicalRecord.findById(recordId).lean();
    if (!rec) return res.status(404).json({ error: "Record not found" });

    // 2) Read file from /uploads
    const filePath = path.join(uploadsDir, rec.storedFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Uploaded file missing on server" });
    }
    const fileBuffer = fs.readFileSync(filePath);

    // 3) Find recipient RSA public key in DB (by uid OR email), keyType=RSA
    const q = recipientUidOrEmail.includes("@")
      ? { email: recipientUidOrEmail.toLowerCase(), keyType: "RSA" }
      : { uid: recipientUidOrEmail, keyType: "RSA" };

    const recipientKey = await PublicKey.findOne(q).lean();
    if (!recipientKey) {
      return res.status(404).json({ error: "Recipient RSA public key not found in DB" });
    }

    // 4) Load sender Ed25519 private/public
    const privPath = process.env.SENDER_ED25519_PRIVATE_PEM_PATH;
    const pubPath = process.env.SENDER_ED25519_PUBLIC_PEM_PATH;
    if (!privPath || !pubPath) {
      return res.status(500).json({ error: "Missing sender Ed25519 PEM env paths" });
    }

    const senderPrivPem = readPemFromPath(privPath);
    const senderPubPem = readPemFromPath(pubPath);

    // 5) Build encrypted + signed package
    const { packageBytes, signatureB64 } = buildSecurePackage({
      fileBuffer,
      recipientRsaPublicPem: recipientKey.publicKeyPem,
      senderEd25519PrivatePem: senderPrivPem,
    });

    // 6) Send mail with attachments
    const transport = makeTransport();

    const subject = `MedSecure — Encrypted record (${rec.recordType}) for patient ${rec.patientUid}`;
    const text =
      `Hi,\n\n` +
      `Attached: encrypted package + signature.\n` +
      `Receiver must: verify signature using sender Ed25519 public key, decrypt AES key using RSA private key, decrypt file using AES-GCM.\n\n` +
      `Sender Ed25519 public key (PEM) is attached.\n\n` +
      `MedSecure`;

    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject,
      text,
      attachments: [
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
      ],
    });

    // (optional) mark record as encrypted / store signature
    await MedicalRecord.findByIdAndUpdate(rec._id, {
      isEncrypted: true,
      signatureBase64: signatureB64,
    });

    return res.json({ ok: true, message: "Secure email sent", recordId: rec._id });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e?.message || e) });
  }
});

export default router;
