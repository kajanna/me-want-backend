const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../utils/cloudinary_config');

const HttpError = require('../models/http-error');
const User = require('../models/user');

 const getAllUsers = async (req, res, next) => {
   let users;
    try {
      users = await User.find({}, '-password');
    } catch (err) {
      return next(new HttpError('Nie znaleźliśmy użytkowników', 404));
    }
    if (!users || users.length === 0) {
      return next(new HttpError('Nie znaleźliśmy użytkowników', 404));
    }
    res.json({users: users.map(u => u.toObject({ getters: true }))});
};

 const getUserById = async (req, res, next) => {
  const userId = req.params.uid;

  let existingUser;
  try {
    existingUser = await User.findById(userId, '-password');
  } catch(err) {
    return next(new HttpError('Nie znaleźliśmy użytkownika', 404));
  }
  if (!existingUser) {
      return next(new HttpError('Nie znaleźliśmy użytkownika', 404));
  }
  res.json({ user: existingUser.toObject({ getters: true})}).status(200);
};

const createNewUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Nieprawidłowe dane, proszę sprawdź jeszcze raz formularz', 422));
  }

  const { name, password, email } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email});
  } catch {
    return next(new HttpError('Niesty nie udało nam sie utworzyć konta. Spróbuj jeszcze raz', 500));
  }
  
  if (existingUser) {
    return next(new HttpError('Wygląda na to, że jesteś już użytkownikiem serwisu, Spróbuj sie zalogować', 422));
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch(err) {
    return next(new HttpError('Niesty nie udało nam sie utworzyć konta. Spróbuj jeszcze raz', 500));
  }
  //Cloudinary upload
  let cloudinaryUrl
  let cloudinaryId
  try {
    const result = await cloudinary.uploader.upload(req.file.path)
    cloudinaryUrl = result.secure_url;
    cloudinaryId = result.public_id
  } catch(err) {
    console.log(err)
    return next(new HttpError('Niesty nie udało nam sie utworzyć konta. Spróbuj jeszcze raz', 500));
  }
  cloudinary
  const newUser = new User({
    name,
    password: hashedPassword,
    image: cloudinaryUrl,
    email,
    cloudinary_id: cloudinaryId,
    items: []
  });

  try {
    await newUser.save();
  } catch (err) {
    return next( new HttpError('Niesty nie udało nam sie utworzyć konta. Spróbuj jeszcze raz', 500));
  }
  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
       { expiresIn: '1h' }
       );  
  } catch(err) {
    return next( new HttpError('Coś poszło bardzo nie tak. Niesty nie udało nam sie utworzyć konta. Spróbuj jeszcze raz', 500));
  }
 
   res.json({userId: newUser.id, email: newUser.name, token: token}).status(201);
}

const loginUser = async (req, res, next) => {

  const { password, email } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email});
  } catch {
    return next(new HttpError('Logowanie się nie powiodło. Spróbuj jeszcze raz', 500));
  }
  
  if (!existingUser) {
    return next(new HttpError('Nie znaleźliśmy użytkownika w bazie danych. Może założysz konto?', 401));
  }

  let isValidPassword = false
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch(err) {
    return next(new HttpError('Logowanie się nie powiodło. Sprawdż jeszcze raz swój login i hasło', 403));
  }

  if (!isValidPassword) {
    return next(new HttpError('Logowanie się nie powiodło. Nie prawidłowe hasło', 403));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
       { expiresIn: '1h' }
       );  
  } catch(err) {
    return next( new HttpError('Logowanie się nie powiodło. Spróbuj jeszcze raz', 500));
  }

  res.json({userId: existingUser.id, email: existingUser.email, token: token}).status(200);
}

exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.createNewUser = createNewUser;
exports.loginUser = loginUser;
