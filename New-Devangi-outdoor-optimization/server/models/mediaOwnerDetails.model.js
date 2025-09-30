
import mongoose from 'mongoose';

const { Schema, model } = mongoose;


const mediaOwnerDetailsSchema=new Schema({
    agencyName: { type: String, required: true },
    agencyContactPersonName: { type: String },
    agencyContactPersonEmail: {
      type: String,
      match: [/.+\@.+\..+/, 'Please enter a valid email address'],
    },
    agencyPanNumber: { type: String },
    agencyNumber: { type: String },
    agencyContactPersontNumber: { type: Number },
    
},{
    timestamps: true
  })

  const mediaOwnerDetails = model('mediaOwnerDetails', mediaOwnerDetailsSchema);

export default mediaOwnerDetails;