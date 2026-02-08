import { useRef, useEffect, useState } from "react"

async function getCameraStream() {
  return await navigator.mediaDevices.getUserMedia({ video: true })
}

function App() {
  const [cameraStarted, setCameraStarted] = useState(false)
  const [cameraStop, setcameraStop] = useState(true)
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
  const RecordCamera = () => {
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
 

  return (
      <>  
        <video ref={videoRef} autoPlay playsInline height={500} width={200}/>
      {!cameraStarted && <button onClick={startCamera}>start Camera </button>}
      {!cameraStop && 
      <><button onClick={RecordCamera}>Record Video</button>   
      <button onClick={stopCamera}>stop Camera</button></>
      }
      </>
  )
}

export default App
