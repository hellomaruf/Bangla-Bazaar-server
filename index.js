const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  // credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
console.log(process.env.PASS);

// const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.0o9qayn.mongodb.net/?appName=Cluster0`;
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.0o9qayn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Collections------------------------------------------->
    const productsCollections = client
      .db("BanglaBazarDB")
      .collection("products");
    const cartCollections = client.db("BanglaBazarDB").collection("cart");

    // find product by category name----------------------------------->
    app.get("/prodects/:name", async (req, res) => {
      const name = req.params.name;
      const query = { categoryName: name };
      const result = await productsCollections.find(query).toArray();
      res.send(result);
    });

    // Get all products------------------------------------------>
    app.get("/allProducts", async (req, res) => {
      const result = await productsCollections.find().toArray();
      res.send(result);
    });

    // find a single product by product name------------------------------------->
    app.get("/productDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollections.findOne(query);
      res.send(result);
    });

    // Search route that filters products by name---------------------------------------->
    app.get("/search/:itemName", async (req, res) => {
      const name = req.params.itemName;
      console.log(name);
      const query = { productName: name };
      const result = await productsCollections.find(query).toArray();
      res.send(result);
      console.log(result);
    });

    // Add products in cart-------------------------------------->
    app.post("/cartData", async (req, res) => {
      const cartInfo = req.body;
      const result = await cartCollections.insertOne(cartInfo);
      res.send(result);
    });

    // Get cart product by email-------------------------------->
    app.get("/cartProduct/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await cartCollections.find(query).toArray();
      res.send(result);
    });

    // increment order------------------------------>
    app.put("/incrementOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const item = await cartCollections.findOne(query);
      const price = item?.addToCartProduct?.price?.latestPrice;
      console.log(price * (item.orderCount + 1));
      const totalLatestPrice = price * (item.orderCount + 1);
      console.log(price, item.orderCount + 1);

      if (item && item.orderCount < item?.addToCartProduct?.quantity) {
        const updateDoc = {
          $inc: {
            orderCount: 1,
          },
          $set: {
            totalLatestPrice,
          },
        };
        const result = await cartCollections.findOneAndUpdate(query, updateDoc);

        res.send(result);
      }
    });

    // Decrement Order------------------------->
    app.put("/decrementOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const item = await cartCollections.findOne(query);
      if (item && item.orderCount > 1) {
        const updateDoc = {
          $inc: {
            orderCount: -1,
          },
        };
        const result = await cartCollections.findOneAndUpdate(query, updateDoc);
        res.send(result);
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("BanglaBazar Shopping website is Running........");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
