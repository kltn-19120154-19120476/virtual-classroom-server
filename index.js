import cookieSession from "cookie-session";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import findConfig from "find-config";
import http from "http";
import { Server } from "socket.io";
import route from "./components/root/root.route.js";
import DbConnect from "./config/db/index.js";
import presentationModel from "./models/presentation.model.js";
import questionModel from "./models/question.model.js";

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

const io = new Server(server);

io.on("connection", (socket) => {
  socket.on("vote", async (data) => {
    try {
      await presentationModel.findByIdAndUpdate(data._id, data);
      io.emit("voted", data);
    } catch (e) {
      io.emit("voted", null);
    }
  });

  socket.on("clientChangeSlideIndex", (data) =>
    io.emit("changeSlideIndex", data)
  );

  socket.on("clientStartPresent", (data) => io.emit("startPresent", data));

  socket.on("clientStopPresent", async (data) => {
    try {
      await questionModel.remove({ presentationId: data });
    } catch (error) {}

    io.emit("stopPresent", data);
  });

  socket.on("clientStopPresentByUpdateGroup", (data) =>
    io.emit("stopPresentByUpdateGroup", data)
  );

  socket.on("clientSendQuestion", async (data) => {
    try {
      const { userName, presentationId, content } = data;
      const newQuestion = await questionModel.create({
        userName: userName || "Anonymous",
        presentationId,
        content,
        hasAnswer: false,
        createdDate: new Date(),
        vote: 0,
      });

      io.emit("sendQuestion", newQuestion);
    } catch (error) {
      io.emit("sendQuestion", null);
    }
  });

  socket.on("clientUpdateQuestion", async (data) => {
    try {
      const newQuestion = await questionModel.findOneAndUpdate(
        { _id: data?._id },
        {
          $set: {
            vote: data.vote,
          },
        }
      );
      io.emit("updateQuestion", newQuestion);
    } catch (error) {
      io.emit("updateQuestion", null);
    }
  });

  socket.on("clientUpdateHistory", async (newHistory) => {
    try {
      await presentationModel.findByIdAndUpdate(newHistory.presentationId, {
        history: newHistory.data,
      });
      io.emit("updateHistory", newHistory);
    } catch (error) {
      io.emit("updateHistory", null);
    }
  });

  //💯
  socket.on("join_presentation", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("receiveMessage", data);
    io.to(data.room).emit("messageToNotify", data);
  });
});

server.listen(process.env.PORT || 1400, () => {
  console.log("Server started on " + process.env.PORT || 1400);
});
