import { useState, useEffect } from "react";
import styles from "./UserManager.module.scss";

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userType: "editor"
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else {
      // Check for duplicate email
      const isDuplicate = users.some(
        u => u.email === formData.email && u.id !== editingUser?.id
      );
      if (isDuplicate) {
        newErrors.email = "This email is already in use";
      }
    }

    // Password is required only for new users
    if (!editingUser && !formData.password) {
      newErrors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const now = new Date().toISOString();
    let updatedUsers;

    if (editingUser) {
      // Update existing user
      updatedUsers = users.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              userType: formData.userType,
              // Only update password if provided
              ...(formData.password ? { password: formData.password } : {}),
              profileUpdatedAt: now
            }
          : u
      );
    } else {
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        createdAt: now,
        profileUpdatedAt: null,
        profileImage: null
      };
      updatedUsers = [...users, newUser];
    }

    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUsers),
      });
      setUsers(updatedUsers);
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "", // Don't pre-fill password
      userType: user.userType
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    const updatedUsers = users.filter(u => u.id !== id);

    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUsers),
      });
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const resetForm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        userType: "editor"
      });
      setEditingUser(null);
      setErrors({});
      setShowForm(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

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
                  onClick={() => setShowForm(true)}
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
    </div>
  );
};

export default UserManager;
