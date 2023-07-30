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
    let new_avail = [false,true,false,true,false,true,false,true,false,true,false,true,false,true,false];

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
    // const jsonString = JSON.stringify(formattedJSON, null);
    // return jsonString;
}


router.get('/api/availability/:eventId', async (req, res) => {
    const { eventId } = req.params;

    // go into specific date
    // for each user, go into availability
    // Example of retrieving data from a Firestore document
    db.collection('events').doc(eventId).get().then((doc) => {
        if (doc.exists) {
        const data = doc.data(); // This will contain the actual data without internal fields
        const lst1 = [];
        const lst2 = [];

        
        res.json(data);
        // for (const date in data.dates) {
        //     if (data.dates.hasOwnProperty(date)) {
        //       const usersArray = data.dates[date].users;
        //       console.log(`Users on ${date}:`, usersArray);
        //     }
        //   }

        } else {
        console.log('Document not found!');
        }
    }).catch((error) => {
        console.log('Error getting document:', error);
    });
});
// Add other routes for retrieving, updating, or deleting availability as needed

module.exports = router;
