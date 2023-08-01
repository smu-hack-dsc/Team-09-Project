const express = require('express');
const router = express.Router();
const firebase = require('./model/firebaseconfig');
const axios = require('axios');
const cookieParser = require('cookie-parser');
// const mysqldb = require('./model/databaseconfig');

router.use(cookieParser());

const db = firebase.db;

// POST request to store user availability for an event
router.post('/api/availability/store/:eventId', (req, res) => {
    const { eventId } = req.params;
    const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    let email = userData.profile.email;

    // frontend need to get these details
    let specific_date = "2023-07-31";
    let new_avail = [false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,true,true,true,true,true,false,false,false];

    axios
        .get(`http://localhost:3000/available/${eventId}`)
        .then(function (res) {
            const event = res.data[0];
            const datesArray = event.Dates.split(',');
            return storeAvailability(eventId, datesArray, email, specific_date,new_avail);
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
                data = format_date_json(datesArray,email,new_avail);
            }
            const eventRef = db.collection('events').doc(eventId);
            eventRef.set(data).then(() => {
                console.log('Document successfully updated!');
                }).catch((error) => {
                console.error('Error updating document: ', error);
                });
        })
        
    } catch (error) {
        throw error;
    }
}

function format_date_json(datesArray,email,availability) {
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
        formattedJSON.dates[date].users.push(createUserObject(availability, email));
    }
    
    return formattedJSON;

}


router.get('/api/availability/:eventId', async (req, res) => {
    const { eventId } = req.params;
    

    try {
        // Get a reference to the document
        let docRef = db.collection('events').doc(eventId);

        // Get the current document data
        docRef.get().then((doc) => {
            let json = empty_json();
            const total_users = new Set();

            if (doc.exists) {                
                // Get the current data
                const data = doc.data();
                let dateArray = data['dates'];

                for (const date in dateArray) {
                    const day_users = new Set();
                    let userArray = data['dates'][date]['users'];

                    for (const i in userArray) {
                        let user = userArray[i];
                        email = user['email'];

                        total_users.add(email);
                        day_users.add(email);

                        const user_avail = user['availability'];
                        
                        for (const j = 0;j<24;j++) {
                            json[date]['availabilities'][j].push(user_avail[j]);
                        }
                    }

                    const day_avail = json[date]['availabilities'];
                    for (const lst in day_avail) {
                       json[date]['no_of_ppl'].push(lst.length());
                    }
                    json[date]['day_filled_out'] = day_users;
                }

                json['total_users'] = total_users;    

            }
            else {
                res.json(json);
            }
            
        })
        
    } catch (error) {
        throw error;
    }
    
});

function empty_json() {
    let datesArray;
    axios
        .get(`http://localhost:3000/available/${eventId}`)
        .then(function (res) {
            const event = res.data[0];
            datesArray = event.Dates.split(',');
        })
    
    // Create an empty object to hold the formatted JSON
    const empty = {};
    const avail_lst = [];
    for (let i = 0;i<24;i++) {
        avail_lst.push([]);
    }

    // Loop through each date in the input array
    for (const date of datesArray) {
        // Create an empty user array for each date
        empty[date] = { 
            'day_filled_out': 0,
            'availabilities': avail_lst,
            'no_of_ppl': []
        };
    }

    empty['total_users'] = 0;
    
    return empty;
}

module.exports = router;
