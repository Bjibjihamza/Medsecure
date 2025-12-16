import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getRecord, downloadRecord } from "../api.js";

export default function RecordView() {
  const { id } = useParams();
  const [rec, setRec] = useState(null);

  useEffect(() => {
    getRecord(id).then(setRec);
  }, [id]);

  if (!rec) return <div>Loading...</div>;
  if (rec.error) return <div>Error: {rec.error}</div>;

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
    </div>
  );
}
