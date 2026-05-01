const Datacard = require('../models/Datacard');
const CardVersion = require('../models/CardVersion');
const ShareView = require('../models/ShareView');
const { encrypt, decrypt } = require('../utils/encryption');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const geoip = require('geoip-lite');
const { logCardEvent } = require('../middleware/auditLogger');

/**
 * @desc    Create a new datacard
 * @route   POST /api/cards
 * @access  Private
 */
const createCard = async (req, res) => {
  try {
    const { title, description, fields, template, visibility, tags } = req.body;

    // Encrypting the sensitive fields
    const processed_Fields = fields?.map(field => {
      if (field.encrypted && field.value) {
        return {
          ...field,
          value: encrypt(field.value)
        };
      }
      return field;
    }) || [];

    const datacard = await Datacard.create({
      userId: req.user.id,
      title,
      description,
      fields: processed_Fields,
      template: template || 'default',
      visibility: visibility || 'private',
      tags: tags || []
    });

    logCardEvent('create', req, { cardId: datacard._id });

    res.status(201).json({
      success: true,
      message: 'Datacard created successfully',
      data: { datacard }
    });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({
      error: 'Failed to create datacard'
    });
  }
};

/**
 * @desc    Get all datacards for current user
 * @route   GET /api/cards
 * @access  Private
 */
const getCards = async (req, res) => {
  try {
    const ALLOWED_SORT_FIELDS = ['createdAt', '-createdAt', 'title', '-title', 'updatedAt', '-updatedAt'];
    const rawSort = req.query.sort || '-createdAt';
    const sort = ALLOWED_SORT_FIELDS.includes(rawSort) ? rawSort : '-createdAt';

    const rawLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(Math.max(rawLimit, 1), 50); // clamp between 1 and 50
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const query = { userId: req.user.id };
    const search = req.query.search?.trim();
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const datacards = await Datacard.find(query)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Datacard.countDocuments(query);

    // Decrypting the sensitive fields for display
    const decryptedCards = datacards.map(card => {
      const cardObj = card.toObject();
      cardObj.fields = cardObj.fields.map(field => {
        if (field.encrypted && field.value) {
          try {
            return { ...field, value: decrypt(field.value) };
          } catch {
            return { ...field, value: '[Decryption Error]' };
          }
        }
        return field;
      });
      return cardObj;
    });

    res.status(200).json({
      success: true,
      data: {
        datacards: decryptedCards,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({
      error: 'Failed to retrieve datacards'
    });
  }
};

/**
 * @desc    Get single datacard by ID
 * @route   GET /api/cards/:id
 * @access  Private (owner) or Public (if visibility is public)
 */
const getCard = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id);

    if (!datacard) {
      return res.status(404).json({
        error: 'Datacard not found'
      });
    }

    // Checking the authorization
    const isOwner = datacard.userId.toString() === req.user?.id;
    const isPublic = datacard.visibility === 'public';

    if (!isOwner && !isPublic) {
      logCardEvent('unauthorized', req, { ownerId: datacard.userId });
      return res.status(403).json({
        error: 'Not authorized to access this datacard'
      });
    }

    // Decrypting the sensitive fields only for owner
    const cardObj = datacard.toObject();
    if (isOwner) {
      cardObj.fields = cardObj.fields.map(field => {
        if (field.encrypted && field.value) {
          try {
            return { ...field, value: decrypt(field.value) };
          } catch {
            return { ...field, value: '[Decryption Error]' };
          }
        }
        return field;
      });
    } else {
      // For public access, mask encrypted fields
      cardObj.fields = cardObj.fields.map(field => {
        if (field.encrypted) {
          return { ...field, value: '••••••••' };
        }
        return field;
      });
    }

    res.status(200).json({
      success: true,
      data: { datacard: cardObj }
    });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({
      error: 'Failed to retrieve datacard'
    });
  }
};

/**
 * @desc    Update datacard
 * @route   PUT /api/cards/:id
 * @access  Private (owner only)
 */
