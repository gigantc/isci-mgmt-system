import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ISCIForm from "@/components/ISCIForm";
import CodeLayout, { AsideSection } from "@/components/CodeLayout";
import { getUserSession } from "@/utils/auth";
import { useSession } from "@/hooks";
import { generateUUID } from "@/utils/uuid";
import styles from "./CreateISCI.module.scss";

/**
 * Fields carried over when duplicating a code as a new cutdown.
 * Spot Length and Air Date are intentionally omitted — those differ
 * per cutdown. The ISCI code itself is auto-regenerated from the brand.
 */
const CUTDOWN_TEMPLATE_FIELDS = [
  "brandId",
  "brand",
  "placementId",
  "placement",
  "campaignName",
  "jobNumber",
  "spotTitle",
  "description",
  "language",
  "closedCaptioning",
  "audio",
  "fileFormat",
  "agency",
  "market",
  "aspectRatio",
  "musicRights",
];

/**
 * CreateISCI Container
 *
 * Dedicated container for creating a new ISCI code.
 * This component is decoupled from the Dashboard.
 */
const CreateISCI = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);

  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fromCode = searchParams.get("from");

  const template = useMemo(() => {
    if (!fromCode || codes.length === 0) return null;
    const source = codes.find((c) => c.code === fromCode);
    if (!source) return null;
    const seed = {};
    for (const field of CUTDOWN_TEMPLATE_FIELDS) {
      if (source[field] !== undefined && source[field] !== null) {
        seed[field] = source[field];
      }
    }
    return seed;
  }, [fromCode, codes]);

  const { user: sessionUser, ready, isViewer } = useSession();

  useEffect(() => {
    if (!ready) return;
    if (!sessionUser) {
      navigate("/login");
      return;
    }
    if (isViewer) {
      navigate("/");
    }
  }, [navigate, ready, sessionUser, isViewer]);

  useEffect(() => {
    loadCodes();
  }, []);

  /**
   * Load all ISCI codes (needed for auto-generation)
   */
  const loadCodes = async () => {
    try {
      const response = await fetch("/api/isci");
      if (response.ok) {
        const data = await response.json();
        setCodes(data);
      }
    } catch (error) {
      console.error("Error loading ISCI codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save the new code to the server
   */
  const handleCreateCode = async (formData) => {
    const user = getUserSession();
    const userDisplayName = user ? `${user.firstName} ${user.lastName}` : "";

    const newCode = {
      id: generateUUID(),
      ...formData,
      createdBy: userDisplayName || null,
      updatedBy: userDisplayName || null,
      editHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/isci", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCode),
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
   * Cancel creating and return to dashboard
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

  return (
    <CodeLayout
      crumbs={[
        { label: "Dashboard", to: "/" },
        { label: "New ISCI code" },
      ]}
      title="Create ISCI code"
      badge={{ label: template ? "Cutdown" : "New", tone: template ? "accent" : "ok" }}
      subtitle={
        template
          ? `Duplicating from ${fromCode}. Adjust length and air date.`
          : "Select a client to auto-generate the code."
      }
      loading={isLoading}
      aside={
        <>
          <AsideSection label="Slate preview">
            <p className={styles.slateHint}>
              The slate becomes available once the ISCI is saved.
            </p>
          </AsideSection>
          <AsideSection label="Tips">
            <ul className={styles.tipList}>
              <li>Select a <strong>Client</strong> to auto-generate the code.</li>
              <li><strong>Spot title</strong> is required.</li>
              <li>Leave the <strong>Air / start date</strong> blank and check TBD if unknown.</li>
            </ul>
          </AsideSection>
        </>
      }
      footerStatus={{ tone: "draft", text: "Draft · not saved" }}
      footerActions={
        <>
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmitClick}>
            Create ISCI
          </button>
        </>
      }
    >
      <ISCIForm
        code={null}
        initialData={template}
        onSubmit={handleCreateCode}
        onCancel={handleCancel}
        allCodes={codes}
        hideActions={true}
        hideTitle={true}
        formRef={formRef}
      />
    </CodeLayout>
  );
};

export default CreateISCI;
