



import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/* -----------------------------------------------------------
 * Subdocument Schemas (existing business stages)
 * ---------------------------------------------------------*/

const BookingStatusSchema = new Schema({
  confirmed: { type: Boolean, default: false },
  reference: { type: String },
  bookingDate: { type: String },
  estimateDocument: { type: String },
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const PoSchema = new Schema({
  confirmed: { type: Boolean, default: false },
  documentUrl: { type: String },
  poNumber: { type: String },
  poDate: { type: String },
  poValue: Number,
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const ArtworkSchema = new Schema({
  confirmed: { type: Boolean, default: false },
  documentUrl: { type: String },
  recievedDate: { type: String },
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const InvoiceItemSchema = new Schema({
  invoiceNumber: { type: String },
  invoiceDate: { type: String },
  invoiceValue: { type: Number },
  documentUrl: { type: String },
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const CashMemoItemSchema = new Schema({
  reference: String,
  value: Number,
  documentUrl: String,
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const CreditNoteItemSchema = new Schema({
  reference: String,
  value: Number,
  documentUrl: String,
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

const PaymentItemSchema = new Schema({
  amount: Number,
  date: Date,
  modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc', 'rtgs', 'neft'], default: 'cash' },
  referenceNumber: String,
  documentUrl: String,
  completedAt: { type: Date }
}, { _id: false, timestamps: true });

/* -----------------------------------------------------------
 * NEW: Per-unit Digital Status (campaign-scoped, per space)
 * ---------------------------------------------------------*/

const DigitalUnitSchema = new Schema({
  unitId: { type: Number, required: true, min: 1 },

  confirmed: { type: Boolean, default: false },
  assignedAgency: { type: String, default: '' },
  assignedPerson: { type: String, default: '' },
  isLive: { type: Boolean, default: false },
  goLiveDate: { type: String, default: '' }, // keep as 'YYYY-MM-DD' string
  note: { type: String },
  tags:{String},
  completedAt: { type: Date },     // when 'confirmed' flips true
  liveCompletedAt: { type: Date }  // when 'isLive' flips true
}, { _id: false, timestamps: true });

const SpaceAllocationSchema = new Schema({
  space: { type: Schema.Types.ObjectId, ref: 'Space', required: true },

  /**
   * For DOOH: one record per *booked* unit in this campaign for this space.
   * For non-DOOH: leave empty/undefined.
   */
  units: {
    type: [DigitalUnitSchema],
    default: undefined,
    validate: {
      validator: function (arr) {
        if (!Array.isArray(arr)) return true;
        const ids = arr.map(u => u.unitId);
        const set = new Set(ids);
        return (
          ids.length === set.size &&               // unique
          ids.every(n => Number.isInteger(n) && n >= 1) // positive ints
        );
      },
      message: 'allocations.units[].unitId must be unique positive integers.'
    }
  }
}, { _id: false });

/* -----------------------------------------------------------
 * Main Pipeline Schema
 * ---------------------------------------------------------*/

const pipelineSchema = new Schema({
  // Unique pipeline per campaign
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },

  /**
   * Legacy flattened list for convenience/population.
   * Keep it to avoid breaking existing UI; we’ll sync it from allocations.
   */
  spaces: [{ type: Schema.Types.ObjectId, ref: 'Space' }],

  /**
   * NEW: exact mapping of spaces booked in this campaign,
   * with per-unit digital status for DOOH.
   */
  allocations: {
    type: [SpaceAllocationSchema],
    default: []
  },

  // Stages
  artwork: { type: ArtworkSchema, default: () => ({}) },
  bookingStatus: { type: BookingStatusSchema, default: () => ({}) },
  po: { type: PoSchema, default: () => ({}) },

  // Commercial docs
  invoice: [InvoiceItemSchema],
  cashMemo: [CashMemoItemSchema],
  creditNote: [CreditNoteItemSchema],

  // Payment summary
  payment: {
    mountingAmount: Number,
    printingAmount: Number,
    displayAmount: Number,
    totalAmount: Number,
    gstValue: Number,
    finalAmountWithGST: Number,
    modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc', 'rtgs', 'neft'], default: undefined },
    cashMemoNo: Number,   // Convert this to string
    payments: [PaymentItemSchema],
    totalPaid: Number,
    paymentDue: Number,
  },
}, { timestamps: true });

/* -----------------------------------------------------------
 * Hooks (timestamps + legacy sync)
 * ---------------------------------------------------------*/

function updateDigitalUnitTimestamps(u) {
  if (u.confirmed && !u.completedAt) u.completedAt = new Date();
  if (u.isLive && !u.liveCompletedAt) u.liveCompletedAt = new Date();
}

pipelineSchema.pre('save', function(next) {
  // stage completions
  if (this.isModified('bookingStatus.confirmed') && this.bookingStatus?.confirmed && !this.bookingStatus.completedAt) {
    this.bookingStatus.completedAt = new Date();
  }
  if (this.isModified('po.confirmed') && this.po?.confirmed && !this.po.completedAt) {
    this.po.completedAt = new Date();
  }
  if (this.isModified('artwork.confirmed') && this.artwork?.confirmed && !this.artwork.completedAt) {
    this.artwork.completedAt = new Date();
  }

  // per-unit timestamps (campaign-scoped)
  if (Array.isArray(this.allocations)) {
    this.allocations.forEach(a => {
      if (Array.isArray(a.units)) a.units.forEach(updateDigitalUnitTimestamps);
    });
  }

  // keep legacy `spaces` flattened & unique
  if (this.isModified('allocations')) {
    const ids = (this.allocations || []).map(a => a.space).filter(Boolean);
    const uniq = Array.from(new Set(ids.map(id => String(id))));
    this.spaces = uniq.map(id => mongoose.Types.ObjectId.createFromHexString(id));
  }

  next();
});

/* -----------------------------------------------------------
 * Helpful Instance Methods
 * ---------------------------------------------------------*/

/** Return allocation record for a given space */
pipelineSchema.methods.getAllocation = function(spaceId) {
  return (this.allocations || []).find(a => String(a.space) === String(spaceId));
};

/**
 * Upsert one unit record for a space in this campaign.
 * - If allocation for space is missing, it will be created.
 * - If the unitId record exists, it is patched; else it is created.
 */
pipelineSchema.methods.upsertUnitStatus = function(spaceId, unitId, patch = {}) {
  if (!this.allocations) this.allocations = [];

  let alloc = this.getAllocation(spaceId);
  if (!alloc) {
    alloc = { space: spaceId, units: [] };
    this.allocations.push(alloc);
  }

  if (!alloc.units) alloc.units = [];
  const idx = alloc.units.findIndex(u => Number(u.unitId) === Number(unitId));

  if (idx === -1) {
    alloc.units.push({ unitId: Number(unitId), ...patch });
  } else {
    Object.assign(alloc.units[idx], patch);
  }

  // also ensure legacy list contains the space
  if (!this.spaces) this.spaces = [];
  if (!this.spaces.find(s => String(s) === String(spaceId))) this.spaces.push(spaceId);
};

/** Check if a unit is present in this pipeline's allocations for a space */
pipelineSchema.methods.hasUnitAllocated = function(spaceId, unitId) {
  const alloc = this.getAllocation(spaceId);
  if (!alloc || !Array.isArray(alloc.units)) return false;
  return alloc.units.some(u => Number(u.unitId) === Number(unitId));
};

/* -----------------------------------------------------------
 * Indexes (speeding up common lookups)
 * ---------------------------------------------------------*/

pipelineSchema.index({ campaign: 1 }, { unique: true });
pipelineSchema.index({ 'allocations.space': 1 });
pipelineSchema.index({ 'allocations.space': 1, 'allocations.units.unitId': 1 });

/* -----------------------------------------------------------
 * Model
 * ---------------------------------------------------------*/

const Pipeline = model('Pipeline', pipelineSchema);
export default Pipeline;