const updateCard = async (req, res) => {
  try {
    let datacard = await Datacard.findById(req.params.id);

    if (!datacard) {
      return res.status(404).json({
        error: 'Datacard not found'
      });
    }

    // Checking for the ownership
    if (datacard.userId.toString() !== req.user.id) {
      logCardEvent('unauthorized', req, { action: 'update', ownerId: datacard.userId });
      return res.status(403).json({
        error: 'Not authorized to update this datacard'
      });
    }

    const { title, description, fields, template, visibility, tags } = req.body;

  
    // Detects the already encrypted values by matching the iv:authTag:data hex format
    const ENCRYPTED_PATTERN = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i;
    const processed_Fields = fields?.map(field => {
      if (field.encrypted && field.value && !ENCRYPTED_PATTERN.test(field.value)) {
        return {
          ...field,
          value: encrypt(field.value)
        };
      }
      return field;
    });

    // Version History - snapshot current state before overwriting
    const snapshotVersion = datacard.currentVersion || 1;
    await CardVersion.create({
      cardId:      datacard._id,
      userId:      req.user.id,
      version:     snapshotVersion,
      title:       datacard.title,
      description: datacard.description || '',
      fields:      datacard.fields.map(f => ({
        label:     f.label,
        value:     f.value,
        type:      f.type,
        encrypted: f.encrypted
      })),
      template:    datacard.template,
      visibility:  datacard.visibility,
      tags:        datacard.tags || [],
      savedAt:     datacard.updatedAt || new Date(),
      changeNote:  req.body.changeNote || ''
    });
    // ---------------------------------------------------------------

    datacard = await Datacard.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        fields: processed_Fields,
        template,
        visibility,
        tags,
        currentVersion: snapshotVersion + 1
      },
      { new: true, runValidators: true }
    );

    logCardEvent('update', req, { cardId: datacard._id, version: snapshotVersion + 1 });

    res.status(200).json({
      success: true,
      message: 'Datacard updated successfully',
      data: { datacard }
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({
      error: 'Failed to update datacard'
    });
  }
};

/**
 * @desc    Gets the version history list for a datacard (metadata only, no field values)
 * @route   GET /api/cards/:id/history
 * @access  Private (owner only)
 */
const getCardHistory = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id).select('userId currentVersion title');
    if (!datacard) return res.status(404).json({ error: 'Datacard not found' });
    if (datacard.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const versions = await CardVersion.find({ cardId: req.params.id })
      .sort({ version: -1 })
      .select('version savedAt changeNote title -_id');

    res.status(200).json({
      success: true,
      data: {
        cardId: req.params.id,
        currentVersion: datacard.currentVersion || 1,
        history: versions
      }
    });
  } catch (error) {
    console.error('Get card history error:', error);
    res.status(500).json({ error: 'Failed to retrieve card history' });
  }
};

/**
 * @desc    Gets a specific version snapshot (with decrypted fields for owner)
 * @route   GET /api/cards/:id/history/:version
 * @access  Private (owner only)
 */
const getCardVersion = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id).select('userId');
    if (!datacard) return res.status(404).json({ error: 'Datacard not found' });
    if (datacard.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const versionNum = parseInt(req.params.version, 10);
    if (isNaN(versionNum) || versionNum < 1) {
      return res.status(400).json({ error: 'Invalid version number' });
    }

    const snapshot = await CardVersion.findOne({
      cardId: req.params.id,
      version: versionNum
    });

    if (!snapshot) return res.status(404).json({ error: 'Version not found' });

    // Decrypting the fields for the owner — same pattern as getCard
    const snapshotObj = snapshot.toObject();
    snapshotObj.fields = snapshotObj.fields.map(field => {
      if (field.encrypted && field.value) {
        try {
          return { ...field, value: decrypt(field.value) };
        } catch {
          return { ...field, value: '[Decryption Error]' };
        }
      }
      return field;
    });

    res.status(200).json({
      success: true,
      data: { version: snapshotObj }
    });
  } catch (error) {
    console.error('Get card version error:', error);
    res.status(500).json({ error: 'Failed to retrieve card version' });
  }
};

