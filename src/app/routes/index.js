const Register = require('./Register')
const Login = require('./Login')
const web = require('./web')
const Relationship = require('./relationship')

function route(app) {
  app.use('/register', Register)
  app.use('/login', Login)
  app.use('/relationships', Relationship)
  app.use('/', web)
}

module.exports = route;