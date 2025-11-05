import { useState, useEffect } from "react";
import { ISCIStatus } from "@/types/isci";
import styles from "./ISCIForm.module.scss";

const ISCIForm = ({ code, onSubmit, onCancel, allCodes, hideActions = false, hideTitle = false, formRef }) => {
  const [brands, setBrands] = useState([]);
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
    airDate: "",
    aspectRatio: "16:9",
    version: "A",
    channel: "Broadcast",
    status: ISCIStatus.PENDING,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (code) {
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
        airDate: code.airDate ? code.airDate.split('T')[0] : "",
        aspectRatio: code.aspectRatio || "16:9",
        version: code.version || "A",
        channel: code.channel || "Broadcast",
        status: code.status,
      });
    }
  }, [code]);

  const loadBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      const data = await response.json();
      // Only show active brands
      setBrands(data.filter(b => b.active));
    } catch (error) {
      console.error("Error loading brands:", error);
    }
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

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className={styles.isciFormContainer}>
      {!hideTitle && (
        <h2>{code ? "Edit ISCI Code" : "Create New ISCI Code"}</h2>
      )}

      <form onSubmit={handleSubmit} className={styles.isciForm} ref={formRef}>

        {/* Brand/Client - Full width */}
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

        {/* Row 1: ISCI Code and Assigned Editor */}
        <div className={styles.formRow}>
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

          <div className={styles.formGroup}>
            <label htmlFor="assignedEditor">Assigned Editor</label>
            <input
              type="text"
              id="assignedEditor"
              name="assignedEditor"
              value={formData.assignedEditor}
              onChange={handleChange}
              placeholder="Editor Name"
            />
          </div>
        </div>

        {/* Row 2: Campaign Name and Spot Length */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="campaignName">Campaign Name</label>
            <input
              type="text"
              id="campaignName"
              name="campaignName"
              value={formData.campaignName}
              onChange={handleChange}
              placeholder="Campaign Name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="spotLength">Spot Length (seconds)</label>
            <select
              id="spotLength"
              name="spotLength"
              value={formData.spotLength}
              onChange={handleChange}
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
        </div>

        {/* Spot Title - Full width */}
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
          />
          {errors.spotTitle && <span className="error-message">{errors.spotTitle}</span>}
        </div>

        {/* Description/Notes */}
        <div className={styles.formGroup}>
          <label htmlFor="description">Description / Notes</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Additional details about this project..."
            rows={3}
          />
        </div>

        {/* Row 3: Language and Closed Captioning */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="language">Language</label>
            <input
              type="text"
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              placeholder="English"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="closedCaptioning">Closed Captioning</label>
            <select
              id="closedCaptioning"
              name="closedCaptioning"
              value={formData.closedCaptioning}
              onChange={handleChange}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {/* Row 4: Audio and Air Date */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="audio">Audio</label>
            <input
              type="text"
              id="audio"
              name="audio"
              value={formData.audio}
              onChange={handleChange}
              placeholder="Stereo LR"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="airDate">Date (Air/Start Date)</label>
            <input
              type="date"
              id="airDate"
              name="airDate"
              value={formData.airDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Row 5: Aspect Ratio and Version/Cut */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="aspectRatio">Aspect Ratio</label>
            <select
              id="aspectRatio"
              name="aspectRatio"
              value={formData.aspectRatio}
              onChange={handleChange}
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
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>
        </div>

        {/* Row 6: Channel and Status */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="channel">Output: Channel</label>
            <select
              id="channel"
              name="channel"
              value={formData.channel}
              onChange={handleChange}
            >
              <option value="Broadcast">Broadcast</option>
              <option value="CTV">CTV</option>
              <option value="Digital">Digital</option>
              <option value="Social">Social</option>
              <option value="OLV">OLV</option>
              <option value="Radio">Radio</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value={ISCIStatus.PENDING}>Pending</option>
              <option value={ISCIStatus.IN_PROGRESS}>In Progress</option>
              <option value={ISCIStatus.IN_REVIEW}>In Review</option>
              <option value={ISCIStatus.COMPLETED}>Completed</option>
              <option value={ISCIStatus.ARCHIVED}>Archived</option>
            </select>
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
