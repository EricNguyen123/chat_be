const Post = require('../models/Post');
const MediaItem = require('../models/MediaItem');
const ActiveStorageBlob = require('../models/ActiveStorageBlob');
const ActiveStorageAttachment = require('../models/ActiveStorageAttachment');
const db = require('../config/database');
const User = require('../models/User');
const Relationship = require('../models/Relationship');
const React = require('../models/React');

class PostController {
  async createPost(req, res) {
    const transaction = await db.sequelize.transaction();
    try {
      const { body, status, userId, parentId } = req.body;

      const post = await Post.create({ body, status: 1, userId, parentId }, { transaction });
      
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
            postId: post.id,
            resourceType: 'post',
            mediaType: 1,
            mediaUrl: `/uploads/${file.filename}`,
          }, { transaction });

          await ActiveStorageAttachment.create({
            name: 'media',
            recordType: 'Post',
            blobId: blob.id,
            mediaItemId: mediaItem.id,
          }, { transaction });
        });

        await Promise.all(mediaPromises);
      }

      await transaction.commit();


      res.status(200).json(post);
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ error: error.message });
    }
  }

  async deletePost(req, res) {
    const transaction = await db.sequelize.transaction();
    try {
      const { id } = req.params;
      const deletePostRecursively = async (postId, transaction) => {
        const existingMediaItems = await MediaItem.findAll({ where: { postId: postId }, transaction });
        const existingMediaIds = existingMediaItems.map(media => media.id);

        if (existingMediaIds.length > 0) {
          const attachmentsToDelete = await ActiveStorageAttachment.findAll({
            where: { mediaItemId: existingMediaIds },
            transaction
          });
    
          const blobIdsToDelete = attachmentsToDelete.map(attachment => attachment.blobId);
    
          await ActiveStorageAttachment.destroy({
            where: { mediaItemId: existingMediaIds },
            transaction
          });
    
          await ActiveStorageBlob.destroy({
            where: { id: blobIdsToDelete },
            transaction
          });
    
          await MediaItem.destroy({
            where: { id: existingMediaIds },
            transaction
          });
        }
        await React.destroy({
          where: { postId: postId },
          transaction
        });
        const childPosts = await Post.findAll({ where: { parentId: postId }, transaction });
        for (const childPost of childPosts) {
          await deletePostRecursively(childPost.id, transaction);
        }
        await Post.destroy({ where: { id: postId }, transaction });
      };

      await deletePostRecursively(id, transaction);

      await transaction.commit();
      res.status(200).json({ success: true });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  async updatePost(req, res) {
    const transaction = await db.sequelize.transaction();
    const currentUser = req.user;
    try {
      const { id } = req.params;
      let { body, status, userId, parentId, mediaItems } = req.body;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
      });

      const fetchAllChildren = async (parentId) => {
        const posts = await Post.findAll({
          where: { parentId },
          include: [
            {
              model: MediaItem,
              attributes: ['id', 'mediaType', 'mediaUrl']
            },
            {
              model: React,
              attributes: ['id', 'action', 'userId']
            }
          ],
          order: [['createdAt', 'DESC']]
        });
  
        for (let post of posts) {
          const userId = post.userId;
          const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
          });
          if (user && user.avatar) {
            post.dataValues.User = user;
            const avatarMedia = await MediaItem.findOne({
              where: { id: user.avatar },
              attributes: ['id', 'mediaType', 'mediaUrl']
            });
            post.dataValues.avatarMedia = avatarMedia;
          }
          if(userId !== currentUser.id) {
            const relationship = await Relationship.findOne({
              where: {
                followerId: currentUser.id,
                followedId: userId
              }
            });

            const isFollowing = !!relationship;
            post.dataValues.isFollowing = isFollowing;
          }
          post.dataValues.children = await fetchAllChildren(post.id);       
        }
  
        return posts;
      };
      
      mediaItems = mediaItems && !Array.isArray(mediaItems) ? [mediaItems] : mediaItems;
      const newMediaFiles = req.files;
      
      await Post.update({ body, status: 1, userId, parentId }, { where: { id }, transaction });
  
      const existingMediaItems = await MediaItem.findAll({ where: { postId: id }, transaction });
      const existingMediaIds = existingMediaItems.map(media => media.id);

      const parsedMediaItems = mediaItems ? mediaItems.map(media => JSON.parse(media)) : [];
      const incomingMediaIds = parsedMediaItems.map(media => media.id);

      const mediaIdsToDelete = existingMediaIds.filter(id => !incomingMediaIds.includes(id));

      if (mediaIdsToDelete.length > 0) {
        const attachmentsToDelete = await ActiveStorageAttachment.findAll({
          where: { mediaItemId: mediaIdsToDelete },
          transaction
        });
  
        const blobIdsToDelete = attachmentsToDelete.map(attachment => attachment.blobId);
  
        await ActiveStorageAttachment.destroy({
          where: { mediaItemId: mediaIdsToDelete },
          transaction
        });
  
        await ActiveStorageBlob.destroy({
          where: { id: blobIdsToDelete },
          transaction
        });
  
        await MediaItem.destroy({
          where: { id: mediaIdsToDelete },
          transaction
        });
      }
  
      if (newMediaFiles && newMediaFiles.length > 0) {
        const filePromises = newMediaFiles.map(async file => {
          const blob = await ActiveStorageBlob.create({
            key: file.filename,
            filename: file.originalname,
            contentType: file.mimetype,
            byteSize: file.size,
            checksum: '',
          }, { transaction });
  
          const mediaItem = await MediaItem.create({
            resourceId: userId,
            postId: id,
            resourceType: 'post',
            mediaType: file.mimetype.startsWith('image') ? 1 : 2,
            mediaUrl: `/uploads/${file.filename}`,
          }, { transaction });
  
          await ActiveStorageAttachment.create({
            name: 'media',
            recordType: 'Post',
            blobId: blob.id,
            mediaItemId: mediaItem.id,
          }, { transaction });
        });
        await Promise.all(filePromises);
      }
  
      await transaction.commit();
      const updatedPost = await Post.findByPk(id, {
        include: [
          {
            model: MediaItem,
            attributes: ['id', 'mediaType', 'mediaUrl']
          },
          {
            model: React,
            attributes: ['id', 'action', 'userId']
          }
        ]
      });
      if (user && user.avatar) {
        updatedPost.dataValues.User = user;
        const avatarMedia = await MediaItem.findOne({
          where: { id: user.avatar },
          attributes: ['id', 'mediaType', 'mediaUrl']
        });
        updatedPost.dataValues.avatarMedia = avatarMedia;
      }
      updatedPost.dataValues.children = await fetchAllChildren(id);
      res.status(200).json({ success: true, ...updatedPost.toJSON() });
    } catch (error) {
      console.log("error", error.message);
      await transaction.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPost(req, res) {
    try {
      const { id } = req.params;
      const post = await Post.findByPk(id, {
        include: [
          {
            model: MediaItem,
            attributes: ['id', 'mediaType', 'mediaUrl']
          }
        ]
      });
      if (!post) {
        res.status(404).json({ error: 'Post not found' });
      } else {
        res.status(200).json(post);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllRelatedPosts(req, res) {
    try {
      const currentUser = req.user;
      const fetchAllChildren = async (parentId) => {
        const posts = await Post.findAll({
          where: { parentId },
          include: [
            {
              model: MediaItem,
              attributes: ['id', 'mediaType', 'mediaUrl']
            },
            {
              model: React,
              attributes: ['id', 'action', 'userId']
            }
          ],
          order: [['createdAt', 'DESC']]
        });
  
        for (let post of posts) {
          const userId = post.userId;
          const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
          });
          if (user && user.avatar) {
            post.dataValues.User = user;
            const avatarMedia = await MediaItem.findOne({
              where: { id: user.avatar },
              attributes: ['id', 'mediaType', 'mediaUrl']
            });
            post.dataValues.avatarMedia = avatarMedia;
          }
          if(userId !== currentUser.id) {
            const relationship = await Relationship.findOne({
              where: {
                followerId: currentUser.id,
                followedId: userId
              }
            });

            const isFollowing = !!relationship;
            post.dataValues.isFollowing = isFollowing;
          }
          post.dataValues.children = await fetchAllChildren(post.id);       
        }
  
        return posts;
      };
  
      const parentPosts = await Post.findAll({
        where: { parentId: null },
        include: [
          {
            model: MediaItem, 
            attributes: ['id', 'mediaType', 'mediaUrl']
          },
          {
            model: React,
            attributes: ['id', 'action', 'userId']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
  
      for (let post of parentPosts) {
        const userId = post.userId;
        const user = await User.findByPk(userId, {
          attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
        });
        if (user && user.avatar) {
          post.dataValues.User = user;
          const avatarMedia = await MediaItem.findOne({
            where: { id: user.avatar },
            attributes: ['id', 'mediaType', 'mediaUrl']
          });
          post.dataValues.avatarMedia = avatarMedia;
        }
        if(userId !== currentUser.id) {
          const relationship = await Relationship.findOne({
            where: {
              followerId: currentUser.id,
              followedId: userId
            }
          });

          const isFollowing = !!relationship;
          post.dataValues.isFollowing = isFollowing;
        }
        post.dataValues.children = await fetchAllChildren(post.id);
      }
      res.status(200).json(parentPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllUserPosts(req, res) {
    try {
      const currentUser = req.user;
      const fetchAllChildren = async (parentId) => {
        const posts = await Post.findAll({
          where: { parentId },
          include: [
            {
              model: MediaItem,
              attributes: ['id', 'mediaType', 'mediaUrl']
            },
            {
              model: React,
              attributes: ['id', 'action', 'userId']
            }
          ],
          order: [['createdAt', 'DESC']]
        });
  
        for (let post of posts) {
          const userId = post.userId;
          const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
          });
          if (user && user.avatar) {
            post.dataValues.User = user;
            const avatarMedia = await MediaItem.findOne({
              where: { id: user.avatar },
              attributes: ['id', 'mediaType', 'mediaUrl']
            });
            post.dataValues.avatarMedia = avatarMedia;
          }
          if(userId !== currentUser.id) {
            const relationship = await Relationship.findOne({
              where: {
                followerId: currentUser.id,
                followedId: userId
              }
            });
  
            const isFollowing = !!relationship;
            post.dataValues.isFollowing = isFollowing;
          }
          post.dataValues.children = await fetchAllChildren(post.id);
        }
  
        return posts;
      };
  
      const parentPosts = await Post.findAll({
        where: { 
          userId: req.params.id,
          parentId: null,
         },
        include: [
          {
            model: MediaItem, 
            attributes: ['id', 'mediaType', 'mediaUrl']
          },
          {
            model: React,
            attributes: ['id', 'action', 'userId']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
  
      for (let post of parentPosts) {
        const userId = post.userId;
        const user = await User.findByPk(userId, {
          attributes: { exclude: ['password', 'createdAt', 'updatedAt', 'actived'] },
        });
        if (user && user.avatar) {
          post.dataValues.User = user;
          const avatarMedia = await MediaItem.findOne({
            where: { id: user.avatar },
            attributes: ['id', 'mediaType', 'mediaUrl']
          });
          post.dataValues.avatarMedia = avatarMedia;
        }
        if(userId !== currentUser.id) {
          const relationship = await Relationship.findOne({
            where: {
              followerId: currentUser.id,
              followedId: userId
            }
          });

          const isFollowing = !!relationship;
          post.dataValues.isFollowing = isFollowing;
        }
        post.dataValues.children = await fetchAllChildren(post.id);
      }
      res.status(200).json(parentPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: error.message });
    }
  }

}

module.exports = new PostController();
