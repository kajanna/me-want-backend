const multer = require('multer');

const MIME_TYPE_MAP = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
    'image/png' : 'png'
};

const fileUpload = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype];
        let error = isValid ? null : new Error('Nieprawidłowy format');
        cb(error, isValid);
    }
});

module.exports = fileUpload;