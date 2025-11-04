/**
 * Vite Configuration
 *
 * Vite is our build tool - it's what turns our fancy React code into stuff browsers can actually run!
 * Think of it as a super-fast chef that takes raw ingredients (our code) and serves up a delicious meal (the app).
 *
 * Fun fact: "Vite" is French for "fast" and boy, is it fast! ⚡
 */

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Plugins are like special powers we give to Vite
  plugins: [
    tailwindcss(),      // Adds TailwindCSS support (utility-first CSS framework)
    reactRouter(),      // Adds React Router v7 support (handles our routes and SSR)
  ],

  // Tell Vite which file extensions to look for when resolving imports
  // When you write: import Foo from "./Foo"
  // Vite will try: ./Foo.jsx, then ./Foo.js
  resolve: {
    extensions: ['.jsx', '.js'],
  },
});
