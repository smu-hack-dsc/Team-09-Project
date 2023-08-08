const express = require('express');
const router = express.Router();
const firebase = require('./model/firebaseconfig');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const encrypt = require('./encrypt');
const config = require('./config');

router.use(cookieParser());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(cors({
    origin: ['http://localhost:3001', 'https://meetngo-84f89.firebaseio.com']
  }));
const db = firebase.db;

// POST request to store user availability for an event
router.post('/api/availability/store/:eventId', (req, res) => {
    const { eventId } = req.params;
    const encryptedCookie = req.cookies.encryptedUserData;
    const email = encrypt.decrypt_user_data(encryptedCookie,'email');
    // email = '123@gmail.com';

    let formData = req.body;
    // console.log('Form Data:', formData);
    
        axios
            .get(`https://meetngo.onrender.com/available/${eventId}`)
            .then(async function (res) {
                const event = res.data[0];
                const datesArray = event.Dates.split(',');
                let dict = await check_event_doc(eventId,datesArray);
                // console.log('line 35: ',dict);
                
                if (Object.keys(formData).length !== datesArray.length) {
                    for (const date of datesArray) {
                        if (!(date in formData)) {
                            formData[date] = [];
                        }
                    }
                }

                // console.log('Formatted Data:', formData);

                for (const specific_date in formData) {
                    let user_avail = formData[specific_date];
                    if (typeof user_avail === "string") {
                        user_avail = [user_avail];
                    }
                    // console.log(user_avail);
                    const new_avail = format_user_avail(user_avail);
                    // console.log(new_avail);
                    
                    dict = storeAvailability(email, specific_date, new_avail, dict);
                    // for(let date in dict.dates) {
                    //     console.log(date);
                    //     console.log(dict.dates[date].users);
                    // }
                }
                const eventRef = db.collection('events').doc(eventId);
                eventRef.set(dict).then(() => {
                    console.log('Availability document successfully updated!');
                    }).catch((error) => {
                    console.error('Error updating availability document: ', error);
                    });
            })
            .then(() => {
                return store_events_per_user(email,eventId);
            })
            .catch(function (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Something went wrong.' });
            });

    res.redirect(`http://localhost:3001/home.html`);

});

async function check_event_doc(eventId, datesArray) {
    try {
        let docRef = db.collection('events').doc(eventId);

        // Get the current document data
        let doc = await docRef.get();
        let data;

        if (doc.exists) {
            data = doc.data();
        } else {
            data = format_date_json(datesArray);
        }
        return data;
        
    } catch (error) {
        throw error;
    }
}

function storeAvailability(email, date, new_avail, data) {
              
            // Get the current data
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
            
            // console.log(data);
            return data;
        
}

function format_date_json(datesArray) {
    // Create an empty object to hold the formatted JSON
    const formattedJSON = 
    {
        dates: {}
    };

    // Loop through each date in the input array
    for (const date of datesArray) {
        // Create an empty user array for each date
        formattedJSON.dates[date] = { users: [] };
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
            const unique = new Set(data[email]);
            const arr = Array.from(unique)
            data[email] = arr;
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

function format_user_avail(user_avail) {

    // Initialize an array of 24 elements with all values set to false
    const availabilityArray = Array(24).fill(false);

    if (user_avail !== []) {
        // Loop through the availability array and set corresponding hours to true
        user_avail.forEach(time => {
            const hour = parseInt(time.split(':')[0], 10);
            availabilityArray[hour] = true;
            });
    }

    return availabilityArray;
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
        const res = await axios.get(`https://meetngo.onrender.com/available/${eventId}`);
        const event = res.data[0];
        const datesArray = event.Dates.split(',');
        const creator = event.Email;

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
        empty['creator'] = creator;

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
