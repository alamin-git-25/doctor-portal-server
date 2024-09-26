const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@doctordb.qbrm6m0.mongodb.net/?retryWrites=true&w=majority&appName=DoctorDB`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})
const varifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
    req.decoded = decoded;
    next();
  });
}
const run = async () => {
  try {
    await client.connect();
    const Database = client.db('Doctors_portal').collection('Service');
    const bookingData = client.db('Doctors_portal').collection('Booking');
    const userData = client.db('Doctors_portal').collection('user');

    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = Database.find(query);
      const data = await cursor.toArray();
      res.send(data);
    })

app.get('/user', async(req, res)=>{
  const user = await userData.find().toArray();
  res.send(user);
})

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user
      };
      const result = await userData.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    })

    app.get('/booking', varifyJWT, async (req, res) => {
      const paititan = req.query.paititan;
      const authorization = req.headers.authorization;
      const decodedEmail = req.decoded.email;
      if (paititan === decodedEmail) {
        const query = { paititan: paititan };
        const cursor = bookingData.find(query);
        const booking = await cursor.toArray();
        return res.send(booking);
      }
      else{
        return res.status(403).send({message:' Forbodden Access'});
      }

    })

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, paititan: booking.paititan }
      const exsist = await bookingData.findOne(query);
      if (exsist) {
        return res.send({ success: false, booking: exsist })
      }
      const result = await bookingData.insertOne(booking);
      res.send({ success: true, result });
    })


  }
  finally {

  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('HELLO DOCTOR');
})












app.listen(port, () => {
  console.log('$$', port);
})