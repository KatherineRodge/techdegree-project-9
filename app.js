'use strict';

// load modules
const express = require('express');
const bodyParser = require('body-parser')
const morgan = require('morgan');

//authorization
const auth = require('basic-auth');
let authUser;

//Models and Sequelize
const Sequelize = require('sequelize');
const User = require('./models').User;
const Course = require('./models').Course;

//bycrypt passwords
const bcrypt = require('bcryptjs');
let hash;

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();

//body-bodyParser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// setup morgan which gives us http request logging
app.use(morgan('dev'));

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      res.status(500).send(error);
    }
  }
}

//Authorization Middleware
const authorizationMiddleware = (asyncHandler( async(req, res, next) => {
  let user = auth(req);
  if (user) {
  let authUser = await User.findAll({
    where: {
      emailAddress : user.name
    },
    attributes: {
      exclude: ['password', 'createdAt', 'updatedAt']
    }
  });
  app.locals.user = authUser;
  next();
} else {
  return res.status(401).json('Sorry, not Authorized');
}
}));

//check to see if password is not NULL
function passwordCheck(password){
  if (password) {
    return true
  } else {
    return false
  }
}

//valid email
function ValidateEmail(mail) {
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
  {
    return (true)
  } else {
    return (false)
  }
}

//creates new user
app.post('/api/users', asyncHandler(async (req, res) => {
      try {
        let user = req.body;

        //checks to see if password has value to run bcrypt
          if(passwordCheck(req.body.password)) {
          user.password = await bcrypt.hashSync(req.body.password,10);
          } else {
          user.password = '';
          }

        //checks to see email is valid
        let validEmail = ValidateEmail(req.body.emailAddress)
          if(validEmail === false && req.body.emailAddress) {
             return res.status(400).json("You have entered an invalid email address!");
          } else {
        let createdUser = await User.create(user);
        res.location('/');
        return res.status(201).json();
      }} catch(error) {
          if(error.name === "SequelizeValidationError") {
          return res.status(400).json(error.message);
        } else {
          return res.status(400).json(error.message)
        }
      }

}));

//Returns the currently authenticated users
app.get('/api/users', authorizationMiddleware, asyncHandler(async (req, res) => {
  try{
  res.json(app.locals.user);
  return res.status(200)
} catch(error) {
  res.json(error.message);
}
}));

//Returns List of All Courses
app.get('/api/courses', asyncHandler(async (req, res) => {
    //finds all courses, but excludes specific attributes
    let courses = await Course.findAll({
      include: [{model: User,
        attributes:{
           exclude: ['createdAt', 'updatedAt', 'password']
       }
      }],
      attributes: {
        exclude: ['createdAt', 'updatedAt']
        }
    });
    res.json({courses});
    return res.status(200).json();
}));

//Return Course with the appropriate :id
app.get('/api/courses/:id', asyncHandler(async (req, res) => {
  //returns one course, but excludes specific attributes
  let courses = await Course.findByPk(req.params.id,
    { include: [
        {model: User,
           attributes:{
              exclude: ['createdAt', 'updatedAt', 'password']
          }
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        }
        });
    if (courses){
      res.json(courses);
      return res.status(200).json();
    } else{
      return res.status(404).json("Sorry, Course not found");
    }
}));



//Creates a Course
app.post('/api/courses', authorizationMiddleware, asyncHandler(async (req, res) => {
  try {
  let course =  (req.body);
  course.userId = app.locals.user[0].dataValues.id
  let newCourse = await Course.create(course);
  res.location('/api/courses/' + course.id);
  return res.status(201).json();
  } catch(error) {
    if(error.name === "SequelizeValidationError") {
    return res.status(400).json(error.message);
  } else {
    return res.status(400).json(error.message)
  }
}
}));

//Updates a Course
app.put('/api/courses/:id', authorizationMiddleware, asyncHandler(async (req, res) => {
    try {
      let course =  await Course.findByPk(req.params.id);
      //check to see if authorized user owns the course
      if (course && (course.userId === app.locals.user[0].dataValues.id)) {
      //check to see if description or title are true and can be updated
            if(req.body.description || req.body.title) {
            course = await course.update(req.body);
            return res.status(204).json();
          } else {
            return res.status(400).json("Please provide an update for the Course Title, Course Description or Both");
          }} else if (course && (course.userId != app.locals.user[0].dataValues.id)) {
            return res.status(403).json('Sorry, you not authorized to make changes to this course');
          } else {
            return res.status(404).json('Course not found');
          }}
        catch(error){
          return res.status(400).json(error.message);
        }
}));

//Delete a Course
app.delete('/api/courses/:id', authorizationMiddleware, asyncHandler(async (req, res) => {
  try{
  let course =  await Course.findByPk(req.params.id);
  //check to see if authorized user owns the course and if course exists
  if(course && (course.userId === app.locals.user[0].dataValues.id)) {
  course = course.destroy();
  return res.status(204).json();
  //if authorized user does not own course
} else if (course && (course.userId != app.locals.user[0].dataValues.id)) {
  return res.status(403).json("You are not authorized to Delete this Course");
  //if course does not exist
  } else {
  return res.status(404).json('Course not found');
  }
  } catch (error) {
  return res.json(error.message);
  }
}));


// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});
