import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useFetchData, useSession } from "@/hooks";
import Export from "./Export";
import Import from "./Import";
import Matrix from "./Matrix";
import styles from "./Tools.module.scss";

const TAB_KEY = "isciz-tools-tab";

// Sidebar groups. Add a tool by adding an item here and rendering it below.
const GROUPS = [
  {
    label: "Production",
    items: [{ id: "matrix", label: "Deliverables matrix", adminOnly: false }],
  },
  {
    label: "Data",
    items: [
      { id: "export", label: "Export", adminOnly: false },
      { id: "import", label: "Import", adminOnly: true },
    ],
  },
];

const Tools = () => {
  const navigate = useNavigate();
  const { user, ready, isViewer, isAdmin: isUserAdmin } = useSession();
  const [activeTab, setActiveTab] = useState("matrix");

  const { data: codes, loading: codesLoading, refetch: loadData } = useFetchData("/api/isci");
  const { data: brands, loading: brandsLoading } = useFetchData("/api/brands");
  const { data: placements } = useFetchData("/api/placements");
  const isLoading = codesLoading || brandsLoading;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (isViewer) {
      navigate("/");
      return;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(TAB_KEY);
      const isAdmin = isUserAdmin;
      if (
        stored === "matrix" ||
        stored === "export" ||
        (stored === "import" && isAdmin)
      ) {
        setActiveTab(stored);
      }
    }
  }, [navigate, ready, user, isViewer, isUserAdmin]);

  const handleSelect = (id) => {
    setActiveTab(id);
    if (typeof window !== "undefined") window.localStorage.setItem(TAB_KEY, id);
  };

  return (
    <div className={styles.toolsPage}>
      <aside className={styles.sidebar}>
        {GROUPS.map((g) => (
          <div key={g.label} className={styles.sbGroup}>
            <div className={styles.sbLabel}>{g.label}</div>
            {g.items.filter((s) => !s.adminOnly || isUserAdmin).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`${styles.sbItem} ${activeTab === s.id ? styles.sbItemOn : ""}`}
                onClick={() => handleSelect(s.id)}
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className={styles.main}>
        <div className={styles.scrollableContent}>
          {activeTab === "matrix" && (
            <Matrix brands={brands} placements={placements} onSaved={loadData} />
          )}
          {activeTab === "export" && (
            <Export
              codes={codes}
              brands={brands}
              placements={placements}
              isLoading={isLoading}
            />
          )}
          {activeTab === "import" && isUserAdmin && (
            <Import onImported={loadData} />
          )}
        </div>

        <footer className={styles.footer}>
          <div>
            {activeTab === "matrix" && "Deliverables matrix"}
            {activeTab === "export" && `${codes.length} ${codes.length === 1 ? "code" : "codes"} available`}
            {activeTab === "import" && "CSV import"}
          </div>
          <div>
            Tools ·{" "}
            <button type="button" className={styles.footerLink} onClick={() => navigate("/")}>
              Back to Dashboard →
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Tools;
