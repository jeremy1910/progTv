require('dotenv').config()
const db = require('monk')('localhost/progTv')
const dbChannels = db.get('channels')

const { GraphQLServer } = require('graphql-yoga');
const {
  GraphQLDate,
  GraphQLTime,
  GraphQLDateTime
} = require('graphql-iso-date');



// (async () => {
//     console.log(JSON.stringify( await dbChannels.find({ channel: 'TF1' }, { fields: {schedules: {schedule: {hour: 1, programme: 1}, day: 1}} })))
// })()



const typeDefs = `
  scalar Date
  type Channel {
    channel: String
  }

  type Schedule {
    hour: String,
    programme: String,
    description: String,
    type: String,
    duration: String
  }

  type Schedules {
      day: Date,
      schedule: [Schedule]
  }

  type ChannelInformations {
      schedules: [Schedules] 
  }

  type Query {
    channelList: [Channel],
    schedulesForChannel(channel: String, day: String): [ChannelInformations]
  }
`
 
const resolvers = {
  Date: GraphQLDate,
  Query: {
    channelList: async (_, {}) => await dbChannels.find({}, {channel: 1}),
    schedulesForChannel: async(_, { channel, day }) => {
      let req = { channel }
      let projection = {}

      if(day) {
        req['schedules.day'] = new Date(day)
        projection = { fields: {schedules: {$elemMatch: {day: new Date(day)} }}}
      }

      return await dbChannels.find(
          req, 
          projection
        )
    }
  },
 
}



const server = new GraphQLServer({ typeDefs, resolvers })
server.start(() => console.log('Server is running on localhost:4000'))