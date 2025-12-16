// components/UI.jsx
import React from "react";

export const Card = ({ children, title, className = "" }) => (
  <div className={`bg-white shadow-lg shadow-gray-200/50 border border-gray-100 rounded-2xl p-8 ${className}`}>
    {title && <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>}
    {children}
  </div>
);

export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const baseStyle = "px-5 py-2.5 rounded-lg font-medium transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/30 focus:ring-blue-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-gray-600">{label}</label>}
    <input
      className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
      {...props}
    />
  </div>
);

export const Select = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-gray-600">{label}</label>}
    <div className="relative">
      <select
        className="w-full appearance-none px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  </div>
);

export const TextArea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-gray-600">{label}</label>}
    <textarea
      className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-y"
      {...props}
    />
  </div>
);