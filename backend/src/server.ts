import "dotenv/config";

import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`Talkora backend server running at http://localhost:${PORT}`);
});

server.on("error", (error: Error) => {
  console.error("Server startup error:", error.message);
  process.exit(1);
});