/**
 * @desc    To Delete the datacard
 * @route   DELETE /api/cards/:id
 * @access  Private (owner only)
 */
const deleteCard = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id);

    if (!datacard) {
      return res.status(404).json({
        error: 'Datacard not found'
      });
    }

    // Checking for ownership
    if (datacard.userId.toString() !== req.user.id) {
      logCardEvent('unauthorized', req, { action: 'delete', ownerId: datacard.userId });
      return res.status(403).json({
        error: 'Not authorized to delete this datacard'
      });
    }

    await Datacard.findByIdAndDelete(req.params.id);
    logCardEvent('delete', req);

    res.status(200).json({
      success: true,
      message: 'Datacard deleted successfully'
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({
      error: 'Failed to delete datacard'
    });
  }
};

/**
 * @desc    Generates share link for datacard
 * @route   POST /api/cards/:id/share
 * @access  Private (owner only)
 */
const generateShareLink = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id);

    if (!datacard) {
      return res.status(404).json({
        error: 'Datacard not found'
      });
    }

    if (datacard.userId.toString() !== req.user.id) {
      logCardEvent('unauthorized', req, { action: 'share', ownerId: datacard.userId });
      return res.status(403).json({
        error: 'Not authorized'
      });
    }

    // Generates unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Seting an expiry (0 = no expiry, otherwise clamped between 1 and 3650 days)
    const rawExpiry = parseInt(req.body.expiryDays, 10);
    const noExpiry = rawExpiry === 0;
    const expiryDays = noExpiry ? 0 : Math.min(Math.max(rawExpiry || 7, 1), 3650);
    let shareExpiry = null;
    if (!noExpiry) {
      shareExpiry = new Date();
      shareExpiry.setDate(shareExpiry.getDate() + expiryDays);
    }

    // Optional password protection
    let sharePasswordHash = null;
    const rawPassword = req.body.password?.trim();
    if (rawPassword) {
      if (rawPassword.length < 4 || rawPassword.length > 50) {
        return res.status(400).json({ error: 'Share password must be 4–50 characters' });
      }
      sharePasswordHash = await bcrypt.hash(rawPassword, 10);
    }

    await Datacard.findByIdAndUpdate(datacard._id, {
      shareToken,
      shareExpiry,
      sharePasswordHash
    });

    logCardEvent('share', req, { expiryDays, passwordProtected: !!sharePasswordHash });

    res.status(200).json({
      success: true,
      data: {
        shareToken,
        shareExpiry,
        passwordProtected: !!sharePasswordHash,
        shareUrl: `${process.env.FRONTEND_URL}/card/shared/${shareToken}`
      }
    });
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({
      error: 'Failed to generate share link'
    });
  }
};

/**
 * @desc    Gets the datacard by share token
 * @route   GET /api/cards/shared/:token
 * @access  Public
 */
