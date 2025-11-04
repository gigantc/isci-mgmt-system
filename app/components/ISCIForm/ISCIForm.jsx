import { useState, useEffect } from "react";
import { ISCIStatus } from "../../types/isci";
import "./ISCIForm.scss";

const ISCIForm = ({ code, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    code: "",
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
    if (code) {
      setFormData({
        code: code.code,
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "ISCI code is required";
    } else if (!/^[A-Z0-9]{8}$/.test(formData.code)) {
      newErrors.code = "ISCI code must be 8 alphanumeric characters (e.g., ABCD1234)";
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
    <div className="isci-form-container">
      <h2>{code ? "Edit ISCI Code" : "Create New ISCI Code"}</h2>

      <form onSubmit={handleSubmit} className="isci-form">
        {/* Row 1: ISCI Code and Assigned Editor */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="code">ISCI Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="ABCD1234"
              maxLength={8}
              className={errors.code ? "error" : ""}
            />
            {errors.code && <span className="error-message">{errors.code}</span>}
          </div>

          <div className="form-group">
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

        {/* Brand/Client - Full width */}
        <div className="form-group">
          <label htmlFor="brand">Brand / Client *</label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="Company or Brand Name"
            className={errors.brand ? "error" : ""}
          />
          {errors.brand && <span className="error-message">{errors.brand}</span>}
        </div>

        {/* Row 2: Campaign Name and Spot Length */}
        <div className="form-row">
          <div className="form-group">
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

          <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-row">
          <div className="form-group">
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

          <div className="form-group">
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
        <div className="form-row">
          <div className="form-group">
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

          <div className="form-group">
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
        <div className="form-row">
          <div className="form-group">
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

          <div className="form-group">
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
        <div className="form-row">
          <div className="form-group">
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

          <div className="form-group">
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
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-submit">
            {code ? "Update" : "Create"} ISCI Code
          </button>
        </div>
      </form>
    </div>
  );
};

export default ISCIForm;
