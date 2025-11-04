import { useState, useEffect } from "react";
import { ISCIStatus } from "@/types/isci";
import ISCIList from "@/components/ISCIList";
import ISCIForm from "@/components/ISCIForm";
import Header from "@/containers/Header";
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
  /**
   * STATE VARIABLES
   * These are like the component's memory - they remember stuff between renders.
   * When any of these change, React re-renders the component to show the new data.
   */

  // All the ISCI codes we've loaded from the server
  const [codes, setCodes] = useState([]);

  // The code we're currently editing (null if we're creating a new one)
  const [selectedCode, setSelectedCode] = useState(null);

  // Are we showing the form right now? (true) Or the list? (false)
  const [showForm, setShowForm] = useState(false);

  // What's the user typing in the search box?
  const [searchTerm, setSearchTerm] = useState("");

  // Are we still loading data from the server? (shows a loading message)
  const [isLoading, setIsLoading] = useState(true);

  /**
   * useEffect Hook - Runs when the component first loads
   *
   * The empty array [] at the end means "only run this once when the component mounts"
   * It's like saying "Hey React, when this component appears on screen, load the codes!"
   */
  useEffect(() => {
    loadCodes();
  }, []);

  /**
   * loadCodes
   *
   * Fetches all ISCI codes from the server API.
   * This is an async function because talking to the server takes time!
   * (The internet isn't instant, despite what your cat videos would have you believe)
   */
  const loadCodes = async () => {
    try {
      // Make a GET request to our API endpoint
      const response = await fetch("/api/isci");

      if (response.ok) {
        // If the server says "here's your data!", parse it from JSON
        const data = await response.json();
        setCodes(data);  // Store it in our state
      }
    } catch (error) {
      // Uh oh, something went wrong! Log it to the console.
      console.error("Error loading ISCI codes:", error);
      // TODO: Maybe show an error message to the user?
    } finally {
      // Whether we succeeded or failed, we're done loading!
      setIsLoading(false);
    }
  };

  /**
   * saveCodes
   *
   * Saves the entire array of codes back to the server.
   * We send ALL the codes, not just the ones that changed.
   * (Simple but not super efficient - future devs might want to improve this!)
   */
  const saveCodes = async (updatedCodes) => {
    try {
      // Make a POST request with the updated codes
      const response = await fetch("/api/isci", {
        method: "POST",                              // POST = "I'm sending you data"
        headers: {
          "Content-Type": "application/json",        // "This data is JSON, FYI"
        },
        body: JSON.stringify(updatedCodes),          // Turn our array into a JSON string
      });

      if (response.ok) {
        // Success! Update our local state to match what we just saved
        setCodes(updatedCodes);
      } else {
        console.error("Failed to save ISCI codes");
      }
    } catch (error) {
      console.error("Error saving ISCI codes:", error);
      // TODO: Show an error toast notification?
    }
  };

  /**
   * handleCreateCode
   *
   * Called when the user submits the form to CREATE a new ISCI code.
   * We generate a unique ID and timestamps, then add it to the list!
   */
  const handleCreateCode = (formData) => {
    // Build the new code object
    const newCode = {
      id: crypto.randomUUID(),                  // Generate a unique ID (looks like: "a1b2c3d4-...")
      ...formData,                              // Spread all the form data into this object
      createdAt: new Date().toISOString(),      // Right now! (ISO format: "2024-01-15T10:00:00.000Z")
      updatedAt: new Date().toISOString(),      // Also right now!
    };

    // Add it to the array and save
    const updatedCodes = [...codes, newCode];   // [...codes, newCode] = "copy all existing codes, then add the new one"
    saveCodes(updatedCodes);

    // Hide the form (back to the list view)
    setShowForm(false);
  };

  /**
   * handleUpdateCode
   *
   * Called when the user submits the form to UPDATE an existing ISCI code.
   * We merge the new data with the old data, update the timestamp, and save!
   */
  const handleUpdateCode = (formData) => {
    // Safety check: If somehow there's no selected code, bail out
    if (!selectedCode) return;

    // Build the updated code object
    const updatedCode = {
      ...selectedCode,                          // Start with all the old data
      ...formData,                              // Overwrite with new data from the form
      updatedAt: new Date().toISOString(),      // Update the "last modified" timestamp

      // Special case: If they just marked it as completed, set the completedAt timestamp
      // Otherwise, keep the old completedAt value (or undefined if it was never completed)
      completedAt: formData.status === ISCIStatus.COMPLETED
        ? new Date().toISOString()
        : selectedCode.completedAt,
    };

    // Replace the old code with the updated one in the array
    // .map() loops through and replaces the matching ID
    const updatedCodes = codes.map(code =>
      code.id === selectedCode.id ? updatedCode : code
    );

    saveCodes(updatedCodes);

    // Clean up and hide the form
    setSelectedCode(null);
    setShowForm(false);
  };

  /**
   * handleDeleteCode
   *
   * DANGER ZONE! 🚨 Permanently deletes an ISCI code.
   * We ask for confirmation first because we're not monsters.
   */
  const handleDeleteCode = (id) => {
    // Show a browser confirmation dialog
    if (confirm("Are you sure you want to delete this ISCI code?")) {
      // Filter out the code with the matching ID
      // .filter() keeps everything EXCEPT the one we want to delete
      const updatedCodes = codes.filter(code => code.id !== id);
      saveCodes(updatedCodes);
    }
    // If they clicked "Cancel", nothing happens! Crisis averted.
  };

  /**
   * handleEditCode
   *
   * User clicked the "Edit" button on a code.
   * Remember which code they want to edit and show the form!
   */
  const handleEditCode = (code) => {
    setSelectedCode(code);   // "Remember this code, we're editing it!"
    setShowForm(true);        // "Show me the form!"
  };

  /**
   * handleCancelForm
   *
   * User clicked "Cancel" on the form. No harm, no foul!
   * Just forget what we were doing and go back to the list.
   */
  const handleCancelForm = () => {
    setSelectedCode(null);   // "Forget which code we were editing"
    setShowForm(false);       // "Hide the form, show the list"
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

  // TIME TO RENDER! 🎨
  return (
    <div className={styles.isciDashboard}>

      <Header isLoading={isLoading} setShowForm={setShowForm} />

      {/* Main content area - shows different things based on the current state */}
      <div className={styles.dashboardContent}>
        <h2>Dashboard</h2>
        {isLoading ? (
          // LOADING STATE: Show a loading message while we fetch data
          <div className={styles.loadingState}>Loading ISCI codes...</div>
        ) : showForm ? (
          // FORM STATE: Show the create/edit form
          <ISCIForm
            code={selectedCode}                                       // Pass the code being edited (or null for create)
            onSubmit={selectedCode ? handleUpdateCode : handleCreateCode}  // Different handlers for create vs update
            onCancel={handleCancelForm}                               // What to do if they cancel
            allCodes={codes}                                          // Pass all codes for auto-generation logic
          />
        ) : (
          // LIST STATE: Show the search bar and the list of codes
          <>
            {/* Search bar */}
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search by code, brand, spot title, or editor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}  // Update search term as they type
              />
            </div>

            {/* The list of ISCI codes (filtered by search term) */}
            <ISCIList
              codes={filteredCodes}           // Pass the filtered codes
              onEdit={handleEditCode}          // What to do when they click Edit
              onDelete={handleDeleteCode}      // What to do when they click Delete
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
