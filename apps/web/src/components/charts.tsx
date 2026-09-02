// Hand-rolled SVG charts — no external deps, SSR-safe, deterministic.

export function LineChart({
  labels,
  series,
  height = 200,
  suffix = "",
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  suffix?: string;
}) {
  const W = 600;
  const H = height;
  const padX = 38;
  const padTop = 14;
  const padBottom = 26;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = Math.max(labels.length, 2);
  const x = (i: number) => padX + (i * (W - padX - 10)) / (n - 1);
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const ticks = [0, Math.round(max / 2), max];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="line chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padX} x2={W - 10} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padX - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {l}
          </text>
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const area = `${padX},${y(0)} ${pts} ${x(s.values.length - 1)},${y(0)}`;
          return (
            <g key={s.name}>
              <polygon points={area} fill={s.color} opacity="0.08" />
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={s.color} strokeWidth="2">
                  <title>{`${s.name} · ${labels[i]}: ${v}${suffix}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 px-8">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 200,
  suffix = "",
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  suffix?: string;
}) {
  const W = 600;
  const H = height;
  const padX = 34;
  const padBottom = 30;
  const padTop = 16;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = Math.min(56, (W - padX - 14) / Math.max(data.length, 1) - 12);
  const n = Math.max(data.length, 1);
  const cx = (i: number) => padX + 10 + (i * (W - padX - 20)) / n + (W - padX - 20) / n / 2 - bw / 2;
  const h = (v: number) => Math.max(2, (v / max) * (H - padTop - padBottom));
  const y = (v: number) => H - padBottom - h(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="bar chart">
      {[0, max].map((t) => (
        <line key={t} x1={padX} x2={W - 10} y1={H - padBottom - (t / max) * (H - padTop - padBottom)} y2={H - padBottom - (t / max) * (H - padTop - padBottom)} stroke="#e2e8f0" />
      ))}
      <text x={padX - 6} y={H - padBottom + 4} textAnchor="end" fontSize="9" fill="#94a3b8">0</text>
      <text x={padX - 6} y={padTop + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{max}</text>
      {data.map((d, i) => (
        <g key={d.label + i}>
          <rect x={cx(i)} y={y(d.value)} width={bw} height={h(d.value)} rx="5" fill={d.color ?? "#2563eb"}>
            <title>{`${d.label}: ${d.value}${suffix}`}</title>
          </rect>
          <text x={cx(i) + bw / 2} y={y(d.value) - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">
            {d.value}
          </text>
          <text x={cx(i) + bw / 2} y={H - 10} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {d.label.length > 9 ? `${d.label.slice(0, 8)}…` : d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HBars({
  data,
  suffix = "",
}: {
  data: { label: string; value: number; color?: string; hint?: string }[];
  suffix?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium text-slate-700">{d.label}</span>
            <span className="text-slate-500">
              {d.hint ? <span className="mr-2 text-slate-400">{d.hint}</span> : null}
              <span className="font-semibold text-slate-900">{d.value}{suffix}</span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? "#2563eb" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  data,
  size = 170,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="donut chart">
        <circle cx="60" cy="60" r="46" fill="none" stroke="#f1f5f9" strokeWidth="16" />
        {data.map((d) => {
          const frac = d.value / total;
          const el = (
            <circle
              key={d.label}
              cx="60"
              cy="60"
              r="46"
              fill="none"
              stroke={d.color}
              strokeWidth="16"
              pathLength={100}
              strokeDasharray={`${frac * 100 - 0.6} ${100 - frac * 100 + 0.6}`}
              strokeDashoffset={-offset * 100 + 0.3}
              transform="rotate(-90 60 60)"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
          offset += frac;
          return el;
        })}
        {centerValue !== undefined && (
          <>
            <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0f172a">
              {centerValue}
            </text>
            <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#94a3b8">
              {centerLabel}
            </text>
          </>
        )}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-semibold text-slate-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniBars({
  values,
  color = "#2563eb",
  height = 40,
  width,
}: {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1" style={{ height, width }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="w-full min-w-2 rounded-sm"
          style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: color, opacity: 0.35 + (0.65 * i) / values.length }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

export function Sparkline({
  values,
  color = "#2563eb",
  width = 90,
  height = 28,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const pts = values
    .map((v, i) => `${(i * width) / (values.length - 1)},${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`)
    .join(" ");
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
