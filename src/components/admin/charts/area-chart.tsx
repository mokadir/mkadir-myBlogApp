"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
  color?: string;
  height?: number;
}

export function AreaChart({
  data,
  title,
  className,
  color = "hsl(var(--primary))",
  height = 300,
}: AreaChartProps) {
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
            style={{ height }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;
  const chartWidth = 100;
  const chartHeight = 100;
  const padding = { top: 10, right: 10, bottom: 30, left: 40 };

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right),
    y: padding.top + ((maxValue - d.value) / range) * (chartHeight - padding.top - padding.bottom),
    value: d.value,
    name: d.name,
  }));

  const areaPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ") + ` L${points[points.length - 1].x},${chartHeight - padding.bottom} L${points[0].x},${chartHeight - padding.bottom} Z`;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const yAxisLabels = [maxValue, Math.round((maxValue + minValue) / 2), minValue];

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ height, maxHeight: height }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {yAxisLabels.map((label, i) => {
            const y =
              padding.top +
              ((maxValue - label) / range) * (chartHeight - padding.top - padding.bottom);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeDasharray="4,4"
                  strokeWidth="0.5"
                />
                <text
                  x={padding.left - 5}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="3"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill={color} fillOpacity="0.15" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.5"
              fill="hsl(var(--background))"
              stroke={color}
              strokeWidth="1"
            />
          ))}

          {/* X-axis labels */}
          {data.length <= 12 &&
            data.map((d, i) => {
              const x =
                padding.left +
                (i / (data.length - 1 || 1)) * (chartWidth - padding.left - padding.right);
              return (
                <text
                  key={i}
                  x={x}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="3"
                >
                  {d.name.length > 5 ? d.name.slice(0, 5) + "..." : d.name}
                </text>
              );
            })}
        </svg>
      </CardContent>
    </Card>
  );
}
