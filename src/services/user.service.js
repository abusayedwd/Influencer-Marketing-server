const httpStatus = require("http-status");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendEmailVerification } = require("./email.service");
const unlinkImages = require("../common/unlinkImage");

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  console.log(oneTimeCode)

  if (userBody.role === "brand" || userBody.role === "user" || userBody.role === "influencer" || userBody.role === "admin") {

    sendEmailVerification(userBody.email, oneTimeCode);
  }
  return User.create({ ...userBody, oneTimeCode });
};




const queryUsers = async (filter, options) => {
  const query = {};

  for (const key of Object.keys(filter)) {
    if ((key === 'fullName' || key === 'email' || key === 'userName') && filter[key] !== '') {
      query[key] = { $regex: filter[key], $options: 'i' }; // case-insensitive partial match
    } else if (key === 'interests' && filter[key] !== '') {
      // filter[key] can be comma-separated string or single interest
      // Convert to array if string contains commas
      let interestsArray = [];
      if (typeof filter[key] === 'string') {
        interestsArray = filter[key].split(',').map((i) => i.trim());
      } else if (Array.isArray(filter[key])) {
        interestsArray = filter[key];
      }

      query.interests = { $in: interestsArray };
    } else if (key === 'socialMedia' && filter[key] !== '') {
      // filter[key] is platform name, can also be comma-separated
      let platforms = [];
      if (typeof filter[key] === 'string') {
        platforms = filter[key].split(',').map((p) => p.trim());
      } else if (Array.isArray(filter[key])) {
        platforms = filter[key];
      }

      query.socialMedia = { $elemMatch: { platform: { $in: platforms } } };
    } else if (filter[key] !== '') {
      query[key] = filter[key];
    }
  }

  // Use mongoose-paginate-v2 plugin for pagination
  const users = await User.paginate(query, options);

  return users;
};


const getUserById = async (id) => {
  return User.findById(id);
};

const loggedInUser = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

// const updateUserById = async (userId, updateBody, files) => {
//   const user = await getUserById(userId);

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
//   }

  // if (files && files.length > 0) {
  //   updateBody.photo = files;
  // } else {
  //   delete updateBody.photo; // remove the photo property from the updateBody if no new photo is provided
  // }

//   Object.assign(user, updateBody);
//   await user.save();
//   return user;
// };



const updateUserById = async (userId, updateBody) => {

  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check email uniqueness if changed
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  
  // Update fields safely
  user.set(updateBody);

  await user.save();

  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.remove();
  return user;
};

const isUpdateUser = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const oneTimeCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;


  if (updateBody.role === "user" || updateBody.role === "brand" || updateBody.role === "influencer") {
    sendEmailVerification(updateBody.email, oneTimeCode);
  }

  Object.assign(user, updateBody, {
    isDeleted: false,
    isSuspended: false,
    isEmailVerified: false,
    isResetPassword: false,
    isPhoneNumberVerified: false,
    oneTimeCode: oneTimeCode,
  });
  await user.save();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  isUpdateUser,
  loggedInUser,
};