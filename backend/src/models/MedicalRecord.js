import mongoose from "mongoose";

const MedicalRecordSchema = new mongoose.Schema(
  {
    patientUid: { type: String, required: true, trim: true },
    uploaderEmail: { type: String, required: true, lowercase: true, trim: true },
    recordType: { type: String, required: true, trim: true },
    note: { type: String, default: "" },

    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },

    // Phase 3 (future)
    isEncrypted: { type: Boolean, default: false },
    signatureBase64: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("MedicalRecord", MedicalRecordSchema);
