const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/financial-help-tool")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Define schema and model
const entrySchema = new mongoose.Schema({
  amount: Number,
  receipt: String,
  date: String,
});
const Entry = mongoose.model("Entry", entrySchema);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// API endpoints
app.post("/api/add", upload.single("receipt"), async (req, res) => {
  try {
    const { amount, date } = req.body;
    const receiptPath = req.file ? `/uploads/${req.file.filename}` : null;

    const newEntry = new Entry({ amount, receipt: receiptPath, date });
    await newEntry.save();

    res.json({ message: "Entry saved successfully!", entry: newEntry });
  } catch (error) {
    res.status(500).json({ error: "Error saving entry" });
  }
});

app.get("/api/entries", async (req, res) => {
  try {
    const entries = await Entry.find();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: "Error fetching entries" });
  }
});

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Serve index.html when the user accesses the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
