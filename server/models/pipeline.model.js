

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const pipelineSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true }, // ✅ Campaign → One Pipeline

  spaces: [{ type: Schema.Types.ObjectId, ref: 'Space' }],  // ✅ Pipeline → Many Spaces
 artwork: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
    recievedDate:{type:String}
  },
  bookingStatus: {
    confirmed: { type: Boolean, default: false },
    reference: { type: String },
    bookingDate:{ type: String },
    // memberName:{ type: String },
    estimateDocument :{type:String}
  },

  po: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
    poNumber: { type: String },
    poDate:{type: String},
    poValue:Number

  },

 

  invoice: {
    invoiceNumber: { type: String },
    documentUrl: { type: String },
    invoiceDate: {type:String},
    invoiceValue:Number
  },
  cashMemo: {
    reference: { type: String },
    value: Number,
    documentUrl: { type: String }
  },
  creditNote: {
    reference: { type: String },
    value: Number,
    documentUrl: { type: String }
  },

  payment: {
    mountingAmount:Number,
    printingAmount:Number,
    displayAmount:Number,
    totalAmount: Number,
    gstValue:Number,
    finalAmountWithGST: Number,
    modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc','rtgs','neft'] ,default: undefined},
    cashMemoNo:Number,
    payments: [
  {
    amount: Number,
    date: Date,
    modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc','rtgs','neft'] },
    referenceNumber: String,
    documentUrl: String,
  },
],

    totalPaid: Number,
    paymentDue: Number,
    
  },
 

}, {
  timestamps: true,
});

const Pipeline = model('Pipeline', pipelineSchema);

export default Pipeline;
