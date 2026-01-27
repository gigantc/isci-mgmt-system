import { useResourceManager, useConfirmDialog } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "./UserManager.module.scss";

const UserManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const {
    items: users,
    formData,
    errors,
    isLoading,
    showForm,
    isClosing,
    editingItem: editingUser,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleNew,
    resetForm
  } = useResourceManager("/api/users", {
    initialFormData: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      userType: "editor"
    },
    validate: (data, users, editingUser) => {
      const newErrors = {};

      if (!data.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }

      if (!data.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }

      if (!data.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        newErrors.email = "Please enter a valid email address";
      } else {
        // Check for duplicate email
        const isDuplicate = users.some(
          u => u.email === data.email && u.id !== editingUser?.id
        );
        if (isDuplicate) {
          newErrors.email = "This email is already in use";
        }
      }

      // Password is required only for new users
      if (!editingUser && !data.password) {
        newErrors.password = "Password is required for new users";
      } else if (data.password && data.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      return newErrors;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      userType: data.userType,
      createdAt: now,
      profileUpdatedAt: null,
      profileImage: null
    }),
    updateItem: (existingUser, data, now) => ({
      ...existingUser,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      userType: data.userType,
      // Only update password if provided
      ...(data.password ? { password: data.password } : {}),
      profileUpdatedAt: now
    }),
    confirmDelete: async () => {
      return await confirm({
        title: "Delete User",
        message: "Are you sure you want to delete this user? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        isDangerous: true,
      });
    }
  });

  return (
    <div className={styles.userManager}>
      {isLoading ? (
        <div className={styles.loadingState}>Loading users...</div>
      ) : (
        <>
          {showForm && (
            <div className={`${styles.userFormSection} ${isClosing ? styles.closing : ''}`}>
              <div className={styles.formHeader}>
                <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={resetForm}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>
            <form onSubmit={handleSubmit} className={styles.userForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g., John"
                    className={errors.firstName ? "error" : ""}
                  />
                  {errors.firstName && <span className={styles.errorMessage}>{errors.firstName}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g., Doe"
                    className={errors.lastName ? "error" : ""}
                  />
                  {errors.lastName && <span className={styles.errorMessage}>{errors.lastName}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g., john.doe@isciz.com"
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="userType">User Type *</label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="password">
                    Password {editingUser ? "(leave blank to keep current)" : "*"}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={editingUser ? "Leave blank to keep current" : "At least 6 characters"}
                    className={errors.password ? "error" : ""}
                  />
                  {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit}>
                  {editingUser ? "Update" : "Add"} User
                </button>
              </div>
            </form>
            </div>
          )}

          <div className={styles.usersListSection}>
            <div className={styles.listHeader}>
              <h2>All Users ({users.length})</h2>
              {!showForm && (
                <button
                  className={styles.btnAddNew}
                  onClick={handleNew}
                >
                  + Add New User
                </button>
              )}
            </div>
            {users.length === 0 ? (
              <p className={styles.emptyState}>No users yet. Add your first one above!</p>
            ) : (
              <div className={styles.usersTableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>User Type</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.firstName} {user.lastName}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`${styles.typeBadge} ${user.userType === "admin" ? styles.admin : styles.editor}`}>
                            {user.userType === "admin" ? "Admin" : "Editor"}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className={styles.actionsCell}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => handleEdit(user)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() => handleDelete(user.id)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default UserManager;
