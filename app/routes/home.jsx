import Dashboard from "@/containers/Dashboard";

export function meta() {
  return [
    { title: "ISCIz" },
    { name: "description", content: "Manage ISCI codes for video editing projects" },
  ];
}

export default function Home() {
  return <Dashboard />;
}
