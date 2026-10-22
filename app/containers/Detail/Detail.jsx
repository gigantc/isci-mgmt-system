import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import ISCIForm from "@/components/ISCIForm";
import Slate from "@/components/Slate";
import CodeLayout from "@/components/CodeLayout";
import QuickActions from "@/components/QuickActions";
import ActivityFeed from "@/components/ActivityFeed";
import { IconCopy, IconEdit, IconLink } from "@/components/Icons";
import { getUserSession, saveUserSession } from "@/utils/auth";
import { useSession } from "@/hooks";
import { formatAirDateDot } from "@/utils/dates";

/**
 * Detail Container
 *
 * Read-only view of an ISCI code at /isci/:code.
 * Admin users see an "Edit" button that routes to /edit/:code.
 * Non-admin users already get read-only EditISCI, so this path is primarily
 * used as the default row-click target from the dashboard.
 */
const Detail = () => {
  const navigate = useNavigate();
  const { code: isciCode } = useParams();
  const { user: sessionUser, ready, canEdit: userCanEdit } = useSession();

  const [code, setCode] = useState(null);
  const [allCodes, setAllCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = formatAirDateDot;

  useEffect(() => {
    if (ready && !sessionUser) {
      navigate("/login");
    }
  }, [navigate, ready, sessionUser]);

  useEffect(() => {
    loadData();
  }, [isciCode]);

  useEffect(() => {
    if (code && isciCode) {
      const trackView = async () => {
        const user = getUserSession();
        if (user) {
          try {
            const response = await fetch("/api/user/recently-viewed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id, isciCode }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.recentlyViewed) {
                const updatedUser = { ...user, recentlyViewed: data.recentlyViewed };
                saveUserSession(updatedUser);
              }
            }
          } catch (err) {
            console.error("Error tracking recently viewed:", err);
          }
        }
      };
      trackView();
    }
  }, [code, isciCode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/isci");
      if (!response.ok) throw new Error("Failed to load ISCI codes");
      const data = await response.json();
      setAllCodes(data);
      const found = data.find((c) => c.code === isciCode);
      if (!found) {
        setError(`ISCI code "${isciCode}" not found`);
        return;
      }
      setCode(found);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subtitle = code
    ? `${code.brand}${code.campaignName ? ` · ${code.campaignName}` : ""}${code.createdAt ? ` · Created ${formatDate(code.createdAt)}` : ""}${code.createdBy ? ` by ${code.createdBy}` : ""}`
    : null;

  return (
    <CodeLayout
      crumbs={[
        { label: "Dashboard", to: "/" },
        { label: isciCode },
      ]}
      title={
        <>
          ISCI <code>{isciCode}</code>
        </>
      }
      badge={{ label: "Read only", tone: "neutral" }}
      subtitle={subtitle}
      loading={isLoading || !ready}
      loadingText="Loading ISCI code…"
      error={error}
      headerActions={
        code && (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(code.code); }}
            >
              <IconCopy /> Copy code
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(window.location.href); }}
            >
              <IconLink /> Share
            </button>
            {userCanEdit && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate(`/edit/${isciCode}`)}
              >
                <IconEdit /> Edit
              </button>
            )}
          </>
        )
      }
      aside={
        code && (
          <>
            <Slate code={code} />
            <QuickActions code={code} canDuplicate={userCanEdit} />
            <ActivityFeed code={code} />
          </>
        )
      }
    >
      <ISCIForm
        code={code}
        onSubmit={() => {}}
        onCancel={() => navigate("/")}
        allCodes={allCodes}
        hideActions={true}
        hideTitle={true}
        viewOnly={true}
      />
    </CodeLayout>
  );
};

export default Detail;
