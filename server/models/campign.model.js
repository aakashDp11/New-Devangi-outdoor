// import mongoose from 'mongoose';

// const { Schema, model } = mongoose;

// const campignSchema = new Schema({
  
//   campaignName: { type: String },
//   campaignImages: [String],
//   description: { type: String },

//   spaces: [{
//     id: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
//     selectedUnits: { type: Number, required: true, min: 1 }
//   }]
// ,  
//   campaignImages: [String],

  

// }, {
//   timestamps: true
// });

// const Campaign = model('Campaign', bookingSchema);

// export default Booking;

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const campaignSchema = new Schema({
  campaignName: { type: String },
  description: { type: String },  
  spaces: [{
    id: { type: Schema.Types.ObjectId, ref: 'Space', required: true },
    selectedUnits: { type: Number, required: true, min: 1 }
  }],
 artwork: {
    confirmed: { type: Boolean, default: false },
    documentUrl: { type: String },
  },
  pipeline: { type: Schema.Types.ObjectId, ref: 'Pipeline', unique: true,sparse: true },  
}, {
  timestamps: true
});

const Campaign = model('Campaign', campaignSchema);

export default Campaign;
