import { useNavigate } from "react-router";
import { AsideSection } from "@/components/CodeLayout";
import { IconCopy, IconDuplicate, IconLink } from "@/components/Icons";
import styles from "./QuickActions.module.scss";

const copyToClipboard = (text) => {
  if (navigator.clipboard) navigator.clipboard.writeText(text);
};

/**
 * Quick actions for an ISCI code, shown in the CodeLayout aside.
 * `canDuplicate` hides "Duplicate as new cutdown" for read-only users.
 */
const QuickActions = ({ code, canDuplicate = true }) => {
  const navigate = useNavigate();

  return (
    <AsideSection label="Quick actions">
      <div className={styles.list}>
        <button type="button" onClick={() => copyToClipboard(code.code)}>
          <IconCopy />
          Copy ISCI code
        </button>
        {canDuplicate && (
          <button
            type="button"
            onClick={() => navigate(`/create?from=${encodeURIComponent(code.code)}`)}
          >
            <IconDuplicate />
            Duplicate as new cutdown
          </button>
        )}
        <button type="button" onClick={() => copyToClipboard(window.location.href)}>
          <IconLink />
          Copy share link
        </button>
      </div>
    </AsideSection>
  );
};

export default QuickActions;
