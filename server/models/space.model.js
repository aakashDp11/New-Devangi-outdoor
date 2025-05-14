// import mongoose from 'mongoose';

// const { Schema, model } = mongoose;

// const spaceSchema = new Schema({
//   spaceName: { type: String, required: true },
//   landlord: { type: String }, // 'text' is treated same as String in MongoDB
//   peerMediaOwner: { type: String },
//   spaceType: { type: String, enum: ['billboard', 'digital screen'], required: true },
//   category: { type: String, enum: ['Retail', 'transit'], required: true },
//   mediaType: { type: String, enum: ['Static', 'digital'], required: true },
//   price: { type: Number },
//   footfall: { type: Number },
//   audience: { type: String, enum: ['youth', 'working professionals'] },
//   demographics: { type: String, enum: ['urban', 'rural'] },
//   description: { type: String },
//   illuminations: { type: String, enum: ['front lit', 'back lit'] },
//   unit: { type: Number },
//   width: { type: Number },
//   height: { type: Number },
//   additionalTags: { type: Number },
//   previousBrands: { type: Number },
//   tags: { type: Number },
//   address: { type: String },
//   city: { type: String },
//   state: {
//     type: String,
//     enum: [
//       'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
//       'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
//       'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
//       'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
//       'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
//       'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
//       'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
//       'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
//     ]
//   },
//   latitude: { type: String },
//   longitude: { type: String },
//   landmark: { type: String },
//   zone: { type: String, enum: ['East', 'West', 'North', 'South'] },
//   tier: { type: String, enum: ['Tier 1', 'Tier 2'] },
//   facing: { type: String, enum: ['Single Facing', 'Double Facing'] },
//   faciaTowards: { type: String }
// }, {
//   timestamps: true
// });

// const Space = model('Space', spaceSchema);

// export default Space;
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const spaceSchema = new Schema({
  spaceName: { type: String, required: true },
  landlord: { type: String },
  peerMediaOwner: { type: String },
  spaceType: { type: String, enum: ['Billboard', 'DOOH','Gantry','Pole Kiosk'], required: true },
  traded:{type:Boolean,default:false},
  category: { type: String, enum: ['Retail', 'Transit'], required: true },
  mediaType: { type: String, enum: ['Static', 'Digital'], required: true },
  price: { type: Number },
  footfall: { type: Number },
  audience: { type: String, enum: ['Youth', 'Working Professionals'] },
  demographics: { type: String, enum: ['Urban', 'Rural'] },
  description: { type: String },
  illuminations: { type: String, enum: ['Front lit', 'Back lit'] },
  // unit: { type: Number },
  unit: {
    type: Number,
    validate: {
      validator: function (value) {
        const limits = {
          'Gantry': 1,
          'DOOH': 10,
          'Billboard': 2,
          'Pole Kiosk': 10
        };
        return value <= limits[this.spaceType];
      },
      message: props => `Maximum units allowed for ${props.instance.spaceType} is exceeded.`
    }
  }
,
occupiedUnits: {
  type: Number,
  default: 0,
  validate: [
    {
      validator: function (value) {
        return value >= 0;
      },
      message: 'Occupied units cannot be negative.'
    },
    {
      validator: function (value) {
        return value <= this.unit;
      },
      message: props => `Occupied units (${props.value}) cannot exceed total units (${props.instance.unit}).`
    }
  ]
}
,
  width: { type: Number },
  height: { type: Number },
  additionalTags: { type: String },
  previousBrands: { type: String },
  tags: { type: String },
  address: { type: String },
  city: { type: String },
  state: {
    type: String,
    enum: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
      'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
      'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
    ]
  },
  latitude: { type: String },
  longitude: { type: String },
  landmark: { type: String },
  zone: { type: String, enum: ['East', 'West', 'North', 'South'] },
  tier: { type: String, enum: ['Tier 1', 'Tier 2'] },
  // facing: { type: String, enum: ['Single Facing', 'Double Facing'],default:'Single Facing' },
  faciaTowards: { type: String },
  overlappingBooking:{type:Boolean,default:false},
  // ✅ New fields
  mainPhoto: String,
  inventory: { type: String },   // could store image URL or file reference
  longShot: { type: String },
  closeShot: { type: String },
  otherPhotos: [String],
  availability: { type: String,enum: ['Completely available', 'Partialy available', 'Completely booked'], default: 'Completely available' },
  dates: [{ type: String, default:"",match: /^\d{2}-\d{2}-\d{2}$/ }] // e.g., "24-04-25"
}, {
  timestamps: true
});

const Space = model('Space', spaceSchema);

export default Space;
