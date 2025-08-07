import React from "react";

export const Card = ({ children, className = "", ...props }) => (
  <div
    className={`bg-white border border-gray-200 shadow-sm rounded-lg w-full flex flex-col ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 md:p-5 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

export const Input = (props) => (
  <input
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
    {...props}
  />
);

export const Select = ({ children, ...props }) => (
  <select
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black bg-white"
    {...props}
  >
    {children}
  </select>
);

export const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-4 py-2 rounded-md bg-black text-white text-xs font-medium hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const ShimmerCard = ({ className = "" }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded-lg w-full h-[320px] ${className}`}
  />
);

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between mt-4 text-xs ${className}`}
    >
      <span className="text-gray-600">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </span>
      <div className="inline-flex items-center gap-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous Page"
        >
          {"<"}
        </button>

        <div className="w-8 h-8 flex items-center justify-center rounded-md font-medium bg-black text-white">
          {currentPage}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next Page"
        >
          {">"}
        </button>
      </div>
    </div>
  );
};
