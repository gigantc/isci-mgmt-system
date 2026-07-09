import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useFetchData } from "@/hooks";
import { colorForCode } from "@/utils/palette";
import styles from "./CutdownFamilies.module.scss";

/**
 * CutdownFamilies
 *
 * Reports → Insights → Cutdown families. Groups codes that share the
 * same client + campaign + spot title, and lists their available lengths.
 * Useful for licensing conversations ("what lengths do we have of X?")
 * and for spotting missing cutdown variants.
 */

const buildFamilies = (codes) => {
  const map = new Map();

  for (const code of codes) {
    const client = code.brand || "—";
    const campaign = (code.campaignName || "").trim();
    const title = (code.spotTitle || "").trim();
    // Normalize key so casing/whitespace differences don't split a family.
    const key = [client, campaign.toLowerCase(), title.toLowerCase()].join("|");

    if (!map.has(key)) {
      map.set(key, {
        key,
        client,
        campaign: campaign || null,
        title: title || "Untitled",
        brandCode: code.brandCode,
        brandColor: code.brandColor,
        members: [],
      });
    }
    map.get(key).members.push(code);
  }

  return Array.from(map.values())
    .map((family) => {
      // Sort members by length ascending, nulls last.
      const members = [...family.members].sort((a, b) => {
        const la = a.spotLength ?? Number.POSITIVE_INFINITY;
        const lb = b.spotLength ?? Number.POSITIVE_INFINITY;
        return la - lb;
      });
      const mostRecent = members.reduce((newest, m) => {
        const t = Date.parse(m.updatedAt || m.createdAt || 0) || 0;
        return t > newest ? t : newest;
      }, 0);
      return { ...family, members, mostRecent };
    });
};

const CutdownFamilies = () => {
  const navigate = useNavigate();
  const { data: codes, loading } = useFetchData("/api/isci");

  const [filter, setFilter] = useState("cutdowns"); // "cutdowns" | "all"
  const [sort, setSort] = useState("recent"); // "recent" | "count" | "client"

  const families = useMemo(() => buildFamilies(codes || []), [codes]);

  const visible = useMemo(() => {
    let list = families;
    if (filter === "cutdowns") list = list.filter((f) => f.members.length >= 2);

    if (sort === "recent") list = [...list].sort((a, b) => b.mostRecent - a.mostRecent);
    else if (sort === "count") list = [...list].sort((a, b) => b.members.length - a.members.length);
    else if (sort === "client") list = [...list].sort((a, b) => a.client.localeCompare(b.client));

    return list;
  }, [families, filter, sort]);

  const cutdownCount = families.filter((f) => f.members.length >= 2).length;
  const totalGroups = families.length;

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Cutdown families</h2>
        <p className={styles.subtitle}>
          Codes that share the same client, campaign, and spot title, grouped so you can see all the lengths you have of a given spot.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="cf-filter">Show</label>
          <select
            id="cf-filter"
            className={styles.select}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="cutdowns">Families with 2+ lengths ({cutdownCount})</option>
            <option value="all">All spots ({totalGroups})</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="cf-sort">Sort by</label>
          <select
            id="cf-sort"
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Most recent activity</option>
            <option value="count">Most cutdowns</option>
            <option value="client">Client (A→Z)</option>
          </select>
        </div>
      </div>

      <section className={styles.card}>
        {visible.length === 0 ? (
          <div className={styles.emptyState}>
            {filter === "cutdowns"
              ? "No cutdown families yet. Duplicate a code as a cutdown to build one."
              : "No spots yet."}
          </div>
        ) : (
          <ul className={styles.familyList}>
            {visible.map((family) => (
              <li key={family.key} className={styles.family}>
                <div className={styles.familyHead}>
                  <span
                    className={styles.clientDot}
                    style={{ background: family.brandColor || colorForCode(family.brandCode || family.client) }}
                  />
                  <div className={styles.familyHeadText}>
                    <div className={styles.familyTitle}>{family.title}</div>
                    <div className={styles.familyMeta}>
                      {family.client}
                      {family.campaign ? ` · ${family.campaign}` : ""}
                    </div>
                  </div>
                  <span className={styles.familyCount}>
                    {family.members.length} {family.members.length === 1 ? "length" : "lengths"}
                  </span>
                </div>
                <div className={styles.members}>
                  {family.members.map((code) => (
                    <button
                      key={code.id}
                      type="button"
                      className={styles.member}
                      onClick={() => navigate(`/isci/${code.code}`)}
                      title={`${code.code} · ${code.channel || ""}`}
                    >
                      <span className={styles.memberLength}>
                        {code.spotLength ? `${code.spotLength}s` : "—"}
                      </span>
                      <span className={styles.memberCode}>{code.code}</span>
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CutdownFamilies;
