import cookieSession from "cookie-session";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import findConfig from "find-config";
import http from "http";
import route from "./components/root/root.route.js";
import DbConnect from "./config/db/index.js";

dotenv.config({ path: findConfig(".env") });

const app = express();

DbConnect();

app.use(
  cookieSession({
    name: "session",
    keys: ["ptudwnc-midterm"],
    maxAge: 24 * 60 * 60 * 100,
  })
);
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

route(app);

const server = http.createServer(app);

server.listen(process.env.PORT || 1400, () => {
  console.log("Server started on " + process.env.PORT || 1400);
});
