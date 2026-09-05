import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Pagination } from './Pagination';

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string | number);
  emptyMessage?: string;
  stickyHeader?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  className?: string;
  // Optional Server-side pagination support:
  currentPage?: number;
  totalItems?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No records found.',
  stickyHeader = false,
  pagination = true,
  itemsPerPage = 10,
  className = '',
  currentPage: externalCurrentPage,
  totalItems: externalTotalItems,
  totalPages: externalTotalPages,
  onPageChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [internalCurrentPage, setInternalCurrentPage] = useState<number>(1);

  const isServerSide = Boolean(onPageChange);
  const activeCurrentPage = isServerSide && externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;

  // Reset internal page to 1 whenever data changes (for client-side mode)
  React.useEffect(() => {
    if (!isServerSide) {
      setInternalCurrentPage(1);
    }
  }, [data.length, isServerSide]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else setSortDir('asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const calculatedTotalPages = Math.ceil(sortedData.length / itemsPerPage);
  const activeTotalPages = isServerSide && externalTotalPages !== undefined ? externalTotalPages : calculatedTotalPages;
  const activeTotalItems = isServerSide && externalTotalItems !== undefined ? externalTotalItems : sortedData.length;

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    if (isServerSide) return sortedData; // server already sends requested page slice
    const start = (activeCurrentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, pagination, isServerSide, activeCurrentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <span className="text-[10px] font-extrabold text-slate-400/80 ml-1 tracking-tighter">↑↓</span>;
    if (sortDir === 'asc') return <span className="text-[10px] font-black text-purple-600 ml-1">↑</span>;
    return <span className="text-[10px] font-black text-purple-600 ml-1">↓</span>;
  };

  const getRowKey = (row: T, idx: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(row);
    return (row[rowKey] as string | number) || idx;
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-800">
          <thead
            className={`bg-slate-50/90 backdrop-blur-sm text-[11px] uppercase font-extrabold text-slate-600 border-b border-slate-200 ${
              stickyHeader ? 'sticky top-0 z-10' : ''
            }`}
          >
            <tr>
              {columns.map((col) => {
                const alignClass =
                  col.align === 'center' ? 'text-center justify-center' : col.align === 'right' ? 'text-right justify-end' : 'text-left justify-start';
                return (
                  <th
                    key={String(col.key)}
                    className={`px-5 py-3.5 whitespace-nowrap select-none ${col.width ?? ''} ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition' : ''
                    }`}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className={`flex items-center gap-1.5 ${alignClass}`}>
                      <span>{col.label}</span>
                      {col.sortable && <SortIcon colKey={String(col.key)} />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-slate-400 font-medium text-xs"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={getRowKey(row, idx)}
                  className="hover:bg-purple-50/30 transition-colors group"
                >
                  {columns.map((col) => {
                    const alignClass = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                    return (
                      <td key={String(col.key)} className={`px-5 py-3.5 whitespace-nowrap ${alignClass}`}>
                        {col.render
                          ? col.render(row[col.key as keyof T], row, (activeCurrentPage - 1) * itemsPerPage + idx)
                          : <span className="text-slate-800 font-bold">{String(row[col.key as keyof T] ?? '—')}</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && activeTotalItems > 0 && (
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
          <Pagination
            currentPage={activeCurrentPage}
            totalPages={activeTotalPages}
            totalItems={activeTotalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
