console.log('### Node.js demo app starting...')

require('dotenv').config()

// App Insights. Set APPINSIGHTS_INSTRUMENTATIONKEY as App Setting or env var
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  const appInsights = require('applicationinsights')
  appInsights
    .setup()
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)

  appInsights.start()
}

const express = require('express')
const path = require('path')
const logger = require('morgan')
const bodyParser = require('body-parser')
const app = express()
const session = require('express-session')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(
  session({
    secret: 'Shape without form, shade without colour',
    cookie: { secure: false },
    resave: false,
    saveUninitialized: false,
  })
)

app.use(logger('dev'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', require('./routes/pages'))
app.use('/', require('./routes/api'))

if (process.env.AAD_APP_ID && process.env.AAD_APP_SECRET) {
  app.use('/', require('./routes/auth'))
}

if (process.env.TODO_MONGO_CONNSTR) {
  app.use('/', require('./todo/routes'))
}

app.locals.version = require('./package.json').version

app.use(function (req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  if (req.method != 'GET') {
    err = new Error(`Method ${req.method} not allowed`)
    err.status = 500
  }

  next(err)
})

app.use(function (err, req, res, next) {
  console.error(`### ERROR: ${err.message}`)

  const appInsights = require('applicationinsights')
  if (appInsights.defaultClient) {
    appInsights.defaultClient.trackException({ exception: err })
  }

  res.status(err.status || 500)
  res.render('error', {
    title: 'Error',
    message: err.message,
    error: err,
  })
})

let port = process.env.PORT || 3000

app.listen(port)
console.log(`### Server listening on port ${port}`)

module.exports = app
