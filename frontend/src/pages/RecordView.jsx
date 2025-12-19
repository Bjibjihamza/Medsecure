import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRecord, downloadRecord, sendSecure } from "../api.js";

export default function RecordView() {
  const { id } = useParams();
  const [rec, setRec] = useState(null);
  const [resp, setResp] = useState(null);

  const [recipientUidOrEmail, setRecipientUidOrEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getRecord(id).then(setRec);
  }, [id]);

  if (!rec) return <div>Loading...</div>;
  if (rec.error) return <div>Error: {rec.error}</div>;

  async function onSend() {
    setResp(null);
    const q = recipientUidOrEmail.trim();
    const mail = recipientEmail.trim();

    if (!q) return setResp({ error: "Recipient UID/Email required" });
    if (!mail.includes("@")) return setResp({ error: "Recipient mailbox invalid" });

    try {
      setSending(true);
      const r = await sendSecure(rec._id, q, mail);
      setResp(r);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h2>Record Details</h2>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <div><b>Patient UID:</b> {rec.patientUid}</div>
        <div><b>Uploader:</b> {rec.uploaderEmail}</div>
        <div><b>Type:</b> {rec.recordType}</div>
        <div><b>Note:</b> {rec.note || "-"}</div>
        <div><b>File:</b> {rec.originalFileName}</div>
        <div><b>Encrypted:</b> {String(rec.isEncrypted)}</div>

        <button onClick={() => downloadRecord(rec._id)} style={{ marginTop: 10 }}>
          Download File
        </button>
      </div>

      <div style={{ marginTop: 16, border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <h3>Phase 3 — Send Secure Email</h3>

        <div style={{ marginBottom: 8 }}>
          <label>Recipient UID or Email (to find RSA key in DB)</label>
          <input
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            value={recipientUidOrEmail}
            onChange={(e) => setRecipientUidOrEmail(e.target.value)}
            placeholder="e.g. Bjibjihamza or receiver@gmail.com"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Recipient mailbox (where to send)</label>
          <input
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="e.g. receiver@gmail.com"
          />
        </div>

        <button onClick={onSend} disabled={sending}>
          {sending ? "Sending..." : "Send Secure Email"}
        </button>

        {resp && (
          <pre style={{ marginTop: 10, background: "#111", color: "#eee", padding: 10 }}>
            {JSON.stringify(resp, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
