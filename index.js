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

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
}).on("error", (err) => {
	console.error(err);
});
