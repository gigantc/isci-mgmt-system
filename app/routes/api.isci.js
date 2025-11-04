/**
 * API Route: /api/isci
 *
 * This is where the backend magic happens! 🪄
 * This file handles reading and writing ISCI codes to our JSON file.
 *
 * Think of this as the librarian who knows where all the books (ISCI codes) are kept
 * and can fetch them or update them for you.
 *
 * Currently using a JSON file, but future devs could swap this out for a database!
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

// Where our data lives! (It's a JSON file in the /data folder)
// process.cwd() gives us the project root directory
const DATA_FILE = join(process.cwd(), "data", "isci-codes.json");

/**
 * loader function
 *
 * This handles GET requests to /api/isci
 * When the frontend says "Give me all the ISCI codes!", this is what runs.
 *
 * React Router calls functions named "loader" automatically when someone visits the route.
 */
export async function loader() {
  try {
    // Read the JSON file from disk
    // "utf-8" means "read this as text, not as binary data"
    const data = await readFile(DATA_FILE, "utf-8");

    // Parse the JSON string into a JavaScript array
    const codes = JSON.parse(data);

    // Send it back as JSON
    // Response.json() creates an HTTP response with JSON content
    return Response.json(codes);
  } catch (error) {
    // Uh oh! Something went wrong reading the file.
    // Maybe it doesn't exist? Maybe permissions are wrong?
    console.error("Error reading ISCI codes:", error);

    // Return an empty array with a 500 status code
    // (500 = "Internal Server Error" in HTTP speak)
    return Response.json([], { status: 500 });
  }
}

/**
 * action function
 *
 * This handles POST requests to /api/isci
 * When the frontend says "Save these ISCI codes!", this is what runs.
 *
 * We take the entire array of codes and overwrite the file.
 * (Not super efficient, but simple! Future devs might want to optimize this.)
 *
 * React Router calls functions named "action" automatically for POST requests.
 */
export async function action({ request }) {
  try {
    // Get the JSON data from the request body
    // await request.json() reads the body and parses it as JSON
    const codes = await request.json();

    // Write it to the file!
    // JSON.stringify with (codes, null, 2) means:
    //   - codes: what to convert to JSON
    //   - null: no custom replacer function (we don't need it)
    //   - 2: indent with 2 spaces (makes the file human-readable!)
    await writeFile(DATA_FILE, JSON.stringify(codes, null, 2), "utf-8");

    // Success! Send back a happy response
    return Response.json({ success: true });
  } catch (error) {
    // Something went wrong! Maybe disk is full? File permissions?
    console.error("Error writing ISCI codes:", error);

    // Send back an error response
    return Response.json(
      { success: false, error: "Failed to save data" },
      { status: 500 }
    );
  }
}
