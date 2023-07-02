import authRoutes from "../auth/auth.routes.js";
import roomRoutes from "../room/room.routes.js";
import userRoutes from "../user/user.routes.js";
import documentRouters from "../document/document.routes.js";
import recordingRouters from "../recording/recording.routes.js";

const route = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/room", roomRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/document", documentRouters);
  app.use("/api/recording", recordingRouters);
};

export default route;
