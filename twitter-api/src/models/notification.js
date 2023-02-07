const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    notSenderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    notReceiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    notificationType: {
        type: String
    },
    postText: {
        type: String
    },
})

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification