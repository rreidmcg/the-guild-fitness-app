import { createApp } from "./app";
import { ENV } from "./config/env";
import { logger } from "./lib/logger";

const app = createApp();

app.listen(ENV.PORT, () => {
  logger.info({ port: ENV.PORT, env: ENV.NODE_ENV }, "Server started");
});