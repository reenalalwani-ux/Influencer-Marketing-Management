import { Router } from 'express';
import mongoose from 'mongoose';
import { 
  Permission, Role, User, Employee, Brand, EmployeeBrand, 
  Task, Notification, AuditLog, Setting, Target, Influencer, PaymentLog, ContentCalendar
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
  targets: Target,
  influencers: Influencer,
  paymentlogs: PaymentLog,
  contentcalendars: ContentCalendar
};

// GET /api/v1/db/overview - Get database overview with collection counts
router.get('/overview', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const collectionsInfo: any[] = [];

    for (const [key, model] of Object.entries(modelsMap)) {
      const count = await model.countDocuments();
      collectionsInfo.push({
        name: key,
        modelName: model.modelName,
        collectionName: model.collection.name,
        count
      });
    }

    return res.status(200).json({
      success: true,
      status: 'success',
      dbState: isConnected ? 'Connected' : 'Disconnected',
      databaseName: mongoose.connection.name || 'influencer_db',
      totalCollections: collectionsInfo.length,
      collections: collectionsInfo,
      message: 'Database overview fetched successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, status: 'error', message: error.message });
  }
});

// GET /api/v1/db/collection/:name - Get documents for a specific collection
router.get('/collection/:name', async (req, res) => {
  try {
    const colName = req.params.name.toLowerCase();
    const model = modelsMap[colName];

    if (!model) {
      return res.status(404).json({ 
        success: false,
        status: 'error', 
        message: `No record exists for collection '${req.params.name}'. Available collections: ${Object.keys(modelsMap).join(', ')}` 
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const total = await model.countDocuments();
    const documents = await model.find().skip(skip).limit(limit).lean();

    return res.status(200).json({
      success: true,
      status: 'success',
      collection: colName,
      modelName: model.modelName,
      total,
      limit,
      skip,
      documents,
      count: documents.length,
      message: documents.length === 0 ? 'No records found in this collection' : `Fetched ${documents.length} records from ${colName}`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, status: 'error', message: error.message });
  }
});

export default router;
