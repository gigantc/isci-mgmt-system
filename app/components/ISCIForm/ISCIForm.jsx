import { useState, useEffect, useCallback } from "react";
import { useFetchData } from "@/hooks";
import { MARKET_OPTIONS, getMarketLabel, normalizeMarketValue } from "@/utils/markets";
import styles from "./ISCIForm.module.scss";

const ISCIForm = ({ code, onSubmit, onCancel, allCodes, hideActions = false, hideTitle = false, formRef, viewOnly = false }) => {
  const [isAirDateTbd, setIsAirDateTbd] = useState(false);
  const [aspectRatioChoice, setAspectRatioChoice] = useState("16:9");
  const [customAspectRatio, setCustomAspectRatio] = useState("");
  const [spotLengthChoice, setSpotLengthChoice] = useState("");
  const [customSpotLength, setCustomSpotLength] = useState("");
  const [formData, setFormData] = useState({
    code: "",
    brandId: "",
    brand: "",
    campaignName: "",
    jobNumber: "",
    spotTitle: "",
    spotLength: "",
    description: "",
    language: "English",
    closedCaptioning: "Clean",
    audio: "Stereo LR",
    fileFormat: "Pro Res",
    agency: "",
    market: "",
    airDate: "",
    aspectRatio: "16:9",
    channel: "Broadcast",
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

  const { data: agencies } = useFetchData("/api/agencies", {
    filter: activeAgenciesFilter
  });

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
      const supportedAspectRatios = ["16:9", "9:16", "4:5", "1:1", "2.39:1"];
      const isCustomAspectRatio = code.aspectRatio && !supportedAspectRatios.includes(code.aspectRatio);
      const supportedSpotLengths = ["6", "10", "15", "30", "45", "60"];
      const codeSpotLength = code.spotLength ? String(code.spotLength) : "";
      const isCustomSpotLength = codeSpotLength && !supportedSpotLengths.includes(codeSpotLength);
      // Editing existing code
      setFormData({
        code: code.code,
        brandId: code.brandId || "",
        brand: code.brand,
        campaignName: code.campaignName || "",
        jobNumber: code.jobNumber || "",
        spotTitle: code.spotTitle,
        spotLength: code.spotLength || "",
        description: code.description || "",
        language: code.language || "English",
        closedCaptioning: code.closedCaptioning || "Clean",
        audio: code.audio || "Stereo LR",
        fileFormat: code.fileFormat || "Pro Res",
        agency: code.agency || "",
        market: normalizeMarketValue(code.market),
        airDate: !code.airDate || isTbdDate ? "" : code.airDate.split('T')[0],
        aspectRatio: code.aspectRatio || "16:9",
        channel: code.channel || "Broadcast",
      });
      setIsAirDateTbd(isTbdDate);
      setAspectRatioChoice(isCustomAspectRatio ? "custom" : (code.aspectRatio || "16:9"));
      setCustomAspectRatio(isCustomAspectRatio ? code.aspectRatio : "");
      setSpotLengthChoice(isCustomSpotLength ? "custom" : codeSpotLength);
      setCustomSpotLength(isCustomSpotLength ? codeSpotLength : "");
    } else {
      setIsAirDateTbd(false);
      setAspectRatioChoice("16:9");
      setCustomAspectRatio("");
      setSpotLengthChoice("");
      setCustomSpotLength("");
    }
  }, [code]);

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
      newErrors.brand = "Client is required";
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
        aspectRatio: aspectRatioChoice === "custom" ? customAspectRatio.trim() : aspectRatioChoice,
        spotLength: spotLengthChoice === "custom" ? customSpotLength.trim() : spotLengthChoice,
      });
    }
  };

  const handleAspectRatioChange = (e) => {
    const { value } = e.target;
    setAspectRatioChoice(value);
    setFormData(prev => ({
      ...prev,
      aspectRatio: value === "custom" ? prev.aspectRatio : value,
    }));
  };

  const handleSpotLengthChange = (e) => {
    const { value } = e.target;
    setSpotLengthChoice(value);
    setFormData(prev => ({
      ...prev,
      spotLength: value === "custom" ? prev.spotLength : value,
    }));
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

          {/* Client and ISCI Code side-by-side */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="brand">Client *</label>
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
                  <option value="">Select a client...</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} ({brand.code})
                    </option>
                  ))}
                </select>
              )}
              {errors.brand && <span className={styles.errorMessage}>{errors.brand}</span>}
              {!code && brands.length === 0 && (
                <span className={styles.helpText}>No clients available. <a href="/admin">Add clients in Admin Panel</a></span>
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
                    title="Auto-generated based on client selection"
                  />
                  {errors.code && <span className={styles.errorMessage}>{errors.code}</span>}
                  <span className={styles.helpText}>Auto-generated: [CLIENT][YEAR][NUMBER]</span>
                </>
              )}
            </div>
          </div>

          {/* Campaign Name + Job Number */}
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
                disabled={viewOnly}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="jobNumber">Job Number</label>
              <input
                type="text"
                id="jobNumber"
                name="jobNumber"
                value={formData.jobNumber}
                onChange={handleChange}
                placeholder="Job Number"
                disabled={viewOnly}
              />
            </div>
          </div>
        </div>

        {/* 2x2 GRID: Four Half-Width Sections */}
        <div className={styles.formSectionsRow}>

          {/* TOP LEFT: Demographics */}
          <div className={`${styles.formSection} ${styles.formSectionHalf}`}>
            <h3 className={styles.sectionTitle}>Demographics</h3>

            {/* Air Date */}
            <div className={styles.formGroup}>
              <label htmlFor="airDate">Date (Air/Start Date)</label>
              <input
                type="date"
                id="airDate"
                name="airDate"
                value={formData.airDate}
                onChange={handleChange}
                disabled={viewOnly || isAirDateTbd}
                className={isAirDateTbd ? styles.dimmedInput : undefined}
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

            <div className={styles.formRow}>
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

              <div className={styles.formGroup}>
                <label htmlFor="market">Market</label>
                <select
                  id="market"
                  name="market"
                  value={formData.market}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="">Select Market</option>
                  {MARKET_OPTIONS.map(option => (
                    <option key={option.code} value={option.code}>
                      {getMarketLabel(option.code)}
                    </option>
                  ))}
                </select>
              </div>
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
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                disabled={viewOnly}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Mandarin">Mandarin</option>
                <option value="Cantonese">Cantonese</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="closedCaptioning">Accessibility</label>
                <select
                  id="closedCaptioning"
                  name="closedCaptioning"
                  value={formData.closedCaptioning}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="Closed Captions">Closed Captions</option>
                  <option value="Subtitles">Subtitles</option>
                  <option value="Clean">Clean</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="audio">Audio</label>
                <select
                  id="audio"
                  name="audio"
                  value={formData.audio}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="Stereo LR">Stereo LR</option>
                  <option value="Broadcast">Broadcast</option>
                  <option value="Digital Streaming">Digital Streaming</option>
                  <option value="Cinema 5:1">Cinema 5:1</option>
                  <option value="Digital">Digital</option>
                </select>
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
                  value={aspectRatioChoice}
                  onChange={handleAspectRatioChange}
                  disabled={viewOnly}
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:5">4:5</option>
                  <option value="1:1">1:1</option>
                  <option value="2.39:1">2.39:1</option>
                  <option value="custom">Custom</option>
                </select>
                {aspectRatioChoice === "custom" && (
                  <input
                    type="text"
                    name="customAspectRatio"
                    value={customAspectRatio}
                    onChange={(e) => setCustomAspectRatio(e.target.value)}
                    placeholder="e.g., 3:2 or 1.85:1"
                    disabled={viewOnly}
                  />
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fileFormat">File Format</label>
                <select
                  id="fileFormat"
                  name="fileFormat"
                  value={formData.fileFormat}
                  onChange={handleChange}
                  disabled={viewOnly}
                >
                  <option value="Pro Res">Pro Res</option>
                  <option value="MP4">MP4</option>
                  <option value="MP3">MP3</option>
                  <option value="QT">QT</option>
                  <option value="WAV">WAV</option>
                  <option value="H.264">H.264</option>
                </select>
              </div>
            </div>


            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="spotLength">Spot Length (seconds)</label>
                <select
                  id="spotLength"
                  name="spotLength"
                  value={spotLengthChoice}
                  onChange={handleSpotLengthChange}
                  disabled={viewOnly}
                >
                  <option value="">Select length</option>
                  <option value="6">06</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                  <option value="custom">Other</option>
                </select>
                {spotLengthChoice === "custom" && (
                  <input
                    type="text"
                    name="customSpotLength"
                    value={customSpotLength}
                    onChange={(e) => setCustomSpotLength(e.target.value)}
                    placeholder="e.g., 75"
                    disabled={viewOnly}
                  />
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="channel">Placement</label>
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
                  <option value="Direct TV">Direct TV</option>
                  <option value="Hulu">Hulu</option>
                  <option value="OLV">OLV</option>
                  <option value="OTT">OTT</option>
                  <option value="Pre-Roll">Pre-Roll</option>
                  <option value="Radio">Radio</option>
                  <option value="Social">Social</option>
                  <option value="Sojern">Sojern</option>
                  <option value="Streaming Radio">Streaming Radio</option>
                  <option value="Terrestrial Radio">Terrestrial Radio</option>
                  <option value="Trade Desk">Trade Desk</option>
                  <option value="YouTube">YouTube</option>
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
