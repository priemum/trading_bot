const bot = require("./bot")
const { db } = require(".")
const { get_admin } = require("./functions")
const { authAdmin } = require("./middlewares")

let broad_data = {
    users_done: 0, broadcasting: false,
}

let responses = {}

let brake_after = 10 //Maximum is 29
let messages_send_after_brake = 0
//1 Second Brake after sending a number of messages bot can send 30 per second, you can decrease it if you have low end server

bot.hears('⛔️ Cancel', async (ctx, next) => {
    if (responses[ctx.from.id]) {
        delete responses[ctx.from.id]
        ctx.replyWithHTML('<b>⛔️ Operation canceled</b>', { reply_markup: { remove_keyboard: true } })
        let adminData_markup = await get_admin(ctx)
        return ctx.replyWithHTML(adminData_markup.text, adminData_markup.markup)
    }
    next()
})



bot.action('broadcast', authAdmin, async (ctx) => {
    try {
        ctx.deleteMessage().catch(err => console.log(err))
        if (broad_data.broadcasting) return ctx.replyWithMarkdown('*⛔️ Please wait untill previous broadcast get completed*')
        ctx.replyWithMarkdown('*💬 Send or forward a post to boardcast*', { reply_markup: { keyboard: [[{ text: '⛔️ Cancel' }]], resize_keyboard: true } })
        responses[ctx.from.id] = {
            target: 'broadcast'
        }
    } catch (err) {
        console.log(err)
        ctx.reply('Error.')
    }
})

bot.action('stop_broadcast', ctx => {
    ctx.deleteMessage().catch(err => console.log(err))
    ctx.replyWithMarkdown('*⛔️ Broadcast stopped*')
    broad_data = {
        users_done: 0, broadcasting: false,
    }
    messages_send_after_brake = 0
})

// Broadcast response handler
bot.on('message', async (ctx, next) => {
    if (!responses[ctx.from.id]) return next()
    delete responses[ctx.from.id]
    await authAdmin(ctx, next)
    if (broad_data.broadcasting) return ctx.replyWithMarkdown('*⚠️ Please wait untill previous broadcast get completed*')
    let all_users = await db.collection('users').find().toArray()
    let hmsg = await ctx.replyWithMarkdown(`*⏳ Sending broadcast to users.....*`, {
        reply_markup: {
            inline_keyboard: [[{
                text: '⛔️ Stop', callback_data: 'stop_broadcast'
            }]]
        }
    })
    broad_data.broadcasting = true
    for (i in all_users) {
        if (!broad_data.broadcasting) return
        let user_id = all_users[i].user_id
        if (messages_send_after_brake == brake_after) {
            ctx.tg.editMessageText(ctx.from.id, hmsg.message_id, null, `<b>⏳ Sleeping for 1 seconds\n\n✅ Broadcasted To: ${broad_data.users_done} Users\n\n🗨 Users Left: ${all_users.length - broad_data.users_done}</b>`, { parse_mode: 'HTML' }).catch((err) => {
                console.log(err)
            })
            await new Promise(resolve => setTimeout(resolve, 1 * 1000));
            messages_send_after_brake = 0
        }
        messages_send_after_brake += 1
        if (ctx.update.message.forward_date) {
            ctx.forwardMessage(user_id).catch((err) => {
                console.log(err)
            })
        } else {
            ctx.copyMessage(user_id).catch((err) => {
                console.log(err)
            })
        }
        broad_data.users_done += 1
    }
    ctx.tg.editMessageText(ctx.from.id, hmsg.message_id, null, `<b>✅ Broadcast completed \n\nBroadcasted To: ${broad_data.users_done} Users</b>`, { parse_mode: 'HTML' }).catch((err) => {
        console.log(err)
    })
    broad_data = {
        users_done: 0,
        broadcasting: false,
    }
    messages_send_after_brake = 0
})