import Admin from "@/containers/Admin";

export function meta() {
  return [
    { title: "Admin Panel | ISCI Management" },
    { name: "description", content: "Manage clients, agencies, and users" },
  ];
}

export default function AdminRoute() {
  return <Admin />;
}
