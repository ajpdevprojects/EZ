export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  caption: string;
  valueFormatter?: (value: number) => string;
}

/**
 * A single-series magnitude chart. Renders as a real table so screen
 * readers get the label/value pairs directly — the bar fill is a
 * decorative visual layer, never the only way to read the data.
 */
export function BarChart({ data, caption, valueFormatter = (value) => String(value) }: BarChartProps) {
  const max = Math.max(1, ...data.map((datum) => datum.value));

  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Label</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {data.map((datum) => (
          <tr key={datum.label}>
            <th scope="row" className="w-28 py-1.5 pr-3 text-left text-sm font-normal text-muted-foreground">
              {datum.label}
            </th>
            <td className="py-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(4, (datum.value / max) * 100)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-foreground">
                  {valueFormatter(datum.value)}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
