import mongoose from 'mongoose'
import SchemasNames from './schemas.names'
import BaseSchema from './base.schema'
import Message from './message.model'

const SCHEMA_NAME = SchemasNames.Channel

const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: SchemasNames.User
  },
  typingParticipants: [{
    _id: false,
    when: { type: Date, default: Date.now, required: true },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: SchemasNames.User,
      required: true
    }
  }]
})

class SchemaExtension extends BaseSchema {
  get participantCount () {
    return Message.aggregate([
      {
        $match: {
          channel: mongoose.Types.ObjectId(this.id)
        }
      },
      {
        $replaceRoot: {
          newRoot: { userID: '$createdBy' }
        }
      },
      {
        $group: {
          _id: '$userID'
        }
      },
      {
        $count: 'count'
      }
    ]).then(r => {
      return r && r[0] && r[0]['count']
    })
  }

  get participants () {
    return Message.aggregate([
      {
        $match: { channel: mongoose.Types.ObjectId(this.id) }
      },
      {
        $replaceRoot: { newRoot: { userID: '$createdBy' } }
      },
      {
        $group: {
          _id: '$userID',
          userID: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      {
        $unwind: '$createdBy'
      },
      {
        $replaceRoot: { newRoot: '$createdBy' }
      },
      {
        $addFields: { id: '$_id' }
      }
    ])
  }

  static async setTypingToNow ({
    channelID,
    userID
  }) {
    // TODO Try Catch ?
    const batchUpdate = await this.bulkWrite([
      {
        updateOne: {
          filter: {
            _id: channelID
          },
          update: {
            $pull: {
              typingParticipants: {
                participant: userID
              }
            }
          }
        }
      },
      {
        updateOne: {
          filter: {
            _id: channelID
          },
          update: {
            $addToSet: {
              typingParticipants: {
                participant: userID
              }
            }
          }
        }
      }
    ])// .exec()
    return batchUpdate
  }

  static async removeTyping ({
    channelID,
    userID
  }) {
    // TODO Try Catch ?
    const update = await this.update(
      {
        _id: channelID
      },
      {
        $pull: {
          typingParticipants: {
            participant: userID
          }
        }
      }).exec()
    console.log('UPDATE 🎃', update)
    return update
  }
}
Schema.loadClass(SchemaExtension)

export default mongoose.model(SCHEMA_NAME, Schema)
