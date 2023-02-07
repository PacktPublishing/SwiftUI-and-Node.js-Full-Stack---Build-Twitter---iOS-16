const jwt = require('jsonwebtoken')
const Tweet = require('../models/tweet')

const findTweet = async (req, res, next) => {
    try {
        const tweet = await Tweet.findOne({ _id: req.body._id })

        if (!tweet) {
            throw new Error()
        }

        req.tweet = tweet
        next()
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.' })
    }
}

module.exports = findTweet