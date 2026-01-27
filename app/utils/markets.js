const MARKET_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "DK", name: "Denmark" },
  { code: "CH", name: "Switzerland" },
  { code: "EU", name: "European Union" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "VN", name: "Vietnam" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "EG", name: "Egypt" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "GLOBAL", name: "Global" }
];

const getMarketLabel = (code, includeCode = true) => {
  if (!code) return "";
  const match = MARKET_OPTIONS.find(option => option.code === code);
  if (!match) return code;
  return includeCode ? `${match.name} (${match.code})` : match.name;
};

const normalizeMarketValue = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  const directMatch = MARKET_OPTIONS.find(option => option.code === trimmed);
  if (directMatch) return directMatch.code;
  const labelMatch = MARKET_OPTIONS.find(
    option => getMarketLabel(option.code, true) === trimmed
  );
  return labelMatch ? labelMatch.code : trimmed;
};

export { MARKET_OPTIONS, getMarketLabel, normalizeMarketValue };
