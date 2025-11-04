import ISCIDashboard from "../containers/ISCIDashboard";

export function meta() {
  return [
    { title: "ISCI Management System" },
    { name: "description", content: "Manage ISCI codes for video editing projects" },
  ];
}

export default function Home() {
  return <ISCIDashboard />;
}