const getSharedCard = async (req, res) => {
  try {
    const datacard = await Datacard.findOne({ shareToken: req.params.token })
      .select('+sharePasswordHash');

    if (!datacard) {
      return res.status(404).json({
        error: 'Shared datacard not found or link has expired'
      });
    }

    // Checking if link has expired
    if (datacard.shareExpiry && new Date() > datacard.shareExpiry) {
      return res.status(410).json({
        error: 'Share link has expired'
      });
    }

    // Checking Password protection
    if (datacard.sharePasswordHash) {
      const submitted = req.headers['x-share-password'];
      if (!submitted) {
        return res.status(401).json({
          requiresPassword: true,
          title: datacard.title
        });
      }
      const match = await bcrypt.compare(submitted, datacard.sharePasswordHash);
      if (!match) {
        logCardEvent('share_wrong_password', req, { cardId: datacard._id });
        return res.status(401).json({
          requiresPassword: true,
          wrongPassword: true,
          title: datacard.title
        });
      }
    }

    // Only the record visit if viewer gave tracking consent
    const trackingConsent = req.headers['x-tracking-consent'];
    if (trackingConsent === 'true') {
      const forwardedFor = req.headers['x-forwarded-for'];
      const rawIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : null)
        || req.ip
        || req.connection?.remoteAddress
        || 'unknown';
      const ua = req.headers['user-agent'] || 'unknown';
      setImmediate(async () => {
        try {
          const cleanIp = rawIp.replace(/^::ffff:/, '');
          const geo = geoip.lookup(cleanIp);
          await ShareView.create({
            cardId: datacard._id,
            ipHash: ShareView.hashIp(rawIp),
            userAgent: ua.substring(0, 500),
            deviceType: ShareView.parseDeviceType(ua),
            browser: ShareView.parseBrowser(ua),
            referrer: (req.headers['referer'] || req.headers['referrer'] || '').substring(0, 500) || null,
            country:  geo?.country  || null,
            city:     geo?.city     || null,
            timezone: geo?.timezone || null
          });
          await Datacard.updateOne(
            { _id: datacard._id },
            { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } }
          );
        } catch (err) {
          console.error('Share view tracking error:', err.message);
        }
      });
    }

    logCardEvent('shared_view', req, { cardId: datacard._id });

    // Masking the encrypted fields
    const cardObj = datacard.toObject();
    cardObj.fields = cardObj.fields.map(field => {
      if (field.encrypted) {
        return { ...field, value: '••••••••' };
      }
      return field;
    });

    // Removing the sensitive info
    delete cardObj.userId;
    delete cardObj.shareToken;

    res.status(200).json({
      success: true,
      data: { datacard: cardObj }
    });
  } catch (error) {
    console.error('Get shared card error:', error);
    res.status(500).json({
      error: 'Failed to retrieve shared datacard'
    });
  }
};

/**
 * @desc    Gets a share link analytics for a datacard
 * @route   GET /api/cards/:id/share/stats
 * @access  Private (owner only)
 */
