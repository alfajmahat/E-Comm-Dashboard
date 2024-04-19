const express = require('express')
const cors = require('cors')
require('./db/config')
const User = require('./db/User')
const Product = require('./db/Product')
const Jwt = require('jsonwebtoken')
const app = express()
app.use(express.json())
app.use(cors())
const jwtkey = 'e-comm'


app.post('/register', async (req, res) => {
    let user = new User(req.body)
    let result = await user.save()
    result = result.toObject()
    delete result.Password
    Jwt.sign({_id:result._id}, jwtkey, (err, token) => {
        if (err) {
            res.send('Something went wrong, Please try after sometime')
        }
        res.send({ result, auth: token })

    })
})

app.post('/login', async (req, res) => {
    if (req.body.Email && req.body.Password) {
        let user = await User.findOne(req.body).select('-Password')
        if (user) {
            Jwt.sign({_id:user._id}, jwtkey, (err, token) => {
                if (err) {
                    res.send('Something went wrong, Please try after sometime')
                }
                res.send({ user, auth: token })

            })
        } else {
            res.send({ result: 'User not found' })
        }
    } else {
        res.send({ result: 'User not found' })
    }

})

app.post('/add-product',verifyToken, async (req, res) => {
    let product = new Product(req.body)
    let result = await product.save()
    res.send(result)
})

app.get('/products',verifyToken, async (req, res) => {
    let products = await Product.find()
    if (Product.length > 0) {
        res.send(products)
    } else {
        console.log({ result: 'No products found' })
    }
})

app.delete('/product/:id',verifyToken, async (req, res) => {
    const result = await Product.deleteOne({ _id: req.params.id })
    res.send(result)
})

app.get('/product/:id',verifyToken, async (req, res) => {
    const result = await Product.findOne({ _id: req.params.id })
    if (result) {
        res.send(result)
    } else {
        res.send({ result: 'No record found' })
    }
})

app.put('/update/:id',verifyToken, async (req, res) => {
    const result = await Product.updateMany(
        { _id: req.params.id },
        {
            $set: req.body
        }
    )
    res.send(result)
})

app.get('/search/:key', verifyToken, async (req, res) => {
    const result = await Product.find({
        "$or": [
            { Name: { $regex: req.params.key } },
            { Category: { $regex: req.params.key } },
            { Company: { $regex: req.params.key } }
        ]
    })
    res.send(result)
})

app.get('/profile/:id', async (req, res) => {
    let result = await User.findOne({_id:req.params.id}).select('-Password')
    if (result) {
        res.send(result)
    } else {
        res.send('User not found')
    }
})

function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        Jwt.verify(token, jwtkey, (err, valid) => {
            if (err) {
                res.status(401).send({ result: 'Please provide valid token' })
            } else {
                next()
            }
        })
    } else {
        res.status(403).send({ result: 'Please add token with header' })
    }
}
app.listen(5000);