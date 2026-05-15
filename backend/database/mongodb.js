// database/mongodb.js
// Chứa logic kết nối cụ thể với MongoDB sử dụng Mongoose

const mongoose = require('mongoose');

/**
 * Hàm kết nối đến MongoDB
 * @param {string} uri - Đường dẫn kết nối (lấy từ MONGO_URI trong .env)
 */
const connectMongoDB = async (uri) => {
    try {
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

        // Lắng nghe sự kiện mất kết nối
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });

        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error; // Ném lỗi lên file tổng xử lý
    }
};

/**
 * Ngắt kết nối MongoDB
 */
const disconnectMongoDB = async () => {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
};

module.exports = { connectMongoDB, disconnectMongoDB };