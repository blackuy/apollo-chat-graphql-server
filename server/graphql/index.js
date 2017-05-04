import bodyParser from 'body-parser'
import { graphiqlExpress, graphqlExpress } from 'graphql-server-express'
import OpticsAgent from 'optics-agent'

import schema from './executableSchema'

import subscriptionServer, {
  SUBSCRIPTIONS_ENDPOINT
} from './subscriptionsServer'

export default ({ app }) => {
  app.use(OpticsAgent.middleware())

  subscriptionServer({ schema })

  const graphqlExpressResponse = graphqlExpress(request => ({
    schema,
    formatError: error => ({
      message: error.message,
      locations: error.locations,
      stack: error.stack,
      path: error.path
    }),
    context: {
      request,
      opticsContext: OpticsAgent.context(request)
    } // user: request.session.user
  }))
  app.use('/graphql', bodyParser.json(), graphqlExpressResponse)

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: SUBSCRIPTIONS_ENDPOINT
  }))
}
