require('dotenv').config();
const express = require('express')
const session = require('express-session');
const morgan = require('morgan');
const db = require('./app/config/database');
const upload = require('./app/config/multer');
const route = require('./app/routes');
const cors = require('cors');
const bodyParser = require('body-parser');  

const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./app/utils/socketHandler');

const app = express()
const port = process.env.PORT || 3002;
db.connect()
upload()
app.use(morgan('combined'))
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

socketHandler.init(io);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}))

route(app);

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

module.exports = { io }
