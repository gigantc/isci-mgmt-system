import { useMemo } from "react";
import { useFetchData } from "@/hooks";
import { colorForCode } from "@/utils/palette";
import styles from "./PlacementMix.module.scss";

/**
 * PlacementMix
 *
 * Reports → Insights → Placement mix. Client × placement matrix so you
 * can see the medium breakdown per client at a glance.
 */

const buildMatrix = (codes) => {
  const clientMap = new Map();
  const placementSet = new Set();

  for (const code of codes) {
    const client = code.brand || "—";
    const placement = code.placement?.name || "—";
    placementSet.add(placement);
    if (!clientMap.has(client)) {
      clientMap.set(client, {
        client,
        brandCode: code.brandCode,
        brandColor: code.brandColor,
        counts: new Map(),
        total: 0,
      });
    }
    const row = clientMap.get(client);
    row.counts.set(placement, (row.counts.get(placement) || 0) + 1);
    row.total += 1;
  }

  const placements = Array.from(placementSet).sort((a, b) => a.localeCompare(b));
  const rows = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);
  const totals = placements.map((p) => rows.reduce((sum, r) => sum + (r.counts.get(p) || 0), 0));
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return { placements, rows, totals, grandTotal };
};

const PlacementMix = () => {
  const { data: codes, loading } = useFetchData("/api/isci");
  const matrix = useMemo(() => buildMatrix(codes || []), [codes]);

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Placement mix by client</h2>
        <p className={styles.subtitle}>
          How your codes are distributed across placements for each client.
        </p>
      </header>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>By client</h3>
          <span className={styles.cardBadge}>
            {matrix.grandTotal} {matrix.grandTotal === 1 ? "code" : "codes"} total
          </span>
        </div>

        {matrix.rows.length === 0 ? (
          <div className={styles.emptyState}>No codes yet.</div>
        ) : (
          <div className={styles.matrixWrap}>
            <table className={styles.matrix}>
              <thead>
                <tr>
                  <th className={styles.matrixClientHead}>Client</th>
                  {matrix.placements.map((p) => (
                    <th key={p} className={styles.matrixCellHead}>{p}</th>
                  ))}
                  <th className={`${styles.matrixCellHead} ${styles.matrixTotalHead}`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.client}>
                    <td className={styles.matrixClient}>
                      <span
                        className={styles.clientDot}
                        style={{ background: row.brandColor || colorForCode(row.brandCode || row.client) }}
                      />
                      {row.client}
                    </td>
                    {matrix.placements.map((p) => {
                      const count = row.counts.get(p) || 0;
                      return (
                        <td key={p} className={`${styles.matrixCell} ${count === 0 ? styles.matrixCellEmpty : ""}`}>
                          {count || "—"}
                        </td>
                      );
                    })}
                    <td className={`${styles.matrixCell} ${styles.matrixTotal}`}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className={styles.matrixClient}>All clients</td>
                  {matrix.totals.map((t, i) => (
                    <td key={i} className={`${styles.matrixCell} ${styles.matrixTotal}`}>
                      {t || "—"}
                    </td>
                  ))}
                  <td className={`${styles.matrixCell} ${styles.matrixTotal}`}>{matrix.grandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default PlacementMix;
