import mongoose from 'mongoose';

import {
    REPORT_SPAM, 
    REPORT_EXTREMISM, 
    REPORT_INSULT, 
    REPORT_PORN, 
    REPORT_SHOCKING,
    reportStatus
} from '../utils/constants';

export const repStatus = reportStatus;

export let ReportSchema = new mongoose.Schema({
    post: {type: mongoose.Schema.Types.ObjectId, ref: 'Post'},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
    type: {type: Number, required: true},
    status: {type: String, default: reportStatus.ACTIVE, required: true},
}, {
    timestamps: true,
    collection: 'reports'
});

ReportSchema.index({post: 1, user: 1}, {unique: true});

ReportSchema.path('type').validate(_type => {
    return [REPORT_EXTREMISM, REPORT_INSULT, REPORT_PORN, REPORT_SHOCKING, REPORT_SPAM].indexOf(_type) != -1;
});

export default mongoose.model('Report', ReportSchema);