// server.js
// where your node app starts

const express = require('express');
const rTracer = require('cls-rtracer');
const { ApiLoggerMiddleware, Logger } = require('./logger');
const cors = require('cors');
const { urlencoded } = require('body-parser');
const { connectToDb } = require('./db/db.util');
const { User, Exercise } = require('./db/db.model');
const { ObjectID } = require('mongodb');

require('dotenv').config();

// init project
var app = express();

// connect to database
connectToDb();

// body parser middleware
app.use(urlencoded({ extended: false }));

// logging middleware
app.use(rTracer.expressMiddleware(), ApiLoggerMiddleware);

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// your first API endpoint...
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/users', function (req, res) {
  const username = req.body.username;
  Logger.info('Server.Post.Users.started', {
    username,
  });

  User.create({
    username,
  })
    .then((newUser) => {
      Logger.info('Server.Post.Users.success', {
        newUser,
      });
      res.json({
        username: newUser.username,
        _id: newUser.id,
      });
    })
    .catch((error) => {
      Logger.error('Server.Post.Users.failed', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.get('/api/users', function (req, res) {
  Logger.info('Server.Get.Users.started');

  User.find({})
    .select('_id username')
    .exec()
    .then((usersList) => {
      Logger.info('Server.Get.Users.success', {
        noOfUsers: usersList.length,
      });
      res.json(usersList);
    })
    .catch((error) => {
      Logger.error('Server.Get.Users.failed', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.post('/api/users/:_id/exercises', function (req, res) {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  Logger.info('Server.Post.Exercises.started', {
    userId,
    description,
    duration,
    date,
  });

  User.findById(userId)
    .exec()
    .then((user) => {
      if (!user) {
        Logger.info('Server.Post.Exercises.userNotFound', {
          userId,
        });
        res.status(404).json({ error: 'User Not Found!' });
        return;
      }

      Exercise.create({
        description,
        duration,
        date: date ? new Date(date) : new Date(),
        user: user._id,
      })
        .then((newExercise) => {
          Logger.info('Server.Post.Exercises.success', {
            newExercise,
          });
          res.json({
            username: user.username,
            description: newExercise.description,
            duration: newExercise.duration,
            date: newExercise.date.toDateString(),
            _id: user.id,
          });
        })
        .catch((error) => {
          Logger.error('Server.Post.Exercises.failed', error);
          res.status(500).json({ error: 'Internal Server Error' });
        });
    })
    .catch((error) => {
      Logger.error('Server.Post.Exercises.failed', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.get('/api/users/:_id/logs', function (req, res) {
  const userId = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  Logger.info('Server.Get.Logs.started', {
    userId,
    from,
    to,
    limit,
  });

  User.findById(userId)
    .exec()
    .then((user) => {
      if (!user) {
        Logger.info('Server.Get.Logs.userNotFound', {
          userId,
        });
        res.status(404).json({ error: 'User Not Found!' });
        return;
      }

      let searchObject = {
        user: user._id,
      };

      if (from) {
        searchObject = {
          ...searchObject,
          date: {
            $gte: new Date(from),
          },
        };
      }

      if (to) {
        searchObject = {
          ...searchObject,
          date: {
            $lte: new Date(to),
          },
        };
      }

      let logsQuery = Exercise.find(searchObject);

      if (limit && !Number.isNaN(Number(limit))) {
        logsQuery = logsQuery.limit(Number(limit));
      }

      logsQuery
        .exec()
        .then((exercises) => {
          Logger.info('Server.Get.Logs.success', {
            exercises,
          });
          res.json({
            _id: user.id,
            username: user.username,
            count: exercises.length,
            log: exercises.map((exercise) => {
              return {
                description: exercise.description,
                duration: exercise.duration,
                date: exercise.date.toDateString(),
              };
            }),
          });
        })
        .catch((error) => {
          Logger.error('Server.Get.Logs.failed', error);
          res.status(500).json({ error: 'Internal Server Error' });
        });
    })
    .catch((error) => {
      Logger.error('Server.Get.Logs.failed', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  Logger.info('Server', `Your app is listening on port ${listener.address().port}`);
});
