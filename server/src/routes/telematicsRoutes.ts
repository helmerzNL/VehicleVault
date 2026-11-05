import { Router } from 'express';
import { TelematicsController } from '../controllers/telematicsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/config', requireAuth, TelematicsController.getConfig);
router.post('/config', requireAuth, TelematicsController.saveConfig);
router.post('/test', requireAuth, TelematicsController.testConnection);
router.get('/sensors', requireAuth, TelematicsController.listSensors);
router.post('/sync/:vehicleId', requireAuth, TelematicsController.syncVehicle);
router.post('/sync-all', requireAuth, TelematicsController.syncAll);

export default router;

