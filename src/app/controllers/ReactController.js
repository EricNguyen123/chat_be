const React = require('../models/React');
const db = require('../config/database');
const Post = require('../models/Post');
const Message = require('../models/Message');

class ReactController {
  async getReacts(req, res, next) {
    try {
      const { postId, messageId } = req.query;
      const condition = postId ? { postId } : { messageId };
      const includeModel = postId ? Post : Message;

      const reacts = await React.findAll({
        where: condition,
        include: [
          {
            model: includeModel,
          }
        ],
      });

      if (!reacts) {
        return res.status(404).json({ success: false, error: 'React not found' });
      }

      res.status(200).json(reacts);

    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createReact(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const { action, userId, postId, messageId } = req.body;

      const condition = postId ? { userId, postId } : { userId, messageId };


      const findReact = await React.findOne({
        where: condition,
        transaction, 
      });

      let react;
      if (findReact) {
        await React.update(
          { action },
          {
            where: condition,
            transaction,
          }
        );
      } else {
        const newReactData = postId ? { action, userId, postId } : { action, userId, messageId };
        react = await React.create(newReactData, { transaction });
      }

      const includeModel = postId ? Post : Message;
      react = await React.findOne({
        where: condition,
        include: [
          {
            model: includeModel,
          }
        ],
        transaction, 
      });
      await transaction.commit();
      res.status(200).json(react);

    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteReact(req, res, next) {
    const transaction = await db.sequelize.transaction();
    try {
      const { userId, postId, messageId } = req.query;

      const condition = postId ? { userId, postId } : { userId, messageId };
      const findReact = await React.findOne({
        where: condition,
        transaction,
      });

      if (!findReact) {
        await transaction.rollback();
        return res.status(404).json({ success: false, error: 'React not found' });
      }

      await React.destroy({
        where: condition,
        transaction,
      });

      await transaction.commit();
      res.status(200).json({ success: true, postId: postId, messageId: messageId, message: 'React deleted successfully' });

    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ReactController();
