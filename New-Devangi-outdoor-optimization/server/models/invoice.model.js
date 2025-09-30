import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Line items on an invoice
const lineItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  rate: { type: Number, required: true },
  amount: { type: Number }
}, { _id: false });

// Payments
const paymentSchema = new Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  mode: { type: String, enum: ['cash', 'cheque', 'pdc', 'rtgs', 'neft'], required: true },
  referenceNumber: String,
  documentUrl: String
}, { timestamps: true });

// Credit/Debit notes
const creditNoteSchema = new Schema({
  noteNumber: String,
  value: Number,
  documentUrl: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const invoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },

  // Link to client (but no campaigns/bookings)
  clientId: { type: Schema.Types.ObjectId, ref: 'clientDetails', required: true },

  // Financials
  lineItems: [lineItemSchema],
  subtotal: { type: Number, default: 0 },
  gstRate: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },

  // Payments
  payments: [paymentSchema],
  totalPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },

  // Notes
  creditNotes: [creditNoteSchema],

  // Meta
  status: { type: String, enum: ['draft', 'issued', 'paid', 'partial', 'cancelled'], default: 'draft' },
  documentUrl: String
}, { timestamps: true });

// Auto calculate fields
invoiceSchema.pre('save', function (next) {
  // Calculate subtotal from line items
  this.subtotal = (this.lineItems || []).reduce((sum, item) => sum + (item.amount || item.quantity * item.rate), 0);
  this.gstAmount = (this.subtotal * this.gstRate) / 100;
  this.totalAmount = this.subtotal + this.gstAmount;

  // Payments + balance
  this.totalPaid = (this.payments || []).reduce((sum, p) => sum + p.amount, 0);
  this.balanceDue = this.totalAmount - this.totalPaid;

  if (this.totalPaid === 0) this.status = 'issued';
  else if (this.balanceDue <= 0) this.status = 'paid';
  else this.status = 'partial';

  next();
});

const Invoice = model('Invoice', invoiceSchema);
export default Invoice;
