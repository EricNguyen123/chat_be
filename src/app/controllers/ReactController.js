const React = require('../models/React');
const db = require('../config/database');
const Post = require('../models/Post');

class ReactController {
  async getReacts(req, res, next) {
    try {
      const { postId } = req.query;

      const reacts = await React.findAll({
        where: {
          postId: postId,
        },
        include: [
          {
            model: Post,
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
      const { action, userId, postId } = req.body;

      const findReact = await React.findOne({
        where: {
          userId: userId,
          postId: postId,
        },
        transaction, 
      });

      let react;
      if (findReact) {
        await React.update(
          { action },
          {
            where: {
              userId: userId,
              postId: postId,
            },
            transaction,
          }
        );
      } else {
        react = await React.create({ action, userId, postId }, { transaction });
      }
      react = await React.findOne({
        where: {
          userId: userId,
          postId: postId,
        },
        include: [
          {
            model: Post,
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
      const { userId, postId } = req.query;

      const findReact = await React.findOne({
        where: {
          userId: userId,
          postId: postId,
        },
        transaction,
      });

      if (!findReact) {
        await transaction.rollback();
        return res.status(404).json({ success: false, error: 'React not found' });
      }

      await React.destroy({
        where: {
          userId: userId,
          postId: postId,
        },
        transaction,
      });

      await transaction.commit();
      res.status(200).json({ success: true, postId: postId, message: 'React deleted successfully' });

    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ReactController();
