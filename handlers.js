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
    let buttons = []
    channels.forEach((ele,index) => {
            buttons.push({ text: 'Telegram', url: ele.username.replace(/@/g, 'https://t.me/') })
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
        [{text:'Begginer',callback_data:'begginer'},{text:'Master',callback_data:'master'}]
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

bot.action('step_3',check_join,async ctx =>{
    await ctx.deleteMessage()
    await ctx.replyWithHTML(`<b>👇 If You Have Registered The Send Your Quotext ID Below</b>`,{reply_markup:{keyboard:[[{text:cancel_button}]],resize_keyboard:true}})
    create_response(ctx,'quotext_id')
})

bot.action('menu',check_join,async ctx=>{
    let menu = get_main_menu(ctx)
    await ctx.deleteMessage()
    await ctx.replyWithHTML(menu.text,menu.markup)
})


bot.hears('🔒 Account',check_join,async ctx=>{
    let text = `<b>☺️ Here Is Your Details, Master\n\n🆔️ Account ID : </b><code>${ctx.from.id}</code>\n\n<b>🔍 Account Type : Beginner</b>`
    let markup = {reply_markup:{inline_keyboard:[[{text:'💳 Change account type',callback_data:'change_account_type'}],[{text:'Bot info',callback_data:'bot_info'}]]}}
    ctx.replyWithHTML(text,{parse_mode:'HTML',...markup})
})


bot.hears('💬 Contact Us',check_join,async ctx=>{
    let text = `<b>Send you query , our admins will reply in some time</b>`
    await ctx.replyWithHTML(text,{reply_markup:{keyboard:[[{text:cancel_button}]],resize_keyboard:true}})
    create_response(ctx,'support')
})