import { useNavigate } from "react-router";
import { colorForCode } from "@/utils/palette";
import { NO_JOB_KEY, cardEntries, cardMeta } from "@/utils/grouping";
import { IconEdit } from "@/components/Icons";
import styles from "./FamilyCards.module.scss";

/**
 * FamilyCards
 *
 * The Dashboard's grouped view: one card per family (client + campaign + spot title)
 * or per job. Pills open a code (the full edit for editors, the read-only view for
 * viewers); "Edit family" / "Edit job" opens the bulk editor for the whole group.
 */

const countLabel = (card, noun, nounPlural) =>
  card.members.length < card.all.length
    ? `${card.members.length} of ${card.all.length} shown`
    : `${card.all.length} ${card.all.length === 1 ? noun : nounPlural}`;

const FamilyCards = ({ codes, allCodes, mode, canEdit, onEdit, density = "comfy" }) => {
  const navigate = useNavigate();
  const cards = cardEntries(codes, allCodes, mode);

  if (cards.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No ISCI codes found. Create your first one to get started!</p>
      </div>
    );
  }

  const pill = (code) => (
    <button
      key={code.id}
      type="button"
      className={styles.pill}
      onClick={() => navigate(canEdit ? `/edit/${code.code}` : `/isci/${code.code}`)}
      aria-label={`Open ${code.code}${code.spotLength ? `, ${code.spotLength}s` : ""}`}
      title={`${code.code} · ${code.placement?.name || ""}`}
    >
      <span className={styles.length}>{code.spotLength ? `${code.spotLength}s` : "N/A"}</span>
      <span className={styles.code}>{code.code}</span>
    </button>
  );

  return (
    <ul className={`${styles.cards} ${density === "compact" ? styles.compact : ""}`}>
      {cards.map((card) => {
        const meta = cardMeta(card.all);
        const isJob = mode === "job";
        const noJob = card.key === NO_JOB_KEY;
        const ids = card.all.map((c) => c.id);
        return (
          <li key={card.key} className={styles.card}>
            <div className={styles.head}>
              <span className={styles.dot} style={{ background: meta.first.brandColor || colorForCode(meta.first.brandCode || meta.first.brand) }} />
              <div className={styles.headText}>
                {isJob ? (
                  <>
                    <h3 className={styles.title}>
                      {noJob ? "No job number" : <span className={styles.mono}>{meta.first.jobNumber}</span>}
                      {!noJob && ` · ${meta.clients.length === 1 ? meta.clients[0] : `${meta.clients.length} clients`}`}
                    </h3>
                    <p className={styles.sub}>
                      {noJob && meta.clients.length === 1 ? `${meta.clients[0]}` : ""}
                      {noJob && meta.clients.length > 1 ? `${meta.clients.length} clients` : ""}
                      {!noJob && (meta.campaigns.length === 0 ? "No campaign" : meta.campaigns.length === 1 ? meta.campaigns[0] : `${meta.campaigns.length} campaigns`)}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className={styles.title}>{meta.title}</h3>
                    <p className={styles.sub}>
                      {meta.clients[0]}
                      {meta.campaigns[0] ? ` · ${meta.campaigns[0]}` : ""}
                    </p>
                  </>
                )}
              </div>
            </div>

            <span className={styles.badge}>{isJob ? countLabel(card, "code", "codes") : countLabel(card, "cut", "cuts")}</span>

            {isJob ? (
              <div className={styles.lines}>
                {card.lines.map((line) => (
                  <div key={line.title} className={styles.line}>
                    <span className={styles.lineTitle}>{line.title || "Untitled"}</span>
                    <div className={styles.pills}>{line.codes.map(pill)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.pills}>{card.members.map(pill)}</div>
            )}

            {/* A single code is edited from its pill; bulk edit needs 2+. */}
            {canEdit && ids.length > 1 && (
              <button
                type="button"
                className={`btn-secondary ${styles.edit}`}
                onClick={() => onEdit?.(ids)}
              >
                <IconEdit /> {isJob ? (noJob ? "Edit codes" : "Edit job") : "Edit family"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default FamilyCards;
