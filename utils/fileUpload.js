const multer = require('multer')
const streamifier = require('streamifier')
const cloudinary = require('cloudinary').v2

// // CREATING FUNCTION FOR UPLOADING IMAGES/FILES AND HAVE BEHAVIOUR AS MIDDLEWARE
// // SHOULD REQUIRE THAT IN server.js AND productRoute.js as part of route

// LOCAL MUTLER
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads");
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       new Date().toISOString().replace(/:/g, "_") + "_" + file.originalname
//     ); //26/07/2023
//   },
// });

// PRODUCTION MULTER
const storage = multer.memoryStorage()

// ===================== SPECIFY FILE FORMAT THAT CAN BE SAVED =====================

function fileFilter(req, file, cb) {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

// ======================================== FILE SIZE FORMATER ========================================

const fileSizeFormatter = (bytes, decimal) => {
  if (bytes === 0) {
    return '0 bytes'
  }
  const dm = decimal || 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'YB', 'ZB']
  const index = Math.floor(Math.log(bytes) / Math.log(1000))
  return (
    parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + ' ' + sizes[index]
  )
}

const uploadFromBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'Pinvent App' },
      (error, result) => {
        if (result) resolve(result)
        else reject(error)
      }
    )

    streamifier.createReadStream(buffer).pipe(stream)
  })

module.exports = { upload, fileSizeFormatter, uploadFromBuffer }
