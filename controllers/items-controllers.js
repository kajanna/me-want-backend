const HttpError = require('../models/http-error');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const Item = require('../models/item');
const User = require('../models/user');

const getItemById = async (req, res, next) => {
  
  const itemId = req.params.iid;
    let item;
    try {
      item = await Item.findById(itemId);
    } catch(err) {
      next(new HttpError('Nie mogliśmy znaleźć poszukiwanego przedmiotu', 500))
    }
    
    if (!item) {
        return next(new HttpError('Nie mogliśmy znaleźć tego konkretnego poszukiwanego przedmiotu', 404));
    }
    res.json({item: item.toObject( {getters:true} )}).status(200);
};

const getItemsByUserId = async (req, res, next) => {
    
  const userId = req.params.uid;

    let items;
    try {
      items = await Item.find({ creatorId: userId});
    } catch(err) {
      return next( new HttpError('Nie mogliśmy znaleźć poszukiwanych przedmiotów', 500))
    }

    if (!items) {
        return next (new HttpError('Nie mogliśmy znaleźć poszukiwanych przedmiotów tego użytkownika', 404));
    }
    res.json({items: items.map(i => i.toObject({ getters: true }))}).status(200);
}

const createNewItem = async (req, res, next) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Nieprawidłowe dane, prosze sprawdź jeszcze raz formularz', 422);
  }

  const { item, url, description, pictureUrl, wantedType, public, creatorId } = req.body;

  const createdItem = new Item({
    item, 
    url,
    description,
    pictureUrl, 
    wantedType, 
    public,
    creatorId
  });

  let user;
  try {
    user = await User.findById(creatorId);
  } catch (err) {
    console.log(err)
    return next(new HttpError('Niestety nie udało sie utworzyć i zapisać twojej ulubionej rzeczy na liście. Prosimy sprubuj jeszcze raz', 500));
  }
  if (!user) {
    return next(new HttpError('Niestety nie udało sie znaleść tego użytkownika', 404))
  }

  try { 
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdItem.save({ session: sess });
    user.items.push(createdItem);
    await user.save( {session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError('Nie udało nam się utworzyć nowego przedmiotu', 500));
  }
  
  res.json({item: createdItem}).status(201);
}

const editItemById = async (req, res, next) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError('Nieprawidłowe dane, prosze sprawdź jeszcze raz formularz', 422);
  }

  const itemId = req.params.iid;

  let foundedItem;
  try {
    foundedItem = await Item.findById(itemId);
  } catch (err) {
    return next(new HttpError('Niestety nie znaleźliśmy przedmiotu, który chciałeś poprawić', 500));
  }
  if (foundedItem.creatorId.toString() !== req.userData.userId) {
    return next(new HttpError('Niestety nie możesz zmienić danych tego przedmiotu', 401))
  }

  const { item,  description, pictureUrl, public, wantedType } = req.body;

   foundedItem.item = item;
   foundedItem.description = description;
   foundedItem.pictureUrl = pictureUrl;
   foundedItem.public = public;
   foundedItem.wantedType = wantedType; 
 
  try {
    await foundedItem.save();
  } catch (err) {
    return next(new HttpError('Niestety nie udło się zapisać zmian. Spróbuj jeszcze raz'));
  }
  
  res.json({item: foundedItem.toObject({ getters:true })}).status(200);
}

const deleteItemById = async (req, res, next) => {

  const itemId = req.params.iid;
  
  let item; 
  try {
    item = await Item.findById(itemId).populate('creatorId');
  } catch (err) {
    return next(new HttpError('Niestety nie znaleźliśmy przedmiotu, który chciałeś usunąć', 500))
  }
  if (!item) {
    return next(new HttpError('Niestety nie znaleźliśmy przedmiotu, który chciałeś usunąć', 404))
  }
  if (item.creatorId.id !== req.userData.userId) {
    return next(new HttpError('Nie jestes upoważniony do usówania cudzych przedmiotów', 403));
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await item.remove({ session: sess});
    item.creatorId.items.pull(item);
    await item.creatorId.save( {session: sess });
    await sess.commitTransaction();

  } catch (err) {
    return next(new HttpError('Niestety nie udało się usunąć przedmiotu', 500))
  }

  res.status(200);
  res.json({message: 'Przedmiot został usunięty z listy'}).status(200);
}

exports.getItemById = getItemById;
exports.getItemsByUserId = getItemsByUserId;
exports.createNewItem = createNewItem;
exports.editItemById = editItemById;
exports.deleteItemById = deleteItemById;