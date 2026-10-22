import { AsideSection } from "@/components/CodeLayout";
import { formatClockTime, formatTimestampDot } from "@/utils/dates";
import styles from "./ActivityFeed.module.scss";

const getEditHistory = (code) => {
  if (!code || !code.editHistory) return [];
  if (Array.isArray(code.editHistory)) return code.editHistory;
  try {
    const parsed = JSON.parse(code.editHistory);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ActivityRow = ({ user, timestamp, text, isNew = false }) => (
  <li>
    <span className={`${styles.dot} ${isNew ? styles.dotNew : ""}`} aria-hidden="true" />
    <div>
      <p className={styles.head}>
        <strong>{user || "Unknown"}</strong>
        <span>· {formatTimestampDot(timestamp)} · {formatClockTime(timestamp)}</span>
      </p>
      <p className={styles.text}>{text}</p>
    </div>
  </li>
);

/**
 * Creation and edit history for an ISCI code, shown in the CodeLayout aside.
 */
const ActivityFeed = ({ code }) => (
  <AsideSection label="Activity">
    <ul className={styles.feed}>
      <ActivityRow
        user={code.createdBy}
        timestamp={code.createdAt}
        text={`Created ISCI ${code.code}`}
        isNew
      />
      {getEditHistory(code)
        .slice()
        .reverse()
        .map((entry, index) => (
          <ActivityRow
            key={`${entry.timestamp}-${index}`}
            user={entry.user}
            timestamp={entry.timestamp}
            text={entry.description || "Edited record"}
          />
        ))}
    </ul>
  </AsideSection>
);

export default ActivityFeed;
