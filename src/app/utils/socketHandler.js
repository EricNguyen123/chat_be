const userHandlers = require('../sockets/userHandlers');
const postHandlers = require('../sockets/postHandlers');
const messagesHandlers = require('../sockets/messagesHandlers');

let io;
const userSockets = new Map();
const roomSockets = new Map();

const init = (socketIo) => {
  io = socketIo;
  io.on('connection', (socket) => {
    console.log('A new client connected', socket.id);
  
    socket.on('registerUser', (userId) => {
      userHandlers.registerUser(socket, userId, io, userSockets);
    });
  
    socket.on('disconnect', () => {
      userHandlers.handleDisconnect(socket, io, userSockets);
    });
  
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('joinRoom', (data) => {
      messagesHandlers.roomJoin(socket, data, roomSockets);
    })

    socket.on('messages', (data) => {
      messagesHandlers.messagesNoti(io, socket, data, roomSockets);
    })
  });
  
};

module.exports = {
  init,
  notifyPostCreated: postHandlers.notifyPostCreated,
};
