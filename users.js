const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
	},
    wishlist : {
        type: mongoose.obejectType
    }
});
