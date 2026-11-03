import Reports from "@/containers/Reports";

export function meta() {
  return [
    { title: "Reports | ISCI Management" },
    { name: "description", content: "Data quality, placement mix, cutdown families and creation trend insights" },
  ];
}

export default function ReportsRoute() {
  return <Reports />;
}
