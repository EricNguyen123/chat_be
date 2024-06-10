const { Op } = require('sequelize');
const db = require('../config/database'); 
const Message = require('../models/Message');
const User = require('../models/User');
const MediaItem = require('../models/MediaItem');
const ActiveStorageBlob = require('../models/ActiveStorageBlob');
const ActiveStorageAttachment = require('../models/ActiveStorageAttachment');
const Relationship = require('../models/Relationship');
const { messagesNoti } = require('../sockets/messagesHandlers'); 

class MessageController {
  async addMessage(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const { message, userId, roomId } = req.body;
      const newMessage = await Message.create({ messages: message, userId, roomId }, { transaction });
      if (req.files && req.files.length > 0) {
        const mediaPromises = req.files.map(async file => {
          const blob = await ActiveStorageBlob.create({
            key: file.filename,
            filename: file.originalname,
            contentType: file.mimetype,
            byteSize: file.size,
            checksum: '',
          });

          const mediaItem = await MediaItem.create({
            resourceId: userId,
            messageId: newMessage.id,
            resourceType: 'message',
            mediaType: 1,
            mediaUrl: `/uploads/${file.filename}`,
          }, { transaction });

          await ActiveStorageAttachment.create({
            name: 'media',
            recordType: 'Message',
            blobId: blob.id,
            mediaItemId: mediaItem.id,
          }, { transaction });
        });

        await Promise.all(mediaPromises);
      }
      await transaction.commit();
      
      res.status(200).json({
        success: true,
        message: 'Message added successfully',
        data: newMessage,
      });
    } catch (err) {
      await transaction.rollback();
      res.status(500).json({
        error: err.message,
        success: false,
      });
    }
  }

  async deleteMessage(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const { id } = req.params;

      const message = await Message.findByPk(id, { transaction });
      if (!message) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Message not found' });
      }

      await message.destroy({ transaction });
      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (err) {
      await transaction.rollback();
      res.status(500).json({
        error: err.message,
        success: false,
      });
    }
  }

  async getAllMessagesByRoom(req, res, next) {
    try {
      const { roomId } = req.params;
      const currentUser = req.user;
      const messages = await Message.findAll({
        where: { roomId },
        include: [
          {
            model: MediaItem, 
            attributes: ['id', 'mediaType', 'mediaUrl']
          }
        ],
        order: [['createdAt', 'ASC']],
      });

      for (let message of messages) {
        const userId = message.userId;
        const user = await User.findByPk(userId, {
          attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
        });
        if (user && user.avatar) {
          message.dataValues.User = user;
          const avatarMedia = await MediaItem.findOne({
            where: { id: user.avatar },
            attributes: ['id', 'mediaType', 'mediaUrl']
          });
          message.dataValues.avatarMedia = avatarMedia;
        }
        if(userId !== currentUser.id) {
          const relationship = await Relationship.findOne({
            where: {
              followerId: currentUser.id,
              followedId: userId
            }
          });

          const isFollowing = !!relationship;
          message.dataValues.isFollowing = isFollowing;
        }
      }

      res.status(200).json({
        success: true,
        messages,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
        success: false,
      });
    }
  }
}

module.exports = new MessageController();
