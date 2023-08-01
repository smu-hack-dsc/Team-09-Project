const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const db = require('./model/databaseconfig');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(timezone);
dayjs.extend(utc);


const passport = require('./auth');
const date_func = require('./helper_func/date_func');

const availabilityDB = require('./model/availability');

const PORT = 3000; //change to .env variable

const availabilityRouter = require('./firebase_api');

// Mount the availability router at /event path
app.use('/event', availabilityRouter);

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
    // console.log(response.data)
    const events = response.data.items.map(event => {
      const ItemId = event.id;
      const start = event.start;
      const end =event.end
      const descriptionini=event.description
      
      const startdatetime = Object.keys(start).length > 1 ? start : 'Whole Day';
      const enddatetime = Object.keys(end).length > 1 ? end : '';
      const description = descriptionini || '';
      const ItemName = event.summary;
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      let StartDate, EndDate;
  
      if (startdatetime && startdatetime.dateTime) {
        // Use dateTime if available (format: "2023-07-27T15:00:00Z")
        StartDate = dayjs(startdatetime.dateTime).utc().tz(userTimezone).format('YYYY-MM-DD');
        const eventDuration = dayjs(event.end.dateTime).diff(dayjs(startdatetime.dateTime), 'day');
        EndDate = dayjs(StartDate).add(eventDuration, 'day').format('YYYY-MM-DD');
      } else {
        // Fall back to date property (format: "2023-07-27")
        StartDate = dayjs(event.start.date).tz('Asia/Singapore').format('YYYY-MM-DD');
        // Subtract one day for events without time
        EndDate = dayjs(event.end.date).tz('Asia/Singapore').subtract(1, 'day').format('YYYY-MM-DD');
      }
  
      return {
        ItemId,
        ItemName,
        StartDate,
        EndDate,
        startdatetime,
        enddatetime,
        description
      };
    });
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
        const eventURL = `http://localhost:3001/available.html?eventId=${eventId}`;
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

// app.get('/available/:eventId', async (req,res) => {
//     const eventId = req.params.eventId;
//     const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
//     let email = userData.profile.email;

//     try {
//         // Retrieve event name
//         const getEventName = `SELECT EventName FROM event WHERE EventID = "${eventId}"`;
//         const res1 = await db.async_query(getEventName, [eventId]);
//         const eventName = res1[0].EventName;

//         // Retrieve event dates
//         const getEventDate = `SELECT Date FROM eventDate WHERE EventID = "${eventId}"`;
//         const res2 = await db.async_query(getEventDate, [eventId]);
//         const eventDates = res2.map(row => row.Date); // Extract an array of dates from the result

//         // Create a JSON object with the desired structure
//         const eventData = {
//         eventName: eventName,
//         eventDates: eventDates
//         };

//         // Sending the JSON object as a response to the front end
//         res.json(eventData);
//     }
//     catch (err) {
//         console.error('Error retrieving event data:', err);
//         res.status(500).send('Error retrieving event data:');
//       }

// });

app.get('/available/:eventId', function (req, res) {
  const eventId = req.params.eventId;

  availabilityDB.getAvailabilityByEvent(eventId, function (err, results) {
      if (err) {
          console.log(results)
          res.status(500)
          res.json({ Result: 'Internal Error' })
      } else {
          res.json(results)
      }
  })
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