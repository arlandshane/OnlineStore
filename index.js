require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const Product = require("./models/product");

const app = express();
const port = process.env.PORT || 3000;

mongoose.set("strictQuery", false);
mongoose.set("strictPopulate", false);
const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(`MongoDB Connnected: ${conn.connection.host}`);
	} catch (error) {
		console.log(error);
	}
};

const store = new MongoDBStore({
	uri: process.env.MONGO_URI,
	collection: "sessions",
	expires: 1000 * 60 * 60 * 24 * 7,
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
	session({
		secret: process.env.SECRET_KEY,
		resave: false,
		saveUninitialized: true,
		store: store,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 7,
		},
	})
);

app.get("/", (req, res) => {
	try {
		ejs.renderFile(path.join(__dirname, "index.ejs"), {}, (err, html) => {
			if (err) {
				console.error(`Error rendering template: ${err}`);
				res.status(500).send("Error rendering template");
			} else {
				res.send(html);
			}
		});
	} catch (error) {
		console.log(error);
	}
});

app.get("/addProduct", (req, res) => {
	ejs.renderFile(path.join(__dirname, "addProduct.ejs"), {}, (err, html) => {
		if (err) {
			console.error(`Error rendering template: ${err}`);
			res.status(500).send("Error rendering template");
		} else {
			res.send(html);
		}
	});
});

app.post("/addProduct", async (req, res) => {
	try {
		const addProduct = new Product(req.body);
		await addProduct.save();
		res.status(201).redirect("/shop");
	} catch (error) {
		console.log(error);
		res.status(500).send("Error adding product");
	}
});

app.get("/shop", async (req, res) => {
	try {
		const curated = req.query.curated;
		let products;
		if (curated !== undefined && curated !== null && curated !== "") {
			products = await Product.find({
				category: { $regex: "curated", $options: "i" },
			});
			console.log("no curated");
		} else {
			products = await Product.find();
		}
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

app.get("/shop/:productType", async (req, res) => {
	try {
		const productType = req.params.productType.toLowerCase();
		const products = await Product.find({
			category: {
				$regex: new RegExp(
					`\\b${productType.replace(/s$/, "")}\\b`,
					"i"
				),
			},
		});
		ejs.renderFile(
			path.join(__dirname, "category.ejs"),
			{ products, productType },
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
		console.error(`Error: ${error}`);
		res.status(500).send("Error processing request");
	}
});

app.get("/shop/:productType/:productId", async (req, res) => {
	try {
		const productType = req.params.productType.toLowerCase();
		const productId = req.params.productId;
		const productDetails = await Product.findById(productId);
		ejs.renderFile(
			path.join(__dirname, "productDetails.ejs"),
			{ productType, productDetails },
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

connectDB().then(() => {
	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});
});
