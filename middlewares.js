const bot = require('./bot.js')
const config = require('./config.js')
const { paginate, get_main_menu, getRandomNumber } = require('./functions.js')
const { db } = require('./index.js')


exports.check_user = async (ctx, next) => {
    if (!ctx?.from?.id) return
    let adminData = (await db
        .collection('admin')
        .findOne(
            { admin: 1 },
            { projection: { bot_off: 1, _id: 0} }
        )) || {}
    let oldData = await db.collection('users').findOne({ user_id: ctx.from.id })
    if (!oldData) {
        db.collection('users').insertOne({ user_id: ctx.from.id })
        db.collection('admin').updateOne({ status: 1 }, { $inc: { total_users: +1 } }, { upsert: true })
        oldData = {}
    }
    //These limits are not for admins
    if (config.admins.includes(ctx.from.id)) return next()
    if (oldData.ban)
        return await ctx.replyWithHTML(`<b>You are banned from using this bot</b>`)
    if (!global.bot_status) {
        global.bot_status = adminData.bot_off ? 'off' : 'on'
    }
    if (global.bot_status == 'off')
        return await ctx.replyWithHTML(`<b>Bot is under maintaince now</b>`)
    next()
}

exports.authAdmin = async (ctx, next) => {
    if (!config.admins.includes(ctx.from.id)) return 
    next()
}

exports.check_join = async (ctx, next) => {
    let channels =
        (await db.collection('admin').findOne({ channels: 1 }))?.data || []
    let promises = channels.map((ele, index) => {
        return new Promise(async (resolve, reject) => {
            await bot.telegram
                .getChatMember(ele.username, ctx.from.id)
                .then(result => {
                    resolve(result.status)
                })
                .catch(error => {
                    resolve(`${ele}: ${error.response.description}`)
                })
        })
    })
    let results = await Promise.all(promises || [])

    if (results.includes('left', 'kicked')) {
        let channel_data_promises = channels.map((ele, index) => {
            return new Promise(async (resolve, reject) => {
                await bot.telegram.getChat(ele.username)
                    .then((result) => {
                        resolve(result.invite_link)
                    })
                    .catch((error) => {
                        resolve(false)
                    })
            })
        })
        let invite_links = (await Promise.all(channel_data_promises || [])).filter((ele) => { return (ele) })
        let text = `<b>👋 Hey There , join our channels before using this bot</b>`
        let markup = paginate(invite_links.map((ele, index) => {
            return { text: 'Join', url: ele }
        }), 2)
        let redirect_url = `https://t.me/${ctx.botInfo.username}?start=redirect`
        markup.push([{ text: 'Restart', url: redirect_url }])
        return ctx.replyWithHTML(
            text,
            {
                reply_markup: {
                    inline_keyboard: markup,
                }
            }
        )
    }
    ctx.check_join = {
        status: true,
        results: results
    }
    next()
}
