import { useState, useEffect, useCallback, useMemo } from "react";
import { useFetchData } from "@/hooks";
import { MARKET_OPTIONS, getMarketLabel, normalizeMarketValue } from "@/utils/markets";
import styles from "./ISCIForm.module.scss";

const BASE_CHANNELS = [
  "Broadcast",
  "CTV",
  "Digital",
  "Direct TV",
  "Hulu",
  "OLV",
  "OTT",
  "Pre-Roll",
  "Radio",
  "Social",
  "Sojern",
  "Streaming Radio",
  "Terrestrial Radio",
  "Trade Desk",
  "YouTube",
];

const BASE_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Japanese",
  "Korean",
  "Mandarin",
  "Cantonese",
  "Arabic",
];

const capitalizeLanguage = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const ISCIForm = ({ code, onSubmit, onCancel, allCodes, hideActions = false, hideTitle = false, formRef, viewOnly = false }) => {
  const [isAirDateTbd, setIsAirDateTbd] = useState(false);
  const [aspectRatioChoice, setAspectRatioChoice] = useState("16:9");
  const [customAspectRatio, setCustomAspectRatio] = useState("");
  const [isOtherLanguage, setIsOtherLanguage] = useState(false);
  const [isOtherChannel, setIsOtherChannel] = useState(false);
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
    musicRights: "",
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

  const languagesTransform = useCallback(
    (data) => (Array.isArray(data?.languages) ? data.languages : []),
    []
  );
  const { data: dbLanguages } = useFetchData("/api/isci/languages", {
    transform: languagesTransform,
  });

  const channelsTransform = useCallback(
    (data) => (Array.isArray(data?.channels) ? data.channels : []),
    []
  );
  const { data: dbChannels } = useFetchData("/api/isci/channels", {
    transform: channelsTransform,
  });

  const mergeWithBase = (base, extras) => {
    const set = new Set([...base, ...(extras || [])]);
    const extrasSorted = Array.from(set)
      .filter((v) => !base.includes(v))
      .sort((a, b) => a.localeCompare(b));
    return [...base, ...extrasSorted];
  };

  const mergedLanguages = useMemo(
    () => mergeWithBase(BASE_LANGUAGES, dbLanguages),
    [dbLanguages]
  );

  const mergedChannels = useMemo(
    () => mergeWithBase(BASE_CHANNELS, dbChannels),
    [dbChannels]
  );

  // Keep the "Other" flags in sync with each merged option list.
  useEffect(() => {
    if (!formData.language) return;
    setIsOtherLanguage(!mergedLanguages.includes(formData.language));
  }, [mergedLanguages, formData.language]);

  useEffect(() => {
    if (!formData.channel) return;
    setIsOtherChannel(!mergedChannels.includes(formData.channel));
  }, [mergedChannels, formData.channel]);

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
        musicRights: code.musicRights || "",
      });
      setIsAirDateTbd(isTbdDate);
      setAspectRatioChoice(isCustomAspectRatio ? "custom" : (code.aspectRatio || "16:9"));
      setCustomAspectRatio(isCustomAspectRatio ? code.aspectRatio : "");
    } else {
      setIsAirDateTbd(false);
      setAspectRatioChoice("16:9");
      setCustomAspectRatio("");
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

    if (isOtherLanguage && !formData.language.trim()) {
      newErrors.language = "Please enter a language";
    }

    if (isOtherChannel && !formData.channel.trim()) {
      newErrors.channel = "Please enter a placement";
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
        language: isOtherLanguage ? capitalizeLanguage(formData.language) : formData.language,
        channel: isOtherChannel ? formData.channel.trim() : formData.channel,
        airDate: isAirDateTbd ? "TBD" : formData.airDate,
        aspectRatio: aspectRatioChoice === "custom" ? customAspectRatio.trim() : aspectRatioChoice,
        spotLength: formData.spotLength ? parseInt(formData.spotLength, 10) : null,
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

  return (
    <div className={styles.isciFormContainer}>
      {!hideTitle && (
        <h2>{code ? "Edit ISCI Code" : "Create New ISCI Code"}</h2>
      )}

      <form onSubmit={handleSubmit} className={styles.isciForm} ref={formRef}>

        {/* 01 — Basic Details */}
        <div className={`${styles.formSection} ${styles.formSectionFull}`}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>01</span> Basic Details
          </h3>

          {/* Client and ISCI Code side-by-side */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="brand">Client *</label>
              {code ? (
                // When editing, show brand as text (can't change brand)
                <div className={styles.inputBadgeWrap}>
                  <input
                    type="text"
                    value={formData.brand}
                    disabled
                    className={styles.disabledInput}
                    title="Changing the client would break the code pattern"
                  />
                  <span
                    className={styles.inputBadge}
                    title="Changing the client would break the code pattern"
                    aria-label="Locked"
                  >
                    Locked
                  </span>
                </div>
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
                <>
                  <div className={styles.inputBadgeWrap}>
                    <input
                      type="text"
                      value={formData.code}
                      disabled
                      className={styles.disabledInput}
                      title="ISCI codes cannot be changed after creation"
                    />
                    <span
                      className={styles.inputBadge}
                      title="ISCI codes cannot be changed after creation"
                      aria-label="Locked"
                    >
                      Locked
                    </span>
                  </div>
                  <span className={styles.helpText}>Immutable once created</span>
                </>
              ) : (
                // When creating, show as read-only auto-generated field
                <>
                  <div className={styles.inputBadgeWrap}>
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
                    <span
                      className={styles.inputBadge}
                      title="Auto-generated based on client selection"
                      aria-label="Auto"
                    >
                      Auto
                    </span>
                  </div>
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

        {/* 02 — Spot Details */}
        <div className={`${styles.formSection} ${styles.formSectionFull}`}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>02</span> Spot Details
          </h3>

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

        {/* 03 — Schedule & People */}
        <div className={`${styles.formSection} ${styles.formSectionFull}`}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>03</span> Schedule &amp; People
          </h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="airDate">Air / Start Date</label>
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
              <label htmlFor="language">Language</label>
              <select
                id="language"
                name="language"
                value={isOtherLanguage ? "Other" : formData.language}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === "Other") {
                    setIsOtherLanguage(true);
                    setFormData((prev) => ({ ...prev, language: "" }));
                  } else {
                    setIsOtherLanguage(false);
                    setFormData((prev) => ({ ...prev, language: value }));
                    if (errors.language) {
                      setErrors((prev) => ({ ...prev, language: "" }));
                    }
                  }
                }}
                disabled={viewOnly}
              >
                {mergedLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
                <option value="Other">Other…</option>
              </select>
              {isOtherLanguage && (
                <>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={(e) => {
                      const { value } = e.target;
                      setFormData((prev) => ({ ...prev, language: value }));
                      if (errors.language) {
                        setErrors((prev) => ({ ...prev, language: "" }));
                      }
                    }}
                    onBlur={(e) => {
                      const normalized = capitalizeLanguage(e.target.value);
                      setFormData((prev) => ({ ...prev, language: normalized }));
                    }}
                    placeholder="Enter language (e.g., Polish)"
                    disabled={viewOnly}
                    className={errors.language ? "error" : ""}
                  />
                  {errors.language && (
                    <span className={styles.errorMessage}>{errors.language}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 04 — Technical */}
        <div className={`${styles.formSection} ${styles.formSectionFull}`}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>04</span> Technical
          </h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="spotLength">Length (sec)</label>
              <input
                type="number"
                id="spotLength"
                name="spotLength"
                min="1"
                step="1"
                value={formData.spotLength}
                onChange={handleChange}
                placeholder="e.g., 30"
                disabled={viewOnly}
              />
            </div>

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
          </div>

          <div className={styles.formRow}>
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

            <div className={styles.formGroup}>
              <label htmlFor="channel">Placement</label>
              <select
                id="channel"
                name="channel"
                value={isOtherChannel ? "Other" : formData.channel}
                onChange={(e) => {
                  const { value } = e.target;
                  if (value === "Other") {
                    setIsOtherChannel(true);
                    setFormData((prev) => ({ ...prev, channel: "" }));
                  } else {
                    setIsOtherChannel(false);
                    setFormData((prev) => ({ ...prev, channel: value }));
                    if (errors.channel) {
                      setErrors((prev) => ({ ...prev, channel: "" }));
                    }
                  }
                }}
                disabled={viewOnly}
              >
                {mergedChannels.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
                <option value="Other">Other…</option>
              </select>
              {isOtherChannel && (
                <>
                  <input
                    type="text"
                    name="channel"
                    value={formData.channel}
                    onChange={(e) => {
                      const { value } = e.target;
                      setFormData((prev) => ({ ...prev, channel: value }));
                      if (errors.channel) {
                        setErrors((prev) => ({ ...prev, channel: "" }));
                      }
                    }}
                    onBlur={(e) => {
                      const trimmed = e.target.value.trim();
                      if (trimmed !== e.target.value) {
                        setFormData((prev) => ({ ...prev, channel: trimmed }));
                      }
                    }}
                    placeholder="Enter placement (e.g., Reddit, Next Door, LVRJ)"
                    disabled={viewOnly}
                    className={errors.channel ? "error" : ""}
                  />
                  {errors.channel && (
                    <span className={styles.errorMessage}>{errors.channel}</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
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
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="musicRights">Music Rights</label>
            <select
              id="musicRights"
              name="musicRights"
              value={formData.musicRights}
              onChange={handleChange}
              disabled={viewOnly}
            >
              <option value="">Not specified</option>
              <option value="Licensed">Licensed</option>
              <option value="Original">Original</option>
              <option value="None">None</option>
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
