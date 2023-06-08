import authRoutes from "../auth/auth.routes.js";
import roomRoutes from "../room/room.routes.js";
import userRoutes from "../user/user.routes.js";

const route = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/room", roomRoutes);
  app.use("/api/user", userRoutes);
};

export default route;
