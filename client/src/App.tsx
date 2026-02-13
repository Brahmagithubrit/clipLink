import { useRef, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [search, setSearch] = useState("");
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    console.log("[Camera] Requesting camera access...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      console.log("[Camera] Camera started successfully.");
    } catch (err) {
      console.error("[Camera] Failed to access camera:", err);
    }
  };

  const stopCamera = () => {
    console.log("[Camera] Stopping camera...");
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    console.log("[Camera] Camera stopped.");
  };

  const startRecording = () => {
    if (!streamRef.current) {
      console.warn("[Recording] No active camera stream. Start camera first.");
      return;
    }
    console.log("[Recording] Starting recording...");
    const recorder = new MediaRecorder(streamRef.current);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        console.log("[Recording] Data chunk received, size:", e.data.size);
      }
    };

    recorder.onstop = () => {
      console.log("[Recording] Recording stopped. Building blob...");
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      console.log("[Recording] Preview URL created:", url);
    };

    recorder.start();
    setRecording(true);
    console.log("[Recording] MediaRecorder started.");
  };

  const stopRecording = () => {
    console.log("[Recording] Stopping recording...");
    recorderRef.current?.stop();
    setRecording(false);
  };

  const uploadVideo = async () => {
    if (!chunksRef.current.length) {
      console.warn("[Upload] No recorded chunks found. Record a video first.");
      return;
    }
    console.log("[Upload] Preparing video blob for upload...");
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", blob, "recording.webm");

    try {
      console.log("[Upload] Sending POST to /upload...");
      const resp = await axios.post("http://localhost:5000/upload", formData);
      const { id } = resp.data;
      setUploadedId(id);
      console.log("[Upload] Upload successful. Video ID:", id);
      alert("Upload successful. Video ID: " + id);
    } catch (e: any) {
      console.error("[Upload] Upload failed:", e.response?.data || e.message);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      console.warn("[Search] Search field is empty.");
      return;
    }
    console.log("[Search] Fetching video with ID:", search);
    try {
      const resp = await axios.get(`http://localhost:5000/video/${search}`, {
        responseType: "blob",
      });
      console.log("[Search] Video blob received, size:", resp.data.size);
      const videoURL = URL.createObjectURL(resp.data);
      setFetchedUrl(videoURL);
      console.log("[Search] Fetched video URL created:", videoURL);
    } catch (e: any) {
      console.error("[Search] Failed to fetch video:", e.response?.data || e.message);
      alert("Video not found or invalid ID.");
    }
  };

  const copyId = () => {
  if (!uploadedId) return;
  navigator.clipboard.writeText(uploadedId).then(() => {
    console.log("[Copy] Video ID copied to clipboard:", uploadedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }).catch((err) => {
    console.error("[Copy] Failed to copy to clipboard:", err);
  });
};

  return (
    <div className="app-root">
      <div className="app-wrapper">

        <header className="app-header">
          <div className="app-header__indicator" />
          <h1 className="app-header__title">clipLINK</h1>
          <span className="app-header__subtitle">Video Recorder &amp; Storage System</span>
        </header>

        <section className="panel search-panel">
          <div className="panel__label">
            <span className="panel__label-dot" />
            RETRIEVE
          </div>
          <h2 className="panel__title">Search Video By ID</h2>
          <div className="search-panel__row">
            <input
              className="search-panel__input"
              type="text"
              placeholder="Enter Video ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn--primary" onClick={handleSearch}>
              <span className="btn__icon">⌕</span>
              Search
            </button>
          </div>

          {fetchedUrl && (
            <div className="video-result">
              <div className="video-result__header">
                <span className="video-result__tag">FETCHED STREAM</span>
              </div>
              <video className="video-player" src={fetchedUrl} controls />
            </div>
          )}
        </section>

        <section className="panel camera-panel">
          <div className="panel__label">
            <span className="panel__label-dot" />
            CAPTURE
          </div>
          <h2 className="panel__title">Camera Controls</h2>

          <div className="camera-panel__viewport-wrap">
            {recording && <div className="camera-panel__rec-badge">● REC</div>}
            <video className="camera-panel__viewport" ref={videoRef} muted />
          </div>

          <div className="camera-panel__controls">
            <button className="btn btn--secondary" onClick={startCamera} disabled={cameraActive}>
              Start Camera
            </button>
            <button
              className={`btn ${recording ? "btn--recording" : "btn--danger"}`}
              onClick={startRecording}
              disabled={!cameraActive || recording}
            >
              {recording ? "● Recording..." : "Start Recording"}
            </button>
            <button className="btn btn--secondary" onClick={stopRecording} disabled={!recording}>
              Stop Recording
            </button>
            <button className="btn btn--ghost" onClick={stopCamera} disabled={!cameraActive}>
              Stop Camera
            </button>
           
          </div>

          
        </section>

        {recordedUrl && (
          <section className="panel preview-panel">
            <div className="panel__label">
              <span className="panel__label-dot" />
              PLAYBACK
            </div>
            <h2 className="panel__title">Recorded Preview</h2>
            <div className="video-result">
              <div className="video-result__header">
                <span className="video-result__tag">LOCAL RECORDING</span>
              </div>
              <video className="video-player" src={recordedUrl} controls />
               <button className="btn btn--primary btn--upload" onClick={uploadVideo}>
              ↑ Upload
              </button>
              {uploadedId && (
  <div className="upload-success">
    <span className="upload-success__icon">✓</span>
    <span className="upload-success__text">
      Uploaded — ID: <strong className="upload-success__id">{uploadedId}</strong>
    </span>
    <button className="upload-success__copy" onClick={copyId}>
      {copied ? "✓ Copied" : "Copy ID"}
    </button>
  </div>
)}
            </div>
          </section>
        )}

        <footer className="app-footer">
          <span className="app-footer__text">clipLINK SYS v1.0</span>
          <span className="app-footer__dot" />
          <span className="app-footer__text">@BRAHMA_dev</span>
        </footer>

      </div>
    </div>
  );
}

export default App;