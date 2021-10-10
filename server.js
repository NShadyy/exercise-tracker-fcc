// server.js
// where your node app starts

const express = require('express');
const rTracer = require('cls-rtracer');
const { ApiLoggerMiddleware, Logger } = require('./logger');
const cors = require('cors');
const { urlencoded } = require('body-parser');
const { connectToDb } = require('./db/utils/connect.util');
const { User } = require('./db/models/user.model');

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

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  Logger.info('Server', `Your app is listening on port ${listener.address().port}`);
});
