require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs')
const mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
mongoose.set('strictQuery', false);
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const port = 3000;

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:27017/${process.env.DB_NAME}`)

const userSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    password: {
        type: String,
    }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.route("/")
    .get((req, res) => { res.render("home") });

app.route("/login")
    .get((req, res) => { res.render("login") })
    .post(passport.authenticate('local', { // there is a lot of drama but explonation is https://github.com/londonappbrewery/Authentication-Secrets/issues/18
        successRedirect: '/secrets',
        failureRedirect: '/login'
    }));

app.route("/register")
    .get((req, res) => { res.render("register") })
    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect('/')
            } else {
                passport.authenticate('local')(req, res, function () { // does not work with required: true validation xddddddd
                    res.redirect("/secrets")
                })
            }
        })
    })

app.route('/secrets')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('secrets')
        } else {
            res.redirect('/login')
        }
    });

app.route('/logout')
    .get((req, res) => {
        req.logout(function (err) {
            if (err) { res.send(err); }
            res.redirect('/');
        });
    });

app.route('/auth/google')
    .get(passport.authenticate('google', { scope: ['profile'] }));


app.listen(port, () => {
    console.log(`Server listen on http://localhost:${port}`)
})