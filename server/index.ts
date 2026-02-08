import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { Readable } from "stream";
import { ObjectId } from "mongodb";

import { connectDB } from "./db/db_connect";
import { gridBucket } from "./grid/gf_grid";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

app.use(cors());
app.use(express.json());

connectDB();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (adjust if needed)
  }
});

app.get("/", (_req, res) => {
  res.send("Server running");
});

/* =========================
   UPLOAD VIDEO
========================= */
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video provided" });
  }

  if (!gridBucket) {
    return res.status(503).json({ message: "Storage not ready" });
  }

  const readableStream = Readable.from(req.file.buffer);

  const uploadStream = gridBucket.openUploadStream(
    req.file.originalname,
    {
        metadata: {
            contentType: req.file.mimetype
        }
        }

  );

  readableStream.pipe(uploadStream);

  uploadStream.on("error", () => {
    res.status(500).json({ message: "Upload failed" });
  });

  uploadStream.on("finish", () => {
    res.status(200).json({
      message: "Uploaded successfully",
      shareUrl: `${BASE_URL}/video/${uploadStream.id}`
    });
  });
});

/* =========================
   STREAM VIDEO
========================= */
app.get("/video/:id", (req, res) => {
  if (!gridBucket) {
    return res.status(503).send("Storage not ready");
  }

  const fileId = new ObjectId(req.params.id);

  res.set({
    "Content-Type": "video/webm",
    "Accept-Ranges": "bytes"
  });

  const downloadStream = gridBucket.openDownloadStream(fileId);

  downloadStream.on("error", () => {
    res.status(404).send("Video not found");
  });

  downloadStream.pipe(res);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
