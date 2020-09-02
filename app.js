require('dotenv').config()
const db = require('monk')('localhost/progTv')
const dbChannels = db.get('channels')

const { GraphQLServer } = require('graphql-yoga')

const { getProg } = require('./src/modules/scraper');

/* getProg('2020-09-01') */

(async () => {
    console.log(JSON.stringify(await dbChannels.find({ channel: 'TF1' }, {schedules: {schedule: {hour: 1}, day: 1} })))
})()

const typeDefs = `
  type Channel {
    channel: String
  }

  type Schedule {
      day: String,
      hour: String
  }

  type Schedules {
      channel: String,
      schedules: [Schedule] 
  }

  type Query {
    channelList: [Channel],
    schedulesForChannel(channel: String): [Schedules]
  }
`
 
const resolvers = {
  Query: {
    channelList: async (_, {}) => await dbChannels.find({}, {channel: 1}),
    schedulesForChannel: async(_, { channel }) => await dbChannels.find({ channel }, {schedules: {schedule: {hour: 1}, day: 1} })
  },
}



const server = new GraphQLServer({ typeDefs, resolvers })
server.start(() => console.log('Server is running on localhost:4000'))