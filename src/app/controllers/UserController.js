const User = require('../models/User');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

class UserController {
  async getUser(req, res, next) {
    try {
      const userId = req.params.id;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await User.findAll();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const currentUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] }
      });
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(currentUser);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
