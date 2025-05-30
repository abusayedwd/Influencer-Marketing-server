// const mongoose = require("mongoose");
// const validator = require("validator");
// const bcrypt = require("bcryptjs");
// const { toJSON, paginate } = require("./plugins");
// const { roles } = require("../config/roles");

// const userSchema = mongoose.Schema(
//   {
//     fullName: {
//       type: String,
//       required: false,
//       trim: true,
//       default: "",
//     },
//     userName: {
//       type: String,
//       required: false,
//       trim: true,
//       default: "",
//     },
//     email: {
//       type: String,
//       required: false,
//       unique: true,
//       trim: true,
//       lowercase: true,
//       validate(value) {
//         if (!validator.isEmail(value)) {
//           throw new Error("Invalid email");
//         }
//       },
//     },

//     image: {
//       type: Object,
//       required: [true, "Image is must be Required"],
//       default: { url: `/uploads/users/user.png`, path: "null" },
//     },
//     password: {
//       type: String,
//       required: false,
//       trim: true,
//       minlength: 8,
//       validate(value) {
//         if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
//           throw new Error(
//             "Password must contain at least one letter and one number"
//           );
//         }
//       },
//       private: true, // used by the toJSON plugin
//     },
//     role: {
//       type: String,
//       enum: roles,
//     },
//     rand: {
//       type: Number,
//       required: false,
//       default: 0,
//     },
//     dataOfBirth: {
//       type: String,
//       required: false,
//     },
//     socialMedia: {
//       type: String,
//       required: false,
//     },
//     interest: {
//       type: Array,
//       required: false,
//       default: [],
//     },
//     address: {
//       type: String,
//       required: false,
//     },
//     oneTimeCode: {
//       type: String,
//       required: false,
//     },
//     isEmailVerified: {
//       type: Boolean,
//       default: false,
//     },
//     isResetPassword: {
//       type: Boolean,
//       default: false,
//     },
//     isInterest: {
//       type: Boolean,
//       default: false,
//     },
//     isProfileCompleted: {
//       type: Boolean,
//       default: false,
//     },

//     isDeleted: { type: Boolean, default: false },
//   },
//   {
//     timestamps: true,
//   }
// );

// // add plugin that converts mongoose to json
// userSchema.plugin(toJSON);
// userSchema.plugin(paginate);

// userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
//   const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
//   return !!user;
// };
// userSchema.statics.isPhoneNumberTaken = async function (
//   phoneNumber,
//   excludeUserId
// ) {
//   const user = await this.findOne({ phoneNumber, _id: { $ne: excludeUserId } });
//   return !!user;
// };

// userSchema.methods.isPasswordMatch = async function (password) {
//   const user = this;
//   return bcrypt.compare(password, user.password);
// };

// userSchema.pre("save", async function (next) {
//   const user = this;
//   if (user.isModified("password")) {
//     user.password = await bcrypt.hash(user.password, 8);
//   }
//   next();
// });

// const User = mongoose.model("User", userSchema);

// module.exports = User;



const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const { roles } = require("../config/roles");

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    userName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs without phoneNumber
      trim: true,
    },
    image: {
      type: Object,
      required: [true, "Image is required"],
      default: { url: `/uploads/users/user.png`, path: "null" },
    },
    password: {
      type: String,
      minlength: 8,
      trim: true,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      required: true,
    },
    rand: {
      type: Number,
      default: 0,
    },
    dateOfBirth: {
       type: String,
       required: true,
       default: "22-04-25"
    },
    socialMedia: [
      {
        platform: { type: String },
        url: { type: String },
      },
    ],
    interests: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    // Brand-specific fields
    companyName: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
      validate: {
        validator: (v) => !v || validator.isURL(v),
        message: "Invalid URL",
      },
    },
    companyDescription: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    previousExperience: {
      type: String,
      enum: ["none", "limited", "moderate", "extensive"],
      default: "none",
    },

    oneTimeCode: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    acceptTerms: {
      type: Boolean, 
      default: false,
    },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    isInterest: {
      type: Boolean,
      default: false,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugins that convert mongoose to json and add paginate functionality
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Static method to check if email is taken
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

// Static method to check if phone number is taken
userSchema.statics.isPhoneNumberTaken = async function (phoneNumber, excludeUserId) {
  const user = await this.findOne({ phoneNumber, _id: { $ne: excludeUserId } });
  return !!user;
};

// Instance method to compare password
userSchema.methods.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
