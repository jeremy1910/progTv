const cheerio = require('cheerio')
const axios = require('axios')
const db = require('monk')('localhost/progTv')
const dbChannels = db.get('channels')

const baseURL = process.env.URL_SCRAPING_BASE

const getPage = async (day) => {
    const { data } = await axios.get(baseURL + day)
    return data
}

const getSynopsis = async (link) => {
    try {
        const { data } = await axios.get(link)
        const $ = cheerio.load(data)
        const description = $('div.synopsis-text.defaultStyleContentTags').text().trim()
        return description || 'n/a'
    } catch (e) {
        return 'n/a'
    }
   
}


const parsePage = async (data) => {
    const schedules = []

    const $ = cheerio.load(data)
    const canals = $('div.bouquet-epgGrid').find('div.doubleBroadcastCard').toArray()
    console.log(canals.length)

     await Promise.all(canals.map( async (canal) => {
        const heure = $(canal).find('.doubleBroadcastCard-hour')
        const nom =  $(canal).find('.doubleBroadcastCard-title')
        const channel = $(canal).find('.doubleBroadcastCard-channelName')
        const type = $(canal).find('.doubleBroadcastCard-type')
        const duration = $(canal).find('span.doubleBroadcastCard-durationContent')
        const descriptions = [
            await getSynopsis($(nom[0]).attr('href').trim()),
            await getSynopsis($(nom[1]).attr('href').trim())
        ]
        const schedule = {
            channel: $(channel).text().trim(),
            channelSchedule: []
        }

        for(let i = 0; i < 2; i++) {
            schedule.channelSchedule.push({
                hour: $(heure[i]).text().trim(),
                programme: $(nom[i]).text().trim(),
                description: descriptions[i],
                type: $(type[i]).text().trim(),
                duration: $(duration[i]).text().trim()
            })
        }
        schedules.push(schedule)



    }))
    return schedules
}


const persistInDb = async (channel, day) => {
    const newSchedule = {
        day: new Date(day),
        schedule: channel.channelSchedule
    }

    const foundedChannel = await dbChannels.findOne({channel: channel.channel})
    if(foundedChannel) {
        console.log(`chaine ${channel.channel} Trouvé`)
        if(!foundedChannel.schedules.find( schedule => new Date(schedule.day).toDateString() === new Date(day).toDateString())){
            console.log(`chaine ${channel.channel}, jour ${day} n'existe pas`)
            foundedChannel.schedules.push(newSchedule)
            dbChannels.update({_id: foundedChannel._id}, {$set: {schedules: foundedChannel.schedules}})
        }
    } else {
        console.log(`chaine ${channel.channel} non trouvé`)
        dbChannels.insert({
            channel: channel.channel,
            schedules: [
                newSchedule
            ]
        })
    }
    console.log(`chaine ${channel.channel} writted`)
    return null
}

const getProg = async (day) => {
    const data = await getPage(day)
    if(data) {
        const channels = await parsePage(data)
        console.log('nombre de chaines : ', channels.length)
        await Promise.all(channels.map(async (channel) => await persistInDb(channel, day)))
    }
    db.close()
}

module.exports = { getProg }