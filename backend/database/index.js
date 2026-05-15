// database/index.js
// File này đóng vai trò trung gian, quyết định gọi database nào dựa vào DB_TYPE

require('dotenv').config();
const { connectMongoDB, disconnectMongoDB } = require('./mongodb');

const DB_TYPE = process.env.DB_TYPE || 'mongodb';

/**
 * Hàm kết nối database chung
 * - Dùng switch-case để gọi đúng hàm kết nối của từng loại DB
 */
const connectDatabase = async () => {
    switch (DB_TYPE) {
        case 'mongodb':
            return await connectMongoDB(process.env.MONGO_URI);
        // Trường hợp thêm PostgreSQL, MySQL,... chỉ cần thêm case mới
        default:
            throw new Error(`Unsupported database type: ${DB_TYPE}`);
    }
};

/**
 * Ngắt kết nối database chung
 */
const disconnectDatabase = async () => {
    switch (DB_TYPE) {
        case 'mongodb':
            return await disconnectMongoDB();
        default:
            console.log('No disconnect function for this DB type');
    }
};

module.exports = { connectDatabase, disconnectDatabase };