import mongoose from 'mongoose';

mongoose.Promise = Promise;

export let _VisitSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    date: Date,
    duration: {type: Number, min: 0}
}, {
    timestamps: true,
    collection: 'visits'
});

export let VisitSchema = new mongoose.Schema({
    u: {type: String, alias: 'user', index: true},
    d: {type: Number, alias: 'date'},
    dur: {type: Number, min: 0, alias: 'duration'},
});

export let Visit = mongoose.model('Visit', VisitSchema);

export let PostViewSchema = new mongoose.Schema({
    p: {type: String, alias: 'post'},
    u: {type: String, alias: 'user', index: true},
    d: {type: Number, alias: 'date'},
}, {
    collection: 'postViews'
});

export let PostView = mongoose.model('PostView', PostViewSchema);