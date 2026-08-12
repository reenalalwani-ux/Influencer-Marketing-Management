import { Router } from 'express';
import mongoose from 'mongoose';
import { 
  Permission, Role, User, Employee, Brand, EmployeeBrand, 
  Task, Notification, AuditLog, Setting, Target
} from '../models/allModels';

const router = Router();

const modelsMap: Record<string, mongoose.Model<any>> = {
  permissions: Permission,
  roles: Role,
  users: User,
  employees: Employee,
  brands: Brand,
  employeebrands: EmployeeBrand,
  tasks: Task,
  notifications: Notification,
  auditlogs: AuditLog,
  settings: Setting,
  targets: Target
};

// GET /api/v1/db/overview - Get database overview with collection counts
router.get('/overview', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const collectionsInfo = [];

    for (const [key, model] of Object.entries(modelsMap)) {
      const count = await model.countDocuments();
      collectionsInfo.push({
        name: key,
        modelName: model.modelName,
        collectionName: model.collection.name,
        count
      });
    }

    res.json({
      status: 'success',
      dbState: isConnected ? 'Connected' : 'Disconnected',
      databaseName: mongoose.connection.name || 'MemoryServerDB',
      totalCollections: collectionsInfo.length,
      collections: collectionsInfo
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/v1/db/collection/:name - Get documents for a specific collection
router.get('/collection/:name', async (req, res) => {
  try {
    const colName = req.params.name.toLowerCase();
    const model = modelsMap[colName];

    if (!model) {
      return res.status(404).json({ 
        status: 'error', 
        message: `Collection '${req.params.name}' not found. Available collections: ${Object.keys(modelsMap).join(', ')}` 
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const total = await model.countDocuments();
    const documents = await model.find().skip(skip).limit(limit).lean();

    res.json({
      status: 'success',
      collection: colName,
      modelName: model.modelName,
      total,
      limit,
      skip,
      documents
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
