const bot = require("./bot")
const { get_admin ,get_main_menu} = require("./functions")
const { db } = require(".")
const { admins  } = require('./config')

exports.cancel_button = 'Cancel'
exports.back_button = 'Back'


let response_data = {}

exports.create_response = (ctx, target, payload = {}, back_command) => {
    response_data[ctx.from.id] = { target, payload, back_command }
}

exports.delete_response = async ctx => {
    delete response_data[ctx.from.id]
}

bot.hears([this.cancel_button, this.back_button], async ctx => {
    this.delete_response(ctx)
    await ctx.replyWithHTML(`<b>Hi!! ${ctx.from.first_name}</b>`, { reply_markup: { remove_keyboard: true } })
    let main_menu = get_main_menu(ctx)
    ctx.replyWithHTML(main_menu.text, main_menu.markup)
})


let query_by_user = {}
bot.on('message',async (ctx,next)=>{
    if(!response_data[ctx.from.id] || !response_data[ctx.from.id].target == 'support') return next()
    let query = ctx.message.text
    this.delete_response(ctx)
    if ((query_by_user[ctx.from.id] || 0) >= 5) {
        return ctx.replyWithHTML('<b>Please wait until your previous queries get replied</b>')
    }
    for (i in admins) {
        bot.telegram.sendMessage(admins[i], `<b>Query Received By <a href='tg://user?id=${ctx.from.id}'>${ctx.from.first_name}</a>: ${ctx.from.username ? ('@' + ctx.from.username) : ''}\n\nQuery:</b> <code>${query}</code>`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Reply', callback_data: `/reply ${ctx.from.id}` }]
                    ]
                },
                parse_mode: 'HTML'
            }
        )
    }
    query_by_user[ctx.from.id] = (query_by_user[ctx.from.id] || 0) + 1
    ctx.replyWithHTML(`<b>Your messsage has been delivered to admins. Please wait for a reply.</b>`)
    let main_menu = get_main_menu(ctx)
    ctx.replyWithHTML(main_menu.text, main_menu.markup)
})


bot.on('message', async (ctx, next) => {
    if (
        !response_data[ctx.from.id] ||
        !(response_data[ctx.from.id]?.target == 'reply_to_query')
    )
        return next()
    let answer = ctx.message.text
    let user_id = response_data[ctx.from.id].payload.user_id
    this.delete_response(ctx)
    await bot.telegram.sendMessage(user_id, `<b>Answer to your query\n\n${answer}</b>`, { parse_mode: 'HTML' }).catch((err) => console.log(err))
    ctx.replyWithHTML(`<b>Message delivered to user</b>`, { reply_markup: { inline_keyboard: [[{ text: 'Reply Again', callback_data: `/reply ${user_id}` }]] } })
})
