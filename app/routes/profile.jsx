import Profile from "@/containers/Profile";

export function meta() {
  return [
    { title: "Edit Profile - ISCIz" },
    { name: "description", content: "Edit your user profile" },
  ];
}

export default function ProfileRoute() {
  return <Profile />;
}
