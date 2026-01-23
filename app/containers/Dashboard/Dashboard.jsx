import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import ISCIList from "@/components/ISCIList";
import { isAuthenticated, getUserSession, isAdmin } from "@/utils/auth";
import { useFetchData } from "@/hooks";
import styles from "./Dashboard.module.scss";

/**
 * ISCIDashboard Container
 *
 * This is the BRAIN of the operation! 🧠
 * It's the main dashboard that coordinates everything:
 *   - Loads all ISCI codes from the server
 *   - Manages creating, editing, and deleting codes
 *   - Handles the search functionality
 *   - Decides whether to show the list or the form
 *
 * Think of this as the conductor of an orchestra, except the orchestra is made
 * of React components and the music is... ISCI codes? (The metaphor got weird, but you get it!)
 */
const Dashboard = () => {
  const navigate = useNavigate();

  /**
   * STATE VARIABLES
   * These are like the component's memory - they remember stuff between renders.
   * When any of these change, React re-renders the component to show the new data.
   */

  // Current logged in user
  const [currentUser, setCurrentUser] = useState(null);

  // What's the user typing in the search box?
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch ISCI codes using useFetchData hook
  const { data: codes, loading: isLoading, refetch: loadCodes } = useFetchData("/api/isci");

  /**
   * useEffect Hook - Check authentication and load user
   */
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      setCurrentUser(getUserSession());
    }
  }, [navigate]);

  /**
   * useEffect Hook - Reload codes and user data when returning to the page
   *
   * This listens for when the page becomes visible again (e.g., after navigating back from edit)
   * and reloads the codes and user data to show the latest changes
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCodes();
        // Reload user session to get updated recentlyViewed
        const updatedUser = getUserSession();
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      }
    };

    const handleFocus = () => {
      loadCodes();
      // Reload user session to get updated recentlyViewed
      const updatedUser = getUserSession();
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    };

    // Listen for visibility changes and window focus
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadCodes]);

  /**
   * handleDeleteCode
   *
   * DANGER ZONE! 🚨 Permanently deletes an ISCI code.
   * We ask for confirmation first because we're not monsters.
   */
  const handleDeleteCode = async (id) => {
    // Show a browser confirmation dialog
    if (!confirm("Are you sure you want to delete this ISCI code?")) {
      return; // User cancelled - do nothing
    }

    try {
      const response = await fetch("/api/isci", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success! Refetch codes to update local state
        loadCodes();
      } else {
        console.error("Failed to delete ISCI code:", result.error);
        // TODO: Show an error toast notification
      }
    } catch (error) {
      console.error("Error deleting ISCI code:", error);
      // TODO: Show an error toast notification
    }
  };

  /**
   * filteredCodes
   *
   * This is where the search magic happens! ✨
   * We filter the codes based on what's in the search box.
   * Searches in: ISCI code, brand, spot title, and assigned editor.
   *
   * The "?." is called optional chaining - it means "only try to call toLowerCase()
   * if assignedEditor exists" (prevents errors if someone isn't assigned yet)
   */
  const filteredCodes = codes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.spotTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.assignedEditor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine the dynamic section title based on current view
  const getSectionTitle = () => {
    if (isLoading) return "Loading...";
    return "Dashboard";
  };

  // TIME TO RENDER! 🎨
  return (
    <div className={styles.isciDashboard}>

      {/* Main content area - shows different things based on the current state */}
      <div className={styles.dashboardContent}>
        {/* Sticky header section with title and search */}
        <div className={styles.stickyHeader}>
          <h2>{getSectionTitle()}</h2>
          {!isLoading && (
            <div className={styles.searchBarRow}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Search by code, brand, spot title, or editor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className={styles.btnCreateNew}
                onClick={() => navigate("/create")}
              >
                + New ISCI Code
              </button>
            </div>
          )}
        </div>

        {/* Scrollable content area */}
        <div className={styles.scrollableContent}>
          {isLoading ? (
            // LOADING STATE: Show a loading message while we fetch data
            <div className={styles.loadingState}>Loading Dashboard...</div>
          ) : (
            // LIST STATE: Show the list of codes
            <ISCIList
              codes={filteredCodes}
              onDelete={handleDeleteCode}
            />
          )}
        </div>
      </div>

      <div className={styles.dashBoxes}>
        <div className={styles.recentBox}>
          <h3>Recently Viewed</h3>
          <div className={styles.recentItems}>
            {currentUser && currentUser.recentlyViewed && currentUser.recentlyViewed.length > 0 ? (
              currentUser.recentlyViewed
                .slice(0, 5)
                .map(isciCode => {
                  const code = codes.find(c => c.code === isciCode);
                  if (!code) return null;
                  return (
                    <div key={code.id} className={styles.recentItem}>
                      <div className={styles.recentItemInfo}>
                        <span className={styles.recentCode}>{code.code}</span>
                        {/* <span className={styles.recentCampaign}>{code.campaignName || 'No campaign'}</span> */}
                        <span className={styles.recentTitle}>{code.spotTitle}</span>
                      </div>
                      <a href={`/edit/${code.code}`} className={styles.recentEditBtn}>
                        {isAdmin() ? "Edit" : "View"}
                      </a>
                    </div>
                  );
                })
                .filter(item => item !== null)
            ) : (
              <p className={styles.emptyState}>No recent items</p>
            )}
          </div>
        </div>

        <div className={styles.recentBox}>
          <h3>Assigned Projects</h3>
          <div className={styles.recentItems}>
            {currentUser && codes.length > 0 ? (
              (() => {
                const assignedCodes = codes
                  .filter(code => code.assignedEditor === `${currentUser.firstName} ${currentUser.lastName}`)
                  .sort((a, b) => {
                    // Sort by Air Date (most recent first)
                    if (!a.airDate && !b.airDate) return 0;
                    if (!a.airDate) return 1;
                    if (!b.airDate) return -1;
                    return new Date(b.airDate) - new Date(a.airDate);
                  })
                  .slice(0, 5);

                if (assignedCodes.length === 0) {
                  return <p className={styles.emptyState}>No assigned projects</p>;
                }

                return assignedCodes.map(code => (
                  <div key={code.id} className={styles.recentItem}>
                    <div className={styles.recentItemInfo}>
                      <span className={styles.recentCode}>{code.code}</span>
                      <span className={styles.recentTitle}>{code.spotTitle}</span>
                    </div>
                    <a href={`/edit/${code.code}`} className={styles.recentEditBtn}>
                      {isAdmin() ? "Edit" : "View"}
                    </a>
                  </div>
                ));
              })()
            ) : (
              <p className={styles.emptyState}>No assigned projects</p>
            )}
          </div>
        </div>

        <div className={styles.recentBox}>
          <h3>Recently Created</h3>
          <div className={styles.recentItems}>
            {codes.length > 0 ? (
              (() => {
                const recentlyCoded = [...codes]
                  .sort((a, b) => {
                    // Sort by createdAt (most recent first)
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  })
                  .slice(0, 5);

                if (recentlyCoded.length === 0) {
                  return <p className={styles.emptyState}>No codes created yet</p>;
                }

                return recentlyCoded.map(code => (
                  <div key={code.id} className={styles.recentItem}>
                    <div className={styles.recentItemInfo}>
                      <span className={styles.recentCode}>{code.code}</span>
                      <span className={styles.recentTitle}>{code.spotTitle}</span>
                    </div>
                    <a href={`/edit/${code.code}`} className={styles.recentEditBtn}>
                      {isAdmin() ? "Edit" : "View"}
                    </a>
                  </div>
                ));
              })()
            ) : (
              <p className={styles.emptyState}>No codes created yet</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
