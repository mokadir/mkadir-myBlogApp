"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
  size?: number;
  showLegend?: boolean;
}

export function PieChart({
  data,
  title,
  className,
  size = 250,
  showLegend = true,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height: size }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 50;
  const cy = 50;
  const r = 35;

  let currentAngle = -90;
  const slices = data.map((d) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...d, path, percentage };
  });

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <svg
            viewBox="0 0 100 100"
            className="shrink-0"
            style={{ width: size, height: size }}
          >
            {slices.map((slice, i) => (
              <path key={i} d={slice.path} fill={slice.color} stroke="hsl(var(--background))" strokeWidth="1" />
            ))}
            <circle cx={cx} cy={cy} r={r * 0.4} fill="hsl(var(--background))" />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              className="fill-foreground"
              fontSize="8"
              fontWeight="bold"
            >
              {total}
            </text>
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="5"
            >
              Total
            </text>
          </svg>

          {showLegend && (
            <div className="space-y-2">
              {slices.map((slice, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {slice.name}
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(slice.percentage * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
