// import mongoose from 'mongoose';

// const { Schema, model } = mongoose;

// const pipelineSchema = new Schema({
//   booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
//   Campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },

//   bookingStatus: {
//     confirmed: { type: Boolean, default: false },
//     reference: { type: String },
//   },

//   po: {
//     confirmed: { type: Boolean, default: false },
//     documentUrl: { type: String },
//   },

//   artwork: {
//     confirmed: { type: Boolean, default: false },
//     documentUrl: { type: String },
//   },

//   invoice: {
//     invoiceNumber: { type: String },
//     documentUrl: { type: String },
//   },

//   payment: {
//     totalAmount: Number,
//     modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc'] },
//     payments: [
//       {
//         amount: Number,
//         date: Date,
//       },
//     ],
//     totalPaid: Number,
//     paymentDue: Number,
//   },

//   printingStatus: {
//     confirmed: { type: Boolean, default: false },
//   },

//   mountingStatus: {
//     confirmed: { type: Boolean, default: false },
//   },
 
//   advertisingLive: {
//     started: { type: Boolean, default: false },
//   },
// }, {
//   timestamps: true,
// });

// export default model('Pipeline', pipelineSchema);

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const pipelineSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true }, // ✅ Campaign → One Pipeline

  spaces: [{ type: Schema.Types.ObjectId, ref: 'Space' }],  // ✅ Pipeline → Many Spaces
 artwork: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
  },
  bookingStatus: {
    confirmed: { type: Boolean, default: false },
    reference: { type: String },
  },

  po: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
  },

 

  invoice: {
    invoiceNumber: { type: String },
    documentUrl: { type: String },
  },

  payment: {
    totalAmount: Number,
    modeOfPayment: { type: String, enum: ['cash', 'cheque', 'pdc'] ,default: undefined},
    payments: [
      {
        amount: Number,
        date: Date,
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
