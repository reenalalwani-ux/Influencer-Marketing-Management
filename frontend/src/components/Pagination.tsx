import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalItems === 0) return null;

  const effectiveTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, currentPage), effectiveTotalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600 font-semibold">
      <div>
        Showing <span className="font-extrabold text-slate-900">{startItem}</span> to{' '}
        <span className="font-extrabold text-slate-900">{endItem}</span> of{' '}
        <span className="font-extrabold text-purple-700">{totalItems}</span> items
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={safePage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: effectiveTotalPages }, (_, i) => i + 1)
          .filter(page => page === 1 || page === effectiveTotalPages || Math.abs(page - safePage) <= 1)
          .map((page, index, array) => {
            const showEllipsis = index > 0 && page - array[index - 1] > 1;
            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-7 h-7 rounded-lg font-bold transition flex items-center justify-center cursor-pointer ${
                    safePage === page
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={safePage >= effectiveTotalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
