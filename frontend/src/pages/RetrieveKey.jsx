import { useMemo, useState } from "react";
import { retrieveKeys, downloadKey } from "../api.js";
import { Card, Input, Select, Button } from "../components/UI";

function looksLikeEmail(s) {
  return s.includes("@");
}

export default function RetrieveKey() {
  const [query, setQuery] = useState("");        // uid OR email
  const [keyType, setKeyType] = useState("");    // "" | RSA | ED25519
  const [results, setResults] = useState([]);
  const [openId, setOpenId] = useState(null);    // which result is expanded
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canSearch = useMemo(() => query.trim().length > 0, [query]);

  async function onSearch(e) {
    e.preventDefault();
    setErr("");
    setResults([]);
    setOpenId(null);

    const q = query.trim();
    if (!q) {
      setErr("Enter a UID or an email to search.");
      return;
    }

    const params = {};
    if (looksLikeEmail(q)) params.email = q.toLowerCase();
    else params.uid = q;

    if (keyType) params.keyType = keyType;

    try {
      setLoading(true);
      const r = await retrieveKeys(params);
      setResults(Array.isArray(r) ? r : []);
      if (!Array.isArray(r)) setErr("Unexpected server response.");
    } catch (e2) {
      setErr("Failed to retrieve keys. Check backend is running and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy(pem) {
    try {
      await navigator.clipboard.writeText(pem);
      alert("PEM copied ✅");
    } catch {
      alert("Copy failed. You can select and copy manually.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card title="Retrieve Public Key">
        <form onSubmit={onSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Search (UID or Email)"
                placeholder="e.g. Bjibjihamza or hamzabjibji@gmail.com"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: paste either a UID or an email — we’ll detect it automatically.
              </p>
            </div>

            <Select
              label="Algorithm"
              value={keyType}
              onChange={(e) => setKeyType(e.target.value)}
            >
              <option value="">Any</option>
              <option value="RSA">RSA</option>
              <option value="ED25519">ED25519</option>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={!canSearch || loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button
              type="button"
              className="bg-gray-100 text-gray-800"
              onClick={() => {
                setQuery("");
                setKeyType("");
                setResults([]);
                setErr("");
                setOpenId(null);
              }}
            >
              Clear
            </Button>
          </div>

          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {err}
            </div>
          )}
        </form>
      </Card>

      <div className="mt-6 space-y-4">
        {!loading && !err && results.length === 0 && (
          <div className="p-6 text-sm text-gray-500 text-center border border-dashed rounded-xl bg-white">
            No results yet. Search by UID or email to retrieve a public key.
          </div>
        )}

        {results.map((k) => {
          const expanded = openId === k._id;
          return (
            <div key={k._id} className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-semibold">UID:</span>{" "}
                    <span className="text-gray-800">{k.uid}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Email:</span>{" "}
                    <span className="text-gray-800">{k.email}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-700">Role:</span>{" "}
                    {k.role} •{" "}
                    <span className="font-semibold text-gray-700">Type:</span>{" "}
                    {k.keyType}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => downloadKey(k._id)}>
                    Download PEM
                  </Button>

                  <Button
                    type="button"
                    className="bg-gray-100 text-gray-800"
                    onClick={() => onCopy(k.publicKeyPem)}
                  >
                    Copy PEM
                  </Button>

                  <Button
                    type="button"
                    className="bg-gray-100 text-gray-800"
                    onClick={() => setOpenId(expanded ? null : k._id)}
                  >
                    {expanded ? "Hide PEM" : "Show PEM"}
                  </Button>
                </div>
              </div>

              {expanded && (
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2">
                    Public Key (PEM)
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs font-mono bg-gray-50 border rounded-xl p-4 max-h-72 overflow-auto">
{k.publicKeyPem}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
