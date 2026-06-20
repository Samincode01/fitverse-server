const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {

    await client.connect();

    console.log("MongoDB Connected");

    const db = client.db("fitverseDB");

    // Collections

    const classesCollection = db.collection("classes");
const trainerApplicationsCollection =
  db.collection("trainer_applications");
    // ==========================
    // GET ALL CLASSES
    // ==========================

    app.get("/classes", async (req, res) => {

      const result = await classesCollection.find().toArray();

      res.send(result);

    });

    // ==========================
    // GET SINGLE CLASS
    // ==========================

    app.get("/classes/:id", async (req, res) => {

      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await classesCollection.findOne(query);

      res.send(result);

    });

    // ==========================
    // ROOT ROUTE
    // ==========================

    app.get("/", (req, res) => {

      res.send({
        success: true,
        message: "Fitverse Server Running Successfully",
      });

    });

    //Favourites
    const favouritesCollection = db.collection("favourites");
    //Post favourites
    app.post("/favourites", async (req, res) => {

  const { userId, classId } = req.body;

  const existing = await favouritesCollection.findOne({
    userId,
    classId,
  });

  if (existing) {

    return res.send({
      success: false,
      message: "Already added",
    });

  }

  const doc = {

    userId,

    classId,

    createdAt: new Date(),

  };

  const result = await favouritesCollection.insertOne(doc);

  res.send(result);

});


//Get favourites
app.get("/favourites/:userId", async (req, res) => {

  const { userId } = req.params;

  const result = await favouritesCollection
    .find({ userId })
    .toArray();

  res.send(result);

});

  //Apply for trainer
  app.post("/trainer-applications", async (req, res) => {

  const application = req.body;

  application.status = "unapproved";

  application.createdAt = new Date();

  const result = await trainerApplicationsCollection.insertOne(application);

  res.send(result);

});

//check for existing application for trainer
app.get("/trainer-applications/:email", async (req, res) => {

  const email = req.params.email;

  const result = await trainerApplicationsCollection.findOne({
    email: email,
  });

  res.send(result);

});

    // ==========================

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB Ping Successful");

  } catch (error) {

    console.log(error);

  }
}

run().catch(console.dir);

// Start Server

app.listen(PORT, () => {

  console.log(`Server is running on port ${PORT}`);

});