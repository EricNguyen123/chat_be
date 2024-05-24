require('dotenv').config();
const express = require('express')
const session = require('express-session');
const morgan = require('morgan');
const db = require('./app/config/database');
const User = require('./app/models/User');
const Relationship = require('./app/models/Relationship');
const route = require('./app/routes');
const cors = require('cors');
const bodyParser = require('body-parser');  

const app = express()
const port = process.env.PORT || 3002;
db.connect()
app.use(morgan('combined'))
app.use(cors());
app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}))

route(app);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
