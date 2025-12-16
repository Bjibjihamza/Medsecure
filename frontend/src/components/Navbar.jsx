import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  
  const NavItem = ({ to, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          isActive 
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30" 
            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 mb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              MediChain
            </span>
          </div>
          
          {/* Links */}
          <div className="flex space-x-2">
            <NavItem to="/" label="Home" />
            <NavItem to="/keys/publish" label="Publish Key" />
            <NavItem to="/keys/retrieve" label="Retrieve Key" />
            <NavItem to="/records/upload" label="Upload" />
            <NavItem to="/records" label="Records" />
          </div>
        </div>
      </div>
    </nav>
  );
}