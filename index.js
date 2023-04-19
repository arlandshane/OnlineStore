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
		let cart = 0;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
			if (user) {
				cart = user.cart.length;
			}
		}
		ejs.renderFile(
			path.join(__dirname, "index.ejs"),
			{ user, cart },
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
		const { email, username, password } = req.body;
		console.log(req.body);
		const user = await User.findOne({
			$or: [{ email: email }, { username: username }],
		});
		console.log(user);
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
		const newUser = new User({
			email,
			password,
			firstName,
			lastName,
			phone,
			gender,
		});
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
		let cart = 0;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
			if (user) {
				cart = user.cart.length;
			}
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
			{ products, curatedCheck, user, cart },
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

app.get("/search", async (req, res) => {
	const q = req.query.q;
	try {
		let products = [];
		if (q) {
			products = await Product.find({
				description: {
					$regex: new RegExp(`\\b${q.replace(/s$/, "")}\\b`, "i"),
				},
			});
		}
		ejs.renderFile(
			path.join(__dirname, "search.ejs"),
			{ products, q },
			(err, html) => {
				if (err) {
					console.error(`Error rendering template: ${err}`);
					res.status(500).send("Error rendering template");
				} else {
					res.send(html);
				}
			}
		);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
});

app.get("/shop/:productType", async (req, res) => {
	try {
		let user;
		let cart = 0;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
			if (user) {
				cart = user.cart.length;
			}
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
			{ products, productType, user, cart },
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
		let cart = 0;
		if (req.session.username) {
			user = await User.findById(req.session.userId);
			if (user) {
				cart = user.cart.length;
			}
		}
		const productType = req.params.productType.toLowerCase();
		const productId = req.params.productId;
		const productDetails = await Product.findById(productId);
		ejs.renderFile(
			path.join(__dirname, "productDetails.ejs"),
			{ productType, productDetails, user, cart },
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

app.get("/wishlist", async (req, res) => {
	try {
		const user = await User.findById(req.session.userId).populate({
			path: "wishlist",
			select: "name price image description curated",
		});
		if (!user) {
			return res.status(401).send("User not found");
		} else {
			const wishlist = user.wishlist;
			ejs.renderFile(
				path.join(__dirname, "wishlist.ejs"),
				{ wishlist, user },
				(err, html) => {
					if (err) {
						console.error(`Error rendering template: ${err}`);
						res.status(500).send("Error rendering template");
					} else {
						res.send(html);
					}
				}
			);
		}
	} catch (error) {
		console.log(error);
		res.status(500).send("Error fetching wishlist");
	}
});

app.get("/cart", async (req, res) => {
	try {
		const user = await User.findById(req.session.userId).populate({
			path: "cart.product",
			select: "name price image description curated",
		});
		if (!user) {
			return res.status(401).send("User not found");
		} else {
			const cart = user.cart;
			ejs.renderFile(
				path.join(__dirname, "cart.ejs"),
				{ cart, user },
				(err, html) => {
					if (err) {
						console.error(`Error rendering template: ${err}`);
						res.status(500).send("Error rendering template");
					} else {
						res.send(html);
					}
				}
			);
		}
	} catch (error) {
		console.log(error);
		res.status(500).send("Error fetching wishlist");
	}
});

app.post("/wishlist/add/:productId", async (req, res) => {
	try {
		const productId = req.params.productId;
		const user = await User.findById(req.session.userId);
		if (!user) {
			return res.status(401).send("User not found");
		}
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).send("Product not found");
		}
		const existingWishlistItem = user.wishlist.find(
			(item) => item.toString() === productId
		);
		if (existingWishlistItem) {
			return res.status(400).send("Product already in wishlist");
		}

		user.wishlist.push(productId);
		await user.save();
		res.status(201).redirect(`/shop/wishlist/${productId}`);
	} catch (error) {
		console.log(error);
		res.status(500).send("Error adding product to wishlist");
	}
});

app.post("/wishlist/remove/:productId", async (req, res) => {
	try {
		const productId = req.params.productId;
		const user = await User.findById(req.session.userId);

		if (!user) {
			return res.status(401).send("User not found");
		}

		const wishlistItemIndex = user.wishlist.findIndex(
			(item) => item.toString() === productId
		);

		if (wishlistItemIndex === -1) {
			return res.status(404).send("Product not found in wishlist");
		}

		user.wishlist.splice(wishlistItemIndex, 1);
		await user.save();
		res.status(200).redirect(`/shop/view/${productId}`);
	} catch (error) {
		console.log(error);
		res.status(500).send("Error removing product from wishlist");
	}
});

app.post("/cart/add/:productId", async (req, res) => {
	try {
		const productId = req.params.productId;
		const user = await User.findById(req.session.userId);
		if (!user) {
			return res.status(401).send("User not found");
		}
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).send("Product not found");
		}
		const existingCartItem = user.cart.find(
			(item) => item.product.toString() === productId
		);
		if (!existingCartItem) {
			user.cart.push({ product: productId });
		}
		await user.save();
		res.status(201).redirect(`/shop/cart/${productId}`);
	} catch (error) {
		console.log(error);
		res.status(500).send("Error adding product to cart");
	}
});

app.post("/cart/remove/:productId", async (req, res) => {
	try {
		const productId = req.params.productId;
		const user = await User.findById(req.session.userId);
		if (!user) {
			return res.status(401).send("User not found");
		}
		const cartItemIndex = user.cart.findIndex(
			(item) => item.product.toString() === productId
		);
		if (cartItemIndex === -1) {
			return res.status(404).send("Product not found in cart");
		}
		user.cart.splice(cartItemIndex, 1);
		await user.save();
		res.status(200).redirect(`/shop/view/${productId}`);
	} catch (error) {
		console.log(error);
		res.status(500).send("Error removing product from cart");
	}
});

app.get("/userProfile", async (req, res) => {
	try {
		const user = await User.findById(req.session.userId);
		ejs.renderFile(
			path.join(__dirname, "userProfile.ejs"),
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

app.get("/logout", async (req, res) => {
	try {
		req.session.destroy((err) => {
			if (err) {
				console.error(`Error destroying session: ${err}`);
				res.status(500).send("Error logging out");
			} else {
				res.redirect("/login");
			}
		});
	} catch (error) {
		console.log(error);
	}
});

connectDB().then(() => {
	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});
});
