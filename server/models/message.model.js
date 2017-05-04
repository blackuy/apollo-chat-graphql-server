import mongoose from 'mongoose'
import SchemasNames from './schemas.names'
import BaseSchema from './base.schema'

const SCHEMA_NAME = SchemasNames.Message

const Schema = new mongoose.Schema({
  text: {
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
    ref: SchemasNames.User,
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: SchemasNames.Channel,
    required: true
  }
})

class SchemaExtension extends BaseSchema {
}
Schema.loadClass(SchemaExtension)

export default mongoose.model(SCHEMA_NAME, Schema)
