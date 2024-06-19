const { Op } = require('sequelize');
const db = require('../config/database'); 
const User = require('../models/User');
const Relationship = require('../models/Relationship');
const MediaItem = require('../models/MediaItem');
const Room = require('../models/Room');
const Remember = require('../models/Remember');
const ActiveStorageBlob = require('../models/ActiveStorageBlob');
const ActiveStorageAttachment = require('../models/ActiveStorageAttachment');
const Message = require('../models/Message');

class RoomController {
  async createOneToOneRoom(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const { id } = req.body;
      const userId = id;
      const currentUser = req.user;

      const rooms = await Room.findAll({
        where: { groups: 0 },
        include: [
          {
            model: Remember,
            where: {
              userId: {
                [Op.in]: [currentUser.id, userId],
              },
            },
          },
        ],
        transaction,
      });

      const existingRooms = rooms.filter(room => {
        const rememberUserIds = room.Remembers.map(r => r.userId);
        return rememberUserIds.includes(currentUser.id) && rememberUserIds.includes(userId);
      });

      if (existingRooms.length === 0) {
        const newRoom = await Room.create({ title: `${currentUser.id}_${userId}`, groups: 0 }, { transaction });
        await Remember.create({ userId: currentUser.id, roomId: newRoom.id }, { transaction });
        await Remember.create({ userId, roomId: newRoom.id }, { transaction });

        await transaction.commit();

        res.status(200).json({
          success: true,
          message: 'One-to-One Room created successfully',
          room: newRoom,
        });
      } else {
        await transaction.commit();

        res.status(200).json({
          success: true,
          message: 'One-to-One Room already exists',
          room: existingRooms[0],
        });
      }
    } catch (err) {
      await transaction.rollback();
      res.status(500).json({
        error: err.message,
        success: false
      });
    }
  }

  // Function to create a group room
  async createGroupRoom(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
        
        const { title, userIds } = req.body;
        const currentUser = req.user;

        const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

        const newRoom = await Room.create({ title, groups: 1 }, { transaction });

        const rememberPromises = userIdArray.map(userId => 
            Remember.create({ userId, roomId: newRoom.id }, { transaction })
        );
        rememberPromises.push(Remember.create({ userId: currentUser.id, roomId: newRoom.id }, { transaction }));

        await Promise.all(rememberPromises);

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
                    resourceId: currentUser.id,  
                    roomId: newRoom.id,          
                    resourceType: 'room',        
                    mediaType: 1,
                    mediaUrl: `/uploads/${file.filename}`,
                }, { transaction });

                await ActiveStorageAttachment.create({
                    name: 'media',
                    recordType: 'Room',
                    blobId: blob.id,
                    mediaItemId: mediaItem.id,
                }, { transaction });
            });

            await Promise.all(mediaPromises);
        }

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'Group Room created successfully',
            room: newRoom,
        });
    } catch (err) {
        await transaction.rollback();
        console.log("err.message", err.message);
        res.status(500).json({
            error: err.message,
            success: false
        });
    }
  }

  async addUserToRoom(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const { roomId, userId } = req.body;
      const currentUser = req.user;

      const room = await Room.findByPk(roomId, { transaction });
      if (!room) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      const existingMember = await Remember.findOne({
        where: { roomId, userId },
        transaction,
      });

      if (existingMember) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'User already in the room' });
      }

      await Remember.create({ userId, roomId }, { transaction });
      await transaction.commit();

      res.status(200).json({ success: true, message: 'User added to the room successfully' });
    } catch (err) {
      await transaction.rollback();
      next(err);
    }
  }

  async getAllRoomsForCurrentUser(req, res, next) {
    try {
        const currentUser = req.user;

        const remembers = await Remember.findAll({
            where: { 
                userId: currentUser.id,
                isDelete: {
                  [Op.or]: [null, { [Op.ne]: 1 }]
                }
             },
            include: [{
                model: Room,
                include: [{
                    model: Remember,
                    include: [{
                      model: User,
                      attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] }
                    }],
                }],
            }],
        });

        const rooms = await Promise.all(remembers.map(async (remember) => {
            const room = remember.Room.get({ plain: true });
            
            let roomAvatar = null;
            if (room.groups === 0) {
              const otherUser = room.Remembers.find(member => member.userId !== currentUser.id)?.User;
              if (otherUser) {
                roomAvatar = await MediaItem.findByPk(otherUser.avatar);
                room.title = otherUser.name;
              }
            } else {
              roomAvatar = await MediaItem.findOne({
                where: { roomId: room.id }
              });
            }
            const users = await Promise.all(room.Remembers.map(async (member) => {
                if (!member.User) {
                    return null;
                }

                const user = member.User;
                const relationship = await Relationship.findOne({
                    where: {
                        followerId: currentUser.id,
                        followedId: user.id,
                    },
                });
                const isFollowing = !!relationship;
                const mediaAvatar = user.avatar ? await MediaItem.findByPk(user.avatar) : null;
                return { 
                    ...user, 
                    isFollowing, 
                    imagAvatar: mediaAvatar ? mediaAvatar.mediaUrl : null 
                };
            }));

            return { 
              ...room, 
              roomInfor: {
                imagAvatar: roomAvatar ? roomAvatar.mediaUrl: null, 
                name: room.title
              }, 
              users: users.filter(Boolean) 
            };
        }));

        res.status(200).json({ rooms });
    } catch (err) {
        console.log("err", err.message);
        next(err);
    }
  }

  async deleteRemember(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const { userId, roomId, outCheck } = req.body;
      console.log('req.body', req.body)
      const user = await User.findByPk(userId, { transaction });
      const remember = await Remember.findOne({
        where: {
          userId: userId,
          roomId: roomId,
        },
        transaction
      })
      if(!remember) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      const outMessage = await Message.create({ messages: `${user.name} has left the group.`, userId, roomId, outCheck }, { transaction });
      await remember.destroy({ transaction });
      await transaction.commit();
      res.status(200).json({
        success: true,
        message: 'Member deleted successfully',
        userId: userId,
        roomId: roomId,
        outMessage: outMessage,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoomController();
