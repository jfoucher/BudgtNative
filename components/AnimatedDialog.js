import { View, StyleSheet, Animated, TouchableWithoutFeedback, Image, Text,KeyboardAvoidingView } from 'react-native';
import React, { Component, PropTypes } from 'react';



const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
    wrapper: {
        justifyContent:'center',
        alignItems: 'center',
        flex:1,
        elevation: 5,
        position: 'absolute',
        top:70,
        left:0,
        right:0,
        bottom:0,
    },
    dialog: {
        //width:200,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 3,
        shadowOffset:{width: 0, height: 0},
    },
    overlay: {
        position: 'absolute',
        left:     0,
        top:      0,
        bottom: 0,
        right:-400,
        backgroundColor: '#000',
        opacity: 0.6,
    }
});


class AnimatedDialog extends Component {

    constructor(props) {
        super(props);
        this.state={
            show: false,
            dialogAnim: new Animated.Value(0)
        }
    }

    componentWillReceiveProps(newProps) {
        //console.log(newProps, this.state, this.props);
        if (newProps.show !== this.state.show) {
            this.toggle();
        }
    }

    toggle = () => {
        const nextAnimValue = this.state.show ? 0 : 1;
        this.setState({show: !this.state.show});
        Animated.timing(
            this.state.dialogAnim,
            {toValue: nextAnimValue, duration: 200, useNativeDriver: true,}
        ).start();
    }
//<LoginForm show={true} toggle={this.toggle} login={this.login} />
    render() {
        return(
            <Animated.View style={[styles.wrapper, {transform:[
                        {
                            translateX: this.state.dialogAnim.interpolate({inputRange: [0, 1], outputRange: [-800, 0]})
                        }
                    ], opacity: this.state.dialogAnim}]}>

                <TouchableWithoutFeedback onPress={this.props.toggle}>
                    <Animated.View style={[styles.overlay, {transform:[
                        {
                            translateX: this.state.dialogAnim.interpolate({inputRange: [0, 0.001, 0.999, 1], outputRange: [0, 800, 0, 0]})
                        }
                    ], opacity: this.state.dialogAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.7]})}]}>

                    </Animated.View>
                </TouchableWithoutFeedback>
                {this.props.inner}
            </Animated.View>

        )
    }

}
AnimatedDialog.contextTypes = contextTypes;

export default AnimatedDialog