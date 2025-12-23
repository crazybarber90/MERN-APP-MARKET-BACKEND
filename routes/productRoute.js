const express = require('express')
const router = express.Router()
const protect = require('../middleWare/authMiddleware')
const {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require('../controllers/productControler')
const { upload } = require('../utils/fileUpload')

// WHEN WE CREATE ROUTE FILE , WE MUST REQUIRE THAT IN SERVER.JS

router.post('/', protect, upload.single('image'), createProduct)
router.patch('/:id', protect, upload.single('image'), updateProduct)
router.get('/', protect, getProducts)
router.get('/:id', protect, getProduct)
router.delete('/:id', protect, deleteProduct)

module.exports = router
