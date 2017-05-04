import User from '../models/user.model'
import Channel from '../models/channel.model'

import APIError from '../helpers/APIError'
import { pubsub } from './subscriptionsServer'

export function delay (ctx) {
  return (ctx &&
    ctx.request &&
    ctx.request.query &&
    ctx.request.query.delay &&
    Number(ctx.request.query.delay)) || 0
}

class TypingIndicatorsTimers {
  typingIndicatorsTimers = {}

  key ({ channelID, userID }) {
    return `c:${channelID}|u:${userID}`
  }

  getTimer ({
    channelID, userID
  }) {
    const key = this.key({ channelID, userID })
    return this.typingIndicatorsTimers[key]
  }

  cancel ({ channelID, userID }) {
    const timer = this.getTimer({ channelID, userID })
    if (timer) {
      timer.cancel()
    }
  }

  async publishChangeToSubscription ({ channelID }) {
    const channel = await Channel.findById(channelID)
      .populate('typingParticipants.participant')
      .exec()
    pubsub.publish('onTypingIndicatorChanged', { channel })
  }

  createTimer ({
    userID,
    channelID
  }) {
    return Promise
          .delay(1000) // buffer typings
          .then(async () => {
            await Channel.removeTyping({
              userID,
              channelID
            })
            this.removeTypingIndicator({
              userID,
              channelID
            })
            this.publishChangeToSubscription({channelID})
          })
  }

  async addTypingIndicator ({
    channelID,
    userID,
    skipLivePush
  }) {
    this.cancel({ userID, channelID })

    const timerPromise = this.createTimer({ userID, channelID })
    const key = this.key({ channelID, userID })
    this.typingIndicatorsTimers = {
      ...this.typingIndicatorsTimers,
      [key]: timerPromise
    }

    if (!skipLivePush) {
      this.publishChangeToSubscription({
        channelID
      })
    }
  }

  removeTypingIndicator ({
    channelID,
    userID
  }) {
    const key = this.key({ channelID, userID })
    const { [key]: oldTimer, ...newTimers } = this.typingIndicatorsTimers
    this.typingIndicatorsTimers = newTimers
  }
}

export const typingIndicatorsTimers = new TypingIndicatorsTimers()

export const createOrFindChannel = function ({ name }) {
  return Channel
    .findOneOrCreate({ name }, { name })
    .then((payload) => {
      if (payload.found) {
        pubsub.publish('onChannelAdded', payload.found)
        return payload.found
      }
      return payload.new
    })
}

export const createOrFindUser = async function ({ query, update }) {
  try {
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
    let user = await User.findOneAndUpdate(query, update, options)
    return user
  } catch (error) {
    const err = new APIError(`Fatal Error: ${error.message}.`)
    return Promise.reject(err)
  }
}
