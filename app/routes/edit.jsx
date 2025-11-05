import EditISCI from "@/containers/EditISCI";

export function meta() {
  return [
    { title: "Edit ISCI Code - ISCIz" },
    { name: "description", content: "Edit an existing ISCI code" },
  ];
}

export default function Edit() {
  return <EditISCI />;
}
