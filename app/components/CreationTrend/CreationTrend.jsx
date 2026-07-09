import { useMemo, useState } from "react";
import { useFetchData } from "@/hooks";
import { colorForCode } from "@/utils/palette";
import styles from "./CreationTrend.module.scss";

/**
 * CreationTrend
 *
 * Reports → Insights → Creation trend. Bar chart of codes created per
 * month over the last 12 months, with an optional client filter.
 * SVG is hand-rolled — no charting library dependency.
 */

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const buildMonthBuckets = (codes, clientFilter) => {
  // Compute the last 12 months (oldest → newest, current month last).
  const now = new Date();
  const buckets = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      year: d.getFullYear(),
      month: d.getMonth(),
      label: MONTH_LABELS[d.getMonth()],
      count: 0,
    });
  }
  const keyToBucket = new Map(buckets.map((b) => [b.key, b]));

  for (const code of codes) {
    if (clientFilter && clientFilter !== "all" && code.brand !== clientFilter) continue;
    const created = code.createdAt ? new Date(code.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) continue;
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = keyToBucket.get(key);
    if (bucket) bucket.count += 1;
  }

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  return { buckets, max, total };
};

const CreationTrend = () => {
  const { data: codes, loading } = useFetchData("/api/isci");
  const [clientFilter, setClientFilter] = useState("all");

  const clients = useMemo(() => {
    const set = new Set();
    for (const c of codes || []) if (c.brand) set.add(c.brand);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [codes]);

  const { buckets, max, total } = useMemo(
    () => buildMonthBuckets(codes || [], clientFilter),
    [codes, clientFilter]
  );

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  // Chart geometry
  const width = 720;
  const height = 260;
  const paddingLeft = 40;
  const paddingRight = 12;
  const paddingTop = 20;
  const paddingBottom = 32;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;
  const gap = 8;
  const barW = (chartW - gap * (buckets.length - 1)) / buckets.length;

  const clientColor = clientFilter === "all"
    ? "var(--accent)"
    : (codes.find((c) => c.brand === clientFilter)?.brandColor
        || colorForCode(codes.find((c) => c.brand === clientFilter)?.brandCode || clientFilter));

  // Y-axis ticks — pick a "nice" step
  const roundNice = (n) => {
    if (n <= 5) return 1;
    if (n <= 10) return 2;
    if (n <= 25) return 5;
    if (n <= 50) return 10;
    if (n <= 100) return 20;
    return Math.ceil(n / 100) * 25;
  };
  const step = roundNice(max);
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(Math.ceil(max / step) * step);
  const axisMax = ticks[ticks.length - 1];

  const currentBucketIndex = buckets.length - 1;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Creation trend</h2>
        <p className={styles.subtitle}>
          Codes created per month over the last 12 months. Filter by client to see individual workload patterns.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="ct-client">Client</label>
          <select
            id="ct-client"
            className={styles.select}
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all">All clients</option>
            {clients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className={styles.summary}>
          <span className={styles.summaryValue}>{total}</span>
          <span className={styles.summaryLabel}>
            {total === 1 ? "code" : "codes"} created in the last 12 months
          </span>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.chartWrap}>
          <svg
            className={styles.chart}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Bar chart of codes created per month"
          >
            {/* Y-axis grid & ticks */}
            {ticks.map((t) => {
              const y = paddingTop + chartH - (t / axisMax) * chartH;
              return (
                <g key={t}>
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={y}
                    y2={y}
                    stroke="var(--line)"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="var(--ink-1)"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {t}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {buckets.map((b, i) => {
              const h = (b.count / axisMax) * chartH;
              const x = paddingLeft + i * (barW + gap);
              const y = paddingTop + chartH - h;
              const isCurrent = i === currentBucketIndex;
              return (
                <g key={b.key}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={h}
                    rx="2"
                    fill={clientColor}
                    opacity={isCurrent ? 1 : 0.75}
                  >
                    <title>{`${b.label} ${b.year}: ${b.count} ${b.count === 1 ? "code" : "codes"}`}</title>
                  </rect>
                  {b.count > 0 && (
                    <text
                      x={x + barW / 2}
                      y={y - 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--ink)"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {b.count}
                    </text>
                  )}
                  <text
                    x={x + barW / 2}
                    y={paddingTop + chartH + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isCurrent ? "var(--ink)" : "var(--ink-1)"}
                    fontFamily="var(--font-mono, monospace)"
                    fontWeight={isCurrent ? 600 : 400}
                  >
                    {b.label}
                  </text>
                  {/* Show year label at year-transition points */}
                  {(i === 0 || buckets[i - 1].year !== b.year) && (
                    <text
                      x={x + barW / 2}
                      y={paddingTop + chartH + 28}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--ink-2)"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {b.year}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>
    </div>
  );
};

export default CreationTrend;
