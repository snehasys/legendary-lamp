import { formatCurrency } from "@/lib/financialData";

interface FinancialTableProps {
  headers: string[];
  rows: {
    label: string;
    values: (number | null)[];
    bold?: boolean;
    highlight?: boolean;
  }[];
  compact?: boolean;
}

export default function FinancialTable({ headers, rows, compact = false }: FinancialTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${compact ? "text-xs" : ""}`}>
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2.5 px-3 font-medium text-muted-foreground sticky left-0 bg-background z-10 min-w-[160px]">
              Particulars
            </th>
            {headers.map((h) => (
              <th key={h} className="text-right py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-border/50 transition-colors hover:bg-accent/30 ${
                row.highlight ? "bg-accent/20" : ""
              }`}
            >
              <td className={`py-2 px-3 sticky left-0 bg-background z-10 ${row.bold ? "font-semibold" : ""}`}>
                {row.label}
              </td>
              {row.values.map((val, j) => (
                <td
                  key={j}
                  className={`text-right py-2 px-3 font-mono ${row.bold ? "font-semibold" : ""} ${
                    val != null && val < 0 ? "text-[oklch(0.55_0.22_25)]" : ""
                  }`}
                >
                  {formatCurrency(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
