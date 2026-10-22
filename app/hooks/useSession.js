import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { getUserSession, isAdmin, isViewer, canEdit, getUserRoleLabel } from "@/utils/auth";

/**
 * useSession - Hydration-safe access to the current user session
 *
 * The session lives in sessionStorage, which the server can't see. Reading it
 * during render makes the first client render differ from the server HTML. This
 * hook returns the same neutral values on the server and on the first client
 * render (user null, ready false), then reads the session in an effect.
 *
 * Role checks are derived from the user via the helpers in utils/auth.js, so the
 * role logic stays in one place.
 *
 * The session is re-read on every navigation, which also covers coming back
 * from /profile after the user edited their details.
 *
 * @returns {{ user: object|null, ready: boolean, isAdmin: boolean, isViewer: boolean, canEdit: boolean, roleLabel: string }}
 *
 * @example
 * const { ready, canEdit } = useSession();
 * if (!ready) return <Loading />;
 */
const useSession = () => {
  const { pathname } = useLocation();
  const [state, setState] = useState({ user: null, ready: false });

  useEffect(() => {
    const current = getUserSession();
    setState((prev) =>
      prev.ready && JSON.stringify(prev.user) === JSON.stringify(current)
        ? prev
        : { user: current, ready: true }
    );
  }, [pathname]);

  const { user, ready } = state;

  return {
    user,
    ready,
    isAdmin: Boolean(isAdmin(user)),
    isViewer: Boolean(isViewer(user)),
    canEdit: Boolean(canEdit(user)),
    roleLabel: getUserRoleLabel(user),
  };
};

export default useSession;
