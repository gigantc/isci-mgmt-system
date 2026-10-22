import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { saveUserSession } from "@/utils/auth";
import { useSession } from "@/hooks";
import CodeLayout, { AsideSection } from "@/components/CodeLayout";
import DefaultProfileImage from "@/assets/default_profile_image.jpg";
import styles from "./Profile.module.scss";

const Profile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user: sessionUser, ready, roleLabel } = useSession();

  useEffect(() => {
    if (!ready) return;
    if (!sessionUser) {
      navigate("/login");
    } else {
      setCurrentUser(sessionUser);
      setFormData({
        firstName: sessionUser.firstName || "",
        lastName: sessionUser.lastName || "",
        email: sessionUser.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [navigate, ready, sessionUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File too large. Maximum size is 5MB.");
        return;
      }

      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to change password");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Use FormData for file upload
      const submitData = new FormData();
      submitData.append("id", currentUser.id);
      submitData.append("firstName", formData.firstName);
      submitData.append("lastName", formData.lastName);
      submitData.append("email", formData.email);
      if (formData.newPassword) {
        submitData.append("password", formData.newPassword);
      }
      if (formData.currentPassword) {
        submitData.append("currentPassword", formData.currentPassword);
      }
      if (profileImageFile) {
        submitData.append("profileImage", profileImageFile);
      }

      const response = await fetch("/api/user", {
        method: "PUT",
        body: submitData, // FormData, no Content-Type header needed
      });

      const data = await response.json();

      if (data.success) {
        // Update session with new user data
        saveUserSession(data.user);
        setSuccess("Profile updated successfully!");

        // Clear password fields and image preview
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
        setProfileImageFile(null);
        setProfileImagePreview(null);

        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <CodeLayout
      crumbs={[
        { label: "Dashboard", to: "/" },
        { label: "Profile" },
      ]}
      title="Edit profile"
      subtitle={
        currentUser
          ? `${currentUser.email}${currentUser.userType ? ` · ${roleLabel}` : ""}`
          : null
      }
      loading={!ready}
      aside={
        <AsideSection label="Account">
          <dl className={styles.accountList}>
            <div>
              <dt>User type</dt>
              <dd>{roleLabel}</dd>
            </div>
            <div>
              <dt>Account created</dt>
              <dd>{formatDate(currentUser?.createdAt)}</dd>
            </div>
            <div>
              <dt>Last profile update</dt>
              <dd>{formatDate(currentUser?.profileUpdatedAt)}</dd>
            </div>
          </dl>
        </AsideSection>
      }
      headerActions={
        <>
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.profileForm}>
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            {success}
          </div>
        )}

        {/* Personal information and profile image, side by side */}
        <div className={styles.formSectionsRow}>
          <div className={styles.formSection}>
            <h3>Personal information</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">First name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName">Last name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Profile image</h3>
            <p className={styles.sectionNote}>JPEG, PNG, GIF, or WebP (max 5MB)</p>

            <div className={styles.imageUploadSection}>
              <div className={styles.currentImage}>
                <img
                  src={profileImagePreview || currentUser?.profileImage || DefaultProfileImage}
                  alt="Profile"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="profileImage">Upload new image</label>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Change password</h3>
          <p className={styles.sectionNote}>Leave blank to keep current password</p>

          <div className={styles.formGroup}>
            <label htmlFor="currentPassword">Current password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Required to change password"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">New password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="At least 6 characters"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>
      </form>
    </CodeLayout>
  );
};

export default Profile;
