"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
  height?: number;
  horizontal?: boolean;
}

export function BarChart({
  data,
  title,
  className,
  height = 300,
  horizontal = false,
}: BarChartProps) {
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
  const chartPadding = { top: 20, right: 20, bottom: 40, left: 50 };

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <svg
          viewBox={`0 0 400 ${height}`}
          className="w-full"
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          {horizontal ? (
            <>
              {/* Horizontal bars */}
              {data.map((d, i) => {
                const barHeight = 20;
                const gap = (height - chartPadding.top - chartPadding.bottom - data.length * barHeight) / (data.length - 1 || 1);
                const y = chartPadding.top + i * (barHeight + gap);
                const barWidth = (d.value / maxValue) * 300;
                const color = d.color || "hsl(var(--primary))";

                return (
                  <g key={i}>
                    <text
                      x={chartPadding.left - 10}
                      y={y + barHeight / 2 + 4}
                      textAnchor="end"
                      className="fill-muted-foreground"
                      fontSize="11"
                    >
                      {d.name.length > 12 ? d.name.slice(0, 12) + "..." : d.name}
                    </text>
                    <rect
                      x={chartPadding.left}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={color}
                      fillOpacity="0.8"
                    />
                    <text
                      x={chartPadding.left + barWidth + 5}
                      y={y + barHeight / 2 + 4}
                      className="fill-foreground"
                      fontSize="11"
                    >
                      {d.value}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {/* Y-axis grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartPadding.top + (1 - ratio) * (height - chartPadding.top - chartPadding.bottom);
                return (
                  <g key={ratio}>
                    <line
                      x1={chartPadding.left}
                      y1={y}
                      x2={400 - chartPadding.right}
                      y2={y}
                      stroke="hsl(var(--border))"
                      strokeDasharray="4,4"
                      strokeWidth="0.5"
                    />
                    <text
                      x={chartPadding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground"
                      fontSize="11"
                    >
                      {Math.round(maxValue * ratio)}
                    </text>
                  </g>
                );
              })}

              {/* Vertical bars */}
              {data.map((d, i) => {
                const barWidth = Math.min(40, (300 - data.length * 4) / data.length);
                const gap = (300 - data.length * barWidth) / (data.length + 1);
                const x = chartPadding.left + gap + i * (barWidth + gap);
                const barHeight = (d.value / maxValue) * (height - chartPadding.top - chartPadding.bottom);
                const y = chartPadding.top + (height - chartPadding.top - chartPadding.bottom - barHeight);
                const color = d.color || "hsl(var(--primary))";

                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={color}
                      fillOpacity="0.8"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={height - 10}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      fontSize="10"
                    >
                      {d.name.length > 6 ? d.name.slice(0, 6) + "..." : d.name}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </CardContent>
    </Card>
  );
}
