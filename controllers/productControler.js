const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

// =============== CREATE SINGLE PRODUCT ===============

const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  // VALIDATION
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }
  // HANDLE IMAGE UPLOAD
  let fileData = {};
  if (req.file) {
    // SAVING FILE (image) TO COLUDINARY
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2), // accept 2 args for function from utills/fileUpload
    };
  }
  // CREATE PRODUCT
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData, // from condition from up
  });

  res.status(201).json(product);
});

// =============== GET ALL PRODUCTS ===============

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt"); // sort from last created -created
  res.status(200).json(products);
});

// =============== GET SINGLE PRODUCT ===============
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  // IF PRODUCT DOES NOT EXIST
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // AUTHORIZATION , matcg product to user id
  // in userModel user is objectId , so we will convert it to string
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  res.status(200).json(product);
});

// =============== DELETE SINGLE PRODUCT ===============
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  // IF PRODUCT DOES NOT EXIST
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // AUTHORIZATION , match product to user id
  // in userModel user is objectId , so we will convert it to string
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  await product.deleteOne();
  res.status(200).json({ message: "Product is successfully deleted" });
});

// =============== UPDATE SINGLE PRODUCT ===============
const updateProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  const { id } = req.params;

  const product = await Product.findById(id);

  // IF PRODUCT DOES NOT EXIST
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // AUTHORIZATION , match product to user id
  // in userModel user is objectId , so we will convert it to string
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // HANDLE IMAGE UPLOAD
  let fileData = {};
  if (req.file) {
    // SAVING FILE (image) TO COLUDINARY
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2), // accept 2 args for function from utills/fileUpload
    };
  }
  // UPDATE PRODUCT
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      //if length is 0 => use what was previously saved , else use fileData
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
