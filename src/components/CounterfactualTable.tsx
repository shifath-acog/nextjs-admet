'use client';

import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

interface CounterfactualPrediction {
  SMILES: string;
  Confidence: string;
  Prediction: string;
}

interface CounterfactualTableProps {
  data: CounterfactualPrediction[];
}

const columnHelper = createColumnHelper<CounterfactualPrediction>();

export default function CounterfactualTable({ data }: CounterfactualTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('SMILES', {
        header: 'SMILES',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('Prediction', {
        header: () => (
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
      columnHelper.accessor('Confidence', {
        header: () => (
          <Button
            variant="ghost"
            onClick={() => {
              const column = table.getColumn('Confidence');
              column?.toggleSorting(column.getIsSorted() === 'asc');
            }}
            className="text-gray-700 font-semibold p-0"
          >
            Confidence
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => info.getValue(),
        sortDescFirst: true,
        sortingFn: (rowA, rowB, columnId) => {
          const a = parseFloat(rowA.getValue(columnId)) || 0;
          const b = parseFloat(rowB.getValue(columnId)) || 0;
          return a - b;
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="rounded-md border border-gray-200 overflow-x-auto mt-4">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left whitespace-normal break-words p-2 font-semibold text-gray-700"
                  style={{
                    minWidth: header.column.id === 'SMILES' ? '200px' : '120px',
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
                      maxWidth: cell.column.id === 'SMILES' ? '230px' : '150px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
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
                No counterfactual or chemical space results available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}