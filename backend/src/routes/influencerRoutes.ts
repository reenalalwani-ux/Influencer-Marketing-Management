import { Router, Response } from 'express';
import { Influencer, Brand, PaymentLog, Employee, EmployeeBrand, Target } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// Helper to keep active targets in sync with transactions
const triggerTargetSync = async () => {
  try {
    const targets = await Target.find({ status: 'Active', autoSync: true });
    for (const target of targets) {
      const now = new Date();
      const startDate = target.startDate || new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const endDate = target.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      if (target.targetType === 'Barter') {
        const count = await Influencer.countDocuments({
          category: 'Barter',
          status: { $in: ['Completed', 'Approved', 'Settled', 'completed', 'approved', 'settled'] },
          transactionDate: { $gte: startDate, $lte: endDate }
        });
        target.achievedCount = count;
        target.achievedAmount = count;
      } else {
        const paidRecords = await Influencer.find({
          category: 'Paid',
          status: { $in: ['Completed', 'Approved', 'Settled', 'completed', 'approved', 'settled'] },
          transactionDate: { $gte: startDate, $lte: endDate }
        });
        target.achievedAmount = paidRecords.reduce((acc, curr) => acc + (curr.ad2shipMargin || 0), 0);
      }
      await target.save();
    }
  } catch (err) {
    console.error('Target sync error:', err);
  }
};

// GET /api/v1/influencers
router.get('/', authenticateToken, checkPermission('influencer.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { category, timeframe, year, month, search } = req.query;
    const filter: any = {};


    // 0. Employee Role Scoping (Only show data for assigned brands or managed deals)
    if (req.user?.role === 'Employee') {
      const employeeDoc = await Employee.findOne({ email: req.user.email });
      if (employeeDoc) {
        const assignments = await EmployeeBrand.find({ employeeId: employeeDoc._id, status: 'Active' });
        const assignedBrandIds = assignments.map(a => a.brandId);
        const assignedBrandDocs = await Brand.find({ _id: { $in: assignedBrandIds } });
        const assignedBrandNames = assignedBrandDocs.map(b => b.brandName);
        const empNameRegex = new RegExp(employeeDoc.name, 'i');

        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { brandId: { $in: assignedBrandIds } },
            { brandName: { $in: assignedBrandNames } },
            { influencerManager: empNameRegex }
          ]
        });
      }
    }

    // 1. Sub-module Category Filter (Paid vs Barter)
    if (category && category !== 'All') {
      filter.category = category;
    }

    // 2. Timeframe Filter (Today, Monthly, Yearly)
    const now = new Date();
    const currentYear = Number(year) || now.getFullYear();
    const currentMonth = month !== undefined ? Number(month) - 1 : now.getMonth();

    if (timeframe && (timeframe as string).includes('_')) {
      const parts = (timeframe as string).split('_');
      const monthNames: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
      };
      const mIdx = monthNames[parts[0].toLowerCase()];
      const yr = Number(parts[1]) || 2026;
      if (mIdx !== undefined) {
        const startOfMonth = new Date(yr, mIdx, 1, 0, 0, 0);
        const endOfMonth = new Date(yr, mIdx + 1, 0, 23, 59, 59);
        filter.transactionDate = { $gte: startOfMonth, $lte: endOfMonth };
      }
    } else if (timeframe === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      filter.transactionDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (timeframe === 'monthly' || timeframe === 'Month') {
      const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      filter.transactionDate = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (timeframe === 'yearly' || timeframe === 'Year') {
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      filter.transactionDate = { $gte: startOfYear, $lte: endOfYear };
    }

    // 3. Search Filter
    if (search) {
      filter.$or = [
        { influencerName: new RegExp(search as string, 'i') },
        { brandName: new RegExp(search as string, 'i') },
        { notes: new RegExp(search as string, 'i') }
      ];
    }

    const influencers = await Influencer.find(filter)
      .populate('brandId', 'brandName brandId logo')
      .sort({ sNo: 1, transactionDate: 1 });

    // Aggregate metrics
    const totalIn = influencers.reduce((acc, curr) => acc + (curr.inAmount || 0), 0);
    const totalOut = influencers.reduce((acc, curr) => acc + (curr.outAmount || 0), 0);
    const netBalance = totalIn - totalOut;

    return res.status(200).json({
      success: true,
      timeframe: timeframe || 'all',
      metrics: {
        totalIn,
        totalOut,
        netBalance,
        totalCount: influencers.length
      },
      data: influencers,
      message: influencers.length === 0 ? 'No records found' : 'Influencer records fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching influencer records', error });
  }
});

