const cheerio = require('cheerio')
const axios = require('axios')


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


const parsePage = (data) => {
    const schedules = []

    const $ = cheerio.load(data)
    const canals = $('div.bouquet-epgGrid').find('div.doubleBroadcastCard')


     canals.each( async (index, canal) => {
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



    })
    return schedules
}


const getProg = async (day) => {
    const data = await getPage(day)
    if(data) {
        const schedules =  parsePage(data)
        console.log(schedules)
    }
}

module.exports = { getProg }