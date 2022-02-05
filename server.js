const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI);

let personSchema = new mongoose.Schema({
  username: String,
  exercices: [
    {
      description: { type: String },
      duration: { type: Number },
      date: { type: String, required: false }
    }
  ]
})
const Person = mongoose.model('Person', personSchema);

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const person = new Person({ username: req.body.username });
  person.save((err, data) => {
    if (err) return console.log(err);
    res.json({
      username: data.username,
      _id: data.id
    });
  });
});

app.get('/api/users', (req, res) => {
  Person.find({}).exec((err, users) => {
    if (err) return console.log(err);
    res.json(users);
  });
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;

  let exercises = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  }

  Person.findByIdAndUpdate(
    id,
    { $push: { exercices: exercises } },
    { new: true },
    (err, data) => {
      if (err) return console.log(err);
      let returnObj = {
        username: data.username,
        description: exercises.description,
        duration: exercises.duration,
        _id: id,
        date: exercises.date
      };
      res.json(returnObj);
    }
  );
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;

  Person.findById(id, (err, data) => {
    if (err) return console.log(err);

    if (from) {
      data.exercices = data.exercices.filter(e => new Date(e.date) > new Date(from));
    }
    if (to) {
      data.exercices = data.exercices.filter(e => new Date(e.date) < new Date(to));
    }
    if (limit) {
      data.exercices = data.exercices.slice(0, limit);
    }

    let returnObj = {
      username: data.username,
      count: data.exercices.length,
      _id: id,
      log: data.exercices
    }
    res.json(returnObj);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
