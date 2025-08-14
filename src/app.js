const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const cors = require("cors");
const passport = require("passport");
const httpStatus = require("http-status");
// const status = require("express-status-monitor");
const config = require("./config/config");
const morgan = require("./config/morgan");
const { jwtStrategy } = require("./config/passport");
const { authLimiter } = require("./middlewares/rateLimiter");
const routes = require("./routes/v1");
const { errorConverter, errorHandler } = require("./middlewares/error");
const ApiError = require("./utils/ApiError");
const bodyParser = require("body-parser"); 

const app = express();  

if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// malter for file upload
app.use(express.static("public"));

app.use(
  bodyParser.json({
    verify: function (req, res, buf) {
      req.rawBody = buf;
    },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

bodyParser.raw({ type: "application/json" });

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors({
  origin: "*",  // Allow this origin
  
}));

app.options("*", cors());

// jwt authentication
app.use(passport.initialize());
passport.use("jwt", jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === "production") {
  app.use("/v1/auth", authLimiter);
}

// Express Monitor
// app.use(status());

// v1 api routes
app.use("/v1", routes); 

// Add this before your existing /test route
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Influencer API is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});



//testing API is alive
app.get("/test", (req, res) => {
  const Ip = "https://sayed8080.sobhoy.com/"
  let userIP =
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress;
  res.send({ message: "This is influencer API", Ip });
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "This API Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;



 


// const express = require("express");
// const helmet = require("helmet");
// const xss = require("xss-clean");
// const mongoSanitize = require("express-mongo-sanitize");
// const compression = require("compression");
// const cors = require("cors");
// const passport = require("passport");
// const httpStatus = require("http-status");
// // const status = require("express-status-monitor");
// const config = require("./config/config");
// const morgan = require("./config/morgan");
// const { jwtStrategy } = require("./config/passport");
// const { authLimiter } = require("./middlewares/rateLimiter");
// const routes = require("./routes/v1");
// const { errorConverter, errorHandler } = require("./middlewares/error");
// const ApiError = require("./utils/ApiError");
// const bodyParser = require("body-parser");

// const app = express();

// // Logger middleware
// if (config.env !== "test") {
//   app.use(morgan.successHandler);
//   app.use(morgan.errorHandler);
// }

// // Static file serving
// app.use(express.static("public"));

// // Body parser setup for handling different request bodies
// app.use(
//   bodyParser.json({
//     verify: function (req, res, buf) {
//       req.rawBody = buf;
//     },
//   })
// );
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.raw({ type: "application/json" }));

// // Set security HTTP headers
// app.use(helmet());

// // Parse incoming JSON and URL-encoded data
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Sanitize request data to prevent XSS and MongoDB injections
// app.use(xss());
// app.use(mongoSanitize());

// // Apply gzip compression
// app.use(compression());

// // CORS Configuration
// app.use(
//   cors({
//     origin: "https://sayed3050.sobhoy.com", // Allow your frontend's origin
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
//   })
// );

// // Handle preflight requests for all routes
// app.options("*", (req, res) => {
//   res.setHeader("Access-Control-Allow-Origin", "https://sayed3050.sobhoy.com");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.status(204).end();
// });

// // JWT Authentication middleware
// app.use(passport.initialize());
// passport.use("jwt", jwtStrategy);

// // Limit repeated failed requests to auth endpoints
// if (config.env === "production") {
//   app.use("/v1/auth", authLimiter);
// }

// // Express Monitor (optional)
//  // app.use(status());

// // API routes under /v1
// app.use("/v1", routes);

// // Testing API health check
// app.get("/test", (req, res) => {
//   const Ip = "https://sayed8080.sobhoy.com/";
//   let userIP =
//     req.headers["x-real-ip"] ||
//     req.headers["x-forwarded-for"] ||
//     req.connection.remoteAddress;
//   res.send({ message: "This is influencer API", Ip });
// });

// // Handle unknown API requests
// app.use((req, res, next) => {
//   next(new ApiError(httpStatus.NOT_FOUND, "This API Not found"));
// });

// // Convert errors to ApiError
// app.use(errorConverter);

// // Global error handler
// app.use(errorHandler);

// module.exports = app;
