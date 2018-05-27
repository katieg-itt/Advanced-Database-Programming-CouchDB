//Connecting to couchdb using nano
var nano = require('nano')('http://localhost:5984');
//Connecting to the shopping list database
var shoppinglist = nano.db.use('shoppinglist');

//Updating Document
shoppinglist.update = function(obj, key, callback) {
 var bought_items = this;
 bought_items.get(key, function (error, existing) { 
  if(!error) obj._rev = existing._rev;
  bought_items.insert(obj, key, callback);
 });
}
shoppinglist.update({item: 'spuds', quantity: '1 bag'}, 'bought_items', function(err, res) {
 if (err) return console.log('No update!');
 console.log('Updated!');
});


