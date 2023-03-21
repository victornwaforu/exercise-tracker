const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
// Require the necessary packages fot the project
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

// Connect to the MongoDB Atlas database
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  }
}, { versionKey: false });

let User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: new Date()
  }
}, { versionKey: false });

let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))

// Adding the body parser
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post("/api/users/", function(req, res) {
  let username = req.body.username;
  let newUser = new User({ username: username });
  newUser.save();
  res.json(newUser)
});

app.get("/api/users", function(req, res) {
  User.find({}).then(function(users) {
    res.json(users);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  console.log(req.body);
  let userId = req.params._id;
  let exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration,
  }
  if(req.body.date != "") {
    exerciseObj.date = req.body.date
  }

  let newExercise = new Exercise(exerciseObj);
  User.findById(userId)
      .then(function(userFound) {
        if (userFound) {
          newExercise.save();
          res.json({
            _id: userFound._id,
            username: userFound.username,
            description: newExercise.description,
            duration: newExercise.duration,
            date: newExercise.date.toDateString()
          })
        }     
     })
     .catch(function(err) {
       if(err) {
         res.send(error)
       }
     })
})

app.get("/api/users/:_id/logs", function(req, res) {
  let userId = req.params._id;
  let responseObj = {};
  let limitParam = req.query.limit;
  let toParam = req.query.to;
  let fromParam = req.query.from;

  limitParm = limitParam ? parseInt(limitParam) : limitParam;

  let queryObj = {userId: userId}

  if(fromParam || toParam) {
    queryObj.date = {}
    if(fromParam) {
      queryObj.date["$gte"] = fromParam;
    }
    if(toParam) {
      queryObj.date["$lte"] = toParam;
    }
  }
  
  User.findById(userId)
      .then(function(userFound) {
        let username = userFound.username;
        let userId = userFound._id;
        responseObj = {
          _id: userId,
          username: username
        }

        Exercise.find(queryObj).limit(limitParam)
                .exec()
                .then(function(exercises) {
                  
                  exercises = exercises.map(function(x) {
                    return {
                      description: x.description,
                      duration: x.duration,
                      date: x.date.toDateString()
                    }
                  })
                  
                  responseObj.log = exercises;
                  responseObj.count = exercises.length;
                  
                  res.json(responseObj);
                })
                .catch(function(err) {
                  if(err) {
                    res.send(error)
                  }
                })
      })
      .catch(function(err) {
        if(err) {
          res.send(error)
        }
      })
  
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
