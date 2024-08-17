const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require("cors");
const app = express();


const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://trust-mart.web.app",
    "https://trust-mart.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());

require("dotenv").config();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ykkxidd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("trust-mart");
    const productsCollections = database.collection("emart");

    app.get("/", (req, res) => {
      res.send("trust-mart");
    });

    app.get("/products", async (req, res) => {
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page);
      const search = req.query.search || '';
      const sortBy = req.query.sortBy || 'price';
      const sortOrder = req.query.sortOrder || 'asc';
      const brand = req.query.brand || '';
      const category = req.query.category || '';
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

      const query = {
        ...(search && { name: { $regex: search, $options: "i" } }),
        ...(brand && { brand: brand }),
        ...(category && { category: category }),
        price: { $gte: minPrice, $lte: maxPrice }
      };

      let sortCriteria = {};
      if (sortBy === 'price') {
        sortCriteria = { price: sortOrder === 'asc' ? 1 : -1 };
      } else if (sortBy === 'date') {
        sortCriteria = { created_at: sortOrder === 'asc' ? 1 : -1 };
      }

      try {
        const count = await productsCollections.countDocuments(query);
        const result = await productsCollections.find(query)
          .sort(sortCriteria)
          .skip(size * page)
          .limit(size)
          .toArray();
        res.send({
          products: result,
          totalPages: Math.ceil(count / size)
        });
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send({ message: "Error fetching products" });
      }
    });

    app.get("/products/count", async (req, res) => {
      const search = req.query.search || '';
      const brand = req.query.brand || '';
      const category = req.query.category || '';
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

      const query = {
        ...(search && { name: { $regex: search, $options: "i" } }),
        ...(brand && { brand: brand }),
        ...(category && { category: category }),
        price: { $gte: minPrice, $lte: maxPrice }
      };

      try {
        const count = await productsCollections.countDocuments(query);
        res.send({ count });
      } catch (error) {
        console.error("Error fetching product count:", error);
        res.status(500).send({ message: "Error fetching product count" });
      }
    });

    app.get("/products/property", async (req, res) => {
      const search = req.query.search || '';
      const query = { name: { $regex: search, $options: "i" } };

      try {
        const result = await productsCollections.find(query).toArray();
        res.send({ result });
      } catch (error) {
        console.error("Error fetching product properties:", error);
        res.status(500).send({ message: "Error fetching product properties" });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
