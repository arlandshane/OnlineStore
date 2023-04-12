const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	adderName: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	originalPrice: Number,
	image: String,
	description: String,
	category: String,
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Product", productSchema);
