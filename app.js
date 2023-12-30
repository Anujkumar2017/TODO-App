const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
var lists = [];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(
  "mongodb+srv://anujk27j:anujk27j123@cluster0.fq5lt39.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
// mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });

const itemeSchema = {
  name: String,
};

const Item = mongoose.model('Item', itemeSchema);

const item1 = new Item({
  name: 'Welcome to your Todolist!',
});

const item2 = new Item({
  name: 'Check to Delete item.',
});

const item3 = new Item({
  name: 'Hit the + button to ADD new item.',
});

const item4 = new Item({
  name: 'To Add new list type ../listname in url.',
});

defaultItems = [item1, item2, item3, item4];

const listSchema = {
  name: String,
  items: [itemeSchema],
};

const List = new mongoose.model('List', listSchema);

app.get('/', function (req, res) {
  //find list
  List.find({}, function (err, list) {
    if (!err) {
      lists = list;
    }
  });
  Item.find({}, function (err, foundItems) {
    if (foundItems == 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) console.log(err);
        else console.log('sucessfully saved default items to DB');
      });
      res.redirect('/');
    } else {
      res.render('index.ejs', {
        listTitle: date.getDate(),
        items: foundItems,
        ls: lists,
      });
    }
  });
});

app.get('/about', (req, res) => {
  res.render('about.ejs');
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: [],
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        //show existing list
        List.find({}, function (err, list) {
          if (!err) {
            lists = list;
            res.render('index.ejs', {
              listTitle: customListName,
              items: foundlist.items,
              ls: lists,
            });
          }
        });
      }
    }
  });
});

app.post('/deletelist', (req, res) => {
  const listName = req.body.list;
  if (listName == date.getDate()) {
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, doc) {
      if (!err) {
        doc.remove();
        res.redirect('/');
      }
    });
  }
});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.id;
  const listName = req.body.listname;
  if (listName == date.getDate()) {
    Item.findByIdAndRemove({ _id: checkedItemId }, function name(err) {
      if (err) console.log(err);
    });
    res.redirect('/');
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err) {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

app.post('/', (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const new_item = new Item({
    name: itemName,
  });

  if (listName == date.getDate()) {
    new_item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, foundlist) {
      foundlist.items.push(new_item);
      foundlist.save();
      res.redirect('/' + listName);
    });
  }
});

let port = process.env.PORT;
if (port == null || port == '') {
  port = 3000;
}

app.listen(port, function () {
  console.log('Server is runnig at http://localhost:3000');
});
