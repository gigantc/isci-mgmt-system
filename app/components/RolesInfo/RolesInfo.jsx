import styles from "./RolesInfo.module.scss";

/**
 * RolesInfo
 *
 * Read-only reference view describing each user role, what it's used for,
 * and what it can / can't do. Rendered in the Admin panel under the
 * "System → Roles" sidebar item. Roles themselves are defined in code
 * (see app/utils/auth.js), so this view stays in sync with those helpers.
 */

const ROLES = [
  {
    id: "admin",
    name: "Admin",
    tagline: "Full access. Manages the system and everyone in it.",
    usedFor:
      "Anyone responsible for maintaining the system itself, including the client list, user accounts, and overall integrity of the codes. This role should be limited to a small group.",
    can: [
      "Create, edit, and delete ISCI codes",
      "Manage clients, agencies, and users",
      "Import and export CSVs from the Reports panel",
      "Assign roles to other users",
    ],
    cannot: [
      "Bypass the auto-generated ISCI code format",
    ],
  },
  {
    id: "editor",
    name: "Editor",
    tagline: "Day-to-day producers and traffic. Can create and edit, but not delete.",
    usedFor:
      "Anyone actively creating cutdowns and updating spot metadata as part of their day-to-day work. This is the most common role.",
    can: [
      "Create new ISCI codes and duplicate as cutdowns",
      "Edit any existing ISCI code",
      "View the Reports panel and export CSVs",
    ],
    cannot: [
      "Delete ISCI codes",
      "Import CSVs (Reports import is admin-only)",
      "Access the Admin panel (clients, agencies, users)",
    ],
  },
  {
    id: "viewer",
    name: "Viewer",
    tagline: "Read-only. Can look but not touch.",
    usedFor:
      "Anyone who needs visibility into the codes but should not be changing anything. Also useful for onboarding new team members before granting edit access.",
    can: [
      "Browse the Dashboard and view any ISCI code",
      "Copy ISCI codes and File Names",
      "See the Slate preview",
    ],
    cannot: [
      "Create, edit, or delete ISCI codes",
      "Access the Reports panel",
      "Access the Admin panel",
    ],
  },
];

const RolesInfo = () => {
  return (
    <div className={styles.rolesInfo}>
      <header className={styles.header}>
        <h2 className={styles.title}>Roles</h2>
        <p className={styles.subtitle}>
          Every user in the system is assigned one of three roles. Roles control what a user can see and do.
          Change a user's role from the Users panel.
        </p>
      </header>

      <div className={styles.grid}>
        {ROLES.map((role) => (
          <section key={role.id} className={`${styles.card} ${styles[`card-${role.id}`]}`}>
            <div className={styles.cardHead}>
              <h3 className={styles.roleName}>{role.name}</h3>
              <p className={styles.tagline}>{role.tagline}</p>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Used for</div>
                <p className={styles.sectionText}>{role.usedFor}</p>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionLabel}>Can</div>
                <ul className={`${styles.list} ${styles.listCan}`}>
                  {role.can.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionLabel}>Cannot</div>
                <ul className={`${styles.list} ${styles.listCannot}`}>
                  {role.cannot.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default RolesInfo;
