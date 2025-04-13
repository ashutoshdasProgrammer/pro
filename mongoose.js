
/**
 * this file is used for checking of connection of the database
 */

const mongoose = require('mongoose');

const connect = () => {
    return mongoose.connect('mongodb://localhost:27017/uploadData');
};

const db = mongoose.connection;

// if there is any error then the db will show us error
db.on('error', function(err){
    console.log(err);
});

// if the connection is successful then the db will show us connected
db.on('open', function(){
    console.log('connected to the database');
});

module.exports = {connect, db};