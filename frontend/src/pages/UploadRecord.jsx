import { useState } from "react";
import { uploadRecord } from "../api.js";
import { Card, Input, Select, TextArea, Button } from "../components/UI";

export default function UploadRecord() {
  const [form, setForm] = useState({ patientUid: "", uploaderEmail: "", recordType: "Lab", note: "" });
  const [file, setFile] = useState(null);
  const [resp, setResp] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    if (file) fd.append("recordFile", file);

    const r = await uploadRecord(fd);
    setResp(r);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="Upload Medical Record">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Patient UID" name="patientUid" placeholder="Target Patient ID" value={form.patientUid} onChange={handleChange} />
            <Input label="Uploader Email" name="uploaderEmail" placeholder="doctor@clinic.com" value={form.uploaderEmail} onChange={handleChange} />
          </div>

          <Select label="Record Type" name="recordType" value={form.recordType} onChange={handleChange}>
            <option value="Lab">Lab Result</option>
            <option value="Prescription">Prescription</option>
            <option value="Radiology">Radiology / Imaging</option>
            <option value="Diagnosis">Clinical Diagnosis</option>
            <option value="Other">Other</option>
          </Select>

          <TextArea label="Clinical Notes" name="note" rows={3} placeholder="Optional details..." value={form.note} onChange={handleChange} />

          <div className="relative border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl p-8 text-center hover:bg-gray-100 transition">
            <div className="text-gray-500">
              <span className="font-medium text-blue-600 hover:underline">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG (Max 10MB)</p>
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
            {file && <p className="mt-2 text-sm font-semibold text-gray-700">Selected: {file.name}</p>}
          </div>

          <Button type="submit" className="w-full">Upload Securely</Button>
        </form>

        {resp && (
          <div className="mt-6 p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-auto font-mono">
            {JSON.stringify(resp, null, 2)}
          </div>
        )}
      </Card>
    </div>
  );
}