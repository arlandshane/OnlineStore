require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const Product = require("./models/product");
const User = require("./models/user");

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

app.get("/", async (req, res) => {
	try {
		let user;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
		}
		ejs.renderFile(
			path.join(__dirname, "index.ejs"),
			{ user },
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

app.get("/login", async (req, res) => {
	try {
		ejs.renderFile(path.join(__dirname, "login.ejs"), {}, (err, html) => {
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

app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email: email });
		if (user) {
			if (user.password === password) {
				req.session.username = user.username;
				req.session.userId = user._id;
				res.redirect("/");
			} else {
				res.status(401).send("Invalid credentials");
			}
		} else {
			res.status(401).send("User not found");
		}
	} catch (error) {
		console.log(error);
	}
});

app.get("/signUp", async (req, res) => {
	try {
		ejs.renderFile(path.join(__dirname, "signUp.ejs"), {}, (err, html) => {
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

app.post("/signUp", async (req, res) => {
	try {
		const { email, password, firstName, lastName, phone, gender } =
			req.body;
		const trimmedFields = {};
		for (const key in req.body) {
			trimmedFields[key] = req.body[key].trim();
		}
		const newUser = new User(trimmedFields);
		await newUser.save();
		res.status(201).redirect("/login");
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
		let user;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
		}
		const curated = req.query.curated;
		let products, curatedCheck;
		if (curated !== undefined && curated !== null && curated !== "") {
			products = await Product.find({ curated: true });
			curatedCheck = true;
		} else {
			products = await Product.find();
			curatedCheck = false;
		}
		ejs.renderFile(
			path.join(__dirname, "shop.ejs"),
			{ products, curatedCheck, user },
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
		let user;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
		}
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
			{ products, productType, user },
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
		let user;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
		}
		const productType = req.params.productType.toLowerCase();
		const productId = req.params.productId;
		const productDetails = await Product.findById(productId);
		ejs.renderFile(
			path.join(__dirname, "productDetails.ejs"),
			{ productType, productDetails, user },
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
