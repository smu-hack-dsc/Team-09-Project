const express = require('express');
const router = express.Router();
const firebase = require('./model/firebaseconfig');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const mysqldb = require('./model/databaseconfig');

router.use(cookieParser());
router.use(cors({
    origin: ['http://localhost:3001', 'https://meetngo-84f89.firebaseio.com']
  }));
const db = firebase.db;

// POST request to store user availability for an event
router.post('/api/availability/store/:eventId', (req, res) => {
    const { eventId } = req.params;
    const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    let email = userData.profile.email;
    email = '123@gmail.com';

    // frontend need to get these details
    let specific_date = "2023-08-08";
    let new_avail = [false,true,false,true,false,true,false,false,false,false,false,true,false,true,false,true,true,true,true,true,true,false,false,false];

    axios
        .get(`http://localhost:3000/available/${eventId}`)
        .then(function (res) {
            const event = res.data[0];
            const datesArray = event.Dates.split(',');
            return storeAvailability(eventId, datesArray, email, specific_date,new_avail);
        })
        .then(() => {
            return store_events_per_user(email,eventId);
        })
        .then(() => {
            res.status(200).json({ message: 'User availability stored successfully.' });
        })
        .catch(function (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Something went wrong.' });
        });
});

function storeAvailability(eventId, datesArray, email, date, new_avail) {
    try {
        // Get a reference to the document
        let docRef = db.collection('events').doc(eventId);

        // Get the current document data
        docRef.get().then((doc) => {
            let data;
            if (doc.exists) {                
                // Get the current data
                data = doc.data();
                let userArray = data['dates'][date]['users'];
                let status = false;
                for (const i in userArray) {
                    let user = userArray[i];
                    if (user['email'] == email) {
                        user['availability'] = new_avail;
                        status = true;    
                    }
                }
                if (!status) {
                    userArray.push(
                        {
                            "availability": new_avail,
                            "email": email
                        })
                }
            }
            else {
                data = format_date_json(datesArray,email,new_avail,date);
            }
            const eventRef = db.collection('events').doc(eventId);
            eventRef.set(data).then(() => {
                console.log('Availability document successfully updated!');
                }).catch((error) => {
                console.error('Error updating availability document: ', error);
                });
        })
        
    } catch (error) {
        throw error;
    }
}

function format_date_json(datesArray,email,availability,user_date) {
    // Create an empty object to hold the formatted JSON
    const formattedJSON = 
    {
        dates: {}
    };

    // Function to create user object
    const createUserObject = (availability, email) => ({ availability, email });

    // Loop through each date in the input array
    for (const date of datesArray) {
        // Create an empty user array for each date
        formattedJSON.dates[date] = { users: [] };

        // Add the user object to the users array for the current date
        if (user_date === date) {
            formattedJSON.dates[date].users.push(createUserObject(availability, email));
        }
        
    }
    
    return formattedJSON;

}

function store_events_per_user(email,eventId) {
    const events_per_user_ref = db.collection('users').doc('events_per_user');

    // Update the document
    events_per_user_ref.get()
    .then(doc => {
    if (doc.exists) {
        const data = doc.data();
        if (data[email]) {
        // User's email exists, update the array
        data[email].push(eventId);
        } else {
        // User's email doesn't exist, create a new entry
        data[email] = [eventId];
        }
        // Update the document with the modified data
        return events_per_user_ref.set(data);
    } else {
        // Document doesn't exist, create a new document with the user's email and event ID
        const newData = {
        [email]: [eventId]
        };
        return events_per_user_ref.set(newData);
    }
    })
    .then(() => {
    console.log("events_per_user document updated successfully!");
    })
    .catch(error => {
    console.error("Error updating events_per_user document: ", error);
    });
}


router.get('/api/availability/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        let json = await empty_json(eventId);

        // Get a reference to the document
        let docRef = db.collection('events').doc(eventId);

        // Get the current document data
        docRef.get().then((doc) => {
            let total_users = new Set();

            if (doc.exists) {                
                // Get the current data
                const data = doc.data();
                let dateArray = data['dates'];

                for (const date in dateArray) {
                    let day_users = new Set();
                    let userArray = data['dates'][date]['users'];

                    for (const i in userArray) {
                        let user = userArray[i];
                        email = user['email'];

                        total_users.add(email);
                        day_users.add(email);

                        const user_avail = user['availability'];
                        
                        for (let j = 0;j<24;j++) {
                            if (user_avail[j]) {
                                json[date]['availabilities'][j].push(email);    
                            }
                        }
                    }

                    for (let k = 0; k<24;k++) {
                        const lst = json[date]['availabilities'][k];
                        json[date]['no_of_ppl'].push(lst.length);
                    }

                    json[date]['day_filled_out'] = day_users.size;
                }
                
                json['total_users'] = total_users.size;    
                res.json(json);
            }
            else {
                res.json(json);
            }
            
        })
        
    } catch (error) {
        throw error;
    }
    
});

async function empty_json(eventId) {
    try {
        const res = await axios.get(`http://localhost:3000/available/${eventId}`);
        const event = res.data[0];
        const datesArray = event.Dates.split(',');

        // Create an empty object to hold the formatted JSON
        const empty = {};
        const avail_lst = [];
        for (let i = 0; i < 24; i++) {
            avail_lst.push([]);
        }
        // Loop through each date in the input array
        for (const date of datesArray) {
            // Create an empty user array for each date
            empty[date] = {
                'day_filled_out': 0,
                'availabilities': {
                    "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [],
                    "8": [], "9": [], "10": [], "11": [], "12": [], "13": [], "14": [], "15": [],
                    "16": [], "17": [], "18": [], "19": [], "20": [], "21": [], "22": [], "23": []
                },
                'no_of_ppl': []
            };
        }

        empty['total_users'] = 0;

        return empty;
    } catch (error) {
        throw error;
    }
}


router.get('/api/:user', (req,res) => {
    const { user } = req.params;

    const docRef = db.collection('users').doc('events_per_user');

            // Get the current document data
            docRef.get().then((doc) => {    
                             
                // Get the current data
                const data = doc.data();
                const user_events = data[user];
                res.json(user_events);
                
            })

});
module.exports = router;