// POST /api/v1/influencers
router.post('/', authenticateToken, checkPermission('influencer.create'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      influencerName, influencerManager, brandId, brandName, phone, profileLink, category,
      brandOnboardingAmt, brandReceivedAmt, influencerOnboardingAmt, influencerPaidAmt, finalPaymentReceived,
      inAmount, outAmount, productLink, videoType, videoDescription, refVideoLink, orderId, orderDate,
      platform, status, contentLink, adsCode, viewsCount, ordersCount, ordersGenerated, isApproved, notes, remark, transactionDate
    } = req.body;

    if (!influencerName) {
      return res.status(400).json({ success: false, message: 'Influencer name is required' });
    }

    let finalBrandName = brandName;
    if (brandId && !finalBrandName) {
      const b = await Brand.findById(brandId);
      if (b) finalBrandName = b.brandName;
    }

    // Auto-calculate Google Sheet financial breakdown fields
    const bOnboard = Number(brandOnboardingAmt) || Number(inAmount) || 0;
    const bRecv = Number(brandReceivedAmt) !== undefined ? Number(brandReceivedAmt) : bOnboard;
    const bPend = bOnboard - bRecv;

    const infOnboard = Number(influencerOnboardingAmt) || Number(outAmount) || 0;
    const infPaid = Number(influencerPaidAmt) !== undefined ? Number(influencerPaidAmt) : infOnboard;
    const infPend = infOnboard - infPaid;

    const ad2shipMargin = bOnboard - infOnboard;
    const inAmt = bRecv;
    const outAmt = infPaid;
    const balance = inAmt - outAmt;

    const actualOrders = Number(ordersGenerated !== undefined ? ordersGenerated : ordersCount) || 0;
    const isOrderBonusQualified = (category === 'Paid' || !category) && actualOrders >= 100;

    const count = await Influencer.countDocuments();

    const newRecord = await Influencer.create({
      sNo: count + 1,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      influencerManager: influencerManager || req.user?.name || '',
      brandId: brandId || undefined,
      brandName: finalBrandName || 'General',
      influencerName,
      phone: phone || '',
      profileLink: profileLink || '',
      category: category || 'Paid',

      brandOnboardingAmt: bOnboard,
      brandReceivedAmt: bRecv,
      brandPendingAmt: bPend,
      influencerOnboardingAmt: infOnboard,
      influencerPaidAmt: infPaid,
      influencerPendingAmt: infPend,
      ad2shipMargin,
      inAmount: inAmt,
      outAmount: outAmt,
      balance,
      finalPaymentReceived: !!finalPaymentReceived,

      productLink: productLink || '',
      videoType: videoType || 'Single Product Video',
      videoDescription: videoDescription || '',
      refVideoLink: refVideoLink || '',
      orderId: orderId || '',
      orderDate: orderDate ? new Date(orderDate) : undefined,
      platform: platform || 'Instagram',
      status: status || (req.user?.role === 'Employee' ? 'Under Review' : 'Completed'),
      contentLink: contentLink || '',
      adsCode: adsCode || '',
      viewsCount: Number(viewsCount) || 0,
      ordersCount: actualOrders,
      ordersGenerated: actualOrders,
      isOrderBonusQualified,
      isApproved: isApproved !== undefined ? !!isApproved : ((status || (req.user?.role === 'Employee' ? 'Under Review' : 'Completed')) !== 'Under Review' && (status || (req.user?.role === 'Employee' ? 'Under Review' : 'Completed')) !== 'Pending'),
      notes: notes || '',
      remark: remark || '',
      createdBy: req.user?._id
    });

    // Automatically create Payment Log entries if financial amounts are present
    if (bRecv > 0) {
      await PaymentLog.create({
        influencerId: newRecord._id,
        influencerName: newRecord.influencerName,
        brandName: newRecord.brandName,
        type: 'IN',
        amount: bRecv,
        paymentMode: 'Bank Transfer',
        referenceNo: newRecord.orderId || 'SHEET-REC-IN',
        handledBy: newRecord.influencerManager || req.user?.name || 'Admin',
        notes: `Brand payment received for ${newRecord.influencerName} (${newRecord.brandName})`,
        transactionDate: newRecord.transactionDate,
        createdBy: req.user?._id
      });
    }

    if (infPaid > 0) {
      await PaymentLog.create({
        influencerId: newRecord._id,
        influencerName: newRecord.influencerName,
        brandName: newRecord.brandName,
        type: 'OUT',
        amount: infPaid,
        paymentMode: 'UPI',
        referenceNo: newRecord.orderId || 'SHEET-PAID-OUT',
        handledBy: newRecord.influencerManager || req.user?.name || 'Admin',
        notes: `Creator payout made to ${newRecord.influencerName} (${newRecord.brandName})`,
        transactionDate: newRecord.transactionDate,
        createdBy: req.user?._id
      });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'User',
      action: 'CREATE_INFLUENCER_RECORD',
      module: 'Influencer Module',
      entity: 'InfluencerTransaction',
      entityId: (newRecord._id as any).toString(),
      newValue: { influencerName, brandName: finalBrandName, category, balance }
    });

    await triggerTargetSync();

    return res.status(200).json({ success: true, message: 'Influencer entry created successfully', data: newRecord });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating influencer record', error });
  }
});

