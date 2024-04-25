const {Telegraf} = require('telegraf')
const {bot_token} = require('./config.js')


const bot = new Telegraf(bot_token)

module.exports = bot



const { check_user } = require("./middlewares.js")

let print_response_time = true

bot.use((ctx, next) => {
    if (print_response_time) console.time('Response Time')
    next()
})

bot.use(check_user)

bot.use((ctx, next) => {
    if (print_response_time) console.timeEnd('Response Time')
    next()
})

require('./response_handlers.js')
require('./handlers.js')
require('./broadcast.js')

bot.catch((err) => console.error(err))


bot.launch()
console.log("Bot Running")