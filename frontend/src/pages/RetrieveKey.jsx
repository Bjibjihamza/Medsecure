import { useState } from "react";
import { retrieveKeys, downloadKey } from "../api.js";

export default function RetrieveKey() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [keyType, setKeyType] = useState("");
  const [results, setResults] = useState([]);

  async function onSearch(e) {
    e.preventDefault();
    const params = {};
    if (uid.trim()) params.uid = uid.trim();
    if (email.trim()) params.email = email.trim();
    if (keyType) params.keyType = keyType;
    const r = await retrieveKeys(params);
    setResults(Array.isArray(r) ? r : []);
  }

  return (
    <div>
      <h2>Retrieve Public Key</h2>
      <form onSubmit={onSearch} style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <input placeholder="Search by UID" value={uid} onChange={(e) => setUid(e.target.value)} />
        <input placeholder="Or by Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Optional Key Type:&nbsp;
          <select value={keyType} onChange={(e) => setKeyType(e.target.value)}>
            <option value="">Any</option>
            <option value="RSA">RSA</option>
            <option value="ED25519">ED25519</option>
          </select>
        </label>
        <button type="submit">Search</button>
      </form>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {results.map((k) => (
          <div key={k._id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <div><b>UID:</b> {k.uid}</div>
            <div><b>Email:</b> {k.email}</div>
            <div><b>Role:</b> {k.role}</div>
            <div><b>Type:</b> {k.keyType}</div>
            <button onClick={() => downloadKey(k._id)} style={{ marginTop: 8 }}>Download PEM</button>
            <details style={{ marginTop: 8 }}>
              <summary>Show PEM</summary>
              <pre style={{ whiteSpace: "pre-wrap" }}>{k.publicKeyPem}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