// PUT /api/v1/influencers/:id
router.put('/:id', authenticateToken, checkPermission('influencer.update'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      influencerName, influencerManager, brandId, brandName, phone, profileLink, category,
      brandOnboardingAmt, brandReceivedAmt, influencerOnboardingAmt, influencerPaidAmt, finalPaymentReceived,
      inAmount, outAmount, productLink, videoType, videoDescription, refVideoLink, orderId, orderDate,
      platform, status, contentLink, adsCode, viewsCount, ordersCount, ordersGenerated, isApproved, notes, remark, transactionDate
    } = req.body;

    const record = await Influencer.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'No record exists for this influencer' });
    }

    if (influencerName) record.influencerName = influencerName;
    if (influencerManager !== undefined) record.influencerManager = influencerManager;
    if (brandId) record.brandId = brandId;
    if (brandName) record.brandName = brandName;
    if (phone !== undefined) record.phone = phone;
    if (profileLink !== undefined) record.profileLink = profileLink;
    if (category) record.category = category;

    if (brandOnboardingAmt !== undefined) record.brandOnboardingAmt = Number(brandOnboardingAmt) || 0;
    if (brandReceivedAmt !== undefined) record.brandReceivedAmt = Number(brandReceivedAmt) || 0;
    record.brandPendingAmt = record.brandOnboardingAmt - record.brandReceivedAmt;

    if (influencerOnboardingAmt !== undefined) record.influencerOnboardingAmt = Number(influencerOnboardingAmt) || 0;
    if (influencerPaidAmt !== undefined) record.influencerPaidAmt = Number(influencerPaidAmt) || 0;
    record.influencerPendingAmt = record.influencerOnboardingAmt - record.influencerPaidAmt;

    record.ad2shipMargin = record.brandOnboardingAmt - record.influencerOnboardingAmt;
    record.inAmount = record.brandReceivedAmt;
    record.outAmount = record.influencerPaidAmt;
    record.balance = record.inAmount - record.outAmount;

    if (finalPaymentReceived !== undefined) record.finalPaymentReceived = !!finalPaymentReceived;
    if (productLink !== undefined) record.productLink = productLink;
    if (videoType !== undefined) record.videoType = videoType;
    if (videoDescription !== undefined) record.videoDescription = videoDescription;
    if (refVideoLink !== undefined) record.refVideoLink = refVideoLink;
    if (orderId !== undefined) record.orderId = orderId;
    if (orderDate) record.orderDate = new Date(orderDate);
    if (platform) record.platform = platform;
    if (status) {
      record.status = status;
      if (status === 'Completed' || status === 'Approved' || status === 'Settled') {
        record.isApproved = true;
      } else if (status === 'Under Review' || status === 'Pending') {
        record.isApproved = false;
      }
    }
    if (contentLink !== undefined) record.contentLink = contentLink;
    if (adsCode !== undefined) record.adsCode = adsCode;
    if (viewsCount !== undefined) record.viewsCount = Number(viewsCount) || 0;
    if (ordersGenerated !== undefined || ordersCount !== undefined) {
      const orders = Number(ordersGenerated !== undefined ? ordersGenerated : ordersCount) || 0;
      record.ordersGenerated = orders;
      record.ordersCount = orders;
      record.isOrderBonusQualified = (record.category === 'Paid') && orders >= 100;
    }
    if (isApproved !== undefined) record.isApproved = !!isApproved;
    if (notes !== undefined) record.notes = notes;
    if (remark !== undefined) record.remark = remark;
    if (transactionDate) record.transactionDate = new Date(transactionDate);

    await record.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'User',
      action: 'UPDATE_INFLUENCER_RECORD',
      module: 'Influencer Module',
      entity: 'InfluencerTransaction',
      entityId: (record._id as any).toString(),
      newValue: { influencerName: record.influencerName, balance: record.balance }
    });

    await triggerTargetSync();

    return res.status(200).json({ success: true, message: 'Influencer record updated successfully', data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating influencer record', error });
  }
});

// DELETE /api/v1/influencers/:id
router.delete('/:id', authenticateToken, checkPermission('influencer.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const record = await Influencer.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'No record exists for this influencer' });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'User',
      action: 'DELETE_INFLUENCER_RECORD',
      module: 'Influencer Module',
      entity: 'InfluencerTransaction',
      entityId: (record._id as any).toString()
    });

    await triggerTargetSync();

    return res.status(200).json({ success: true, message: 'Influencer record deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting influencer record', error });
  }
});

