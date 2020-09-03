require('dotenv').config()
const cheerio = require('cheerio')
const axios = require('axios')
const db = require('monk')('localhost/progTv')
const dbChannels = db.get('channels')

const baseURL = process.env.URL_SCRAPING_BASE

const getPage = async (day) => {
    console.log(`get ${baseURL + day}`)
    const { data } = await axios.get(baseURL + day)
    return data
}

const getSynopsis = async (link) => {
    try {
        const { data } = await axios.get(link)
        const $ = cheerio.load(data)
        const description = $('div.synopsis-text.defaultStyleContentTags').text() ? $('div.synopsis-text.defaultStyleContentTags').text().trim() : 'n/a'
        return description
    } catch (e) {
        return 'n/a'
    }
   
}


const parsePage = async (data) => {
    const channelsSchedules = []

    const $ = cheerio.load(data)
    const canals = $('div.bouquet-epgGrid').find('div.doubleBroadcastCard').toArray()
    console.log(`canal trouvé ${canals.length}`)
     await Promise.all(canals.map( async (canal) => {
        const hour = $(canal).find('.doubleBroadcastCard-hour')
        const title =  $(canal).find('.doubleBroadcastCard-title')
        const channel = $(canal).find('.doubleBroadcastCard-channelName')
        const type = $(canal).find('.doubleBroadcastCard-type')
        const duration = $(canal).find('span.doubleBroadcastCard-durationContent')
        const descriptions = []
        const channelInformation = {
            channel: $(channel).text().trim(),
            channelSchedules: []
        }

        for(let i = 0; i < 2; i++) {

            if($(title[i]).attr('href')) {
                descriptions.push(await getSynopsis($(title[i]).attr('href').trim()),)
            } else {
                descriptions.push('n/a')
            }
            

            channelInformation.channelSchedules.push({
                hour: $(hour[i]).text().trim(),
                programme: $(title[i]).text().trim(),
                description: descriptions[i],
                type: $(type[i]).text().trim(),
                duration: $(duration[i]).text().trim()
            })
        }
        channelsSchedules.push(channelInformation)



    }))
    return channelsSchedules
}


const persistInDb = async (channelInformation, day) => {
    const newSchedule = {
        day: new Date(day),
        schedule: channelInformation.channelSchedules
    }

    const foundedChannel = await dbChannels.findOne({channel: channelInformation.channel})
    if(foundedChannel) {
        console.log(`chaine ${channelInformation.channel} Trouvé`)
        if(!foundedChannel.schedules.find( schedule => new Date(schedule.day).toDateString() === new Date(day).toDateString())){
            console.log(`chaine ${channelInformation.channel}, jour ${day} n'existe pas`)
            foundedChannel.schedules.push(newSchedule)
            dbChannels.update({_id: foundedChannel._id}, {$set: {schedules: foundedChannel.schedules}})
        }
    } else {
        console.log(`chaine ${channelInformation.channel} non trouvé`)
        dbChannels.insert({
            channel: channelInformation.channel,
            schedules: [
                newSchedule
            ]
        })
    }
    console.log(`chaine ${channelInformation.channel} writted`)
    return null
}

const getProg = async (day) => {
    const data = await getPage(day)
    if(data) {
        const channelsSchedules = await parsePage(data)
        await Promise.all(channelsSchedules.map(async (channelInformation) => await persistInDb(channelInformation, day)))
    }
    
}

(async () => {
    await getProg('2020-09-04')
})()

module.exports = { getProg }