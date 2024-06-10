const notifyPostCreated = async (post, db, userSockets, io) => {
  const [followers] = await db.query(
    'SELECT follower_id FROM followers WHERE followed_id = ?',
    [post.userId]
  );

  followers.forEach(follower => {
    const followerSocketId = userSockets.get(follower.follower_id);
    if (followerSocketId) {
      io.to(followerSocketId).emit('postCreated', { message: 'Post created successfully', post });
    }
  });
};

module.exports = {
  notifyPostCreated
};