// GET /api/v1/influencers/payment-logs
router.get('/payment-logs', authenticateToken, checkPermission('influencer.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { type, timeframe, year, month, search } = req.query;
    const filter: any = {};

    if (type && type !== 'All') {
      filter.type = type;
    }

    if (req.user?.role === 'Employee') {
      const employeeDoc = await Employee.findOne({ email: req.user.email });
      if (employeeDoc) {
        const assignments = await EmployeeBrand.find({ employeeId: employeeDoc._id, status: 'Active' });
        const assignedBrandIds = assignments.map(a => a.brandId);
        const assignedBrandDocs = await Brand.find({ _id: { $in: assignedBrandIds } });
        const assignedBrandNames = assignedBrandDocs.map(b => b.brandName);
        const empNameRegex = new RegExp(employeeDoc.name, 'i');

        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { brandName: { $in: assignedBrandNames } },
            { handledBy: empNameRegex }
          ]
        });
      }
    }

    const now = new Date();
    const currentYear = Number(year) || now.getFullYear();
    const currentMonth = month !== undefined ? Number(month) - 1 : now.getMonth();

    if (timeframe && (timeframe as string).includes('_')) {
      const parts = (timeframe as string).split('_');
      const monthNames: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
      };
      const mIdx = monthNames[parts[0].toLowerCase()];
      const yr = Number(parts[1]) || 2026;
      if (mIdx !== undefined) {
        const startOfMonth = new Date(yr, mIdx, 1, 0, 0, 0);
        const endOfMonth = new Date(yr, mIdx + 1, 0, 23, 59, 59);
        filter.transactionDate = { $gte: startOfMonth, $lte: endOfMonth };
      }
    } else if (timeframe === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      filter.transactionDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (timeframe === 'monthly' || timeframe === 'Month') {
      const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      filter.transactionDate = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (timeframe === 'yearly' || timeframe === 'Year') {
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      filter.transactionDate = { $gte: startOfYear, $lte: endOfYear };
    }

    if (search) {
      filter.$or = [
        { influencerName: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { handledBy: { $regex: search, $options: 'i' } },
        { referenceNo: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await PaymentLog.find(filter).sort({ transactionDate: 1, createdAt: 1 });

    const totalIn = logs.filter(l => l.type === 'IN').reduce((acc, l) => acc + (l.amount || 0), 0);
    const totalOut = logs.filter(l => l.type === 'OUT').reduce((acc, l) => acc + (l.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: logs,
      metrics: {
        totalIn,
        totalOut,
        netBalance: totalIn - totalOut,
        totalCount: logs.length
      },
      message: logs.length === 0 ? 'No records found' : 'Payment logs fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching payment logs', error });
  }
});

// POST /api/v1/influencers/payment-logs
router.post('/payment-logs', authenticateToken, checkPermission('influencer.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { influencerId, influencerName, brandName, type, amount, paymentMode, referenceNo, handledBy, notes, transactionDate } = req.body;

    if (!influencerName || !brandName || !type || !amount) {
      return res.status(400).json({ success: false, message: 'Influencer name, brand name, type, and amount are required' });
    }

    const newLog = await PaymentLog.create({
      influencerId: influencerId || undefined,
      influencerName,
      brandName,
      type,
      amount: Number(amount) || 0,
      paymentMode: paymentMode || 'UPI',
      referenceNo: referenceNo || '',
      handledBy: handledBy || req.user?.name || 'Admin',
      notes: notes || '',
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      createdBy: req.user?._id
    });

    // If linked to an influencer record, auto update financial totals
    if (influencerId) {
      const inf = await Influencer.findById(influencerId);
      if (inf) {
        if (type === 'IN') {
          inf.brandReceivedAmt = (inf.brandReceivedAmt || 0) + Number(amount);
          inf.brandPendingAmt = inf.brandOnboardingAmt - inf.brandReceivedAmt;
          inf.inAmount = inf.brandReceivedAmt;
        } else if (type === 'OUT') {
          inf.influencerPaidAmt = (inf.influencerPaidAmt || 0) + Number(amount);
          inf.influencerPendingAmt = inf.influencerOnboardingAmt - inf.influencerPaidAmt;
          inf.outAmount = inf.influencerPaidAmt;
        }
        inf.balance = inf.inAmount - inf.outAmount;
        await inf.save();
      }
    }

    return res.status(200).json({ success: true, message: 'Payment log created successfully', data: newLog });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating payment log', error });
  }
});

// DELETE /api/v1/influencers/payment-logs/:id
router.delete('/payment-logs/:id', authenticateToken, checkPermission('influencer.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await PaymentLog.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'No record exists for this payment log' });
    }
    return res.status(200).json({ success: true, message: 'Payment log deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting payment log', error });
  }
});

export default router;
