// const app = require('./controller/app.js');
// const port = 3000;
// const server = app.listen(port,function() {
//     console.log("App hosted at localhost:" + port);
// });

const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');

const passport = require('./auth');
const PORT = 3000; //change to .env variable

const session = require('express-session');
const db = require('./model/databaseconfig')
const apikey=process.env.API_KEY;
const { google } = require('googleapis');

app.use(cors());
app.use(session({
    secret:'cats', // change to .env variable
    resave: false,
    saveUninitialized: false,
})); 
app.use(passport.initialize());
app.use(passport.session());

 
function isLoggedIn(req,res,next) {
    const accessToken = req.user && req.user.accessToken;
    if (accessToken) {
        return next();
    }

    res.sendStatus(401);
};



app.get('/',
    passport.authenticate('google',{scope:['email','profile','https://www.googleapis.com/auth/calendar.readonly']})
);    

app.get('/google/callback',
    passport.authenticate('google',{
        successRedirect: '/protected',
        failureRedirect: '/auth/failure',
    }));

app.get('/auth/failure', (req,res) => {
    res.redirect('http://localhost:3001');
});

// adding isLoggedIn middleware function is called before the res is sent.
app.get('/protected',isLoggedIn, (req,res) => {
    console.log(req.user);
    const accessToken = req.user.accessToken;
    var Username = req.user.profile.given_name;
    var Email = req.user.profile.email;
    //var url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary'
    var url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        // Handle the response data here
        console.log('Calendar Data:', response.data);
      })
      .catch(error => {
        // Handle errors here
        console.error('Error fetching calendar data:', error);
      });
    var sql_check=`SELECT COUNT(*) AS count FROM user WHERE Email = "${Email}";`
    var sql_insert = `INSERT INTO user (Email,Username) VALUES ("${Email}", "${Username}");`

    
    //check if user exists in our databse:
    db.query(sql_check, [Email], (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          // if error redirect to login
          res.redirect('http://localhost:3001')
        }
      
        // Access the count value from the result object
        const count = result[0].count;
      
        if (count > 0) {
          // Email already exists, do not create another instance in db
          res.redirect('http://localhost:3001/home.html?accessToken=' + encodeURIComponent(accessToken))
        } 
        else {
          // Email doesn't exist, create a new instance in db
          db.query(sql_insert, [],function (err, result) {
            if (err) {
              console.error('Error executing SQL query:', err);
              // if error redirect to login
              res.redirect('http://localhost:3001')
            }
            else{
            res.redirect('http://localhost:3001/home.html?accessToken=' + encodeURIComponent(accessToken));
            ;}
            
        })
        }
      });
    })

  
    
app.get('/logout', (req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy();
        res.redirect('http://localhost:3001');
      });
});

app.listen(PORT, function(err){
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", PORT);
});