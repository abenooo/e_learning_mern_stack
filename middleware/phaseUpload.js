const { upload } = require('../config/cloudinary');

const uploadPhaseIcon = (fieldName) => {
  return upload.single(fieldName);
};

module.exports = {
  uploadPhaseIcon,
};