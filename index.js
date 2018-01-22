import mongoose from 'mongoose'

// config should be imported before importing any other file
import app from './config/express'

Promise.config({
  warnings: true,
  longStackTraces: true,
  cancellation: true,
  monitoring: true
})

// plugin bluebird promise in mongoose
mongoose.Promise = Promise

// connect to mongo db
const mongoUri = process.env.MONGO_URL
mongoose.connect(mongoUri, { server: { socketOptions: { keepAlive: 1 } } })
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`)
})

console.log('Process!', {process: process})

export default app