const getShareStats = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id)
      .select('userId viewCount lastViewedAt shareToken shareExpiry title');

    if (!datacard) {
      return res.status(404).json({ error: 'Datacard not found' });
    }

    if (datacard.userId.toString() !== req.user.id) {
      logCardEvent('unauthorized', req, { action: 'share_stats', ownerId: datacard.userId });
      return res.status(403).json({ error: 'Not authorized' });
    }

    const cardId = datacard._id;

    // Total views (from ShareView records)
    const totalViews = await ShareView.countDocuments({ cardId });

    // Unique visitors (distinct ipHash)
    const uniqueResult = await ShareView.aggregate([
      { $match: { cardId } },
      { $group: { _id: '$ipHash' } },
      { $count: 'count' }
    ]);
    const uniqueVisitors = uniqueResult[0]?.count ?? 0;

    // Views per day for last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const viewsByDay = await ShareView.aggregate([
      { $match: { cardId, viewedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } }
    ]);

    //  Device breakdown 
    const deviceBreakdown = await ShareView.aggregate([
      { $match: { cardId } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $project: { _id: 0, device: '$_id', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    //  Country breakdown 
    const countryBreakdown = await ShareView.aggregate([
      { $match: { cardId, country: { $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $project: { _id: 0, country: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    //  City breakdown (top 10) 
    const cityBreakdown = await ShareView.aggregate([
      { $match: { cardId, city: { $ne: null }, city: { $ne: '' } } },
      { $group: { _id: { city: '$city', country: '$country' }, count: { $sum: 1 } } },
      { $project: { _id: 0, city: '$_id.city', country: '$_id.country', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    //  Recent views (last 10, no raw IP) 
    const recentViews = await ShareView.find({ cardId })
      .sort({ viewedAt: -1 })
      .limit(10)
      .select('deviceType browser referrer country city timezone viewedAt -_id');

    res.status(200).json({
      success: true,
      data: {
        cardId,
        title: datacard.title,
        shareActive: !!datacard.shareToken,
        shareExpiry: datacard.shareExpiry,
        totalViews,
        uniqueVisitors,
        lastViewedAt: datacard.lastViewedAt,
        viewsByDay,
        deviceBreakdown,
        countryBreakdown,
        cityBreakdown,
        recentViews
      }
    });
  } catch (error) {
    console.error('Get share stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve share statistics' });
  }
};

/**
 * @desc    Revoke share link for datacard
 * @route   DELETE /api/cards/:id/share
 * @access  Private (owner only)
 */
const revokeShareLink = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id);

    if (!datacard) {
      return res.status(404).json({ error: 'Datacard not found' });
    }

    if (datacard.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!datacard.shareToken) {
      return res.status(400).json({ error: 'No active share link to revoke' });
    }

    datacard.shareToken = undefined;
    datacard.shareExpiry = undefined;
    datacard.sharePasswordHash = undefined;
    await datacard.save();

    res.status(200).json({
      success: true,
      message: 'Share link revoked successfully'
    });
  } catch (error) {
    console.error('Revoke share link error:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
};

/**
 * @desc    Exporting datacard as a password protected PDF
 * @route   POST /api/cards/:id/export
 * @access  Private (owner only)
 */
const exportCard = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id);

    if (!datacard) {
      return res.status(404).json({ error: 'Datacard not found' });
    }

    if (datacard.userId.toString() !== req.user.id) {
      logCardEvent('unauthorized', req, { action: 'export', ownerId: datacard.userId });
      return res.status(403).json({ error: 'Not authorized' });
    }

    const password = req.body.password?.trim() || null;
    if (password !== null && password.length < 4) {
      return res.status(400).json({ error: 'Export password must be at least 4 characters' });
    }

    // Decrypting fields for export
    const fields = datacard.fields.map(field => {
      if (field.encrypted && field.value) {
        try {
          return { ...field.toObject(), value: decrypt(field.value), decrypted: true };
        } catch {
          return { ...field.toObject(), value: '[decryption failed]' };
        }
      }
      return field.toObject();
    });

    logCardEvent('export', req, { cardId: datacard._id });

    // Build PDF (optionally password protected)
    const pdfOptions = {
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
    };
    if (password) {
      pdfOptions.userPassword = password;
      pdfOptions.ownerPassword = crypto.randomBytes(16).toString('hex');
      pdfOptions.permissions = {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false
      };
    }
    const doc = new PDFDocument(pdfOptions);

    const filename = `${datacard.title.replace(/[^a-z0-9]/gi, '_')}_datacard.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    //  Header 
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text('[sc] securecard', { align: 'right' });
    doc.moveDown(0.5);

    doc.fontSize(22).fillColor('#111827').font('Helvetica-Bold')
      .text(datacard.title);
    doc.moveDown(0.3);

    if (datacard.description) {
      doc.fontSize(11).fillColor('#4b5563').font('Helvetica')
        .text(datacard.description);
      doc.moveDown(0.5);
    }

    // Divider
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#d1d5db').lineWidth(1).stroke();
    doc.moveDown(0.8);

    //  Fields 
    fields.forEach(field => {
      const labelX = 60;
      const valueX = 210;
      const y = doc.y;

      doc.fontSize(9).fillColor('#6b7280').font('Helvetica-Bold')
        .text(field.label.toUpperCase(), labelX, y, { width: 140, continued: false });

      const displayValue = field.encrypted
        ? `[encrypted] ${field.value}`
        : (field.value || '—');

      doc.fontSize(10).fillColor('#111827').font('Helvetica')
        .text(displayValue, valueX, y, { width: 325 });

      doc.moveDown(0.6);
    });

    //  Tags 
    if (datacard.tags?.length > 0) {
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#d1d5db').lineWidth(1).stroke();
      doc.moveDown(0.6);
      doc.fontSize(9).fillColor('#6b7280').font('Helvetica-Bold').text('TAGS');
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#2563eb').font('Helvetica')
        .text(datacard.tags.map(t => `#${t}`).join('  '));
      doc.moveDown(0.5);
    }

    //  Metadata 
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#d1d5db').lineWidth(1).stroke();
    doc.moveDown(0.6);
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica')
      .text(`Created: ${new Date(datacard.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}   |   Visibility: ${datacard.visibility}`);
    doc.moveDown(0.5);

    //  Security notice
    doc.fontSize(8).fillColor('#9ca3af')
      .text('This document is password protected. Field values marked [encrypted] were decrypted for this export. Handle with care.');

    doc.end();
  } catch (error) {
    console.error('Export card error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export datacard' });
    }
  }
};

/**
 * @desc    Export datacard as Markdown (GAP 4 standard format export)
 * @route   GET /api/cards/:id/export/markdown
 * @access  Private (owner only)
 */
const exportMarkdown = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id);
    if (!datacard) return res.status(404).json({ error: 'Datacard not found' });
    if (datacard.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const fields = datacard.fields.map(field => {
      if (field.encrypted && field.value) {
        try { return { ...field.toObject(), value: decrypt(field.value) }; }
        catch { return { ...field.toObject(), value: '[decryption failed]' }; }
      }
      return field.toObject();
    });

    const lines = [];
    lines.push(`# ${datacard.title}`);
    lines.push('');
    if (datacard.description) {
      lines.push(`> ${datacard.description}`);
      lines.push('');
    }
    lines.push('## Fields');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|---|---|');
    for (const f of fields) {
      const val = f.encrypted ? `\`[encrypted]\` ${f.value}` : (f.value || '—');
      lines.push(`| **${f.label}** | ${val} |`);
    }
    if (datacard.tags?.length > 0) {
      lines.push('');
      lines.push('## Tags');
      lines.push('');
      lines.push(datacard.tags.map(t => `\`#${t}\``).join('  '));
    }
    lines.push('');
    lines.push('---');
    lines.push(`*Generated by SecureCard · ${new Date().toISOString().split('T')[0]}*`);

    const markdown = lines.join('\n');
    const filename = `${datacard.title.replace(/[^a-z0-9]/gi, '_')}_datacard.md`;
    logCardEvent('export_markdown', req, { cardId: datacard._id });
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (error) {
    console.error('Markdown export error:', error);
    res.status(500).json({ error: 'Failed to export as Markdown' });
  }
};

/**
 * @desc    Export datacard as JSON (GAP 4 — machine readable standard format)
 * @route   GET /api/cards/:id/export/json
 * @access  Private (owner only)
 */
const exportJSON = async (req, res) => {
  try {
    const datacard = await Datacard.findById(req.params.id);
    if (!datacard) return res.status(404).json({ error: 'Datacard not found' });
    if (datacard.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const fields = datacard.fields.map(field => {
      const f = field.toObject();
      if (f.encrypted && f.value) {
        try { return { ...f, value: decrypt(f.value) }; }
        catch { return { ...f, value: '[decryption failed]' }; }
      }
      return f;
    });

    const exportData = {
      schema: 'securecard/datacard/v1',
      exportedAt: new Date().toISOString(),
      title: datacard.title,
      description: datacard.description || '',
      template: datacard.template,
      visibility: datacard.visibility,
      tags: datacard.tags || [],
      fields: fields.map(({ label, value, type }) => ({ label, value, type })),
      metadata: {
        createdAt: datacard.createdAt,
        updatedAt: datacard.updatedAt,
        version: datacard.currentVersion || 1,
      }
    };

    const filename = `${datacard.title.replace(/[^a-z0-9]/gi, '_')}_datacard.json`;
    logCardEvent('export_json', req, { cardId: datacard._id });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('JSON export error:', error);
    res.status(500).json({ error: 'Failed to export as JSON' });
  }
};

module.exports = {
  getCardHistory,
  getCardVersion,
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  generateShareLink,
  revokeShareLink,
  getSharedCard,
  getShareStats,
  exportCard,
  exportMarkdown,
  exportJSON,
};
