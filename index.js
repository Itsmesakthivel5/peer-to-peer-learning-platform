const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 5000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== UPLOAD FOLDER =====
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// ===== STATIC =====
app.use('/uploads', express.static(uploadPath));

// ===== MULTER =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ===== TEST =====
app.get('/', (req, res) => {
  res.send('🚀 Server running');
});


// ==========================================
// 🔐 REGISTER
// ==========================================
app.post('/api/auth/register', (req, res) => {
  console.log("REGISTER HIT:", req.body);

  const { name, phone, department, year, role } = req.body;

  if (!name || !phone || !year) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  res.json({
    message: "User registered successfully",
    user: { name, phone, department, year, role }
  });
});


// ==========================================
// 📚 COURSE CREATE (VIDEO OPTIONAL)
// ==========================================
app.post('/api/courses/create', upload.single('video'), (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title & Description required"
      });
    }

    const videoPath = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    console.log("COURSE:", { title, description, videoPath });

    res.json({
      message: "Course created successfully",
      data: { title, description, video: videoPath }
    });

  } catch (err) {
    console.error("COURSE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ==========================================
// 📄 RESUME ANALYZER (FIXED)
// ==========================================
app.post('/api/resume/analyze', upload.single('resume'), async (req, res) => {
  try {
    console.log("📁 FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.join(uploadPath, req.file.filename);
    const buffer = fs.readFileSync(filePath);

    const data = await pdfParse(buffer);
    const text = data.text;

    console.log("TEXT LENGTH:", text.length);

    const safeText = text && text.length > 20
      ? text
      : "No readable content found";

    let score = 0;
    const keywords = ["python", "react", "node", "mongodb"];

    keywords.forEach(k => {
      if (safeText.toLowerCase().includes(k)) score += 25;
    });

    if (score > 100) score = 100;

    res.json({
      atsScore: score,
      analysis:
        safeText === "No readable content found"
          ? "⚠️ Image-based PDF (use text PDF)"
          : "✅ Resume analyzed",
      text: safeText
    });

  } catch (err) {
    console.error("❌ PDF ERROR:", err);
    res.status(500).json({ error: "PDF parsing failed" });
  }
});
// ==========================================
// 🚀 START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});