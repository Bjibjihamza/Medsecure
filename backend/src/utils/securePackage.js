import crypto from "crypto";
import fs from "fs";

export function readPemFromPath(p) {
  return fs.readFileSync(p, "utf-8");
}

/**
 * Hybrid encryption:
 * - Encrypt file with AES-256-GCM
 * - Encrypt AES key with recipient RSA public key (OAEP-SHA256)
 * - Sign entire package JSON bytes using Ed25519
 */
export function buildSecurePackage({ fileBuffer, recipientRsaPublicPem, senderEd25519PrivatePem }) {
  // AES-256-GCM
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Wrap AES key with RSA-OAEP-SHA256
  const encAesKey = crypto.publicEncrypt(
    {
      key: recipientRsaPublicPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  );

  const pkg = {
    v: 1,
    alg: {
      file: "AES-256-GCM",
      keywrap: "RSA-OAEP-SHA256",
      sig: "Ed25519",
    },
    iv_b64: iv.toString("base64"),
    tag_b64: tag.toString("base64"),
    enc_key_b64: encAesKey.toString("base64"),
    data_b64: ciphertext.toString("base64"),
  };

  const pkgBytes = Buffer.from(JSON.stringify(pkg), "utf-8");

  // Ed25519 signature (algorithm null for Ed25519)
  const signature = crypto.sign(null, pkgBytes, senderEd25519PrivatePem);

  return {
    packageJson: pkg,
    packageBytes: pkgBytes,
    signatureB64: signature.toString("base64"),
  };
}
