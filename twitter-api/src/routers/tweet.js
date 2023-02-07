const express = require('express')
const Tweet = require('../models/tweet')
//const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const auth = require('../middleware/auth')
const findTweet = require('../middleware/findTweet')
const sharp = require('sharp')

// router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
//     const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
//     console.log(buffer)
//     req.user.avatar = buffer
//     await req.user.save()
//     console.log(req.user.avatar)
//     res.send()
// }, (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// })

const upload = multer({
    limits: {
        fileSize: 100000000
    }
})

router.post('/uploadTweetImage/:id', auth, upload.single('upload'), async (req, res) => {
    const tweet = await Tweet.findOne({ _id: req.params.id })
    console.log(tweet)
    if (!tweet) {
        throw new Error('Cannot find the tweet')
    }
    const buffer = await sharp(req.file.buffer).resize({ width: 350, height: 350 }).png().toBuffer()
    console.log(buffer)
    tweet.image = buffer
    await tweet.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/tweets', async (req, res) => {
    try {
        const tweets = await Tweet.find({})
        res.send(tweets)
    }
    catch (err) {
        res.status(500).send(err)
    }
})

router.get('/tweets/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const tweet = await Tweet.find({ user: _id })

        if (!tweet) {
            return res.status(404).send()
        }

        res.send(tweet)
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/tweets', auth, async (req, res) => {
    const tweet = new Tweet({
        ...req.body,
        user: req.user._id
    })
    try {
        await tweet.save()
        res.status(201).send(tweet)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/tweets/:id/image', async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id)

        if (!tweet || !tweet.image) {
            throw new Error()
        }
        res.set('Content-Type', 'image/jpg')
        res.send(tweet.image)
    } catch (e) {
        res.status(404).send()
    }
})

router.put('/tweets/:id/like', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        if (!tweet.likes.includes(req.user.id)) {
        await tweet.updateOne({ $push: { likes: req.user.id } });
        // await req.user.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("post has been liked");
        console.log('it has been liked');
        } else {
            res.status(403).json("you have already liked this post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});


router.put('/tweets/:id/unlike', auth, async (req, res) => {
    try {
        const tweet = await Tweet.findById(req.params.id);
        if (tweet.likes.includes(req.user.id)) {
        await tweet.updateOne({ $pull: { likes: req.user.id } });
        // await req.user.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("post has been unliked");
        } else {
            res.status(403).json("you have already unliked this post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// const upload = multer({
//     limits: {
//         fileSize: 1000000
//     },
//     fileFilter(req, file, cb) {
//         if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//             return cb(new Error('Please upload an image'))
//         }

//         cb(undefined, true)
//     }
// })

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc



// router.get('/tweets', async (req, res) => {
//     const match = {}
//     const sort = {}

//     if (req.query.completed) {
//         match.completed = req.query.completed === 'true'
//     }

//     if (req.query.sortBy) {
//         const parts = req.query.sortBy.split(':')
//         sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
//     }

//     try {
//         await req.user.populate({
//             path: 'tasks',
//             match,
//             options: {
//                 limit: parseInt(req.query.limit),
//                 skip: parseInt(req.query.skip),
//                 sort
//             }
//         }).execPopulate()
//         res.send(req.user.tasks)
//     } catch (e) {
//         res.status(500).send()
//     }
// })


// router.patch('/tasks/:id', auth, async (req, res) => {
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['description', 'completed']
//     const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

//     if (!isValidOperation) {
//         return res.status(400).send({ error: 'Invalid updates!' })
//     }

//     try {
//         const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})

//         if (!task) {
//             return res.status(404).send()
//         }

//         updates.forEach((update) => task[update] = req.body[update])
//         await task.save()
//         res.send(task)
//     } catch (e) {
//         res.status(400).send(e)
//     }
// })

// router.delete('/tasks/:id', auth, async (req, res) => {
//     try {
//         const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

//         if (!task) {
//             res.status(404).send()
//         }

//         res.send(task)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

module.exports = router