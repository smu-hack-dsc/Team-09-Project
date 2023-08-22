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
const encrypt = require('./encrypt');
const config = require('./config');
dayjs.extend(timezone);
dayjs.extend(utc);


const passport = require('./auth');
const date_func = require('./helper_func/date_func');

const availabilityDB = require('./helper_func/availability');

const PORT = 3000; //change to .env variable

const availabilityRouter = require('./firebase_api');

// Mount the availability router at /event path
app.use('/event', availabilityRouter);

// const apikey=process.env.API_KEY;
// const { google } = require('googleapis');

app.use(cors({ origin: 'meet-n-go', credentials: true }));
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
    const check = req.user && req.user.accessToken;
    if (check) {
        return next();
    }

    res.sendStatus(401);
};

app.get('/',
    app.use(express.static('./public'))
);

app.get('/home', isLoggedIn, (req, res) => {
  res.sendFile(__dirname + '/public/home.html'); // Serve a specific HTML file
});

app.get('/create', isLoggedIn, (req, res) => {
  res.sendFile(__dirname + '/public/create.html'); // Serve a specific HTML file
});

app.get('/available',isLoggedIn, (req, res) => {
  const eventId = req.query.eventId;
  if (eventId) {
    res.sendFile(__dirname + `/public/available.html?eventId=${eventId}`); // Serve a specific HTML file
  }
  res.sendFile((__dirname + `/public/available.html`));
});


app.get('/auth',
    passport.authenticate('google',{scope:['email','profile','https://www.googleapis.com/auth/calendar.readonly']})
);    

app.get('/google/callback',
    passport.authenticate('google',{
        // successRedirect: '/protected',
        successRedirect: '/protected',
        failureRedirect: '/auth/failure',
    }));

app.get('/auth/failure', (req,res) => {
    res.redirect('/');
});

// adding isLoggedIn middleware function is called before the res is sent.
app.get('/protected',isLoggedIn, (req,res) => {
    // const encryptedCookie = encrypt.encrypt_cookie(req.user)

    // res.cookie('encryptedUserData', encryptedCookie, { httpOnly: true });
    // console.log("req.user", req.user)
    // res.cookie('userData', JSON.stringify(req.user), { path:'/', domain:'.onrender.com', httpOnly: true, sameSite: 'none', });
    // res.setHeader('Set-Cookie', 'userData=' + JSON.stringify(req.user) + '; Path=/; Domain=.onrender.com; HttpOnly; Secure; SameSite=None');
    // res.header('Access-Control-Allow-Origin', 'meet-n-go');
    // res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    // res.header('Access-Control-Allow-Credentials', true);
    // const cookieValue = JSON.stringify(req.user);
    // console.log("cookieValue", cookieValue)
    // res.send("cookie.set")

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
          res.redirect('/')
        }
      
        // Access the count value from the result object
        const count = result[0].count;
      
        if (count > 0) {
          // Email already exists, do not create another instance in db
          res.redirect('/home');
        } 
        else {
          // Email doesn't exist, create a new instance in db
          db.callback_query(sql_insert, [],function (err, result) {
            if (err) {
              console.error('Error executing SQL query:', err);
              // if error redirect to login
              res.redirect('/')
            }
            else{
            res.redirect('/home');
            ;}
            
        })
        }
      });
    
});

app.get('/access', (req,res) => {
  // const encryptedCookie = req.cookies.encryptedUserData;
  // const accessToken = encrypt.decrypt_user_data(encryptedCookie,'access');

  // const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
  // const accessToken = userData.profile.accessToken;

  const accessToken = req.user.accessToken;

  res.send(accessToken);
})


app.get('/calendar-events', async (req, res) => {
  // const encryptedCookie = req.cookies.encryptedUserData;
  // const accessToken = encrypt.decrypt_user_data(encryptedCookie,'access');

  // const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
  // const accessToken = userData.profile.accessToken;

  const accessToken = req.user.accessToken;

  // console.log(accessToken);
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  
  if (accessToken) {
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        withCredentials: true
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
  }
})


