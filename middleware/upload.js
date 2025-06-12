const { upload } = require('../config/cloudinary');

const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

const uploadMultiple = (fieldName, maxCount) => {
  return upload.array(fieldName, maxCount);
};

const uploadFields = (fields) => {
  return upload.fields(fields);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields
};
