const cheerio = require('cheerio')
const axios = require('axios')


const baseURL = process.env.URL_SCRAPING_BASE

const getPage = async (day) => {
    const { data } = await axios.get(baseURL + day)
    return data
}


const parsePage = (data) => {
    const $ = cheerio.load(data)
    const canals = $('div.bouquet-epgGrid').find('div.doubleBroadcastCard')
    
    canals.each( (index, canal) => {
        const heure = $(canal).find('.doubleBroadcastCard-hour')
        const nom =  $(canal).find('.doubleBroadcastCard-title')
        const channel = $(canal).find('.doubleBroadcastCard-channelName')
        const shedule = {
            chaine: $(channel).text().trim(),
            shedules: [
                {
                    heure: $(heure[0]).text().trim(),
                    programme: $(nom[0]).text().trim()
                },
                {
                    heure: $(heure[1]).text().trim(),
                    programme: $(nom[1]).text().trim()
                }
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