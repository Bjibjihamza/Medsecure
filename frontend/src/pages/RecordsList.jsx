import { useState } from "react";
import { listRecords } from "../api.js";
import { Link } from "react-router-dom";
// ✅ CORRECT (goes up to src/ then into components/)
import { Card, Input, Button } from "../components/UI";
export default function RecordsList() {
  const [patientUid, setPatientUid] = useState("");
  const [records, setRecords] = useState([]);

  async function onLoad(e) {
    e.preventDefault();
    const r = await listRecords(patientUid.trim());
    setRecords(Array.isArray(r) ? r : []);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card title="Medical Records" className="mb-8">
        <form onSubmit={onLoad} className="flex gap-4 items-end">
          <div className="flex-1">
            <Input 
              label="Search by Patient UID" 
              placeholder="Enter UID..." 
              value={patientUid} 
              onChange={(e) => setPatientUid(e.target.value)} 
            />
          </div>
          <Button type="submit">Load Records</Button>
        </form>
      </Card>

      <div className="grid gap-4">
        {records.length > 0 ? records.map((rec) => (
          <div key={rec._id} className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wide">
                  {rec.recordType}
                </span>
                <span className="text-gray-400 text-sm">
                  {new Date(rec.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-medium text-gray-900">{rec.originalFileName}</h4>
              <p className="text-sm text-gray-500">Uploaded by: {rec.uploaderEmail}</p>
            </div>
            
            <Link to={`/records/${rec._id}`}>
              <Button variant="outline" className="text-sm">View Details</Button>
            </Link>
          </div>
        )) : (
          <div className="text-center py-12 text-gray-400">
            No records found. Search for a UID above.
          </div>
        )}
      </div>
    </div>
  );
}