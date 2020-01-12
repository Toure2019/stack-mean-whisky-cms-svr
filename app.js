const express   = require('express');
const app       = express();
const api       = require('./api/v1/index');
const auth      = require('./auth/routes');
const cors      = require('cors');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const connection = mongoose.connection;

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());    // Implémentation du CORS: npm install cors (midleware)

// passport
const passport      = require('passport');
const cookieParser  = require('cookie-parser');
const session       = require('express-session');
const Strategy      = require('passport-local').Strategy;
const User          = require('./auth/models/user');

app.use(cookieParser());
app.use(session({
    secret: 'my super secret',
    resave: true,
    saveUnitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

passport.use(new Strategy({
    usernameField: 'username',
    passwordField: 'password'
}, (name, pwd, cb) => {
    User.findOne({ username: name }, (err, user) => {
        if (err) {
            console.error(`could not find ${name} in MongoDB !`, err);
        }
        if (user.password !== pwd) {
            console.log(`wrong password for ${name}`);
            cb(null, false);
        } else {
            console.log(`${name} found in MongoDB and authenticate`);
            cb(null, user);
        }
    });
}));

const uploadsDir = require('path').join(__dirname, '/uploads');
console.log('uploadsDir', uploadsDir);
app.use(express.static(uploadsDir));

app.use((req, res, next) => {
    console.log(`Request handled at ${new Date()}`);
    next();
});
app.use('/api/v1', api);    // localhost:3000/api/v1
app.use('/auth', auth);     // localhost:3000/auth/register   
app.use((req, res) => {
    const err = new Error('404 - Not found !');
    err.status = 404;
    res.json({ msg: '404 - Not found !', err: err });
});

mongoose.connect('mongodb://localhost:27017/whiskycms', { useNewUrlParser: true });

connection.on('error', () => {
    console.error(`Connection to MongoDB error : ${err.message}`);
});

connection.once('open', () => {
    console.log('Connected to MongoDB');

    app.listen(app.get('port'), () => {
        console.log(`Express server listening on port ${app.get('port')}`);
    });
});