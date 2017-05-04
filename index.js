import mongoose from 'mongoose'

// config should be imported before importing any other file
import app from './config/express'

// make bluebird default Promise
// Promise = require('bluebird') // eslint-disable-line no-global-assign
global.Promise = require('bluebird')
global.Promise.config({
  warnings: true,
  longStackTraces: true,
  cancellation: true,
  monitoring: true
})

// plugin bluebird promise in mongoose
mongoose.Promise = global.Promise

// connect to mongo db
const mongoUri = process.env.MONGO_URL
mongoose.connect(mongoUri, { server: { socketOptions: { keepAlive: 1 } } })
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`)
})

export default app
