
const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
// const db = require('./model/databaseconfig');
const db = require('./model/databaseconfig');
const dayjs = require('dayjs'); 
const passport = require('./auth');
const date_func = require('./helper_func/date_func');

const PORT = 3000; //change to .env variable


// const apikey=process.env.API_KEY;
// const { google } = require('googleapis');

app.use(cors());
app.use(session({
    secret:'cats', // change to .env variable
    resave: false,
    saveUninitialized: false,
})); 
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


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
    res.cookie('userData', JSON.stringify(req.user), { httpOnly: true });

    const accessToken = req.user.accessToken;
    var Username = req.user.profile.given_name;
    var Email = req.user.profile.email;

    //sql scripts
    var sql_check=`SELECT COUNT(*) AS count FROM user WHERE Email = "${Email}";`
    var sql_insert = `INSERT INTO user (Email,Username) VALUES ("${Email}", "${Username}");`

    
    //check if user exists in our databse:
    db.callback_query(sql_check, [Email], (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          // if error redirect to login
          res.redirect('http://localhost:3001')
        }
      
        // Access the count value from the result object
        const count = result[0].count;
      
        if (count > 0) {
          // Email already exists, do not create another instance in db
          res.redirect('http://localhost:3001/home.html?accessToken=' + encodeURIComponent(accessToken));
        } 
        else {
          // Email doesn't exist, create a new instance in db
          db.callback_query(sql_insert, [],function (err, result) {
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
    
});


app.get('/calendar-events', (req, res) => {
  const accessToken = req.headers.authorization.replace('Bearer ', '');
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  

  axios.get(url, {
      headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
      },
  })
  .then(response => {
      const events = response.data.items.map(event => ({
          ItemId: event.id,
          ItemName: event.summary,
          StartDate: dayjs(event.start.dateTime).format('YYYY-MM-DD'),
          EndDate: dayjs(event.end.dateTime).format('YYYY-MM-DD'),
      }));

      // Send the events data to the frontend as JSON
      res.json(events);
  })
})

// Set up your route handler for the form submission
app.post('/create-event', async (req, res) => {
    // Access the form data through the 'req.body' object
    const eventData = req.body;
  
    // Generate a unique identifier for the event
    const eventId = uuidv4();
    
  
    // Access individual form fields using the 'name' attribute as the key
    const eventName = eventData.event_name;
    const date_str = eventData.datePick;
  
    // console.log(eventData);
    // console.log(date_str);
  
    const date_lst = date_func.process_date(date_str);
    const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    let email = userData.profile.email;
  
    try {
      // Check for userId
      const getUserIdSql = `SELECT userId FROM user WHERE email = "${email}"`;
      const userResult = await db.async_query(getUserIdSql, [email]);
      const userId = userResult[0].userId;
  
      // Create event if userId exists
      if (userId) {
        const insertEventSql = `INSERT into EVENT (EventID, CreatorID, EventName) VALUES ("${eventId}",${userId},"${eventName}")`;
        await db.async_query(insertEventSql, [eventId, userId, eventName]);
  
        for (const date of date_lst) {
          const insertDateSql = `INSERT into eventDate VALUES ("${eventId}","${date}")`;
          await db.async_query(insertDateSql, [eventId, date]);
        }
  
        // Respond to the client
        // res.send('Event created successfully!');
        const eventURL = `http://localhost:3001/available/${eventId}`;
        res.redirect(eventURL);
      } 
      else {
        res.status(404).send('User not found');
      }
    } 
    catch (err) {
      console.error('Error creating event:', err);
      res.status(500).send('Error creating event');
    }
  });

    
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
})

