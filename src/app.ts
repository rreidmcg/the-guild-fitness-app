import express from "express";
import { healthRouter } from "./routes/health";
import { notFoundHandler, errorHandler } from "./middleware/error";

// Import and mount your EXISTING routers here (keep original paths).
// Example:
// import { usersRouter } from "./routes/users";
// import { statsRouter } from "./routes/stats";

export function createApp() {
  const app = express();
  app.use(express.json());

  // Mount preserved routes here:
  // app.use("/api/users", usersRouter);
  // app.use("/api/stats", statsRouter);

  app.use(healthRouter);

  // Error handling (keep last):
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}