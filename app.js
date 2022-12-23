require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const encrypt = require('mongoose-encryption');
const ejs = require('ejs')
const port = 3000;
const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:27017/${process.env.DB_NAME}`)

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Why not"]
    },
    password: {
        type: String,
        required: [true, "WHY NOT!"]
    }
});
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model('User', userSchema);

app.route("/")
    .get((req, res) => { res.render("home") });

app.route("/login")
    .get((req, res) => { res.render("login") })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        User.findOne({ email: username }, (err, found) => {
            if (err) {
                console.log(err)
            } else {
                if (found) {
                    if (found.password === password) {
                        res.render("secrets")
                    } else {
                        res.send("wrong password")
                    }
                } else {
                    res.send("no user register with that  ")
                }
            }
        })
    })

app.route("/register")
    .get((req, res) => { res.render("register") })
    .post((req, res) => {
        const user = new User({
            email: req.body.username,
            password: req.body.password
        });
        user.save((err) => {
            if (!err) {
                res.render('secrets');
            } else {
                res.send('error')
            }
        })

    })


app.listen(port, () => {
    console.log(`Server listen on http://localhost:${port}`)
})