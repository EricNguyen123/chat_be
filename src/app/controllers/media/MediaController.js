const ActiveStorageBlob = require('../../models/ActiveStorageBlob');
const MediaItem = require('../../models/MediaItem');
const ActiveStorageAttachment = require('../../models/ActiveStorageAttachment');
const User = require('../../models/User');

class MediaController {
  async updateAvatar(req, res) {
    try {
      const userId = req.user.id;
      const file = req.file;
      const blob = await ActiveStorageBlob.create({
        key: file.filename,
        filename: file.originalname,
        contentType: file.mimetype,
        byteSize: file.size,
        checksum: '',
      });
      const mediaItem = await MediaItem.create({
        resourceId: userId,
        resourceType: 'User',
        mediaType: 1,
        mediaUrl: `/uploads/${file.filename}`,
      });
      const attachment = await ActiveStorageAttachment.create({
        name: 'avatar',
        recordType: 'User',
        blobId: blob.id,
        mediaItemId: mediaItem.id,
      });

      const user = await User.findByPk(userId);
      user.avatar = mediaItem.id;
      await user.save();
  
      res.json({ success: true, user });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async uploadMedia (req, res) {
    try {
      const file = req.file;
      const blob = await ActiveStorageBlob.create({
        key: file.filename,
        filename: file.originalname,
        contentType: file.mimetype,
        byteSize: file.size,
        checksum: '', 
      });
      const mediaItem = await MediaItem.create({
        resourceId: req.user.id,
        resourceType: 'ActiveStorageAttachment',
        mediaType: 1, 
        mediaUrl: `/uploads/${file.filename}`
      });
      const attachment = await ActiveStorageAttachment.create({
        name: 'media',
        recordType: 'MediaItem',
        blobId: blob.id,
        mediaItemId: mediaItem.id,
      });

      res.json({ success: true, mediaItem });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new MediaController();
