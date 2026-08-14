import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import { sma } from '../utils/indicators';

function toChartData(history) {
  if (!history) return { candles: [], ma20: [], ma50: [], volumes: [] };
  const map = new Map();
  const sorted = [...history].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  sorted.forEach((p) => {
    const t = Math.floor(new Date(p.date).getTime() / 1000);
    map.set(t, {
      time: t,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume || 0,
    });
  });
  const points = Array.from(map.values());
  const closes = points.map((p) => p.close);
  // Only calculate SMA if we have enough data points
  const ma20 = points.length >= 20 ? sma(closes, 20) : new Array(points.length).fill(null);
  const ma50 = points.length >= 50 ? sma(closes, 50) : new Array(points.length).fill(null);
  return {
    candles: points.map((p) => ({
      time: p.time,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    })),
    volumes: points.map((p) => ({
      time: p.time,
      value: p.volume,
      color:
        p.close >= p.open
          ? 'rgba(34,197,94,0.5)'
          : 'rgba(239,68,68,0.5)',
    })),
    // Ensure ma20/ma50 have the same length as points, with null for insufficient data
    ma20: ma20.length === points.length ? ma20 : new Array(points.length).fill(null),
    ma50: ma50.length === points.length ? ma50 : new Array(points.length).fill(null),
  };
}

export default function CandlestickChart({ data, showMA20, showMA50 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volRef = useRef(null);
  const ma20Ref = useRef(null);
  const ma50Ref = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(229,231,235,0.6)' },
        horzLines: { color: 'rgba(229,231,235,0.6)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#E5E7EB' },
      timeScale: { borderColor: '#E5E7EB', timeVisible: true },
      autoSize: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });
    candleRef.current = candleSeries;

    const volSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    });
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volRef.current = volSeries;

    const ma20Series = chart.addLineSeries({
      color: '#3B82F6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    ma20Ref.current = ma20Series;

    const ma50Series = chart.addLineSeries({
      color: '#F59E0B',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    ma50Ref.current = ma50Series;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candleRef.current) return;
    const { candles, volumes, ma20, ma50 } = toChartData(data);
    candleRef.current.setData(candles);
    volRef.current.setData(volumes);
    // Only set MA data if showMA20/showMA50 are true and we have data
    if (showMA20) {
      ma20Ref.current.setData(ma20);
      ma20Ref.current.applyOptions({ visible: true });
    } else {
      ma20Ref.current.applyOptions({ visible: false });
    }
    if (showMA50) {
      ma50Ref.current.setData(ma50);
      ma50Ref.current.applyOptions({ visible: true });
    } else {
      ma50Ref.current.applyOptions({ visible: false });
    }
    chartRef.current?.timeScale().fitContent();
  }, [data, showMA20, showMA50]);

  return <div ref={containerRef} style={{ height: 320, width: '100%' }} />;
}