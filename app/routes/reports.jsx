import Reports from "@/containers/Reports";

export function meta() {
  return [
    { title: "Reports | ISCI Management" },
    { name: "description", content: "Export and import ISCI code data" },
  ];
}

export default function ReportsRoute() {
  return <Reports />;
}
