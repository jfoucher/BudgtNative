import React, { Component } from 'react';
import {
    TouchableNativeFeedback,
    TouchableHighlight,
    Platform
} from 'react-native';


class TouchableWithFeedback extends Component {

    render() {
        const { children} = this.props;
        if (Platform.OS == 'ios') {
            return (
                <TouchableHighlight
                    {...this.props}
                    >
                    {children}
                </TouchableHighlight>
            )
        }
        return (
            <TouchableNativeFeedback
                {...this.props}
                >
                {children}
            </TouchableNativeFeedback>
        )


    }


}



export default TouchableWithFeedback