/* eslint no-console: 0 */
/* eslint no-underscore-dangle: 0 */

import { createServer } from 'http'
import { PubSub, SubscriptionManager } from 'graphql-subscriptions'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import setupFunctions from './setupFunctions'

const EventEmitter = require('events')
EventEmitter.defaultMaxListeners = 5000 // TODO Use redis transport

export const pubsub = new PubSub()

export const SUBSCRIPTIONS_ENDPOINT = `${process.env.WS_PROTOCOL}://${process.env.HOST}:${process.env.WS_PORT}`

export default ({ schema }) => {
  const WS_PORT = process.env.WS_PORT

  const subscriptionManager = new SubscriptionManager({
    schema,
    pubsub,
    setupFunctions
  })

  const websocketServer = createServer((request, response) => {
    response.writeHead(404)
    response.end()
  })

  websocketServer.listen(WS_PORT, () => {
    console.log(`🌎 WS Server is now running on ${SUBSCRIPTIONS_ENDPOINT}`)
  })

  process.on('SIGINT', () => {
    console.log('Bye from WS 👋 SIGINT')
    websocketServer.close()
  })

  const subscriptionServer = new SubscriptionServer( // eslint-disable-line 
    {
      onConnect: async (connectionParams, ws) => {
        console.log('✅  SubscriptionServer onConnect 🌏!', ws._socket.remprocess.env.OPTICS_API_KEYteAddress, ws._socket.remotePort)
      },
      onSubscribe: async (message, params, wsRequest) => {
        console.log('✅  SubscriptionServer onSubscribe 😄')
        return Promise.resolve(params)
      },
      onUnsubscribe: () => {
        console.log('✅  SubscriptionServer onUnsubscribe 👋')
      },
      onDisconnect: (webSocket) => {
        console.log('✅  SubscriptionServer onDisconnect ❌')
      },
      subscriptionManager
    },
    {
      server: websocketServer,
      path: '/'
    }
  )
}
