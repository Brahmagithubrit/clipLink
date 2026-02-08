import { useRef, useEffect, useState } from "react"
import "./global.css"
import axios from "axios"; 

async function getCameraStream() {
  return await navigator.mediaDevices.getUserMedia({ video: true })
}

function App() {
  const [cameraStarted, setCameraStarted] = useState(false)
  const [cameraStop, setcameraStop] = useState(true)
  const [url, setUrl] = useState<string >()
  const [blob, setBlob] = useState<Blob>()
  const [videoUrl, setVideoUrl] = useState()
  const [alertUrl , setAlertUrl ]= useState(false)
  // later i have to make this two tracks to one isCameraStart , so it can handle both case 

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordRef = useRef<MediaRecorder | null>(null)
  const chunkRef = useRef <Blob[]> ([])

  async function startCamera() {
    setCameraStarted(true)
    setcameraStop(false)
    console.log ("start camera clicked ")
    const stream = await getCameraStream()
    streamRef.current = stream; 
     console.log(streamRef)
    console.log (streamRef.current)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
  }
  
  const stopCamera = () => {
    setcameraStop(true)
    setCameraStarted(false)
    console.log ("stop camera clicked ")
    if (!streamRef.current) return; 

   

    streamRef.current.getTracks().forEach(track => track.stop())
    streamRef.current = null  

    if (videoRef.current ) 
    videoRef.current.srcObject = null; 
  }
  const startRecording = () => {
    if (!streamRef.current) return; 
    if (recordRef.current) return; 

    const record = new MediaRecorder(streamRef.current)
    recordRef.current = record
    chunkRef.current = []
    
    record.ondataavailable = e => {
      if (e.data.size > 0) {
        chunkRef.current.push (e.data)
      }
    }

    record.onstop = () => {
      const blob = new Blob(chunkRef.current, { type: "video/webm" })
      console.log("Recorded video blob:", blob)
      recordRef.current = null;     
    }
     record.start()   
    setTimeout(() => {
      record.stop()
    } , 60000)
  }
  const stopRecording = () => {
    
    if (!recordRef.current) return;
    const record = recordRef.current
    record.stop();
    record.onstop = () => {
      const blob = new Blob(chunkRef.current, { type: "video/webm" })
      console.log ("type of blob is "  , typeof blob)
      setBlob(blob)
      const newUrl = URL.createObjectURL(blob)
      setUrl(newUrl)
      console.log("Recorded video blob:", blob)
      recordRef.current = null;     
    }
  }

  const uploadVideo = async () => {
  const formData = new FormData();
  formData.append("video", blob, "recording.webm");

  try {
    const resp = await axios.post("http://localhost:5000/upload", formData);

    const { shareUrl } = resp.data;
    if (shareUrl) {
      setAlertUrl(true)
    }


    console.log("Share URL:", shareUrl);

    setVideoUrl(shareUrl);      
  } catch (e) {
    console.log("error in upload", e);
  }
};


  return (
      <div className="app">
  <video ref={videoRef} autoPlay playsInline height={500} width={200} />

  {!cameraStarted && (
    <div className="controls">
      <button onClick={startCamera}>Start Camera</button>
    </div>
  )}

  {!cameraStop && (
    <div className="controls">
      <button onClick={startRecording}>Record Video</button>
      <button className="stop" onClick={stopRecording}>Stop Recording</button>
      {url && <video controls autoPlay src={url} />}
          <button className="stop" onClick={stopCamera}>Stop Camera</button>
          <button onClick={uploadVideo}>upload</button>
          {videoUrl && <div className="urlContainer">
            <p>{videoUrl}</p>
            <button onClick={() => navigator.clipboard.writeText(videoUrl)}>
              Copy Share Link
            </button>
          </div>}
    </div>
  )}
      </div>
  )
}

export default App
