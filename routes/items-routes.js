const express = require('express');
const { check } = require('express-validator');

const itemsControlers = require('../controllers/items-controllers');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/users/:uid', itemsControlers.getItemsByUserId);

router.use(auth);

router.post(
    '/', 
    [ 
      check('item').not().isEmpty(),
      check('url').isURL(),
      check('description').isLength({min: 8}),
      check('pictureUrl').isURL(),
      check('wantedType').not().isEmpty(),
      check('public').isBoolean(),
      check('creatorId').not().isEmpty(),
    ],
    itemsControlers.createNewItem);


router.get('/:iid', itemsControlers.getItemById);

router.patch(
    '/:iid',
    [
      check('item').not().isEmpty(),
      check('url').isURL(),
      check('description').isLength({min: 8}),
      check('pictureUrl').isURL(),
      check('pictureUrl').isURL(),
      check('wantedType').not().isEmpty(),
      check('public').isBoolean(),
    ],
    itemsControlers.editItemById);
    
router.delete('/:iid', itemsControlers.deleteItemById);

module.exports = router;