app.get('/userData', (req,res) => {
    // const encryptedCookie = req.cookies.encryptedUserData;
    // const email = encrypt.decrypt_user_data(encryptedCookie,'email');

    const userData = req.user;

    // const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    const email = userData.profile.email;

    const data = {'email' : email}
    res.json(data);
});

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
    // const encryptedCookie = req.cookies.encryptedUserData;
    // const email = encrypt.decrypt_user_data(encryptedCookie,'email');

    const userData = req.user;

    // const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    const email = userData.profile.email;
  
    try {
      // Check for email
      let status;
      const check_user = `SELECT COUNT(*) as count FROM user WHERE email = "${email}"`;
      const userResult = await db.async_query(check_user, [email]);
      status = userResult[0].count;
  
      // Create event if user exists
      if (status) {
        const insertEventSql = `INSERT into EVENT (EventID, Creator, EventName) VALUES ("${eventId}","${email}","${eventName}")`;
        await db.async_query(insertEventSql, [eventId, email, eventName]);
  
        for (const date of date_lst) {
          const insertDateSql = `INSERT into eventDate VALUES ("${eventId}","${date}")`;
          await db.async_query(insertDateSql, [eventId, date]);
        }
  
        // Respond to the client
        // res.send('Event created successfully!');
        const eventURL = `/available?eventId=${eventId}`; // need to fix this, redirection doesn't work
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

app.get('/filter', async (req,res) => {
    const requestedCategory = req.query.category;

    // const encryptedCookie = req.cookies.encryptedUserData;
    // const email = encrypt.decrypt_user_data(encryptedCookie,'email');

    const userData = req.user;
    // console.log(userData);

    // const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    const email = userData.profile.email;
    // console.log(email);

    if (requestedCategory === 'all') {
      axios.get(`http://localhost:3000/event/api/${email}`, {withCredentials: true})
      .then(async response => {
        const data = response.data;
        let all_events = {};
        let my_events = {};
        let result = {};

        if (data) {
          all_events = await get_all_events(data);
          my_events = await get_my_created_events(email);
          // Merge listA and listB
          const mergedList = [...all_events, ...my_events];

          // Remove duplicates based on EventName and EventID
          result = mergedList.filter((item, index, self) => 
          index === self.findIndex(i =>
          i.EventName === item.EventName && i.EventID === item.EventID
        ));
        }

        res.json(result);
      })
        
    }
    else if (requestedCategory === 'mine') {
      const my_events = await get_my_created_events(email);
      res.json(my_events);
    
    }
    else if (requestedCategory === 'other') {
      axios.get(`http://localhost:3000/event/api/${email}`, {withCredentials: true})
      .then(async response => {
        let all_events = {};
        let my_events = {};
        let other_events = {};

        const data = response.data;
        if (data) {
          all_events = await get_all_events(data);
          my_events = await get_my_created_events(email);
        
          other_events = all_events.filter(itemA => {
          return !my_events.some(itemB => 
            itemB.EventName === itemA.EventName && itemB.EventID === itemA.EventID);
          });
        }
  
        res.json(other_events);
      })
    }

});

async function get_all_events(eventIDs) {
    const event_str = eventIDs.map(id => `'${id}'`).join(', ');
    const sqlQuery = `SELECT EventName,EventID FROM EVENT WHERE EventID in (${event_str});`;

    try {
      // Retrieve event name
      const res = await db.async_query(sqlQuery, []);
      return res;
      // Sending the JSON object as a response to the front end
      
    }
    catch (err) {
        console.error('Error retrieving event data:', err);
      }
  
}

async function get_my_created_events(email) {
  const sqlQuery = `SELECT EventName,EventID FROM EVENT WHERE Creator = "${email}"`;

  try {
    // Retrieve event name
    const res = await db.async_query(sqlQuery, []);
    return res;

    // Sending the JSON object as a response to the front end
    
  }
  catch (err) {
      console.error('Error retrieving event data:', err);
    }
}



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

app.get('/username', async (req,res) => {
    const email_lst = req.body;
    const email_str = email_lst.map(id => `'${id}'`).join(', ');
    const sql = `select email,username from user where email in (${email_str});`;
    const users = await db.async_query(sql, []);

    res.json(users);
});

app.get('/logout', (req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy();
        res.clearCookie('encryptedUserData', { httpOnly: true });
        res.redirect('/');
      });
});

app.listen(PORT, function(err){
    if (err) console.log("Error in server setup")
    console.log("Server listening on Port", PORT);
})