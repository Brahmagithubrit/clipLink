import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

export let gridBucket: GridFSBucket | null = null;

mongoose.connection.once("open", () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection not ready");
  }

  gridBucket = new GridFSBucket(db, {
    bucketName: "videos"
  });

  console.log("GridFSBucket initialized");
});
