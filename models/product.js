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
	image: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	originalPrice: {
		type: Number,
		required: true,
	},
	category: {
		type: String,
		required: true,
	},
	primaryColor: String,
	secondaryColor: String,
	date: {
		type: Date,
		default: Date.now,
	},
	// quantity: Number,
	// brand: String,
	// size: String,
	// material: String,
	// rating: Number,
	curated: {
		type: Boolean,
		default: false,
	},
	reviews: [
		{
			title: String,
			body: String,
			rating: Number,
		},
	],
	tags: [String],
	shippingInfo: {
		weight: Number,
		dimensions: {
			length: Number,
			width: Number,
			height: Number,
		},
	},
});

module.exports = mongoose.model("Product", productSchema);
