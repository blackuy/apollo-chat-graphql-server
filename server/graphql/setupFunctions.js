export default {

  onMessageAdded: (options, args, subscriptionName) => ({
    onMessageAdded: {
      filter: ({ message }, ctx) => message.channel.id === args.channelID
    }
  }),

  onMemberJoin: (options, args, subscriptionName) => ({
    onMemberJoin: {
      filter: ({ channel }, ctx) => channel.id === args.channelID
    }
  }),

  onTypingIndicatorChanged: (options, args, subscriptionName) => ({
    onTypingIndicatorChanged: {
      filter: ({ channel }, ctx) => channel.id === args.channelID
    }
  })

}
