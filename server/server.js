const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const morgan = require("morgan")
const dotenv = require("dotenv")
const audioRoutes = require("./routes/audio")
const playlistRoutes = require("./routes/playlist")
const authRoutes = require("./routes/auth")
const socialRoutes = require("./routes/social")

dotenv.config()

const PORT = process.env.PORT || 5000

const app = express()

//middleware
app.use(cors({
  origin: "*"
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

//Connect to DB
mongoose.connect(process.env.MONGO_URI).then((res)=>{
    console.log("Connected to DB:", res.connection.db.databaseName)
}).catch((err)=>{
    console.log("Error connecting to DB", err)
})

//Routes
app.use("/api/auth", authRoutes)
app.use("/api/audio", audioRoutes)
app.use("/api/playlists", playlistRoutes)
app.use("/api/social", socialRoutes)

// Default route for health check
app.get("/", (req, res) => {
  res.status(200).send("🎵 Spotify Clone API is running");
})

// Only listen to the port when not running in Vercel (development mode)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, ()=>{
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📱 Health check: http://localhost:${PORT}/`)
  })
}

// Export the app for Vercel
module.exports = app; 