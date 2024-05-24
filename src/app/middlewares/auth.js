const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthMiddleware {
  // Kiểm tra xem người dùng đã đăng nhập qua session chưa
  async loggedin(req, res, next) {
    if (req.session.loggedin) {
      res.locals.user = req.session.user;
      next();
    } else {
      return res.status(404).json({ message: 'Please login.' });
    }
  }

  // Kiểm tra xem người dùng đã xác thực qua session chưa
  async isAuth(req, res, next) {
    if (req.session.loggedin) {
      res.locals.user = req.session.user;
      return res.status(200).json({ message: 'Login succeeded.' });
    } else {
      next();
    }
  }

  // Xác thực JWT
  async verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }
  }

  // Kiểm tra vai trò người dùng (ví dụ: admin)
  async isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: Admins only.' });
    }
  }
}

module.exports = new AuthMiddleware();
