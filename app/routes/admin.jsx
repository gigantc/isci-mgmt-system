import BrandManager from "@/components/BrandManager";
import Header from "@/containers/Header";

export const meta = () => {
  return [
    { title: "Admin - Brand Management | ISCI Management" },
    { name: "description", content: "Manage brands and clients" },
  ];
};

export default function Admin() {
  return (
    <div>
      <Header
        showAdminButton={false}
        showCreateButton={false}
        showBackButton={true}
      />
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        <BrandManager />
      </div>
    </div>
  );
}
