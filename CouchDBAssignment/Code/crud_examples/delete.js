//Connecting to couchdb using nano
var nano = require('nano')('http://localhost:5984');
//Connecting to the shopping list database
var shoppinglist = nano.db.use('shoppinglist');

//Deleting a specific document
shoppinglist.destroy('1 bag', '2-d1605591ae0abaa74bb92fb8546b0785', function(err, body) {
    if(!err){
        //done deleting
    }
});