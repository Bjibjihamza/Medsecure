import { useState } from "react";
import { publishKey } from "../api.js";
import { Card, Input, Select, TextArea, Button } from "../components/UI";

export default function PublishKey() {
  const [form, setForm] = useState({ uid: "", email: "", role: "PATIENT", keyType: "RSA", pemText: "" });
  const [pemFile, setPemFile] = useState(null);
  const [resp, setResp] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    if (pemFile) fd.append("pemFile", pemFile);

    const r = await publishKey(fd);
    setResp(r);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Publish Public Key">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="UID (Unique)" name="uid" placeholder="e.g. 12345" value={form.uid} onChange={handleChange} />
            <Input label="Email" name="email" type="email" placeholder="user@example.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" name="role" value={form.role} onChange={handleChange}>
              <option value="PATIENT">PATIENT</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
            <Select label="Algorithm" name="keyType" value={form.keyType} onChange={handleChange}>
              <option value="RSA">RSA</option>
              <option value="ED25519">ED25519</option>
            </Select>
          </div>

          <TextArea 
            label="Public Key (PEM Format)" 
            name="pemText"
            rows={6}
            className="font-mono text-xs"
            placeholder="-----BEGIN PUBLIC KEY-----"
            value={form.pemText}
            onChange={handleChange}
          />

          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
            <p className="text-sm text-gray-500 mb-2">Or upload a PEM file</p>
<input
  id="pemFile"
  name="pemFile"
  type="file"
  accept=".pem,.txt"
  onChange={(e) => {
    console.log("file picked:", e.target.files?.[0]);
    setPemFile(e.target.files?.[0] || null);
  }}
/>

          </div>

          <Button type="submit" className="w-full">Securely Store Key</Button>
        </form>

        {resp && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm overflow-auto">
            <pre>{JSON.stringify(resp, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}