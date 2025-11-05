import CreateISCI from "@/containers/CreateISCI";

export function meta() {
  return [
    { title: "Create ISCI Code - ISCIz" },
    { name: "description", content: "Create a new ISCI code" },
  ];
}

export default function Create() {
  return <CreateISCI />;
}
