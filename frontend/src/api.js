const API_BASE = "http://localhost:5000";

export async function publishKey(formData) {
  const r = await fetch(`${API_BASE}/api/keys`, { method: "POST", body: formData });
  return r.json();
}

export async function retrieveKeys(params) {
  const q = new URLSearchParams(params);
  const r = await fetch(`${API_BASE}/api/keys?${q.toString()}`);
  return r.json();
}

export function downloadKey(id) {
  window.open(`${API_BASE}/api/keys/${id}/download`, "_blank");
}


export async function sendSecure(recordId, recipientUidOrEmail, recipientEmail) {
  const r = await fetch(`${API_BASE}/api/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordId, recipientUidOrEmail, recipientEmail }),
  });
  return r.json();
}


export async function uploadRecord(formData) {
  const r = await fetch(`${API_BASE}/api/records`, { method: "POST", body: formData });
  return r.json();
}

export async function listRecords(patientUid) {
  const q = new URLSearchParams({ patientUid });
  const r = await fetch(`${API_BASE}/api/records?${q.toString()}`);
  return r.json();
}

export async function getRecord(id) {
  const r = await fetch(`${API_BASE}/api/records/${id}`);
  return r.json();
}

export function downloadRecord(id) {
  window.open(`${API_BASE}/api/records/${id}/download`, "_blank");
}
