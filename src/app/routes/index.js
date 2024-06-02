const Register = require('./Register')
const Login = require('./Login')
const web = require('./web')
const Relationship = require('./relationship')
const Media = require('./media')
const express = require('express');
const path = require('path');
const Post = require('./post')

function route(app) {
  app.use('/register', Register)
  app.use('/login', Login)
  app.use('/relationships', Relationship)
  app.use('/media', Media)
  app.use('/uploads', express.static(path.join(__dirname, '../../../uploads')));
  app.use('/posts', Post)
  app.use('/', web)
}

module.exports = route;