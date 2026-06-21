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
  const usersCollection = db.collection("user");
  const bookingsCollection = db.collection("bookings");
  const forumsCollection = db.collection("forums");
    // ==========================
    // GET ALL CLASSES
    // ==========================

app.get("/classes", async (req, res) => {

  const page = parseInt(req.query.page) || 1;

  const limit = parseInt(req.query.limit) || 6;

  const skip = (page - 1) * limit;

  const search = req.query.search || "";

  const category = req.query.category || "";

  let query = {
    status: "approved",
  };

  if (search) {

    query.title = {

      $regex: search,

      $options: "i",

    };

  }

  if (category && category !== "All") {

    query.category = {

      $in: [category],

    };

  }

  const total = await classesCollection.countDocuments(query);

  const classes = await classesCollection

    .find(query)

    .skip(skip)

    .limit(limit)

    .toArray();

  res.send({

    classes,

    total,

    currentPage: page,

    totalPages: Math.ceil(total / limit),

  });

});

    // ==========================
    // GET SINGLE CLASS
    // ==========================
app.get("/classes/pending", async (req,res)=>{

  const result = await classesCollection
    .find({
      status:"pending"
    })
    .toArray();

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
//booking
app.post("/bookings", async (req, res) => {

  const booking = req.body;

  const exists = await bookingsCollection.findOne({

    userEmail: booking.userEmail,

    classId: booking.classId,

  });

  if (exists) {

    return res.send({

      message: "Already booked",

    });

  }

  const result = await bookingsCollection.insertOne(booking);

  res.send(result);

});
app.get("/bookings-count", async (req, res) => {

  const total = await bookingsCollection.countDocuments();

  res.send({

    total,

  });

});
app.get("/bookings/:email", async (req, res) => {

  const email = req.params.email;

  const result = await bookingsCollection

    .find({

      userEmail: email,

    })

    .sort({

      createdAt: -1,

    })

    .toArray();

  res.send(result);

});

//transactions
app.get("/transactions", async (req, res) => {

  const result = await bookingsCollection

    .find()

    .sort({

      createdAt: -1,

    })

    .toArray();

  res.send(result);

});

//trainer students
app.get("/trainer-classes/:email", async (req, res) => {

  const email = req.params.email;

  const classes = await classesCollection

    .find({

      trainerEmail: email,

    })

    .toArray();

  const updatedClasses = await Promise.all(

    classes.map(async (item) => {

      const totalStudents =

        await bookingsCollection.countDocuments({

          classId: item._id.toString(),

        });

      return {

        ...item,

        students: totalStudents,

      };

    })

  );

  res.send(updatedClasses);

});

//class students
app.get("/class-students/:id", async (req, res) => {

  const classId = req.params.id;

  const result = await bookingsCollection

    .find({

      classId: classId,

    })

    .project({

      userName: 1,

      userEmail: 1,

      userImage: 1,

    })

    .toArray();

  res.send(result);

});
//Forum section
//Forums
app.get("/forums", async (req, res) => {

  const page = parseInt(req.query.page) || 1;

  const limit = parseInt(req.query.limit) || 6;

  const skip = (page - 1) * limit;

  const total = await forumsCollection.countDocuments({

    status: "approved",

  });

  const forums = await forumsCollection

    .find({

      status: "approved",

    })

    .sort({

      createdAt: -1,

    })

    .skip(skip)

    .limit(limit)

    .toArray();

  res.send({

    forums,

    total,

    currentPage: page,

    totalPages: Math.ceil(total / limit),

  });

});
app.get("/my-forums/:email", async (req, res) => {

  const email = req.params.email;

  const result = await forumsCollection

    .find({

      authorEmail: email,

    })

    .sort({

      createdAt: -1,

    })

    .toArray();

  res.send(result);

});
//pending forum
app.get("/forums/all", async (req, res) => {

  const result = await forumsCollection

    .find()

    .sort({ createdAt: -1 })

    .toArray();

  res.send(result);

});
//approve forum
app.get("/forums/pending", async (req, res) => {

  const result = await forumsCollection

    .find({

      status: "pending",

    })

    .toArray();

  res.send(result);

});

//Get single forum
app.get("/forums/:id", async (req, res) => {

  const id = req.params.id;

  const result = await forumsCollection.findOne({

    _id: new ObjectId(id),

  });

  res.send(result);

});

//Post forum
app.post("/forums", async (req, res) => {

  try {

    const forum = req.body;

    const forumData = {

      title: forum.title,

      image: forum.image,

      description: forum.description,

      author: forum.author,

      authorEmail: forum.authorEmail,

      authorImage: forum.authorImage,

      role: forum.role,

      status: "pending",

      likes: 0,

      dislikes: 0,

      comments: [],

      createdAt: new Date(),

    };

    const result = await forumsCollection.insertOne(forumData);

    res.send(result);

  } catch (error) {

    console.log(error);

    res.status(500).send({

      message: "Failed to create forum",

    });

  }

});

//Add comment
app.patch("/forums/comment/:id", async (req, res) => {

  const id = req.params.id;

  const comment = req.body;

  const user = await usersCollection.findOne({

    email: comment.email,

  });

  if (user?.status === "blocked") {

    return res.status(403).send({

      message: "Action restricted by Admin",

    });

  }

  const result = await forumsCollection.updateOne(

    {

      _id: new ObjectId(id),

    },

    {

      $push: {

        comments: comment,

      },

    }

  );

  res.send(result);

});
app.patch("/forums/comment/edit/:id", async (req, res) => {

  const id = req.params.id;

  const { index, text } = req.body;

  const forum = await forumsCollection.findOne({

    _id: new ObjectId(id),

  });

  forum.comments[index].text = text;

  const result = await forumsCollection.updateOne(

    {

      _id: new ObjectId(id),

    },

    {

      $set: {

        comments: forum.comments,

      },

    }

  );

  res.send(result);

});
//delete comment
app.patch("/forums/comment/delete/:id", async (req, res) => {

  const id = req.params.id;

  const { index } = req.body;

  const forum = await forumsCollection.findOne({

    _id: new ObjectId(id),

  });

  forum.comments.splice(index, 1);

  const result = await forumsCollection.updateOne(

    {

      _id: new ObjectId(id),

    },

    {

      $set: {

        comments: forum.comments,

      },

    }

  );

  res.send(result);

});

//add reply
app.patch("/forums/reply/:id", async (req, res) => {

  const id = req.params.id;

  const { commentIndex, reply } = req.body;

  const forum = await forumsCollection.findOne({

    _id: new ObjectId(id),

  });

  if (!forum.comments[commentIndex].replies) {

    forum.comments[commentIndex].replies = [];

  }

  forum.comments[commentIndex].replies.push(reply);

  const result = await forumsCollection.updateOne(

    {

      _id: new ObjectId(id),

    },

    {

      $set: {

        comments: forum.comments,

      },

    }

  );

  res.send(result);

});

//like forum
app.patch("/forums/like/:id", async (req,res)=>{

  const id = req.params.id;

  const { email } = req.body;

  const forum = await forumsCollection.findOne({
    _id: new ObjectId(id)
  });

  const alreadyLiked =
    forum.likedUsers?.includes(email);

  if(alreadyLiked){

    await forumsCollection.updateOne(

      {
        _id:new ObjectId(id)
      },

      {

        $inc:{
          likes:-1
        },

        $pull:{
          likedUsers:email
        }

      }

    );

    return res.send({

      liked:false

    });

  }

  await forumsCollection.updateOne(

    {
      _id:new ObjectId(id)
    },

    {

      $inc:{
        likes:1
      },

      $addToSet:{
        likedUsers:email
      }

    }

  );

  res.send({

    liked:true

  });

});

//dislike forum
app.patch("/forums/dislike/:id", async (req, res) => {

  const id = req.params.id;

  const { email } = req.body;

  const forum = await forumsCollection.findOne({

    _id: new ObjectId(id),

  });

  const alreadyDisliked =

    forum.dislikedUsers?.includes(email);

  // Undo dislike

  if (alreadyDisliked) {

    await forumsCollection.updateOne(

      {

        _id: new ObjectId(id),

      },

      {

        $inc: {

          dislikes: -1,

        },

        $pull: {

          dislikedUsers: email,

        },

      }

    );

    return res.send({

      disliked: false,

    });

  }

  // Add dislike

  await forumsCollection.updateOne(

    {

      _id: new ObjectId(id),

    },

    {

      $inc: {

        dislikes: 1,

      },

      $addToSet: {

        dislikedUsers: email,

      },

    }

  );

  res.send({

    disliked: true,

  });

});

//reject forum
app.patch("/forums/reject/:id", async (req, res) => {

  const id = req.params.id;

  const result = await forumsCollection.updateOne(

    {

      _id: new ObjectId(id),

    },

    {

      $set: {

        status: "rejected",

      },

    }

  );

  res.send(result);

});

//delete forum
app.delete("/forums/:id", async (req, res) => {

  const id = req.params.id;

  const result = await forumsCollection.deleteOne({

    _id: new ObjectId(id),

  });

  res.send(result);

});
//approval
app.patch("/forums/approve/:id", async (req, res) => {

  const id = req.params.id;

  const result = await forumsCollection.updateOne(

    {
      _id: new ObjectId(id),
    },

    {
      $set: {
        status: "approved",
      },
    }

  );

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
 //======user panel=====
  //Apply for trainer
app.post("/trainer-applications", async (req, res) => {

  const application = req.body;

  const user = await usersCollection.findOne({

    email: application.email,

  });

  if (user?.status === "blocked") {

    return res.status(403).send({

      message: "Action restricted by Admin",

    });

  }

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
// total trainer applications
app.get("/trainer-applications", async (req, res) => {

  const result = await trainerApplicationsCollection
    .find()
    .toArray();

  res.send(result);

});
//====admin panel====
//Total users
app.get("/users", async (req, res) => {
  const users = await usersCollection.find().toArray();
  res.send(users);
});

//approve trainer
app.patch("/trainer-applications/approve/:id", async (req, res) => {

  const id = req.params.id;

  const application =
    await trainerApplicationsCollection.findOne({
      _id: new ObjectId(id),
    });

  if (!application) {

    return res.status(404).send({
      message: "Application not found",
    });

  }

  // Update application status

  await trainerApplicationsCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        status: "approved",
        feedback: "",
      },
    }
  );

  // Update user role

  const userResult =
    await usersCollection.updateOne(
      {
        email: application.email,
      },
      {
        $set: {
          role: "trainer",
        },
      }
    );

  res.send({

    success: true,

    userModified: userResult.modifiedCount,

  });

});

//reject trainer
app.patch("/trainer-applications/reject/:id", async (req, res) => {

  const id = req.params.id;

  const { feedback } = req.body;

  const filter = {

    _id: new ObjectId(id),

  };

  const updateDoc = {

    $set: {

      status: "rejected",

      feedback: feedback,

    },

  };

  const result =
    await trainerApplicationsCollection.updateOne(
      filter,
      updateDoc
    );

  res.send(result);

});

//manage trainer
app.get("/trainers", async (req, res) => {

  const result = await usersCollection

    .find({

      role: "trainer"

    })

    .toArray();

  res.send(result);

});

//demote trainer
app.patch("/trainers/:id", async (req, res) => {

  const id = req.params.id;

  const result = await usersCollection.updateOne(

    {
      _id: new ObjectId(id),
    },

    {
      $set: {
        role: "user",
      },
    }

  );

  res.send(result);

});

//block user
app.patch("/users/block/:id", async (req, res) => {

  const id = req.params.id;

  const result = await usersCollection.updateOne(

    {
      _id: new ObjectId(id)
    },

    {
      $set: {
        status: "blocked"
      }
    }

  );

  res.send(result);

});

//unblock user
app.patch("/users/unblock/:id", async (req, res) => {

  const id = req.params.id;

  const result = await usersCollection.updateOne(

    {
      _id: new ObjectId(id)
    },

    {
      $unset: {
        status: ""
      }
    }

  );

  res.send(result);

});

//make admin
app.patch("/users/make-admin/:id", async (req, res) => {

  const id = req.params.id;

  const result = await usersCollection.updateOne(

    {

      _id: new ObjectId(id),

    },

    {

      $set: {

        role: "admin",

      },

    }

  );

  res.send(result);

});

//demote to user from admin
app.patch("/users/demote-admin/:id", async (req, res) => {

  const id = req.params.id;

  const result = await usersCollection.updateOne(

    {
      _id: new ObjectId(id),
    },

    {
      $set: {
        role: "user",
      },
    }

  );

  res.send(result);

});
// all classes
app.get("/classes/all", async (req, res) => {

  const result = await classesCollection

    .find()

    .sort({ createdAt: -1 })

    .toArray();

  res.send(result);

});
//pending class
app.get("/classes/pending", async (req, res) => {

  const result = await classesCollection

    .find({
      status: "pending"
    })

    .toArray();

  res.send(result);

});
    app.get("/classes/:id", async (req, res) => {

      const id = req.params.id;

      const query = {
        _id: new ObjectId(id),
      };

      const result = await classesCollection.findOne(query);

      res.send(result);

    });
//approve class
app.patch("/classes/approve/:id", async (req, res) => {

  const id = req.params.id;

  const result = await classesCollection.updateOne(

    {
      _id: new ObjectId(id),
    },

    {
      $set: {
        status: "approved",
      },
    }

  );

  res.send(result);

});

//reject class
app.patch("/classes/reject/:id", async (req, res) => {

  const id = req.params.id;

  const result = await classesCollection.updateOne(

    {
      _id: new ObjectId(id),
    },

    {
      $set: {
        status: "rejected",
      },
    }

  );

  res.send(result);

});
//====Trainer===
// Trainer Dashboard Stats

app.get("/trainer-stats/:email", async (req, res) => {

  const email = req.params.email;

  const totalClasses = await classesCollection.countDocuments({
    trainerEmail: email,
  });

  const trainerClasses = await classesCollection
    .find({
      trainerEmail: email,
    })
    .toArray();

  const classIds = trainerClasses.map(item => item._id.toString());

  const totalStudents = await bookingsCollection.countDocuments({
    classId: {
      $in: classIds,
    },
  });

  res.send({

    totalClasses,

    totalStudents,

  });

});

//Post a class
app.post("/classes", async (req, res) => {

  try {

    const classData = req.body;

    classData.status = "pending";

    classData.students = 0;

    classData.createdAt = new Date();

    const result = await classesCollection.insertOne(classData);

    res.send(result);

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message: "Failed to add class",
    });

  }

});

//get my classes
app.get("/trainer-classes/:email", async (req, res) => {

  const email = req.params.email;

  const result = await classesCollection

    .find({
      trainerEmail: email,
    })

    .toArray();

  res.send(result);

});

//update class
app.patch("/classes/:id", async (req, res) => {

  const id = req.params.id;

  const updated = req.body;

  const result = await classesCollection.updateOne(

    {
      _id: new ObjectId(id),
    },

    {
      $set: {

        title: updated.title,

        image: updated.image,

        category: updated.category,

        level: updated.level,

        duration: updated.duration,

        schedule: updated.schedule,

        price: Number(updated.price),

        description: updated.description,

      },

    }

  );

  res.send(result);

});
//delete class
app.delete("/classes/:id", async (req, res) => {

  const id = req.params.id;

  const result = await classesCollection.deleteOne({

    _id: new ObjectId(id),

  });

  res.send(result);

});

//class students
app.get("/class-students/:id", async (req, res) => {

  const id = req.params.id;

  const result = await bookingsCollection

    .find({
      classId: id,
    })

    .toArray();

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