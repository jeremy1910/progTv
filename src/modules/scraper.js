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
        return description || null
    } catch (e) {
        console.log('error', link)
        return null
    }
   
}


const parsePage = (data) => {
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
        const shedule = {
            chaine: $(channel).text().trim(),
            shedules: [
                {
                    heure: $(heure[0]).text().trim(),
                    programme: $(nom[0]).text().trim(),
                    description: descriptions[0],
                    type: $(type[0]).text().trim(),
                    duration: $(duration[0]).text().trim()
                },
                {
                    heure: $(heure[1]).text().trim(),
                    programme: $(nom[1]).text().trim(),
                    description: descriptions[1],
                    type: $(type[1]).text().trim(),
                    duration: $(duration[1]).text().trim()                }
            ]
        }
        console.log(shedule)

    })
    
}


const getProg = async (day) => {
    const data = await getPage(day)
    if(data) {
        return parsePage(data)
    }
}

module.exports = { getProg }