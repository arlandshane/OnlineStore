const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
	},
	profilePicUrl: String,
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	phone: {
		type: Number,
		unique: true,
	},
	gender: {
		type: String,
		required: true,
	},
	dateOfSignUp: {
		type: Date,
		default: Date.now,
	},
	wishlist: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
		},
	],
	cart: [
		{
			product: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Product",
			},
			quantity: {
				type: Number,
				default: 1,
			},
		},
	],
});

module.exports = mongoose.model("User", userSchema);
