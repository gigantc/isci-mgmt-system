import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import Header from "@/containers/Header";
import AppErrorBoundary from "@/components/ErrorBoundary";
import CmdK from "@/components/CmdK";
import "./styles/app.scss";

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600&display=swap",
  },
];

// Inline script executed before hydration so the saved theme is applied
// synchronously — avoids a flash of dark-mode on light-theme reload.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('isciz-theme');if(t==='light'){document.documentElement.classList.add('theme-light');}}catch(e){}})();`;

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();

  // Don't show header on login page
  const showHeader = location.pathname !== "/login";

  return (
    <AppErrorBoundary>
      {showHeader && <Header />}
      <Outlet />
      {showHeader && <CmdK />}
    </AppErrorBoundary>
  );
}

export function ErrorBoundary({ error }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="error-container">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="error-stack">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
