const bot = require('./bot.js')
const {  get_admin, paginate ,get_main_menu} = require("./functions");
const { check_join, authAdmin } = require("./middlewares");
const { create_response, delete_response, cancel_button ,back_button} = require("./response_handlers");
const { db } = require(".");
const {
    social_media_links
} = require('./config.js')

bot.start(async ctx =>{
    let channels =
        (await db.collection('admin').findOne({ channels: 1 }))?.data || []
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
    let buttons = []
    invite_links.forEach((ele,index) => {
            buttons.push({ text: 'Telegram', url: ele})
        })
    social_media_links.forEach((ele,index)=>{
        buttons.push({text:ele.title,url:ele.url})
    })
    let text = `<b>☺️ Hello Master !\n\n👇 To Use Bot Please Follow Us On Social Media.</b>`
    let markup = paginate(buttons, 2)
    markup.push([{ text: "🍃 Procced" , callback_data:'procced'}])
    return await ctx.replyWithHTML(
            text,
            {
                reply_markup: {
                    inline_keyboard: markup,
                }
            }
        )
})

bot.action('procced',check_join,async ctx =>{
    let text = `<b>🤔 Are you begginer in trading ?</b>`
    let buttons =  [
        [{text:'Begginer',callback_data:'begginer'},{text:'Master',callback_data:'menu'}]
    ]
    await ctx.editMessageText(text,{reply_markup:{inline_keyboard:buttons},parse_mode:'HTML'})
})

bot.action('begginer',check_join,async ctx =>{
    await ctx.deleteMessage()
    await ctx.replyWithHTML('<b>☺️ No Worries ! Use below button to get some trading tips</b>',{reply_markup:{keyboard:[[{text:'💡 Trading Tips'}]],resize_keyboard:true}})
})

bot.hears('💡 Trading Tips',check_join,async ctx =>{
    let photo_link = `https://t.me/photo_upload_karan/2`
    let text = `<b>I am a specially designed and trained bot to guide you throught your trading journey ...\n\n👇 Just Follow All Our 5 Steps And You Will Become A Champion Of Trading</b>`
    await ctx.replyWithPhoto(photo_link,{caption:text,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:'🟢 Step 1',callback_data:'step_1'},{text:'Menu',callback_data:'menu'}]]}}).catch(err=>console.log(err))
})

bot.action('step_1',check_join,async ctx =>{
    await ctx.deleteMessage()
    let photo_link = `https://t.me/photo_upload_karan/2`
    let text = `So, let's dive into the world of trading!\n\n<b>What is Trading: </b>Trading is buying and selling assets like stocks, currencies, or commodities with the aim of making a profit. It's like a digital marketplace where people exchange these assets.\n\n<b>Types Of Trading: </b>There are various types, including:\n\n1. <b>Stock Trading: </b>Buying and selling shares of companies.\n2. <b>Forex Trading: </b> Trading currencies like dollars, euros, etc.\n3. <b>Commodity Trading: </b>Trading goods like gold, oil, etc.\n4. <b> Cryptocurrency Trading: </b>Buying and selling digital currencies like Bitcoin.\n5. <b>Options Trading: </b>Contracts giving the right to buy or sell assets at a set price.\n\n<b>Why Do We Need Trading: </b>Trading is essential for several reasons:\n\n<b>-Price Discovery: </b>It helps determine the fair value of assets by reflecting supply and demand\n<b>- Investment Opportunities: </b>It allows individuals and businesses to invest their money and potentially earn profits`
    let markup = {reply_markup:{inline_keyboard:[[{text:'🟢 Step 2',callback_data:'step_2'},{text:'Menu',callback_data:'menu'}]]},parse_mode:'HTML'}
    await ctx.replyWithPhoto(photo_link,{caption:text,...markup})
})

