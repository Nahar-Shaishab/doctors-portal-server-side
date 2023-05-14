const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7lqf4go.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run(){
    try{
        const appointmentOptionCollection= client.db('doctorsPortal').collection('AppointmentOptions');
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');
        app.get('/appointmentOptions',async(req,res)=>{
            // Use aggregate to query multiple collection and then merge data
            const date = req.query.date;
            console.log(date);
            const query= {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = {appointmentDate: date}
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            options.forEach(option =>{
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slots => !bookedSlots.includes(slots));
                option.slots = remainingSlots;
                
            })
            res.send(options);

        });
        /***
         * API naming Convention
         * bookings
         * app.get('/bookings')
         * app.get('/bookings/:id')
         * app.post('/bookings')
         * app.patch('/bookings/:id')
         * app.delete('/bookings/:id')
         */

        app.get('/bookings', async(req,res)=>{
          const email = req.query.email;
          const query =  {email: email};
          const bookings = await bookingsCollection.find(query).toArray();
          res.send(bookings);
        })

        app.post('/bookings', async(req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length){
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({acknowledged: false, message})
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result); 
        })


    }
    finally{

    }
}
run().catch(console.log)

app.get('/', async(req,res)=>{
    res.send('doctors-portal-server is running')
})

app.listen(port,()=>console.log(`doctors portal running on ${port}`))