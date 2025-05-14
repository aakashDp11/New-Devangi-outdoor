import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const pipelineSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },

  bookingStatus: {
    confirmed: { type: Boolean, default: false },
    reference: { type: String },
  },

  po: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
  },

  artwork: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
  },

  invoice: {
    invoiceNumber: { type: String },
    documentUrl: { type: String },
  },

  payment: {
    totalAmount: Number,
    modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc'] },
    payments: [
      {
        amount: Number,
        date: Date,
      },
    ],
    totalPaid: Number,
    paymentDue: Number,
  },

  printingStatus: {
    confirmed: { type: Boolean, default: false },
  },

  mountingStatus: {
    confirmed: { type: Boolean, default: false },
  },
 
  advertisingLive: {
    started: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

export default model('Pipeline', pipelineSchema);