bot.action('step_2',check_join,async ctx =>{
    await ctx.deleteMessage()
    let photo_link = `https://t.me/photo_upload_karan/2`
    let text = `<b>So Now Lets Reccommend You The Top Trading Platform For Your Ultimate Experience\n\nQUOTEX is a platform provides over 400 free tools to each client so that you can trade and earn money the way you like. Choose any assets: currency quotes, stocks, majors, metals, oil or gas, as well as the main trend of recent years - cryptocurrencies\n\nSingup Link : https://broker-qx.pro/sign-up/?lid=739527\n\nOnce Registered To Website Please Proceed Towards Next Step</b>`
    let markup = {reply_markup:{inline_keyboard:[[{text:'🟢 Step 3',callback_data:'step_3'},{text:'Back',callback_data:'step_1'}],[{text:'Menu',callback_data:'menu'}]]},parse_mode:'HTML'}
    await ctx.replyWithPhoto(photo_link,{caption:text,...markup})
})

bot.action('step_3',check_join,async ctx=>{
    await ctx.deleteMessage()
    let userData = await db.collection('users').findOne({user_id:ctx.from.id},{projection:{_id:0,account_id:1}})
    let account_id = userData?.account_id
    if(account_id) return await ctx.replyWithHTML(`<b>You have already completed our all steps, Please share your feedback</b>`,{reply_markup:{inline_keyboard:[[{text:'Feedback',callback_data:'feedback'}]]}})
    await ctx.replyWithHTML(`<b>👇 If You Have Registered The Send Your Quotext ID Below</b>`, { reply_markup: { keyboard: [[{ text: cancel_button }]], resize_keyboard: true } })
    create_response(ctx,'quotext_id')
})

bot.action('feedback',check_join,async ctx =>{
    await ctx.deleteMessage()
    await ctx.replyWithHTML(`<b>👇 Can you share you feedback about this bot. So, we can improve our bot and provide you better performance</b>`,{reply_markup:{keyboard:[[{text:cancel_button}]],resize_keyboard:true}})
    create_response(ctx,'feedback')
})

bot.action('menu',check_join,async ctx=>{
    let menu = get_main_menu(ctx)
    await ctx.deleteMessage()
    await ctx.replyWithHTML(menu.text,menu.markup)
})


bot.hears('🔒 Account',check_join,async ctx=>{
    let userData = await db.collection('users').findOne({user_id:ctx.from.id},{projection:{_id:0,account_id:1}})
    let account_id = userData?.account_id
    let text = `<b>☺️ Here Is Your Details, Master\n\n🆔️ Telegram ID : </b><code>${ctx.from.id}</code>\n<b>Account ID: </b><code>${account_id||'Not registered'}</code>\n\n<b>🔍 Account Type : ${account_id?'Master':'Begginer'}</b>`
    let markup = {reply_markup:{inline_keyboard:[[{text:'💳 Change account type',callback_data:'step_2'}],[{text:'Bot info',callback_data:'bot_info'}]]}}
    ctx.replyWithHTML(text,{parse_mode:'HTML',...markup})
})


bot.hears('💬 Contact Us',check_join,async ctx=>{
    let text = `<b>Send you query , our admins will reply in some time</b>`
    await ctx.replyWithHTML(text,{reply_markup:{keyboard:[[{text:cancel_button}]],resize_keyboard:true}})
    create_response(ctx,'support')
})


bot.hears('🛒 Join Us in The Journey',check_join,async ctx =>{
    let text = `<b>Your Text</b>`
    let markup = {
        reply_markup:{
            inline_keyboard:[
                [{ text: 'Hello', url: 'https://t.me/karan_nodejs' }, { text: 'Hello', url: 'https://t.me/karan_nodejs' }]
            ]
        }
    }
    await ctx.replyWithHTML(text,markup)
})


//Admin Handlers
bot.action(/^\/reply (.+)$/,check_join,async ctx =>{
    let text = `<b>Send your reply to answer this query</b>`
    await ctx.replyWithHTML(text,{reply_markup:{keyboard:[[{text:cancel_button}]],resize_keyboard:true}})
    create_response(ctx,'reply_to_query',{user_id:ctx.from.id})
})

//Admin Handlers
bot.command(['admin', 'panel'], authAdmin, async ctx => {
    let adminMarkup = await get_admin(ctx)
    ctx.replyWithHTML(adminMarkup.text, adminMarkup.markup)
})

