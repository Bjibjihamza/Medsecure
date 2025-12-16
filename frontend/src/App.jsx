import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import PublishKey from "./pages/PublishKey.jsx";
import RetrieveKey from "./pages/RetrieveKey.jsx";
import UploadRecord from "./pages/UploadRecord.jsx";
import RecordsList from "./pages/RecordsList.jsx";
import RecordView from "./pages/RecordView.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/keys/publish" element={<PublishKey />} />
        <Route path="/keys/retrieve" element={<RetrieveKey />} />
        <Route path="/records/upload" element={<UploadRecord />} />
        <Route path="/records" element={<RecordsList />} />
        <Route path="/records/:id" element={<RecordView />} />
      </Routes>
    </div>
  );
}
