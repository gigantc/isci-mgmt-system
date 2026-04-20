import { useState, useMemo } from "react";
import { useResourceManager, useConfirmDialog } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import styles from "./UserManager.module.scss";

const ROLE_FILTERS = [
  { id: "all", label: "All" },
  { id: "admin", label: "Admin" },
  { id: "editor", label: "Editor" },
];

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

const UserManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

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
      ...(data.password ? { password: data.password } : {}),
      profileUpdatedAt: now,
    }),
  });

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users.filter((u) => {
      if (roleFilter !== "all" && u.userType !== roleFilter) return false;
      if (!q) return true;
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      return name.includes(q) || (u.email || "").toLowerCase().includes(q);
    });

    list = [...list].sort((a, b) => {
      let av;
      let bv;
      switch (sortBy) {
        case "email":
          av = a.email || "";
          bv = b.email || "";
          break;
        case "role":
          av = a.userType || "";
          bv = b.userType || "";
          break;
        case "created":
          av = new Date(a.createdAt).getTime() || 0;
          bv = new Date(b.createdAt).getTime() || 0;
          break;
        case "lastActive":
          av = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
          bv = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
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
  }, [users, search, roleFilter, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const sortIndicator = (col) => (sortBy === col ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return (
    <div className={styles.userManager}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.chips} role="group" aria-label="Role filter">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`${styles.chip} ${roleFilter === r.id ? styles.chipActive : ""}`}
              onClick={() => setRoleFilter(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <button type="button" className="btn-primary" onClick={handleNew}>
          + Add User
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>Loading users…</div>
      ) : displayed.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No users match</h3>
          <p>Try a different search or role filter.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => toggleSort("name")}>Name{sortIndicator("name")}</th>
                <th onClick={() => toggleSort("email")}>Email{sortIndicator("email")}</th>
                <th onClick={() => toggleSort("role")}>Role{sortIndicator("role")}</th>
                <th onClick={() => toggleSort("lastActive")}>Last Active{sortIndicator("lastActive")}</th>
                <th>Status</th>
                <th style={{ width: 64 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((u) => {
                const active = u.active !== false;
                return (
                  <tr key={u.id} className={active ? "" : styles.rowInactive}>
                    <td>
                      <div className={styles.nameCell}>
                        <span className={styles.avatar} style={{ background: avatarColor(u) }}>
                          {initialsFor(u)}
                        </span>
                        <span className={styles.name}>
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </td>
                    <td className={styles.email}>{u.email}</td>
                    <td>
                      <span className={`${styles.role} ${u.userType === "admin" ? styles.roleAdmin : ""}`}>
                        {u.userType === "admin" ? "Admin" : "Editor"}
                      </span>
                    </td>
                    <td className={styles.created}>
                      {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.statusToggle} ${active ? styles.statusActive : styles.statusInactive}`}
                        onClick={() => handleToggleActive(u)}
                        aria-pressed={active}
                        title={active ? "Deactivate user" : "Activate user"}
                      >
                        <span className={styles.statusDot} />
                        {active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => handleEdit(u)}
                          title="Edit"
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={showForm}
        onClose={resetForm}
        title={editingUser ? "Edit User" : "Add User"}
        subtitle={editingUser ? editingUser.email : "No invite email is sent"}
        footer={
          <>
            <button type="button" className="btn-text" onClick={resetForm}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSubmit}>
              {editingUser ? "Save Changes" : "Add User"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className={errors.firstName ? styles.inputError : ""}
              />
              {errors.firstName && <span className={styles.fieldError}>{errors.firstName}</span>}
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className={errors.lastName ? styles.inputError : ""}
              />
              {errors.lastName && <span className={styles.fieldError}>{errors.lastName}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              className={errors.email ? styles.inputError : ""}
            />
            {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="userType">Role</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType || "editor"}
              onChange={handleChange}
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="password">
              Password {editingUser ? "(leave blank to keep current)" : ""}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              placeholder={editingUser ? "Leave blank to keep current" : "At least 6 characters"}
              className={errors.password ? styles.inputError : ""}
            />
            {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </div>
        </form>
      </Drawer>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default UserManager;
