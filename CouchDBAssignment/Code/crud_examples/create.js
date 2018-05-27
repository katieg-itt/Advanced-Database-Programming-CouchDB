//Connecting to couchdb using nano
var nano = require('nano')('http://localhost:5984');
//Connecting to the shopping list database
var shoppinglist = nano.db.use('shoppinglist');

//Creating new document using insert method
var bought_items = { 
    item: 'Onions', 
    quantity: ['1 bag'] 
};

shoppinglist.insert(bought_items, 'unique_id', function(err, body){
  if(!err){
    console.log(body);
  }
});




