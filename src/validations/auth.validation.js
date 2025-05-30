// const Joi = require("joi");
// const { password } = require("./custom.validation");

// const register = {
//   body: Joi.object().keys({
//     email: Joi.string().required().email(),
//     password: Joi.string().required().custom(password),
//     fullName: Joi.string().required(),
//     userName: Joi.string().required(), 
//     dateOfBirth: Joi.string(), 
//     socialMedia: Joi.string() ,
    
//     role: Joi.string().required().valid("user", "brand", "influencer"),
//   }),
// };

// const login = {
//   body: Joi.object().keys({
//     email: Joi.string().required(),
//     password: Joi.string().required(),
//   }),
// };

// const logout = {
//   body: Joi.object().keys({
//     refreshToken: Joi.string().required(),
//   }),
// };

// const refreshTokens = {
//   body: Joi.object().keys({
//     refreshToken: Joi.string().required(),
//   }),
// };

// const forgotPassword = {
//   body: Joi.object().keys({
//     email: Joi.string().email().required(),
//   }),
// };

// const resetPassword = {
//   body: Joi.object().keys({
//     password: Joi.string().required().custom(password),
//     email: Joi.string().required(),
//   }),
// };
// const changePassword = {
//   body: Joi.object().keys({
//     oldPassword: Joi.string().required().custom(password),
//     newPassword: Joi.string().required().custom(password),
//   }),
// };

// const verifyEmail = {
//   body: Joi.object().keys({
//     email: Joi.string().required(),
//     oneTimeCode: Joi.string().required(),
//   }),
// };

// const deleteMe = {
//   body: Joi.object().keys({
//     password: Joi.string().required().custom(password),
//   }),
// };

// const sendOTP = {
//   body: Joi.object().keys({
//     phoneNumber: Joi.string().required(),
//   }),
// }
// const verifyOTP = {
//   body: Joi.object().keys({
//     phoneNumber: Joi.string().required(),
//     otpCode: Joi.string().required(),
//   }),
// }
// module.exports = {
//   register,
//   login,
//   logout,
//   refreshTokens,
//   forgotPassword,
//   resetPassword,
//   verifyEmail,
//   deleteMe,
//   changePassword
// };

const Joi = require("joi");

// Example custom password validation function
// You can adjust this function as needed and import it here if in separate file
const password = (value, helpers) => {
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message(
      "Password must contain at least one letter and one number"
    );
  }
  if (value.length < 6) {
    return helpers.message("Password must be at least 6 characters long");
  }
  return value;
};

const register = {
  body: Joi.object().keys({
    fullName: Joi.string().required().messages({
      "string.empty": "Full Name is required",
    }),
    userName: Joi.string().required().messages({
      "string.empty": "User Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Must be a valid email",
      "string.empty": "Email is required",
    }),
    password: Joi.string().required().custom(password).messages({
      "string.empty": "Password is required",
    }),
    role: Joi.string().required().valid("user", "brand", "influencer").messages({
      "any.only": "Role must be one of 'user', 'brand', or 'influencer'",
      "string.empty": "Role is required",
    }),

    dateOfBirth: Joi.date().iso().optional().messages({
      "date.format": "Date of Birth must be in ISO format (YYYY-MM-DD)",
    }),

    phoneNumber: Joi.string()
      .pattern(/^\+?[0-9]{7,15}$/)
      .optional()
      .messages({
        "string.pattern.base": "Phone Number must be a valid international number",
      }),

    socialMedia: Joi.array()
      .items(
        Joi.object({
          platform: Joi.string().valid(
            "facebook",
            "instagram",
            "tiktok",
            "youtube",
            "twitter",
            "linkedin",
            "snapchat"
          ),
          url: Joi.string(),
        })
      )
      .optional(),

    interests: Joi.array().items(Joi.string()).optional(),

    bio: Joi.string().max(500).optional(),

    // Brand-specific optional fields
    companyName: Joi.string().optional(),
    location: Joi.string().optional(),
    industry: Joi.string().optional(),
    website: Joi.string().uri().optional(),
    companyDescription: Joi.string().max(1000).optional(),
    previousExperience: Joi.string()
      .valid("none", "limited", "moderate", "extensive")
      .optional(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Must be a valid email",
      "string.empty": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required().messages({
      "string.empty": "Refresh token is required",
    }),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required().messages({
      "string.empty": "Refresh token is required",
    }),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Must be a valid email",
      "string.empty": "Email is required",
    }),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password).messages({
      "string.empty": "Password is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Must be a valid email",
      "string.empty": "Email is required",
    }),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required().custom(password).messages({
      "string.empty": "Old password is required",
    }),
    newPassword: Joi.string().required().custom(password).messages({
      "string.empty": "New password is required",
    }),
  }),
};

const verifyEmail = {
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Must be a valid email",
      "string.empty": "Email is required",
    }),
    oneTimeCode: Joi.string().required().messages({
      "string.empty": "One-time code is required",
    }),
  }),
};

const deleteMe = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password).messages({
      "string.empty": "Password is required",
    }),
  }),
};

const sendOTP = {
  body: Joi.object().keys({
    phoneNumber: Joi.string()
      .pattern(/^\+?[0-9]{7,15}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone Number must be a valid international number",
        "string.empty": "Phone Number is required",
      }),
  }),
};

const verifyOTP = {
  body: Joi.object().keys({
    phoneNumber: Joi.string()
      .pattern(/^\+?[0-9]{7,15}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone Number must be a valid international number",
        "string.empty": "Phone Number is required",
      }),
    otpCode: Joi.string().required().messages({
      "string.empty": "OTP Code is required",
    }),
  }),
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  deleteMe,
  changePassword,
  sendOTP,
  verifyOTP,
};
