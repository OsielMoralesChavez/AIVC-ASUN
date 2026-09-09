"use client";

/**
 * Gráficas del dashboard en SVG con los tokens de color del tema
 * (`fill="var(--color-chart-N)"`). No leen variables CSS desde JavaScript a propósito: al
 * escribirlas directamente en el SVG, el navegador las recalcula solo cuando cambia
 * `data-palette` o `data-mode` — sin re-render, sin colores calculados al montar que se queden
 * obsoletos, y sin destruir los datos ni los filtros seleccionados.
 */

export interface SeriesPoint {
  label: string;
  value: number;
}

/** Barras verticales — actividad de generación por periodo. */
export function BarChart({ data, ariaLabel }: { data: SeriesPoint[]; ariaLabel: string }) {
  if (data.length === 0) return <p className="field-hint">Sin datos en este periodo.</p>;

  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const height = 42;
  const slot = width / data.length;
  const barWidth = Math.min(slot * 0.55, 9);

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height + 10}`}
        role="img"
        aria-label={ariaLabel}
        // Altura fija (no `auto`): la gráfica ocupa las 12 columnas del grid, y con la relación
        // de aspecto del viewBox crecería desproporcionadamente alta al ensancharse.
        style={{ width: "100%", height: "clamp(180px, 24vw, 300px)", overflow: "visible" }}
        preserveAspectRatio="none"
      >
        {/* Cuadrícula: 3 líneas de referencia, suficientes para leer magnitudes sin saturar. */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={0}
            x2={width}
            y1={height - t * height}
            y2={height - t * height}
            stroke="var(--color-chart-grid)"
            strokeWidth={0.3}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {data.map((d, i) => {
          const barHeight = (d.value / max) * height;
          return (
            <rect
              key={d.label}
              x={i * slot + (slot - barWidth) / 2}
              y={height - barHeight}
              width={barWidth}
              height={Math.max(barHeight, d.value > 0 ? 0.8 : 0)}
              rx={1}
              fill="var(--color-chart-1)"
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="chart-axis" aria-hidden>
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </figure>
  );
}

/** Anillo — distribución de contenidos por tipo. */
export function DonutChart({ data, ariaLabel }: { data: SeriesPoint[]; ariaLabel: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <p className="field-hint">Todavía no hay contenidos generados.</p>;

  const radius = 15.9155; // circunferencia ≈ 100, para usar los valores como porcentajes directos
  let offset = 25; // arranca arriba

  return (
    <figure className="donut-figure">
      <svg viewBox="0 0 42 42" role="img" aria-label={ariaLabel} className="donut-svg">
        <circle cx="21" cy="21" r={radius} fill="none" stroke="var(--color-chart-grid)" strokeWidth="4" />
        {data.map((d, i) => {
          const pct = (d.value / total) * 100;
          const dash = `${pct} ${100 - pct}`;
          const el = (
            <circle
              key={d.label}
              cx="21"
              cy="21"
              r={radius}
              fill="none"
              stroke={`var(--color-chart-${(i % 4) + 1})`}
              strokeWidth="4"
              strokeDasharray={dash}
              strokeDashoffset={offset}
            >
              <title>{`${d.label}: ${d.value} (${Math.round(pct)}%)`}</title>
            </circle>
          );
          offset -= pct;
          return el;
        })}
        <text x="21" y="20.6" textAnchor="middle" className="donut-total">
          {total}
        </text>
        <text x="21" y="24.4" textAnchor="middle" className="donut-caption">
          total
        </text>
      </svg>
      <ul className="chart-legend">
        {data.map((d, i) => (
          <li key={d.label}>
            <span className="chart-swatch" style={{ background: `var(--color-chart-${(i % 4) + 1})` }} aria-hidden />
            <span className="chart-legend-label">{d.label}</span>
            <span className="chart-legend-value">{d.value}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
