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

// if (config.env !== "test") { 
//   app.use(morgan.successHandler);
//   app.use(morgan.errorHandler);
// }

// // malter for file upload
// app.use(express.static("public"));

// app.use(
//   bodyParser.json({
//     verify: function (req, res, buf) {
//       req.rawBody = buf;
//     },
//   })
// );

// app.use(bodyParser.urlencoded({ extended: true }));

// bodyParser.raw({ type: "application/json" });

// // set security HTTP headers
// app.use(helmet());

// // parse json request body
// app.use(express.json());

// // parse urlencoded request body
// app.use(express.urlencoded({ extended: true }));

// // sanitize request data
// app.use(xss());
// app.use(mongoSanitize());

// // gzip compression
// app.use(compression());

// // enable cors
// app.use(cors({
//   origin: "*",  // Allow this origin
  
// }));

// app.options("*", cors());

// // jwt authentication
// app.use(passport.initialize());
// passport.use("jwt", jwtStrategy);

// // limit repeated failed requests to auth endpoints
// if (config.env === "production") {
//   app.use("/v1/auth", authLimiter);
// }

// // Express Monitor
// // app.use(status());

// // v1 api routes
// app.use("/v1", routes); 

// // Add this before your existing /test route
// app.get("/", (req, res) => {
//   res.json({ 
//     status: "ok", 
//     message: "Influencer API is running",
//     timestamp: new Date().toISOString()
//   });
// });
 
// app.get("/health", (req, res) => {
//   res.status(200).json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     message: 'API is working',
//     method: req.method,
//     uptime: process.uptime()
//   });
// });



// //testing API is alive
// app.get("/test", (req, res) => {
//   const Ip = "https://sayed8080.sobhoy.com/"
//   let userIP =
//     req.headers["x-real-ip"] ||
//     req.headers["x-forwarded-for"] ||
//     req.connection.remoteAddress;
//   res.send({ message: "This is influencer API", Ip });
// });

// // send back a 404 error for any unknown api request
// app.use((req, res, next) => {
//   next(new ApiError(httpStatus.NOT_FOUND, "This API Not found"));
// });

// // convert error to ApiError, if needed
// app.use(errorConverter);

// // handle error
// app.use(errorHandler);

// module.exports = app;



  
const express = require('express');
const cors = require('cors');
const httpStatus = require('http-status');
const config = require('./config/config');
const routes = require("./routes/v1")
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

// Enable trust proxy for Vercel
app.set('trust proxy', 1);

// Enable CORS
app.use(cors({
  origin: true, // Allow all origins for now, restrict in production
  credentials: true
}));

// Parse JSON requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Send back a 404 error for any unknown api request
app.use((req, res, next) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle error
app.use(errorHandler);

module.exports = app;