app.post('/create-event',(req, res) => {
    // Here, you can access the form data through the 'req.body' object
    const eventData = req.body;
  
    // Generate a unique identifier for the event
    const eventId = uuidv4();
    const eventURL = `http://localhost:3001/event/${eventId}`;
  
    // Access individual form fields using the 'name' attribute as the key
    const eventName = eventData.event_name;
    const date_str = eventData.datePick;
  
    console.log(eventData);
    console.log(date_str);
  
    const date_lst = date_func.process_date(date_str);
    const userData = req.cookies.userData ? JSON.parse(req.cookies.userData) : null;
    let email = userData.profile.email;
  
    let sql=`SELECT userId FROM user WHERE email = "${email}";`

    //check for userId
    db.query(sql, [email], (err, result) => {
    if (err) {
        console.error('Cannot retrieve UserId:', err);
    }

    // Access the count value from the result object
    const userId = result[0].userId;
    console.log(userId);

    // create event if userId exist
    if (userId) {
        let sql_insert=`INSERT into EVENT (EventLink, CreatorID, EventName) VALUES ("${eventURL}",${userId},"${eventName}")`;

        db.query(sql_insert, [email], (err, result) => {
        if (err) {
            console.error('Error creating event:', err);
            return res.status(500).send('Error creating event');
        }

        else {
            date_lst.forEach(date => {
                sql = `INSERT into eventDate VALUES ("${eventURL}","${date}")`;
                db.query(sql, [email], (err, result) => {
                    if (err) {
                        console.error('Error inserting date:', err);
                        return res.status(500).send('Error inserting date');
                    }
                
                    // // Redirect the user to the unique URL for the created event
                    // res.redirect(`http://localhost:3001/event/${eventId}`);
                    // Respond to the client (optional)
                    res.send('Event created successfully!');
                })
            })
        }
        })
    }
    }) 
  });