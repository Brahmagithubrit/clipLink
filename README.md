
#  Real-Time Video Call Application

A peer-to-peer video calling web application built using **Node.js**, **React.js**, **WebRTC**, and **WebSockets**.
This project enables real-time video, audio, and data communication similar to WhatsApp video calling.

---

##  Features

* 🔹 Peer-to-peer video and audio calling (WebRTC)
* 🔹 Real-time signaling using WebSockets
* 🔹 Low latency communication
* 🔹 Camera and microphone stream handling
* 🔹 Call join via unique room ID
* 🔹 Real-time data sharing between peers
* 🔹 Responsive UI built with React

---

##  Tech Stack

### Frontend

* React.js
* WebRTC API
* Socket.io-client

### Backend

* Node.js
* Express.js
* Socket.io

---

##  How It Works

1. **User joins a room**
2. A WebSocket connection is established with the server.
3. The server handles **signaling** (offer, answer, ICE candidates).
4. WebRTC establishes a **direct peer-to-peer connection**.
5. Media streams (audio/video) are shared directly between users.
6. Real-time messages or additional data can be exchanged using WebRTC data channels.

> Note: The server is only used for signaling. Media does not pass through the server.

---



## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository



---

### 2️⃣ Install Dependencies

#### Server

```bash
cd server
npm install
```

#### Client

```bash
cd client
npm install
```

---

### 3️⃣ Run the Application

#### Start Backend

```bash
npm start
```

#### Start Frontend

```bash
npm start
```

Frontend will run on:

```
http://localhost:3000
```

Backend will run on:

```
http://localhost:5000
```

---

##  WebRTC Signaling Flow

1. Caller creates an **offer**
2. Offer sent via WebSocket to server
3. Server forwards offer to receiver
4. Receiver sends **answer**
5. ICE candidates exchanged
6. Peer-to-peer connection established

---

## 📸 Future Improvements

* Group video calling
* Screen sharing
* Authentication system
* TURN server integration for NAT traversal
* End-to-end encryption enhancement
* Call recording

---

##  Challenges Solved

* Managing WebRTC signaling
* Handling ICE candidate exchange
* Preventing multiple re-renders in React
* Maintaining socket lifecycle
* Handling peer disconnect events cleanly

---

##  Learning Outcomes

* Deep understanding of WebRTC internals
* Practical real-time communication architecture
* WebSocket signaling implementation
* React + real-time systems integration

---

##  License

This project is for educational purposes.

