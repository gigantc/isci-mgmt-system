import { useRef, useState, useMemo } from "react";
import { useResourceManager, useConfirmDialog } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import styles from "./UserManager.module.scss";

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
  </svg>
);
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>
  </svg>
);

const initialsFor = (u) => {
  const f = (u.firstName || "?").charAt(0);
  const l = (u.lastName || "").charAt(0);
  return `${f}${l}`.toUpperCase();
};

const avatarColor = (u) => {
  const seed = `${u.firstName || ""}${u.lastName || ""}${u.email || ""}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue}, 45%, 45%)`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${String(dt.getFullYear()).slice(2)}`;
};

const SortIcon = ({ col, sortBy, sortDir }) => (
  <span className={styles.sortIcon}>
    {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
  </span>
);

const UserManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const pendingDeleteRef = useRef(null);
  const originalStateRef = useRef(null);

  const {
    items: users,
    formData,
    errors,
    isLoading,
    showForm,
    editingItem: editingUser,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleNew,
    resetForm,
  } = useResourceManager("/api/users", {
    initialFormData: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      userType: "editor",
      active: true,
    },
    hasActiveToggle: true,
    validate: (data, list, editing) => {
      const e = {};
      if (!data.firstName.trim()) e.firstName = "First name is required";
      if (!data.lastName.trim()) e.lastName = "Last name is required";
      if (!data.email.trim()) {
        e.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        e.email = "Please enter a valid email";
      } else {
        const dup = list.some((u) => u.email === data.email && u.id !== editing?.id);
        if (dup) e.email = "This email is already in use";
      }
      if (!editing && !data.password) {
        e.password = "Password is required for new users";
      } else if (data.password && data.password.length < 6) {
        e.password = "Password must be at least 6 characters";
      }
      return e;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      userType: data.userType,
      active: true,
      createdAt: now,
      profileUpdatedAt: null,
      profileImage: null,
    }),
    updateItem: (existing, data, now) => ({
      ...existing,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      userType: data.userType,
      active: data.active,
      ...(data.password ? { password: data.password } : {}),
      profileUpdatedAt: now,
    }),
    confirmDelete: async () => {
      const user = pendingDeleteRef.current;
      return confirm({
        title: "Delete User",
        message: `Delete ${user?.firstName} ${user?.lastName} (${user?.email})? This can't be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        isDangerous: true,
      });
    },
  });

  const handleEditUser = (user) => {
    originalStateRef.current = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      active: user.active !== false, // normalise to boolean
    };
    handleEdit(user);
  };

  const handleDrawerClose = async () => {
    if (!editingUser) { resetForm(); return; }

    const isDirty =
      formData.password ||
      formData.firstName !== originalStateRef.current?.firstName ||
      formData.lastName !== originalStateRef.current?.lastName ||
      formData.email !== originalStateRef.current?.email ||
      formData.userType !== originalStateRef.current?.userType ||
      formData.active !== originalStateRef.current?.active;

    if (!isDirty) { resetForm(); return; }

    const shouldSave = await confirm({
      title: "Unsaved Changes",
      message: "You have unsaved changes. Save before closing?",
      confirmText: "Save Changes",
      cancelText: "Discard",
      isDangerous: false,
    });

    if (shouldSave) {
      handleSubmit();
    } else {
      resetForm();
    }
  };

  const doDelete = (user) => {
    if (showForm) resetForm();
    pendingDeleteRef.current = user;
    handleDelete(user);
  };

  const activeCount = users.filter((u) => u.active !== false).length;
  const inactiveCount = users.length - activeCount;
  const adminCount = users.filter((u) => u.userType === "admin").length;

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users.filter((u) => {
      if (filter === "active" && u.active === false) return false;
      if (filter === "inactive" && u.active !== false) return false;
      if (filter === "admin" && u.userType !== "admin") return false;
      if (q) {
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        return name.includes(q) || (u.email || "").toLowerCase().includes(q);
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      let av, bv;
      switch (sortBy) {
        case "email":
          av = a.email || ""; bv = b.email || ""; break;
        case "role":
          av = a.userType || ""; bv = b.userType || ""; break;
        case "created":
          av = new Date(a.createdAt).getTime() || 0;
          bv = new Date(b.createdAt).getTime() || 0;
          break;
        case "name":
        default:
          av = `${a.lastName} ${a.firstName}`.toLowerCase();
          bv = `${b.lastName} ${b.firstName}`.toLowerCase();
      }
      if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [users, search, filter, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const previewInitials =
    `${(formData.firstName || "").charAt(0)}${(formData.lastName || "").charAt(0)}`.toUpperCase() || "?";
  const previewColor = editingUser
    ? avatarColor(editingUser)
    : avatarColor({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email });

  return (
    <div className={styles.userManager}>
      <header className={styles.pgHead}>
        <div>
          <h1 className={styles.pgTitle}>Users</h1>
          <p className={styles.pgSub}>
            <strong>{displayed.length}</strong> of {users.length}
            {" · "}
            <strong>{activeCount}</strong> active
            {" · "}
            <strong>{adminCount}</strong> admin{adminCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
          + Add User
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterChips}>
          {[
            { id: "all", label: "All", count: users.length },
            { id: "active", label: "Active", count: activeCount },
            { id: "inactive", label: "Inactive", count: inactiveCount },
            { id: "admin", label: "Admins", count: adminCount },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              className={`${styles.chip} ${filter === id ? styles.chipOn : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
              <span className={styles.chipCount}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.emptyState}><p>Loading users…</p></div>
        ) : displayed.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No users {search || filter !== "all" ? "match" : "yet"}</h3>
            <p>
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Add your first user to get started."}
            </p>
            {!search && filter === "all" && (
              <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
                + Add User
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => toggleSort("name")}>
                  Name <SortIcon col="name" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th onClick={() => toggleSort("email")}>
                  Email <SortIcon col="email" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th onClick={() => toggleSort("role")}>
                  Role <SortIcon col="role" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th onClick={() => toggleSort("created")}>
                  Created <SortIcon col="created" sortBy={sortBy} sortDir={sortDir} />
                </th>
                <th>Status</th>
                <th style={{ width: 72 }} />
              </tr>
            </thead>
            <tbody>
              {displayed.map((u) => {
                const active = u.active !== false;
                return (
                  <tr key={u.id} className={active ? "" : styles.rowInactive}>
                    <td>
                      <div className={styles.nameCell}>
                        {u.profileImage ? (
                          <span className={styles.avatar}>
                            <img src={u.profileImage} alt={initialsFor(u)} className={styles.avatarImg} />
                          </span>
                        ) : (
                          <span className={styles.avatar} style={{ background: avatarColor(u) }}>
                            {initialsFor(u)}
                          </span>
                        )}
                        <span className={styles.name}>{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className={styles.email}>{u.email}</td>
                    <td>
                      <span className={`${styles.role} ${u.userType === "admin" ? styles.roleAdmin : ""}`}>
                        {u.userType === "admin" ? "Admin" : "Editor"}
                      </span>
                    </td>
                    <td className={styles.created}>{fmtDate(u.createdAt)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${active ? styles.statusActive : styles.statusInactive}`}>
                        <span className={styles.statusDot} />
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          title="Edit"
                          className={styles.actionBtn}
                          onClick={() => handleEditUser(u)}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => doDelete(u)}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={showForm}
        onClose={handleDrawerClose}
        title={editingUser ? "Edit User" : "Add User"}
        subtitle={
          editingUser
            ? `${editingUser.firstName} ${editingUser.lastName} · ${editingUser.email}`
            : "No invite email is sent"
        }
        footer={
          <>
            <div>
              {editingUser && (
                <button type="button" className={styles.btnDanger} onClick={() => doDelete(editingUser)}>
                  <IconTrash /> Delete
                </button>
              )}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnSecondary} onClick={handleDrawerClose}>
                Cancel
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSubmit}>
                {editingUser ? "Save Changes" : "Add User"}
              </button>
            </div>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.avatarPreview}>
            {editingUser?.profileImage ? (
              <div className={styles.avatarLg}>
                <img src={editingUser.profileImage} alt={previewInitials} className={styles.avatarImg} />
              </div>
            ) : (
              <div className={styles.avatarLg} style={{ background: previewColor }}>
                {previewInitials}
              </div>
            )}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="um-firstName">First Name <span className={styles.req}>*</span></label>
              <input
                type="text"
                id="um-firstName"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className={errors.firstName ? styles.inputError : ""}
                autoFocus
              />
              {errors.firstName && <span className={styles.fieldError}>{errors.firstName}</span>}
            </div>
            <div className={styles.field}>
              <label htmlFor="um-lastName">Last Name <span className={styles.req}>*</span></label>
              <input
                type="text"
                id="um-lastName"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className={errors.lastName ? styles.inputError : ""}
              />
              {errors.lastName && <span className={styles.fieldError}>{errors.lastName}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="um-email">Email <span className={styles.req}>*</span></label>
            <input
              type="email"
              id="um-email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              className={errors.email ? styles.inputError : ""}
            />
            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="um-userType">Role</label>
            <select
              id="um-userType"
              name="userType"
              value={formData.userType || "editor"}
              onChange={handleChange}
            >
              <option value="editor">Editor — can create and edit ISCI codes</option>
              <option value="admin">Admin — full access, manages clients &amp; users</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="um-password">
              Password{" "}
              {editingUser
                ? <span className={styles.fieldOptional}>(leave blank to keep current)</span>
                : <span className={styles.req}>*</span>
              }
            </label>
            <input
              type="password"
              id="um-password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder={editingUser ? "Leave blank to keep current" : "At least 6 characters"}
              className={errors.password ? styles.inputError : ""}
            />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </div>

          {editingUser && (
            <div className={styles.rowSwitch}>
              <div>
                <div className={styles.switchTitle}>Status</div>
                <div className={styles.switchHint}>
                  {formData.active
                    ? "Can sign in and create codes"
                    : "Cannot sign in. Existing codes unaffected."}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.toggleTrack} ${formData.active ? styles.toggleOn : ""}`}
                onClick={() => handleChange({ target: { name: "active", value: !formData.active } })}
                aria-pressed={formData.active}
                aria-label="Toggle active status"
              />
            </div>
          )}
        </form>
      </Drawer>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default UserManager;
