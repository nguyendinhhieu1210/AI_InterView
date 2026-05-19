// server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDatabase } = require('./database');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const weaknessRoutes = require('./routes/weaknessRoutes');
const cvRoutes = require('./routes/cv');

const app = express();

// Middleware
app.use(cors({
    origin:
        process.env.FRONTEND_URL ||
        'http://localhost:3000',

    credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/interview', interviewRoutes);

app.use('/api/cv', cvRoutes);

app.use('/api/weakness', weaknessRoutes);

app.use(
    '/api/activity',
    require('./routes/activityRoutes')
);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date()
    });
});

// Database
connectDatabase()
    .then(() =>
        console.log(
            '✅ Database connected successfully'
        )
    )
    .catch(err => {

        console.error(
            '❌ Database connection failed:',
            err
        );

        process.exit(1);
    });

// Start server
const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});