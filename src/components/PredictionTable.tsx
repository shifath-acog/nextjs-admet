'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { X, ArrowUpDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Prediction {
  SMILES: string;
  Prediction: string;
  Confidence: string;
  Applicability: string;
  ChemicalStructure?: string;
  GroundTruth?: string;
}

interface PredictionTableProps {
  data: Prediction[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const columnHelper = createColumnHelper<Prediction>();

export default function PredictionTable({ data, searchQuery, onSearchChange }: PredictionTableProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    document.body.style.overflow = expandedImage ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expandedImage]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      row.SMILES.toLowerCase().includes(query) ||
      row.Prediction.toLowerCase().includes(query) ||
      row.Applicability.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const handleImageClick = (html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const img = doc.querySelector('img');
      const src = img?.getAttribute('src') || '';

      if (src && (src.startsWith('data:image') || src.startsWith('http') || src.startsWith('https'))) {
        setExpandedImage(src);
      }
    } catch (error) {
      console.error('Error parsing image HTML:', error);
    }
  };

  const columns = useMemo(
    () => {
      const hasGroundTruth = data.some(row => row.GroundTruth);

      const allColumns: any[] = [
        columnHelper.accessor('SMILES', {
          header: ({ table }) => (
            <Button
              variant="ghost"
              onClick={() => {
                const column = table.getColumn('SMILES');
                column?.toggleSorting(column.getIsSorted() === 'asc');
              }}
              className="text-gray-700 font-semibold p-0"
            >
              SMILES
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: (info) => info.getValue(),
        }),
      ];

      if (hasGroundTruth) {
        allColumns.push(
          columnHelper.accessor('GroundTruth', {
            header: ({ table }) => (
              <Button
                variant="ghost"
                onClick={() => {
                  const column = table.getColumn('GroundTruth');
                  column?.toggleSorting(column.getIsSorted() === 'asc');
                }}
                className="text-gray-700 font-semibold p-0"
              >
                Ground Truth
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            ),
            cell: (info) => info.getValue(),
          })
        );
      }

      allColumns.push(
        columnHelper.accessor('Prediction', {
          header: ({ table }) => (
            <Button
              variant="ghost"
              onClick={() => {
                const column = table.getColumn('Prediction');
                column?.toggleSorting(column.getIsSorted() === 'asc');
              }}
              className="text-gray-700 font-semibold p-0"
            >
              Prediction
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('Applicability', {
          header: ({ table }) => (
            <Button
              variant="ghost"
              onClick={() => {
                const column = table.getColumn('Applicability');
                column?.toggleSorting(column.getIsSorted() === 'asc');
              }}
              className="text-gray-700 font-semibold p-0"
            >
              Applicability
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          ),
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('ChemicalStructure', {
          header: 'Chemical Structure',
          cell: (info) => {
            const htmlContent = info.getValue();

            if (!htmlContent) {
              return (
                <div className="flex justify-center">
                  <div className="w-[60px] h-[60px] rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                </div>
              );
            }

            return (
              <div
                className="flex justify-center"
                onClick={() => handleImageClick(htmlContent)}
              >
                <div
                  className="w-[60px] h-[60px] rounded-md border border-gray-200 cursor-pointer overflow-hidden hover:border-gray-400 transition-colors flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  style={{ minHeight: '60px', minWidth: '60px' }}
                />
              </div>
            );
          },
          enableSorting: false,
        })
      );

      return allColumns;
    },
    [data]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  const closeModal = () => setExpandedImage(null);

  // Generate CSV content
  const handleDownloadCsv = () => {
    const headers = ['SMILES', 'Prediction', 'Applicability'];
    const rows = data.map((row) => [
      `"${row.SMILES.replace(/"/g, '""')}"`,
      `"${row.Prediction.replace(/"/g, '""')}"`,
      `"${row.Applicability.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'predictions.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const showPagination = filteredData.length > 10;

  return (
    <>
      <div className="rounded-md border border-gray-200 overflow-x-auto mt-4">
        <table className="w-3/4 border-collapse">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`text-left whitespace-normal break-words p-2 font-semibold text-gray-700${header.column.id === 'ChemicalStructure' ? ' text-right' : ''}`}
                    style={{
                      minWidth: header.column.id === 'SMILES' || header.column.id === 'ChemicalStructure' ? '250px' : '80px',
                      
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-2 align-top text-gray-700"
                      style={{
                        maxWidth: cell.column.id === 'SMILES' || cell.column.id === 'ChemicalStructure' ? '230px' : '100px',
                        ...(cell.column.id !== 'ChemicalStructure' ? { whiteSpace: 'normal', wordBreak: 'break-word' } : {}),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-gray-700">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between mt-4 text-gray-700">
          <div>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
          <div className="space-x-2 mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {expandedImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80"
          onClick={closeModal}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Chemical Structure</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center">
              <img
                src={expandedImage}
                alt="Chemical Structure"
                className="max-w-full max-h-[90vh] object-contain rounded-md shadow-sm h-[150px] w-[150px]"
                onLoad={() => console.log('Image loaded successfully')}
                onError={(e) => {
                  console.error('Failed to load image');
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="text-gray-500 p-8 text-center">Failed to load image</div>';
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}