const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const { default: axios } = require("axios");
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(express.urlencoded());
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  // credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.0o9qayn.mongodb.net/?appName=Cluster0`;
// const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.0o9qayn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"`;
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.0o9qayn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const paymentCollections = client
      .db("BanglaBazarDB")
      .collection("payments");
    const usersCollections = client.db("BanglaBazarDB").collection("users");

    // Added users by post req------------------------------>
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const result = await usersCollections.insertOne(userInfo);
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        email,
      };
      const result = await usersCollections.findOne(query);
      res.send(result);
    });

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
      const totalLatestPrice = price * (item.orderCount + 1);
      console.log(totalLatestPrice);
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
      const price = item?.addToCartProduct?.price?.latestPrice;
      const totalLatestPrice = price / (item.orderCount - 1);
      if (item && item.orderCount > 1) {
        const updateDoc = {
          $inc: {
            orderCount: -1,
          },
          $set: {
            totalLatestPrice,
          },
        };
        const result = await cartCollections.findOneAndUpdate(query, updateDoc);
        res.send(result);
      }
    });

    app.post("/create-payment", async (req, res) => {
      const paymentInfo = req.body;
      console.log("paymentinfo------------------------->", paymentInfo);
      const tranID = new ObjectId().toString();
      const initiateData = {
        store_id: "bangl66c99f326f374",
        store_passwd: "bangl66c99f326f374@ssl",
        total_amount: paymentInfo?.ammount,
        currency: "EUR",
        tran_id: tranID,
        success_url: "http://localhost:3000/success-payment",
        fail_url: "http://localhost:3000/fail-payment",
        cancel_url: "http://localhost:3000/cancle-payment",
        cus_name: paymentInfo?.name,
        cus_email: paymentInfo?.email,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: paymentInfo?.phoneNumber,
        cus_fax: "01711111111",
        product_category: "Groceries",
        product_name: paymentInfo?.productName,
        product_profile: "general",
        shipping_method: "NO",
        ship_name: "Customer Name",
        // ship_add1: "Dhaka",
        // ship_add2: "Dhaka",
        // ship_city: "Dhaka",
        // ship_state: "Dhaka",
        // ship_postcode: "1000",
        // ship_country: "Bangladesh",
        multi_card_name: "mastercard,visacard,amexcard",
        value_a: "ref001_A",
        value_b: "ref002_B",
        value_c: "ref003_C",
        value_d: "ref004_D",
      };
      const response = await axios({
        method: "POST",
        url: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
        data: initiateData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log(response);
      const paymentData = {
        authorName: paymentInfo?.name,
        phoneNumber: paymentInfo?.phoneNumber,
        email: paymentInfo?.email,
        ammount: paymentInfo?.ammount,
        status: "pending",
        paymentID: tranID,
        productName: paymentInfo?.productName,
        productImg: paymentInfo?.productImg
      };
      const paymentResponse = await paymentCollections.insertOne(paymentData);

      // added trans id in cartCollection
      const filter = {
        userEmail: paymentInfo?.email,
      };
      const updateDoc = {
        $set: {
          tran_id: tranID,
        },
      };
      await cartCollections.updateMany(filter, updateDoc);

      if (paymentResponse) {
        res.send({
          paymentUrl: response.data.GatewayPageURL,
        });
      }
    });

    app.post("/success-payment", async (req, res) => {
      const successData = req.body;
      console.log("Success data--------------------->", successData);
      if (successData?.status == !"VALID") {
        throw new Error("Unauthorized Payment");
      }

      // update the database status
      const query = { paymentID: successData?.tran_id };
      const updateDoc = {
        $set: {
          status: "success",
          paymentMethod: successData?.card_type,
          tranDate: successData?.tran_date,
        },
      };
      const result = await paymentCollections.updateOne(query, updateDoc);
      if (result) {
        res.redirect("http://localhost:5173/success-payment");
        const tranID = successData?.tran_id;
        const query = {
          tran_id: tranID,
        };
        await cartCollections.deleteMany(query);
      }
    });

    // Fail payment------------------------>
    app.post("/fail-payment", async (req, res) => {
      res.redirect("http://localhost:5173/fail-payment");
    });

    // Cancle payment------------------------>
    app.post("/cancle-payment", async (req, res) => {
      res.redirect("http://localhost:5173/cancle-payment");
    });

    // update user profile -------------------------->
    app.patch("/update-profile", async (req, res) => {
      const { email, name, photo, phoneNum, dateOfBirth, gender } = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          name: name,
          phoneNum: phoneNum,
          dateOfBirth: dateOfBirth,
          gender: gender,
          photo: photo,
        },
      };
      const result = await usersCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Get orders------------------------------->
    app.get('/orders/:email', async (req, res) => {
      const email = req.params.email
      const query1 = {email : email}
      const query2 = {status : 'success'}
      const multiQuery = {
        $and:[query1, query2]
      }
      const result = await paymentCollections.find(multiQuery).toArray()
      res.send(result)
      
      
    })

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
