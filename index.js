const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

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

    const classesCollection = db.collection("classes");


    // GET ALL CLASSES

    app.get("/classes", async (req, res) => {

      const result = await classesCollection.find().toArray();

      res.send(result);

    });


    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

  } catch (error) {

    console.log(error);

  }
}

run().catch(console.dir);


app.get("/", (req, res) => {

  res.send("Server is running");

});


app.listen(PORT, () => {

  console.log(`Server is running on port ${PORT}`);

});