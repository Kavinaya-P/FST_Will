const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getVault, addAsset, deleteAsset, getAsset } = require('../controllers/vaultController');

router.use(authenticate); // All vault routes require full auth

router.get('/',                   getVault);
router.post('/assets',            addAsset);
router.get('/assets/:assetId',    getAsset);
router.delete('/assets/:assetId', deleteAsset);

module.exports = router;
