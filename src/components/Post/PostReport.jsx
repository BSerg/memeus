import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Select, ReCaptcha} from 'components/shared';
import {ReportReasons} from 'utils/constants';
import ReactSVG from 'react-svg';
import CloseIcon from './images/close_white.svg';
import {report} from './actions/actions';

import './styles/PostReport.scss';

export class PostReport extends Component {

    reportItems;

    constructor(props) {
        super(props);
        this.state = {reason: ReportReasons[0].value};
        this.changeHandle = this.changeHandle.bind(this);
        this.onVerifyCaptcha = this.onVerifyCaptcha.bind(this);

        this.reportItems = ReportReasons.map((r) => {
            return { value: r.value, label: props.captions[r.captionKey] }
        });
    }

    changeHandle(v) {
        this.setState({reason: v});
    }

    onVerifyCaptcha(r) {
        this.props.report(this.state.reason, r);
        this.props.closeReport();
    }

    render() {
        let {post, open, captions, close} = this.props;
        let {reason} = this.state;

        if (!open) {
            return null;
        }

        return <div className="post_report">
            <div>
                <div className="post_report__close" onClick={close}>
                    <ReactSVG path={CloseIcon}/>
                </div>
                <div className="post_reposrt_content">
                    <h2>{captions["reportReason"]}</h2>
                    <Select items={this.reportItems} value={reason} onChange={this.changeHandle}/>
                </div>
                
                <ReCaptcha elementID={`post_report_${post.slug}`} verifyCallback={this.onVerifyCaptcha}/>
            </div>
            
        </div>
    }
}

const mapStateToProps = (state) => {
    return {
        captions: state.localization.captions,
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        report: (reason, captchaResponse) => { dispatch(report(ownProps.post.slug, reason, captchaResponse)); }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PostReport);