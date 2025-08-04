const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require('jsonwebtoken')
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

//middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://survey-project-c091a.web.app",
  ],
  credentails: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hmtao.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const surveyCollection = client.db("surveyBangla").collection("surveys");
    const userCollection = client.db('surveyBangla').collection('users');

    //jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({ token })
    })

    //middleware
    const verifyToken = (req, res, next) => {
      if(!req.headers.authorization){
        return res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify = (token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err) {
           return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next()
      } )
    }

    //get all user from db
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    //Save a user in db
    app.put('/user', async(req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        }
      }
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result)
    })

    //Save a survey data in db
    app.post("/survey", async (req, res) => {
      const surveyData = req.body;
      surveyData.timestamp = new Date();
      const newSurveyData = {
        ...surveyData,
        status: "publish",
        yesCount: 0,
        noCount: 0,
      };
      const result = await surveyCollection.insertOne(newSurveyData);
      res.send(result);
    });

    //Get all survey data from db
    app.get('/surveys', async (req, res) => {
      const result = await surveyCollection.find().toArray();
      res.send(result)
    })

    //Get all survey data for surveyor from db
    app.get('/my-surveylists/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'surveyor.email': email };
      const result = await surveyCollection.find(query).toArray();
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Survey is going on");
});

app.listen(port, () => {
  console.log(`Survey Server is running on port: ${port}`);
});
