const express   = require('express');
const app       = express();
const api       = require('./api/v1/index');
const cors      = require('cors');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const connection = mongoose.connection;

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Implémentation du CORS: npm install cors (midleware)
app.use(cors());
app.use((req, res, next) => {
    console.log(`Request handled at ${new Date()}`);
    next();
});
app.use('/api/v1', api);   // localhost:3000/api/v1
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
        console.log(`Express server listening on ${app.get('port')}`);
    });
});