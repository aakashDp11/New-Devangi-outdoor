import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// --- Subdocument Schemas for each stage with automatic timestamps ---

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


// --- Main Pipeline Schema using the new subdocument schemas ---

const pipelineSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },
  spaces: [{ type: Schema.Types.ObjectId, ref: 'Space' }],
  
  artwork: { type: ArtworkSchema, default: () => ({}) },
  bookingStatus: { type: BookingStatusSchema, default: () => ({}) },
  po: { type: PoSchema, default: () => ({}) },
  
  invoice: [InvoiceItemSchema],
  cashMemo: [CashMemoItemSchema],
  creditNote: [CreditNoteItemSchema],
  
  payment: {
    mountingAmount: Number,
    printingAmount: Number,
    displayAmount: Number,
    totalAmount: Number,
    gstValue: Number,
    finalAmountWithGST: Number,
    modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc', 'rtgs', 'neft'], default: undefined },
    cashMemoNo: Number,
    payments: [PaymentItemSchema],
    totalPaid: Number,
    paymentDue: Number,
  },
}, {
  timestamps: true,
});

// --- Middleware to automatically set 'completedAt' on confirmation ---
pipelineSchema.pre('save', function(next) {
  if (this.isModified('bookingStatus.confirmed') && this.bookingStatus.confirmed && !this.bookingStatus.completedAt) {
    this.bookingStatus.completedAt = new Date();
  }
  if (this.isModified('po.confirmed') && this.po.confirmed && !this.po.completedAt) {
    this.po.completedAt = new Date();
  }
  if (this.isModified('artwork.confirmed') && this.artwork.confirmed && !this.artwork.completedAt) {
    this.artwork.completedAt = new Date();
  }
  next();
});

const Pipeline = model('Pipeline', pipelineSchema);

export default Pipeline;