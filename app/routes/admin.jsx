import BrandManager from "../components/BrandManager";

export const meta = () => {
  return [
    { title: "Admin - Brand Management | ISCI Management" },
    { name: "description", content: "Manage brands and clients" },
  ];
};

export default function Admin() {
  return (
    <div>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "2px solid rgba(255, 250, 231, 0.1)"
        }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#FFFAE7",
            margin: 0
          }}>
            Admin Panel
          </h1>
          <a
            href="/"
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#1C1C1C",
              backgroundColor: "#C2FF00",
              border: "none",
              borderRadius: "6px",
              textDecoration: "none",
              transition: "all 0.2s"
            }}
          >
            Back to Dashboard
          </a>
        </div>
        <BrandManager />
      </div>
    </div>
  );
}
