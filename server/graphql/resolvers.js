import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'

import { pubsub } from './subscriptionsServer'
import APIError from '../helpers/APIError'

import User from '../models/user.model'
import Channel from '../models/channel.model'
import Message from '../models/message.model'

import {
  createOrFindChannel,
  createOrFindUser,
  delay,
  typingIndicatorsTimers
} from './helpers'

export default {
  Query: {

    users (_, args, ctx) {
      return User.list() // { limit: 100, skip: 0 }
    },
    user (_, { id }, ctx) {
      return User.get(id)
    },

    channels (root, {
      limit = 100,
      skip = 0
    }, ctx) {
      return Channel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'messages',
          options: {
            limit: 2
          }
        })
        .exec()
    },
    channel (_, { channelID }, ctx) {
      return Channel.findById(channelID).exec()
    },

    async messagesForChannel (_, {
      channelID,
      limit = 20,
      skip = 0
    }, ctx) {
      try {
        await Promise.delay(delay(ctx))
        const channel = await Channel.get(channelID)
        return Message.find({ channel: channel.id })
          .populate('channel')
          .populate('createdBy')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec()
          .then(msgs => msgs.reverse())
      } catch (error) {
        const err = new APIError(`Fatal Error: ${error.message}.`)
        return Promise.reject(err)
      }
    }

  },
  Mutation: {

    async typing (_, { channelID, userID }) {
      try {
        const result = await Channel.setTypingToNow({
          userID,
          channelID
        })
        const skipLivePush = result.modifiedCount === 2
        typingIndicatorsTimers.addTypingIndicator({
          userID,
          channelID,
          skipLivePush
        })
        return true
      } catch (error) {
        const err = new APIError(`Fatal Error: ${error.message}.`)
        return Promise.reject(err)
      }
    },

    async join (_, { channelName, username }, ctx) {
      try {
        await Promise.delay(delay(ctx))
        const [user, channel] = await Promise.all([
          createOrFindUser({
            query: { username },
            update: {
              lastIP: ctx.request._remoteAddress,
              lastLoginAt: Date.now()
            }
          }),
          createOrFindChannel({ name: channelName })
        ])
        pubsub.publish('onMemberJoin', { member: user, channel })
        return {
          channel,
          user
        }
      } catch (error) {
        const err = new APIError(`Fatal Error: ${error.message}.`)
        return Promise.reject(err)
      }
    },

    async messageNew (_, { channelID, userID, text }, ctx) {
      try {
        await Promise.delay(delay(ctx))
        const [channel, user] = await Promise.all([
          Channel.get(channelID),
          User.get(userID)
        ])
        return Message.create({ channel, createdBy: user, text })
          .then((message) => {
            pubsub.publish('onMessageAdded', { message })
            return message
          })
      } catch (error) {
        const err = new APIError(`Fatal Error: ${error.message}.`)
        return Promise.reject(err)
      }
    }

  },
  Subscription: {
    onChannelAdded (channel, args, ctx) {
      return channel
    },
    onTypingIndicatorChanged ({ channel }, args, ctx) {
      const participants = channel.typingParticipants.map(p => p.participant)
      return participants
    },
    onMemberJoin ({ member }, args, ctx) {
      return member
    },
    onMessageAdded ({ message }, args, ctx) {
      return message
    }
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue (value) {
      return new Date(value) // from the client
    },
    serialize (value) {
      return value.getTime() // to the client
    },
    parseLiteral (ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10) // cast value is always in string format
      }
      return null
    }
  })
}
