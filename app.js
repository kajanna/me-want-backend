const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const HttpError = require('./models/http-error');
const itemRoutes = require('./routes/items-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use("/uploads/images", express.static(__dirname + "/uploads/images"));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
     //'Access-Control-Allow-Headers', 'Content-Type');
     'Access-Control-Allow-Headers', 'Origin,Access-Control-Allow-Origin, X-Requested, Content-Type, Accept, Authorization');
     res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
})
app.use('/api/items', itemRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
    const error = new HttpError('Niestety nie znaleźliśmy tego czego szukałeś', 404);
    throw error
});

app.use( function (err, req, res, next) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
        });
    }
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.code || 500)
    res.json({message: err.message || 'Wystapił nieznany błąd'});
});

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.eb2lw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(process.env.PORT || 5000);
    })
    .catch(err => {
        console.log(err);
    });


