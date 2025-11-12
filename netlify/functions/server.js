import { createRequestHandler } from "@react-router/node";

export const handler = async (event, context) => {
  // Dynamic import to avoid bundling issues
  const build = await import("../../build/server/index.js");

  const requestHandler = createRequestHandler({
    build,
    mode: process.env.NODE_ENV || "production"
  });

  return requestHandler(event, context);
};
