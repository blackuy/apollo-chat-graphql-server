import mongoose from 'mongoose'
import SchemasNames from './schemas.names'
import BaseSchema from './base.schema'

const SCHEMA_NAME = SchemasNames.User

const Schema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  ip: {
    type: String
  },
  mobileNumber: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: SchemasNames.Channel
  }]
})

class SchemaExtension extends BaseSchema {
}
Schema.loadClass(SchemaExtension)

export default mongoose.model(SCHEMA_NAME, Schema)
