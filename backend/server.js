// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./database');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const weaknessRoutes = require('./routes/weaknessRoutes');
const cvRoutes = require('./routes/cv');
const adaptiveRoutes = require('./routes/adaptiveInterviewRoutes');
const liveCodingRoutes = require('./routes/liveCodingRoutes');
const adminTokenRoutes = require('./routes/admin/tokenRoutes');

// ✅ Import Question Routes từ thư mục admin
const questionRoutes = require('./routes/admin/questionRoutes');
const examSetRoutes = require('./routes/admin/examSetRoutes');

// ✅ Import user exam set routes
const userExamSetRoutes = require('./routes/userexamSetRoutes');

const app = express();

// ================= CORS =================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= ROUTES =================
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/weakness', weaknessRoutes);
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/adaptive', adaptiveRoutes);
app.use('/api/live-coding', liveCodingRoutes);

// ✅ User Routes - KHÔNG có middleware admin
app.use('/api/user', userExamSetRoutes);

// ✅ Admin Routes - Có middleware admin trong route
// Đổi thành /api/admin để tránh xung đột với user routes
app.use('/api/admin', questionRoutes);
app.use('/api/admin', examSetRoutes);
app.use('/api/admin/tokens', adminTokenRoutes);

// ================= HEALTH =================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// ================= ERROR HANDLING =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ================= START =================
const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    console.log('✅ Database connected successfully');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
