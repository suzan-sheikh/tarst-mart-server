const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

require("dotenv").config();
const port =  process.env.PORT || 5000;



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xm07hcd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("trendmart");
    const productsCollections = database.collection("Products");
    app.get("/",(req,res)=>{
      res.send("trendmart")
     })
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
        const result = await productsCollections.find(query)
          .sort(sortCriteria)
          .skip(size * page)
          .limit(size)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send({ message: "Error fetching products" });
      }
    });
    
    
    
    app.get("/products/count", async (req, res) => {
      const search = req.query.search || ''; // Get search term from query
      const query = { name: { $regex: search, $options: "i" } }; // Filter by name
    
      try {
        const count = await productsCollections.countDocuments(query); // Get count of matching products
        res.send({ count });
      } catch (error) {
        console.error("Error fetching product count:", error);
        res.status(500).send({ message: "Error fetching product count" });
      }
    });
    app.get("/products/property", async (req, res) => {
      const search = req.query.search || ''; // Get search term from query
      const query = { name: { $regex: search, $options: "i" } }; // Filter by name
    
      try {
        const result = await productsCollections.find(query).toArray(); 
        res.send({ result });
      } catch (error) {
        console.error("Error fetching product count:", error);
        res.status(500).send({ message: "Error fetching product count" });
      }
    });
    
    
     
     
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
