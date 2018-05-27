//Connecting to couchdb using nano
var nano = require('nano')('http://localhost:5984');
//Connecting to the shopping list database
var shoppinglist = nano.db.use('shoppinglist');
//Retrieving Documents with a view


shoppinglist.get('katies_list', { revs_info: true }, function(err, body) {
  if (!err)
    console.log(body);
});