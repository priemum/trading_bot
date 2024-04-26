const bot = require("./bot")
const { get_admin, get_main_menu } = require("./functions")
const { db } = require(".")
const { admins } = require('./config')

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
bot.on('message', async (ctx, next) => {
    if (
        !response_data[ctx.from.id] ||
        !(response_data[ctx.from.id]?.target == 'support')
    )
        return next()
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
        !(response_data[ctx.from.id]?.target == 'admin_channel_username')
    )
        return next()
    let answer = ctx.message.text
    if (!answer.startsWith('@')) return ctx.replyWithHTML("<b>Username must be start with '@'</b>")
    await bot.telegram.getChatMember(answer, ctx.from.id)
        .then(async (res) => {
            await db.collection("admin").updateOne({ channels: 1 }, { $push: { data: { username: answer } } }, { upsert: true })
            await ctx.replyWithHTML(`<b>✅ Channel Added Successfully.....</b>`, { reply_markup: { inline_keyboard: [[{ text: this.back_button, callback_data: '/channels_settings' }]] } })
            this.delete_response(ctx)
        })
        .catch((err) => {
            console.log(err)
            switch (err?.response?.error_code) {
                case 400:
                    ctx.replyWithHTML("<b>I didn't find any channels with this username , make sure bot is admin in this channel:</b>" + ` <code>${err?.response?.description}</code>`)
                    break;
                default:
                    ctx.replyWithHTML(`<b>Error while trying to add this channel : </b><code>${err}</code>`)
            }
        })
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



bot.on('message', async (ctx, next) => {
    if (!(response_data[ctx.from.id]) || !(response_data[ctx.from.id]?.target == 'admin_log_channel')) return next()
    let answer = ctx.message.text
    this.delete_response(ctx)
    await db.collection('admin').updateOne({ admin: 1 }, { $set: { log_channel: isNaN(answer) ? answer : parseFloat(answer) } }, { upsert: true })
    ctx.replyWithHTML(`<b>Log channel has been updated to ${answer}</b>`)
    let adminMarkup = await get_admin(ctx)
    ctx.replyWithHTML(adminMarkup.text, adminMarkup.markup)
})

let feedbacks_data = {}
bot.on('message', async (ctx, next) => {
    if (!(response_data[ctx.from.id]) || !(response_data[ctx.from.id]?.target == 'feedback')) return next()
    let answer = ctx.message.text
    this.delete_response(ctx)
    let main_menu = get_main_menu(ctx)
    await ctx.replyWithHTML(main_menu.text,main_menu.markup)
    if ((query_by_user[ctx.from.id] || 0) >= 5) {
        return ctx.replyWithHTML('<b>You already sended 5 feedback , please wait some time to send more feedbacks</b>')
    }
    let adminData = await db.collection('admin').findOne({ admin: 1 }, { projection: { _id: 0, log_channel: 1 } })
    let logChannel = adminData?.log_channel
    let text = `<b>Feedback received by <a href='tg://user?id=${ctx.from.id}'>${ctx.from.first_name}</a></b>\n\n<i>${answer}</i>`
    if (!logChannel) {
        bot.telegram.sendMessage(logChannel, text).catch((err) => console.log(err))
    } else {
        for (i in admins) {
            bot.telegram.sendMessage(admins[i], text,
                {
                    parse_mode: 'HTML'
                }
            )
        }
    }
    feedbacks_data[ctx.from.id] = (feedbacks_data[ctx.from.id] || 0) + 1
})

