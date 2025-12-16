import mongoose from "mongoose";

const PublicKeySchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true, enum: ["PATIENT", "DOCTOR", "ADMIN"] },
    keyType: { type: String, required: true, enum: ["RSA", "ED25519"] },
    publicKeyPem: { type: String, required: true }
  },
  { timestamps: true }
);

PublicKeySchema.index({ email: 1, keyType: 1 }, { unique: true });

export default mongoose.model("PublicKey", PublicKeySchema);
