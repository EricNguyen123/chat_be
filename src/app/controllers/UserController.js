const User = require('../models/User');
const Relationship = require('../models/Relationship');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const MediaItem = require('../models/MediaItem');

class UserController {
  async getUser(req, res, next) {
    try {
      const userId = req.params.id;
      const currentUser = req.user;
  
      if (!currentUser) {
        return res.status(400).json({ message: 'Current user not found' });
      }
  
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
      });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const relationship = await Relationship.findOne({
        where: {
          followerId: currentUser.id,
          followedId: userId
        }
      });

      const followingCount = await Relationship.count({
        where: {
          followerId: userId,
        }
      });
      
      const followerCount = await Relationship.count({
        where: {
          followedId: userId,
        }
      });      
  
      const isFollowing = !!relationship;

      const mediaAvatar = await MediaItem.findByPk(user.avatar)
  
      res.status(200).json({ ...user.toJSON(), isFollowing, followingCount, followerCount, imagAvatar: mediaAvatar ? mediaAvatar.mediaUrl: undefined });
    } catch (error) {
      next(error);
    }
  }
  
  
  async getUsers(req, res, next) {
    try {
        const users = await User.findAll();
        const result = await Promise.all(users.map(async user => {
            const mediaAvatar = user.avatar ? await MediaItem.findByPk(user.avatar) : null;
            return { ...user.toJSON(), imagAvatar: mediaAvatar ? mediaAvatar.mediaUrl : null };
        }));
        res.status(200).json(result);
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
      const followingCount = await Relationship.count({
        where: {
          followerId: req.user.id,
        }
      });
      
      const followerCount = await Relationship.count({
        where: {
          followedId: req.user.id,
        }
      });    

      const mediaAvatar = await MediaItem.findByPk(currentUser.avatar)
      
      res.status(200).json({...currentUser.toJSON(), followingCount, followerCount, imagAvatar: mediaAvatar ? mediaAvatar.mediaUrl : undefined});
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
