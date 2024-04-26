const { db } = require(".");

exports.paginate = function (arr, size) {
    size = size || 2
    return arr.reduce((acc, val, i) => {
        let idx = Math.floor(i / size);
        let page = acc[idx] || (acc[idx] = []);
        page.push(val);
        return acc;
    }, []);
};


exports.get_main_menu  = (ctx)=>{
    let text = `<b>Welcome To The Ultimate Trading Guide !</b>`
    let markup = {parse_mode:'HTML',reply_markup:{keyboard:[
        [{text:'🔒 Account'}],
        [{text:'💡 Trading Tips'},{text:'💬 Contact Us'}],
        [{text:'🛒 Join Us in The Journey'}]
    ],resize_keyboard:true}}
    return {text,markup}
}

exports.get_admin = async (ctx, adminData) => {
    adminData =
        adminData ||
        (await db.collection('admin').findOne({
            admin: 1
        })) ||
        {}
    let status_data = await db.collection('admin').findOne({ status: 1 })
    let keyboard = [
        [
            {
                text: `${adminData.bot_off ? '✅ Enable' : '❎ Disable'} Bot`,
                callback_data: `/change_bot_status`
            },
        ],
        [
            {
                text: 'Channels',
                callback_data: '/channels_settings'
            }
        ],
        [
            { text: 'Log Channel', callback_data: '/change_log_channel' },
        ],
        [
            {
                text: 'Broadcast',
                callback_data: 'broadcast'
            }
        ],]
    let text = `<b>👋 Hello ${ctx.from.first_name}, Welcome to admin panel\n\nBot: ${adminData?.bot_off ? '❎ Disabled' : '✅ Enabled'}\n\nTotal Users: ${status_data?.total_users||0}\n\nLog Channels: ${adminData?.log_channel||'Unknown'}</b>`
    return {
        text,
        markup: {
            reply_markup: {
                inline_keyboard: keyboard
            },
            parse_mode: 'HTML'
        }
    }
}