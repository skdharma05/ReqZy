import express from "express";
import mongoose from "mongoose";
import router from "./controller/index";
import { ensureSuperUserExists } from "./utils/bootstrap";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(router);

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pr-system")
  .then(() => {
    console.log("Connected to MongoDB");
    ensureSuperUserExists();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.listen(3000, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
