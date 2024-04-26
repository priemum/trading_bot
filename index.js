const {
    MongoClient
} = require('mongodb')

const {
    mongo_url,
    bot_token
} = require('./config.js')

const client = new MongoClient(mongo_url, {
    writeConcern: {
        w: 'majority'
    }
})

client.connect()
    .then((client) => {
        exports.db = client.db(bot_token.split(':')[0]+':Trading-Bot')
        console.log('Connected To MongoDB')
        require('./bot')
    })
    .catch((error) => {
        console.log("Error while connecting to MongoDB:", error)
    })