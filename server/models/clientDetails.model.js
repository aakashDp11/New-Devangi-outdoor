
import mongoose from 'mongoose';

const { Schema, model } = mongoose;


const clientDetailsSchema=new Schema({
    companyName: { type: String, required: true },
    clientName: { type: String },
    clientEmail: {
      type: String,
      match: [/.+\@.+\..+/, 'Please enter a valid email address'],
    },
    clientPanNumber: { type: String },
    clientGstNumber: { type: String },
    clientContactNumber: { type: Number },
    brandDisplayName: { type: String },
},{
    timestamps: true
  })

  const clientDetails = model('clientDetails', clientDetailsSchema);

export default clientDetails;