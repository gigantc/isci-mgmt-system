import Login from "@/containers/Login";

export function meta() {
  return [
    { title: "Login - ISCIz" },
    { name: "description", content: "Sign in to ISCIz" },
  ];
}

export default function LoginRoute() {
  return <Login />;
}
