import { ReactComponent as Logo } from "@/assets/Logo.svg";
import styles from "./AppLogo.module.scss";

const SIZES = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/**
 * AppLogo
 *
 * The ISCIz mark on the amber tile. Decorative: the wordmark text always sits
 * next to it. `size` is "sm" (header), "md" (login) or "lg" (about dialog);
 * `className` is for layout only.
 */
const AppLogo = ({ size = "sm", className = "" }) => (
  <Logo
    className={`${styles.logo} ${SIZES[size] || styles.sm} ${className}`.trim()}
    aria-hidden="true"
    focusable="false"
  />
);

export default AppLogo;
