//Connecting to couchdb using nano
var nano = require('nano')('http://localhost:5984');
//Connecting to the shopping list database
var shoppinglist = nano.db.use('shoppinglist');
var displayed_list = '';	// The list displayed on screen

// Nano does not have any built in functions for updating documents, so add one
shoppinglist.update = function(obj, key, callback) {
	var bought_items = this;
	bought_items.get(key, function (err, existing) { 
		if(!err) obj._rev = existing._rev;
			bought_items.insert(obj, key, callback);
	});
}

// Include express as a basic webserver
var express = require('express');
var app = express();
// parsing forms
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();

// Basic templating system taken from express docs http://expressjs.com/en/advanced/developing-template-engines.html
var fs = require('fs') // this engine requires the fs module
app.engine('ntl', function (filePath, options, callback) { // define the template engine
	fs.readFile(filePath, function (err, content) {
		if (err) return callback(err)
		// this is an extremely simple template engine
		var rendered = content.toString().replace('#list#', options.list).replace('#all_lists#', options.all_lists);
		return callback(null, rendered)
	})
})
app.set('views', './views') // specify the views directory
app.set('view engine', 'ntl') // register the template engine



// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 

// for parsing multipart/form-data
app.use(upload.array()); 
// Set up static file serving (For css etc)
app.use(express.static('public'));

// Express routes
app.all('/', function (req, res) {

	// handle list changes (sent via post)
	if(req.body.list) {
		displayed_list = req.body.list;
	}
	var my_list;
	var html_list = '';
	var html_alllists = '';

	var total_items = 0;

	shoppinglist.view('showAllBooks', 'total-items', function(err, body) {
		//Run mapreduce view to get total items across all lists
		if (!err) {
			body.rows.forEach(function(doc) {
				total_items = doc.value;
			});

			// Get all the lists
			shoppinglist.view('showAllBooks', 'show-all', function(err, body) {
			  if (!err) {
			  	var first_list = '';
			  	var list_found = false;
			    body.rows.forEach(function(doc) {
			    	if(!first_list) {
			    		first_list = doc.id;
			    	}
			    	var selected = "";
			    	if(doc.id == displayed_list) {
			    		selected = " selected='selected'";
			    		list_found = true;
			    	} else {
			    		selected = "";
			    	}
			    	html_alllists += "<option value='"+doc.id+"'"+selected+">"+doc.key+" (contains "+doc.value+" of "+total_items+" items)</option>";
			    });

			    if(!displayed_list) {
			    	// in case list is deleted or first view, use the first list
			    	displayed_list = first_list;
			    }


			    // Display the items in the list
			    shoppinglist.get(displayed_list, { revs_info: true }, function(err, body) {
				  if (!err) {
				  	my_list = body.shopping_list;
				  	var delete_id = 0;
				  	if(my_list.length) {
					  	my_list.forEach(function(element) {
					  		if(element.item) {
								html_list += "<li>"+element.item+"<span>"+element.quantity+"<a href='/delete/"+delete_id+"'>"
										  + "<i class='material-icons'>remove_shopping_cart</i></a></span></li>";
								delete_id++;
							}
						});
					} else {
						html_list += "<li>List is Empty</li>";
					}

					res.render('list', { "list": html_list, "all_lists": html_alllists });
				  } else {
				  	console.log('Could not render');
				  }
				});
			  }
			});
		}
	});

	

  //res.sendFile(__dirname+'/public/index.html');
});

app.post('/addlist', function (req, response) {
	var list_name = req.body.name;
	list_name = list_name.split(' ').join('_'); // replace space with _
	console.log('Adding new list '+list_name);
	shoppinglist.insert({ "shopping_list": [] }, list_name, function(err, body) {
	  if (!err) {
	  	response.redirect('/');
	  } else {
	  	console.log(err);
	  }
	});
});

app.post('/insert', function (req, response) {
	// Get the product and quantity
	var product = req.body.product;
	var quantity = req.body.quantity;

	// Get the old list, add new item to the array and update it
	shoppinglist.get(displayed_list, { revs_info: true }, function(err, body) {
	  if (!err) {
	  	var current_list = body.shopping_list;
	  	// Add the new item to the list
	  	current_list.push({"item":product, "quantity":quantity});
	  	// Update list in couchDB
	  	shoppinglist.update({"shopping_list": current_list}, displayed_list, function(err, res) {
			if (err) return console.log('No update!');
			console.log('Updated!');
			response.redirect('/');
		});
	  }
	});


	//res.send(req.body);
});

app.get('/delete/:id', function (req, response) {
	// Get the old list, remove the indexed item from the array and update it
	shoppinglist.get(displayed_list, { revs_info: true }, function(err, body) {
	  if (!err) {
	  	var current_list = body.shopping_list;
	  	// Remove the item at position :id from the list
	  	current_list.splice(req.params.id, 1);
	  	// Update list in couchDB
	  	shoppinglist.update({"shopping_list": current_list}, displayed_list, function(err, res) {
			if (err) return console.log('No update!');
			console.log('deleted');
			response.redirect('/');
		});
	  }
	});
})

app.get('/deletelist', function (req, response) {
	// Get the revision id for deletion
	shoppinglist.get(displayed_list, function(err, body) {
		console.log(body._rev);
		shoppinglist.destroy(displayed_list, body._rev, function(err, body) {
			if (!err) {
				displayed_list = '';
				console.log('List Deleted');
				response.redirect('/');
			}
		});
	});
})

// Listen on port 3000, view app with http://localhost:3000
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})


