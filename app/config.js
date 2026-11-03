/**
 * App Config
 *
 * Constants shared across the app. The version comes from package.json
 * (named import, so only `version` ends up in the bundle).
 */

import { version } from "../package.json";

export const APP_VERSION = version;

//////////////////////////////////////
// ISCI code format settings live in utils/isciSettings.js (plain-node loadable)

export { ISCI_HYPHEN, ISCI_BROADCAST_H } from "./utils/isciSettings";
