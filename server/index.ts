import express from "express"
import cors from "cors"

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send("server is up and running")
})

app.listen(port, () => {
    console.log("Server is listening on port", port)
})
