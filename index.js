const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

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

    // ==========================
    // GET ALL CLASSES
    // ==========================

    app.get("/classes", async (req, res) => {

      const result = await classesCollection.find().toArray();

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