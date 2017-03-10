import React, { Component, PropTypes } from 'react';
import { View, StyleSheet, Animated, Easing} from 'react-native';

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
    spinner: {

        borderLeftColor: 'transparent'
    }
});

class Spinner extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rotation: new Animated.Value(0),

        }
    }

    componentDidMount() {
        this.animate();
    }

    animate = () => {
        console.log('rotate animation');
        Animated.timing(this.state.rotation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start((e) => {
            if(e.finished) {
                this.setState({rotation: new Animated.Value(0)});
                this.animate();
            }

        });
    }

    componentWillUnmount() {
        console.log('unmounting component, animation is ');
        this.state.rotation.stopAnimation((val) => {
            //console.log('animation stopped at', val)
        });
    }


    render() {

        var {size} = this.props;
        if(!size) {
            size = 20;
        }

        return (
            <Animated.View style={[styles.spinner, {
            borderRadius: size/2,
            borderWidth: size/8,
            width: size,
            height: size,
            borderColor: this.context.uiTheme.palette.primaryColor,
            //backgroundColor: this.context.uiTheme.palette.primaryColor,
            transform:[
                        {
                            rotate: this.state.rotation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg']
                            })
                        }
            ]}]}>
            </Animated.View>
        )
    }
}

Spinner.contextTypes = contextTypes;

export default Spinner