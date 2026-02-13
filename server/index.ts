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

console.log("[Server] Connecting to database...");
connectDB();
console.log("[Server] Database connection initiated.");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.get("/", (_req, res) => {
  console.log("[GET /] Health check hit.");
  res.send("Server running");
});

app.post("/upload", upload.single("video"), (req, res) => {
  console.log("[POST /upload] Upload request received.");

  if (!req.file) {
    console.warn("[POST /upload] No video file in request.");
    return res.status(400).json({ message: "No video provided" });
  }

  console.log("[POST /upload] File received:", req.file.originalname, "| Size:", req.file.size, "bytes | MIME:", req.file.mimetype);

  if (!gridBucket) {
    console.error("[POST /upload] GridFS bucket not initialized.");
    return res.status(503).json({ message: "Storage not ready" });
  }

  const readableStream = Readable.from(req.file.buffer);

  const uploadStream = gridBucket.openUploadStream(req.file.originalname, {
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  console.log("[POST /upload] Streaming file into GridFS...");
  readableStream.pipe(uploadStream);

  uploadStream.on("error", (err) => {
    console.error("[POST /upload] GridFS upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  });

  uploadStream.on("finish", () => {
    const id = uploadStream.id.toString();
    const shareUrl = `${BASE_URL}/video/${id}`;
    console.log("[POST /upload] Upload finished. File ID:", id);
    console.log("[POST /upload] Share URL:", shareUrl);
    res.status(200).json({
      message: "Uploaded successfully",
      id,
      shareUrl,
    });
  });
});

app.get("/video/:id", async (req, res) => {
  const rawId = req.params.id;
  console.log("[GET /video/:id] Request for video ID:", rawId);

  if (!gridBucket) {
    console.error("[GET /video/:id] GridFS bucket not initialized.");
    return res.status(503).send("Storage not ready");
  }

  try {
    const fileId = new ObjectId(rawId);

    const files = await gridBucket.find({ _id: fileId }).toArray();
    if (!files.length) {
      console.warn("[GET /video/:id] No file found for ID:", rawId);
      return res.status(404).send("Video not found");
    }

    const file = files[0];
    const contentType = file.metadata?.contentType || "video/webm";
    const videoSize = file.length;
    const range = req.headers.range;

    console.log("[GET /video/:id] File found:", file.filename, "| Size:", videoSize, "| Type:", contentType);

    if (!range) {
      console.log("[GET /video/:id] No range header. Streaming full file.");
      res.set({
        "Content-Type": contentType,
        "Content-Length": videoSize,
      });
      gridBucket.openDownloadStream(fileId).pipe(res);
    } else {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;

      console.log("[GET /video/:id] Range request — start:", start, "end:", end, "/ total:", videoSize);

      if (start >= videoSize) {
        console.warn("[GET /video/:id] Range start exceeds file size. Returning 416.");
        return res.status(416).send("Requested range not satisfiable");
      }

      const chunkSize = end - start + 1;

      res.status(206).set({
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      console.log("[GET /video/:id] Streaming partial content, chunk size:", chunkSize);
      gridBucket.openDownloadStream(fileId, { start, end: end + 1 }).pipe(res);
    }
  } catch (err) {
    console.error("[GET /video/:id] Invalid or malformed video ID:", rawId, err);
    res.status(400).send("Invalid video ID");
  }
});

app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
  console.log(`[Server] Base URL: ${BASE_URL}`);
});