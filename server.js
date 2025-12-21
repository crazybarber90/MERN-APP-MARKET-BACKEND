const dotenv = require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
//convert everything to object so backend can read
const bodyParser = require('body-parser')
const cors = require('cors')
const userRoute = require('./routes/userRoute')
const productRoute = require('./routes/productRoute')
const contactRoute = require('./routes/contactRoute')
const errorHandler = require('./middleWare/errorMiddleware')
const cookieParser = require('cookie-parser')
const path = require('path')

const app = express()
// MUST for Azure / HTTPS cookies
// Azure (i Vercel) su reverse proxy
// Bez ovoga Express ne vidi HTTPS
// secure: true cookie se NE šalje
app.set('trust proxy', 1)

// Middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(
  cors({
    // origin: ['http://localhost:3000', 'https://pinvent-app.vercel.app'],
    origin: process.env.FRONTEND_URL,
    credentials: true, // enable sending credentials from backend to frontend
  })
)

// DEFINE ROUTE WHERE WILL BE SAVED IMAGES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes Middleware
app.use('/api/users', userRoute)
app.use('/api/products', productRoute)
app.use('/api/contactus', contactRoute)

// Routes
app.get('/', (req, res) => {
  res.send('Home Page')
})

// Error Middleware
app.use(errorHandler)

// connect to DB and start server
const PORT = process.env.PORT || 5000
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}`)
    })
  })
  .catch((err) => console.log(err))
