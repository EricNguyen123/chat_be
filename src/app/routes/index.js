const Register = require('./Register')
const Login = require('./Login')
const web = require('./web')

function route(app) {
  app.use('/register', Register)
  app.use('/login', Login)
  app.use('/', web)
}

module.exports = route;