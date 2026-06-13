// middleware/admin.js
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            message: 'Truy cập bị từ chối. Yêu cầu quyền Admin.',
            yourRole: req.user?.role || 'unknown'
        });
    }
};

module.exports = admin;