const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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
