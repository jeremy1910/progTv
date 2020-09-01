require('dotenv').config()


const { getProg } = require('./src/modules/scraper');

(async () => {
    console.log(await getProg('2020-08-31'))
})()



