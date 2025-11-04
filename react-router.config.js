/**
 * React Router Configuration
 *
 * This file configures React Router v7.
 * It's pretty simple right now - just tells React Router to use Server-Side Rendering (SSR).
 *
 * SSR means: "Render the page on the server first, then send HTML to the browser"
 * vs
 * SPA means: "Send JavaScript to the browser and let IT render everything"
 *
 * SSR is better for SEO and initial load time! 🚀
 */

export default {
  // Server-Side Render by default
  // Set to `false` if you want a Single Page App (SPA) instead
  ssr: true,

  // More config options available - check React Router docs for details!
  // https://reactrouter.com/
};
