const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const contactSchema = new mongoose.Schema(
  {
    _id: { type: Number },          
    phoneNumber: { type: String, default: null },
    email: { type: String, default: null },
    linkedId: { type: Number, default: null },
    linkPrecedence: {
      type: String,
      enum: ['primary', 'secondary'],
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    _id: false,                     
  }
);

contactSchema.plugin(AutoIncrement, {
  id: 'contact_id_counter',         
  inc_field: '_id',                 
});

module.exports = mongoose.model('Contact', contactSchema);
