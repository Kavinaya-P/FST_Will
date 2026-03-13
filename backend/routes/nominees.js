const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getNominees,
  addNominee,
  removeNominee,
  acceptInvitation,
  declineInvitation,
} = require('../controllers/nomineeController');

// ── Public — token-based (no auth needed) ──────────
router.post('/accept',  acceptInvitation);
router.post('/decline', declineInvitation);

// ── Protected — requires user JWT ──────────────────
router.use(authenticate);
router.get('/',                getNominees);
router.post('/',               addNominee);
router.delete('/:nomineeId',   removeNominee);

module.exports = router;
