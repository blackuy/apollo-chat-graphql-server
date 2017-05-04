import { makeExecutableSchema } from 'graphql-tools'
import OpticsAgent from 'optics-agent'

import Resolvers from './resolvers'
import Schema from './schema.graphql'

const schema = makeExecutableSchema({
  typeDefs: Schema,
  resolvers: Resolvers,
  logger: {
    log (e) { console.log('[GraphQL Log]:', e) }
  }
})

OpticsAgent.instrumentSchema(schema)

export default schema
