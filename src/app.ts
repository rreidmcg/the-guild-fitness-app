import express from "express";
import { healthRouter } from "./routes/health";
import { notFoundHandler, errorHandler } from "./middleware/error";

// ⬇️ Add this import
import { exampleRouter } from "./routes/example";

// Import and mount your EXISTING routers here (keep original paths).
// Example:
// import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();
  app.use(express.json());

  // Mount preserved routes here first (do not rename):
  // app.use("/api/users", usersRouter);

  // ⬇️ Demo route
  app.use(exampleRouter);

  app.use(healthRouter);

  // Error handling (keep last):
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}