const Relationship = require('../models/Relationship');
const User = require('../models/User');

class RelationshipController {
  async follow(req, res) {
    try {
      const followedUser = await User.findByPk(req.params.id);
      if (!followedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const relationship = await Relationship.findOne({
        where: {
          followerId: req.user.id,
          followedId: followedUser.id,
        },
      });

      if (relationship) {
        return res.status(400).json({ error: 'Already following' });
      }

      await req.user.addFollowing(followedUser);

      const followingCount = await Relationship.count({
        where: {
          followerId: req.params.id,
        }
      });
      
      const followerCount = await Relationship.count({
        where: {
          followedId: req.params.id,
        }
      });    
      res.json({ success: true, followingCount, followerCount });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async unfollow(req, res) {
    try {
      const followedId = req.params.id;
      const followerId = req.user.id;
  
      const relationship = await Relationship.findOne({
        where: {
          followerId: followerId,
          followedId: followedId,
        },
      });
  
      if (!relationship) {
        return res.status(404).json({ error: 'Relationship not found' });
      }
  
      await req.user.removeFollowing(followedId);

      const followingCount = await Relationship.count({
        where: {
          followerId: req.params.id,
        }
      });
      
      const followerCount = await Relationship.count({
        where: {
          followedId: req.params.id,
        }
      });    
      res.json({ success: true, followingCount, followerCount });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
  
}

module.exports = new RelationshipController();