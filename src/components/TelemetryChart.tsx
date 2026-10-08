import React, { useState } from 'react';
import { Telemetry, Threshold } from '../types';

interface TelemetryChartProps {
  telemetryData: Telemetry[];
  threshold?: Threshold;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  telemetryData,
  threshold,
  timeRange,
  onTimeRangeChange,
}) => {
  const [activeMetric, setActiveMetric] = useState<'vibration' | 'temperature' | 'pressure' | 'power_consumption'>('vibration');
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; val: number; time: string } | null>(null);

  const metricConfig = {
    vibration: { label: 'Vibration', unit: 'mm/s', color: '#EF4444', thresholdVal: threshold?.vibration_max },
    temperature: { label: 'Temperature', unit: '°C', color: '#F59E0B', thresholdVal: threshold?.temperature_max },
    pressure: { label: 'Pressure', unit: 'bar', color: '#3B82F6', thresholdVal: threshold?.pressure_max },
    power_consumption: { label: 'Power Consumption', unit: 'kW', color: '#10B981', thresholdVal: threshold?.power_max },
  };

  const currentConfig = metricConfig[activeMetric];

  // Chart layout parameters
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = telemetryData.map((d) => d[activeMetric]);
  const minVal = points.length > 0 ? Math.min(...points, 0) : 0;
  const maxVal = points.length > 0
    ? Math.max(...points, currentConfig.thresholdVal || 0) * 1.15
    : 100;

  const getY = (val: number) => {
    if (maxVal === minVal) return innerHeight / 2;
    return innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  const getX = (idx: number) => {
    if (telemetryData.length <= 1) return innerWidth / 2;
    return (idx / (telemetryData.length - 1)) * innerWidth;
  };

  let pathData = '';
  if (telemetryData.length > 0) {
    pathData = telemetryData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[activeMetric])}`)
      .join(' ');
  }

  const thresholdY = currentConfig.thresholdVal !== undefined ? getY(currentConfig.thresholdVal) : null;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Metric Selector Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(Object.keys(metricConfig) as Array<keyof typeof metricConfig>).map((key) => {
            const isActive = activeMetric === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? `1px solid ${metricConfig[key].color}` : '1px solid #E2E8F0',
                  backgroundColor: isActive ? `${metricConfig[key].color}12` : '#F8FAFC',
                  color: isActive ? metricConfig[key].color : '#64748B',
                  transition: 'all 0.15s ease',
                }}
              >
                {metricConfig[key].label}
              </button>
            );
          })}
        </div>

        {/* Time range pills */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
          {['1h', '6h', '24h', '7d'].map((r) => (
            <button
              key={r}
              onClick={() => onTimeRangeChange(r)}
              style={{
                border: 'none',
                background: timeRange === r ? '#FFFFFF' : 'transparent',
                color: timeRange === r ? '#0F172A' : '#64748B',
                boxShadow: timeRange === r ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      {telemetryData.length === 0 ? (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>
          No telemetry recorded in selected window.
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', minHeight: '220px', overflow: 'visible' }}
          >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = innerHeight * pct;
                const val = (minVal + (1 - pct) * (maxVal - minVal)).toFixed(1);
                return (
                  <g key={pct}>
                    <line x1={0} y1={y} x2={innerWidth} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    <text x={-10} y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontFamily="var(--font-mono)">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Threshold line */}
              {thresholdY !== null && thresholdY >= 0 && thresholdY <= innerHeight && (
                <g>
                  <line
                    x1={0}
                    y1={thresholdY}
                    x2={innerWidth}
                    y2={thresholdY}
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={innerWidth - 4}
                    y={thresholdY - 5}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="#EF4444"
                  >
                    Limit: {currentConfig.thresholdVal} {currentConfig.unit}
                  </text>
                </g>
              )}

              {/* Filled area gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentConfig.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={currentConfig.color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {pathData && (
                <>
                  <path
                    d={`${pathData} L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z`}
                    fill="url(#chartGradient)"
                  />
                  <path
                    d={pathData}
                    fill="none"
                    stroke={currentConfig.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Data points */}
              {telemetryData.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d[activeMetric]);
                const isHovered = hoveredPoint?.index === i;
                return (
                  <circle
                    key={d.id || i}
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 2.5}
                    fill={isHovered ? '#FFFFFF' : currentConfig.color}
                    stroke={currentConfig.color}
                    strokeWidth={isHovered ? 2.5 : 1}
                    style={{ cursor: 'pointer', transition: 'all 0.1s ease' }}
                    onMouseEnter={() =>
                      setHoveredPoint({
                        index: i,
                        x: cx,
                        y: cy,
                        val: d[activeMetric],
                        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}

              {/* Tooltip */}
              {hoveredPoint && (
                <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y - 35})`}>
                  <rect
                    x={-45}
                    y={-14}
                    width={90}
                    height={28}
                    rx={6}
                    fill="#0F172A"
                    opacity={0.9}
                  />
                  <text
                    x={0}
                    y={-2}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="var(--font-mono)"
                  >
                    {hoveredPoint.val} {currentConfig.unit}
                  </text>
                  <text
                    x={0}
                    y={9}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="8.5"
                  >
                    {hoveredPoint.time}
                  </text>
                </g>
              )}
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};
