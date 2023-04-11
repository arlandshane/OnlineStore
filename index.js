require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("./models/product");

const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set("strictQuery", false);
mongoose.set("strictPopulate", false);

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Failed to connect to MongoDB: ${error}`);
		process.exit(1);
	}
};
connectDB();

app.get("/", (req, res) => {
	try {
		ejs.renderFile(
			path.join(__dirname, "index.ejs"),
			{ products },
			(err, html) => {
				if (err) {
					console.error(`Error rendering template: ${err}`);
					res.status(500).send("Error rendering template");
				} else {
					res.send(html);
				}
			}
		);
	} catch (error) {
		console.error(`Failed to fetch products: ${error}`);
		res.status(500).send("Error fetching products");
	}
});

app.get("/shop", async (req, res) => {
	try {
		const products = await Product.find();
		ejs.renderFile(
			path.join(__dirname, "shop.ejs"),
			{ products },
			(err, html) => {
				if (err) {
					console.error(`Error rendering template: ${err}`);
					res.status(500).send("Error rendering template");
				} else {
					res.send(html);
				}
			}
		);
	} catch (error) {
		console.log(error);
	}
});

app.get("/about", (req, res) => {
	ejs.renderFile(path.join(__dirname, "about.ejs"), {}, (err, html) => {
		if (err) {
			console.error(`Error rendering template: ${err}`);
			res.status(500).send("Error rendering template");
		} else {
			res.send(html);
		}
	});
});

app.get("/contact", (req, res) => {
	ejs.renderFile(path.join(__dirname, "contact.ejs"), {}, (err, html) => {
		if (err) {
			console.error(`Error rendering template: ${err}`);
			res.status(500).send("Error rendering template");
		} else {
			res.send(html);
		}
	});
});

app.post("/products", async (req, res) => {
	try {
		const { name, image, price, description } = req.body;
		const addProduct = new Product({ name, image, price, description });
		await addProduct.save();
		res.send("Product added successfully");
	} catch (error) {
		console.log(error);
		res.status(500).send("Error adding product");
	}
});

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
}).on("error", (err) => {
	console.error(err);
});
