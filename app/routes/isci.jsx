import Detail from "@/containers/Detail";

export function meta() {
  return [
    { title: "ISCI Details - ISCIz" },
    { name: "description", content: "View ISCI code details" },
  ];
}

export default function ISCIDetail() {
  return <Detail />;
}
