import Tools from "@/containers/Tools";

export function meta() {
  return [
    { title: "Tools | ISCI Management" },
    { name: "description", content: "Export and import ISCI code data" },
  ];
}

export default function ToolsRoute() {
  return <Tools />;
}