bot.action('/admin', authAdmin, async ctx => {
    let adminMarkup = await get_admin(ctx)
    ctx.editMessageText(adminMarkup.text, adminMarkup.markup)
})

bot.action('/change_log_channel', authAdmin, async ctx => {
    ctx.deleteMessage().catch(err => console.log(err))
    ctx.replyWithHTML('<b>Send Log channel Id or username with @</b>', {
        reply_markup: {
            keyboard: [[{
                text: cancel_button
            }]], resize_keyboard: true
        }
    })
    create_response(ctx, 'admin_log_channel')
})


bot.action('/change_bot_status', authAdmin, async ctx => {
    let adminData =
        (await db.collection('admin').findOne(
            {
                admin: 1
            },
            {
                projection: {
                    _id: 0,
                    bot_off: 1
                }
            }
        )) || {}
    if (adminData?.bot_off) {
        global.bot_status = 'on'
        await db.collection('admin').updateOne(
            {
                admin: 1
            },
            {
                $unset: {
                    bot_off: 1
                }
            }
        )
    } else {
        global.bot_status = 'off'
        await db.collection('admin').updateOne(
            {
                admin: 1
            },
            {
                $set: {
                    bot_off: true
                }
            },
            {
                upsert: true
            }
        )
    }
    let newAdminMarkup = await get_admin(ctx)
    await ctx
        .editMessageText(newAdminMarkup.text, newAdminMarkup.markup)
        .catch(err => console.log(err))
})


bot.action('/channels_settings', authAdmin, async ctx => {
    let channels_data =
        (await db.collection('admin').findOne({ channels: 1 })) || {}
    let channels = channels_data?.data || []
    let buttons = channels.map(data => {
        return [
            {
                text: data.username,
                callback_data: `/check_if_admin ${data.username}`
            },
            {
                text: '❌ Delete',
                callback_data: `/delete_channel ${data.username}`
            }
        ]
    })
    buttons.push([
        {
            text: '➕  Add Channel',
            callback_data: '/add_channels'
        }
    ])
    buttons.push([
        {
            text: '◀️ Back',
            callback_data: '/admin'
        }
    ])
    ctx.editMessageText(
        `<b>There are total in Check: ${channels.length} Channels in our bot\n\nUse "➕ Add Channel" button for adding more channels\n\nUse "❌ Delete " button for deleting channs</b>`,
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: buttons
            }
        }
    )
})

bot.action(/^\/check_if_admin (.+)$/, authAdmin, async ctx => {
    let username = ctx.match[1]
    await bot.telegram
        .getChatMember(username, ctx.from.id)
        .then(async res => {
            await ctx
                .answerCbQuery("✅ There's no any problem with this channel")
                .catch(async err => {
                    await ctx.replyWithHTML(
                        `<b>✅ There's no any problem with this channel</b>`
                    )
                })
        })
        .catch(err => {
            console.log(err)
            switch (err.response.error_code) {
                case 400:
                    ctx.replyWithMarkdown(
                        '*⚠️ Bot is not admin in this channel , it will not check user until promting as admin*'
                    )
                    break
                default:
                    ctx.replyWithHTML(
                        `<b>⚠️ Error : </b><code>${err.response.description}</code>\n\n<b>⛔️ Bot will not check if user joined this or not untill this problem not get fixed</b>`
                    )
            }
        })
})

bot.action(/^\/delete_channel (.+)$/, authAdmin, async ctx => {
    let username = ctx.match[1]
    db.collection('admin').updateOne(
        { channels: 1 },
        { $pull: { data: { username } } }
    )
    ctx.editMessageText('*✅ Channel Deleted*', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '◀️ Back',
                        callback_data: '/channels_settings'
                    }
                ]
            ]
        }
    })
})

bot.action('/add_channels', authAdmin, async ctx => {
    ctx.deleteMessage()
    ctx.replyWithHTML('<b>Send channel id you want to add</b>', {
        reply_markup: {
            keyboard: [[{
                text: cancel_button
            }]], resize_keyboard: true
        }
    })
    create_response(ctx, 'admin_channel_username')
})

