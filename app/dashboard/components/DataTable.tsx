"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import "./DataTable.css";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="dt-container ui-table-wrap">
      <table className="dt-table ui-table">
        <thead className="dt-header">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="dt-header-row">
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    className="dt-header-cell"
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      cursor: header.column.getCanSort() ? "pointer" : "default",
                      width: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="dt-header-content">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp size={14} className="dt-sort-icon" aria-hidden="true" />,
                          desc: <ChevronDown size={14} className="dt-sort-icon" aria-hidden="true" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="dt-body">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="dt-row"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="dt-cell"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="dt-empty">
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
