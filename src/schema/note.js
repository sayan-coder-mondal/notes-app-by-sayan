const mongoose = require('mongoose');

// product schema
const noteSchema = new mongoose.Schema({
    uid:{
        type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
    },

    title: {
      type: String,
      maxlength: 30,
      required: true
   },

   note: {
      type: String,
      maxlength: 300
   },
},
   {
      timestamps: true
   });

const note = new mongoose.model("note", noteSchema);

module.exports = note;