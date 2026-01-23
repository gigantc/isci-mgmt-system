import { useState, useEffect, useCallback } from "react";
import { ISCIStatus } from "@/types/isci";
import { getUserSession } from "@/utils/auth";
import { useFetchData } from "@/hooks";
import styles from "./ISCIForm.module.scss";

const ISCIForm = ({ code, onSubmit, onCancel, allCodes, hideActions = false, hideTitle = false, formRef, viewOnly = false }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAirDateTbd, setIsAirDateTbd] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    brandId: "",
    assignedEditor: "",
    brand: "",
    campaignName: "",
    spotTitle: "",
    spotLength: "",
    description: "",
    language: "English",
    closedCaptioning: "No",
    audio: "Stereo LR",
    agency: "",
    airDate: "",
    aspectRatio: "16:9",
    version: "A",
    channel: "Broadcast",
    status: ISCIStatus.PENDING,
  });

  const [errors, setErrors] = useState({});

  const activeBrandsFilter = useCallback(
    (data) => data.filter(b => b.active),
    []
  );

  const activeAgenciesFilter = useCallback(
    (data) => data.filter(a => a.active),
    []
  );

  // Fetch brands, users, and agencies using useFetchData hook
  const { data: brands } = useFetchData("/api/brands", {
    filter: activeBrandsFilter
  });

  const { data: users } = useFetchData("/api/users");

  const { data: agencies } = useFetchData("/api/agencies", {
    filter: activeAgenciesFilter
  });

  useEffect(() => {
    setCurrentUser(getUserSession());
  }, []);

  // Set default agency when agencies load and we're creating a new code
  useEffect(() => {
    if (!code && agencies.length > 0) {
      const defaultAgency = agencies.find(a => a.isDefault);
      if (defaultAgency && !formData.agency) {
        setFormData(prev => ({ ...prev, agency: defaultAgency.name }));
      }
    }
  }, [agencies, code, formData.agency]);

  useEffect(() => {
    if (code) {
      const isTbdDate = code.airDate === "TBD";
      // Editing existing code
      setFormData({
        code: code.code,
        brandId: code.brandId || "",
        assignedEditor: code.assignedEditor || "",
        brand: code.brand,
        campaignName: code.campaignName || "",
        spotTitle: code.spotTitle,
        spotLength: code.spotLength || "",
        description: code.description || "",
        language: code.language || "English",
        closedCaptioning: code.closedCaptioning || "No",
        audio: code.audio || "Stereo LR",
        agency: code.agency || "",
        airDate: !code.airDate || isTbdDate ? "" : code.airDate.split('T')[0],
        aspectRatio: code.aspectRatio || "16:9",
        version: code.version || "A",
        channel: code.channel || "Broadcast",
        status: code.status,
      });
      setIsAirDateTbd(isTbdDate);
    } else {
      setIsAirDateTbd(false);
    }
  }, [code]);

  // Sort users with current user first, then alphabetically
  const getSortedUsers = () => {
    if (!users || users.length === 0) return [];

    const currentUserFullName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : null;

    const sorted = [...users].sort((a, b) => {
      const aFullName = `${a.firstName} ${a.lastName}`;
      const bFullName = `${b.firstName} ${b.lastName}`;

      // Current user always first
      if (currentUserFullName) {
        if (aFullName === currentUserFullName) return -1;
        if (bFullName === currentUserFullName) return 1;
      }

      // Then alphabetically by full name
      return aFullName.localeCompare(bFullName);
    });

    return sorted;
  };

  const generateISCICode = (brandCode) => {
    const currentYear = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year

    // Find all codes for this brand in the current year
    const brandCodes = allCodes.filter(c => {
      const codeStart = `${brandCode}${currentYear}`;
      return c.code.startsWith(codeStart);
    });

    // Extract the numbers and find the highest
    let highestNumber = 0;
    brandCodes.forEach(c => {
      const match = c.code.match(new RegExp(`${brandCode}${currentYear}(\\d+)`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNumber) {
          highestNumber = num;
        }
      }
    });

    // Increment and pad with zeros (2 or 3 digits)
    const nextNumber = highestNumber + 1;
    const paddedNumber = nextNumber < 100 ? nextNumber.toString().padStart(2, '0') : nextNumber.toString();

    return `${brandCode}${currentYear}${paddedNumber}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "ISCI code is required";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand/Client is required";
    }

    if (!formData.spotTitle.trim()) {
      newErrors.spotTitle = "Spot Title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    const selectedBrand = brands.find(b => b.id === brandId);

    if (selectedBrand) {
      const generatedCode = generateISCICode(selectedBrand.code);
      setFormData(prev => ({
        ...prev,
        brandId: brandId,
        brand: selectedBrand.name,
        code: generatedCode,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        brandId: "",
        brand: "",
        code: "",
      }));
    }

    if (errors.brand) {
      setErrors(prev => ({ ...prev, brand: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === "airDate" && value) {
      setIsAirDateTbd(false);
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleAirDateTbdChange = (e) => {
    const checked = e.target.checked;
    setIsAirDateTbd(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, airDate: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        airDate: isAirDateTbd ? "TBD" : formData.airDate,
      });
    }
  };

  return (
    <div className={styles.isciFormContainer}>
      {!hideTitle && (
        <h2>{code ? "Edit ISCI Code" : "Create New ISCI Code"}</h2>
      )}

      <form onSubmit={handleSubmit} className={styles.isciForm} ref={formRef}>

        {/* FULL-WIDTH SECTION: Basic Details */}
        <div className={`${styles.formSection} ${styles.formSectionFull}`}>
          <h3 className={styles.sectionTitle}>Basic Details</h3>

          {/* Brand and ISCI Code side-by-side */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="brand">Brand / Client *</label>
              {code ? (
                // When editing, show brand as text (can't change brand)
                <input
                  type="text"
                  value={formData.brand}
                  disabled
                  className={styles.disabledInput}
                />
              ) : (
                // When creating, show dropdown
                <select
                  id="brand"
                  name="brand"
                  value={formData.brandId}
                  onChange={handleBrandChange}
                  className={errors.brand ? "error" : ""}
                >
                  <option value="">Select a brand...</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} ({brand.code})
                    </option>
                  ))}
                </select>
              )}
              {errors.brand && <span className={styles.errorMessage}>{errors.brand}</span>}
              {!code && brands.length === 0 && (
                <span className={styles.helpText}>No brands available. <a href="/admin">Add brands in Admin Panel</a></span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="code">ISCI Code *</label>
              {code ? (
                // When editing, show ISCI code as text (can't change code)
                <input
                  type="text"
                  value={formData.code}
                  disabled
                  className={styles.disabledInput}
                  title="ISCI codes cannot be changed after creation"
                />
              ) : (
                // When creating, show as read-only auto-generated field
                <>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Auto-generated"
                    maxLength={12}
                    readOnly
                    className={`${errors.code ? "error" : ""} ${styles.readonlyInput}`}
                    title="Auto-generated based on brand selection"
                  />
                  {errors.code && <span className={styles.errorMessage}>{errors.code}</span>}
                  <span className={styles.helpText}>Auto-generated: [BRAND][YEAR][NUMBER]</span>
                </>
              )}
            </div>
          </div>

          {/* Campaign Name full-width */}
          <div className={styles.formGroup}>
            <label htmlFor="campaignName">Campaign Name</label>
            <input
              type="text"
              id="campaignName"
              name="campaignName"
              value={formData.campaignName}
              onChange={handleChange}
              placeholder="Campaign Name"
              disabled={viewOnly}
            />
          </div>
        </div>

        {/* 2x2 GRID: Four Half-Width Sections */}
        <div className={styles.formSectionsRow}>

          {/* TOP LEFT: Status */}
          <div className={`${styles.formSection} ${styles.formSectionHalf}`}>
            <h3 className={styles.sectionTitle}>Status</h3>

            {/* Assigned Editor full-width */}
            <div className={styles.formGroup}>
              <label htmlFor="assignedEditor">Assigned Editor</label>
              <select
                id="assignedEditor"
                name="assignedEditor"
                value={formData.assignedEditor}
                onChange={handleChange}
                disabled={viewOnly}
              >
                <option value="">Select Editor</option>
                {getSortedUsers().map(user => {
                  const fullName = `${user.firstName} ${user.lastName}`;
                  return (
                    <option key={user.id} value={fullName}>
                      {fullName}
                      {currentUser && fullName === `${currentUser.firstName} ${currentUser.lastName}` ? ' (You)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Air Date and Status side-by-side */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="airDate">Date (Air/Start Date)</label>
                <input
                  type="date"
                  id="airDate"
                  name="airDate"
                  value={formData.airDate}
                  onChange={handleChange}
                  disabled={viewOnly || isAirDateTbd}
                />
                <label className={styles.tbdToggle}>
                  <input
                    type="checkbox"
                    checked={isAirDateTbd}
                    onChange={handleAirDateTbdChange}
                    disabled={viewOnly}
                  />
                  TBD
                </label>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value={ISCIStatus.PENDING}>Pending</option>
                  <option value={ISCIStatus.IN_PROGRESS}>In Progress</option>
                  <option value={ISCIStatus.IN_REVIEW}>In Review</option>
                  <option value={ISCIStatus.COMPLETED}>Completed</option>
                  <option value={ISCIStatus.ARCHIVED}>Archived</option>
                </select>
              </div>
            </div>

            {/* Agency full-width */}
            <div className={styles.formGroup}>
              <label htmlFor="agency">Agency</label>
              <select
                id="agency"
                name="agency"
                value={formData.agency}
                onChange={handleChange}
                disabled={viewOnly}
              >
                <option value="">Select Agency</option>
                {agencies.map(agency => (
                  <option key={agency.id} value={agency.name}>
                    {agency.name}{agency.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TOP RIGHT: Spot Details */}
          <div className={`${styles.formSection} ${styles.formSectionHalf}`}>
            <h3 className={styles.sectionTitle}>Spot Details</h3>

            <div className={styles.formGroup}>
              <label htmlFor="spotTitle">Spot Title *</label>
              <input
                type="text"
                id="spotTitle"
                name="spotTitle"
                value={formData.spotTitle}
                onChange={handleChange}
                placeholder="e.g., LVCVA_New Fab Trailer_30s_Hartbeat_No Disclaimer"
                className={errors.spotTitle ? "error" : ""}
                disabled={viewOnly}
              />
              {errors.spotTitle && <span className={styles.errorMessage}>{errors.spotTitle}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description / Notes</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Additional details about this project..."
                rows={3}
                disabled={viewOnly}
              />
            </div>
          </div>

          {/* BOTTOM LEFT: Audio Information */}
          <div className={`${styles.formSection} ${styles.formSectionHalf}`}>
            <h3 className={styles.sectionTitle}>Audio Information</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="language">Language</label>
              <input
                type="text"
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="English"
                disabled={viewOnly}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="closedCaptioning">Closed Captioning</label>
                <select
                  id="closedCaptioning"
                  name="closedCaptioning"
                  value={formData.closedCaptioning}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="audio">Audio</label>
                <input
                  type="text"
                  id="audio"
                  name="audio"
                  value={formData.audio}
                  onChange={handleChange}
                  placeholder="Stereo LR"
                  disabled={viewOnly}
                />
              </div>
            </div>
          </div>

          {/* BOTTOM RIGHT: Technical Details */}
          <div className={`${styles.formSection} ${styles.formSectionHalf}`}>
            <h3 className={styles.sectionTitle}>Technical Details</h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="aspectRatio">Aspect Ratio</label>
                <select
                  id="aspectRatio"
                  name="aspectRatio"
                  value={formData.aspectRatio}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1</option>
                  <option value="2.39:1">2.39:1</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="version">Version / Cut</label>
                <select
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>
            </div>


            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="spotLength">Spot Length (seconds)</label>
                <select
                  id="spotLength"
                  name="spotLength"
                  value={formData.spotLength}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select length</option>
                  <option value="6">06</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="channel">Output: Channel</label>
                <select
                  id="channel"
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="Broadcast">Broadcast</option>
                  <option value="CTV">CTV</option>
                  <option value="Digital">Digital</option>
                  <option value="Social">Social</option>
                  <option value="OLV">OLV</option>
                  <option value="Radio">Radio</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        {!hideActions && (
          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit}>
              {code ? "Update" : "Create"} ISCI Code
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ISCIForm;
