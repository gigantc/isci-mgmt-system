import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import ISCIForm from "@/components/ISCIForm";
import Slate from "@/components/Slate";
import CodeLayout from "@/components/CodeLayout";
import QuickActions from "@/components/QuickActions";
import ActivityFeed from "@/components/ActivityFeed";
import { getUserSession, saveUserSession } from "@/utils/auth";
import { useSession } from "@/hooks";
import { formatClockTime } from "@/utils/dates";

/**
 * EditISCI Container
 *
 * Dedicated container for editing/viewing an existing ISCI code.
 * Shows read-only view for non-admins and edit mode for admins.
 * This component is decoupled from the Dashboard so it can be accessed
 * from multiple places in the application.
 */
const EditISCI = () => {
  const navigate = useNavigate();
  const { code: isciCode } = useParams();
  const formRef = useRef(null);
  const { user: sessionUser, ready, isViewer, canEdit: userCanEdit } = useSession();

  const [code, setCode] = useState(null);
  const [allCodes, setAllCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!sessionUser) {
      navigate("/login");
      return;
    }
    if (isViewer && isciCode) {
      navigate(`/isci/${isciCode}`, { replace: true });
    }
  }, [navigate, isciCode, ready, sessionUser, isViewer]);

  useEffect(() => {
    loadData();
  }, [isciCode]);

  /**
   * Track this ISCI code as recently viewed
   */
  useEffect(() => {
    if (code && isciCode) {
      const trackView = async () => {
        const user = getUserSession();
        if (user) {
          try {
            const response = await fetch("/api/user/recently-viewed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                isciCode: isciCode
              })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.recentlyViewed) {
                // Update the user session with the new recentlyViewed array
                const updatedUser = { ...user, recentlyViewed: data.recentlyViewed };
                saveUserSession(updatedUser);
              }
            }
          } catch (error) {
            console.error("Error tracking recently viewed:", error);
            // Don't block the UI if tracking fails
          }
        }
      };
      trackView();
    }
  }, [code, isciCode]);

  /**
   * Load both the specific code being edited and all codes
   * (needed for the form's validation/auto-generation)
   */
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all ISCI codes
      const response = await fetch("/api/isci");
      if (!response.ok) throw new Error("Failed to load ISCI codes");

      const data = await response.json();
      setAllCodes(data);

      // Find the specific code to edit by ISCI code
      const codeToEdit = data.find(c => c.code === isciCode);
      if (!codeToEdit) {
        setError(`ISCI code "${isciCode}" not found`);
        return;
      }

      setCode(codeToEdit);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save the updated code to the server
   */
  const handleUpdateCode = async (formData) => {
    if (!code) return;

    const user = getUserSession();
    const userDisplayName = user ? `${user.firstName} ${user.lastName}` : "";

    const updatedCode = {
      ...code,
      ...formData,
      updatedBy: userDisplayName || null,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/isci", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCode),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success! Navigate back to dashboard
        navigate("/");
      } else {
        console.error("Failed to save ISCI code:", result.error);
        // TODO: Show error message to user
      }
    } catch (err) {
      console.error("Error saving ISCI code:", err);
      // TODO: Show error toast notification
    }
  };

  /**
   * Cancel editing and return to dashboard
   */
  const handleCancel = () => {
    navigate("/");
  };

  /**
   * Trigger form submission from header button
   */
  const handleSubmitClick = () => {
    if (formRef.current) {
      if (typeof formRef.current.requestSubmit === "function") {
        formRef.current.requestSubmit();
      } else {
        formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }
  };

  const subtitle = code
    ? `${code.brand}${code.campaignName ? ` · ${code.campaignName}` : ""}${code.spotLength ? ` · ${code.spotLength}s` : ""}`
    : null;

  return (
    <CodeLayout
      crumbs={[
        { label: "Dashboard", to: "/" },
        { label: code?.brand || "ISCI", to: `/isci/${isciCode}` },
        { label: isciCode },
        { label: userCanEdit ? "Edit" : "View" },
      ]}
      title={
        <>
          <code>{isciCode}</code>
          {code?.spotTitle && <span>{code.spotTitle}</span>}
        </>
      }
      badge={{
        label: userCanEdit ? "Editing" : "Read-only",
        tone: userCanEdit ? "accent" : "neutral",
      }}
      subtitle={subtitle}
      loading={isLoading || !ready}
      loadingText="Loading ISCI code…"
      error={error}
      aside={
        code && (
          <>
            <Slate code={code} />
            <QuickActions code={code} />
            <ActivityFeed code={code} />
          </>
        )
      }
      footerStatus={{
        tone: "saved",
        text: (
          <>
            All changes saved
            {code?.updatedAt && <> · {formatClockTime(code.updatedAt)}</>}
          </>
        ),
      }}
      footerActions={
        <>
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            {userCanEdit ? "Cancel" : "Back"}
          </button>
          {userCanEdit && (
            <button type="button" className="btn-primary" onClick={handleSubmitClick}>
              Update ISCI
            </button>
          )}
        </>
      }
    >
      <ISCIForm
        code={code}
        onSubmit={handleUpdateCode}
        onCancel={handleCancel}
        allCodes={allCodes}
        hideActions={true}
        hideTitle={true}
        formRef={formRef}
        viewOnly={!userCanEdit}
      />
    </CodeLayout>
  );
};

export default EditISCI;
