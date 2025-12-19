import { Link } from "react-router-dom";
import { Card } from "../components/UI"; 

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="text-center py-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Secure Medical <span className="text-blue-600">Record Sharing</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          A decentralized approach to healthcare data. Encrypt, sign, and share medical records securely using RSA/ED25519 cryptography.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/records/upload" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition">
            Start Uploading
          </Link>
          <Link to="/keys/publish" className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition">
            Setup Keys
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <FeatureCard 
          title="Key Management" 
          desc="Publish and retrieve public keys (RSA/ED25519) for identity verification."
        />
        <FeatureCard 
          title="Secure Storage" 
          desc="Upload and download medical records with metadata preservation."
        />
        <FeatureCard 
          title="End-to-End Encryption" 
          desc="Phase 3: Automatically encrypt and sign records before transmission."
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}