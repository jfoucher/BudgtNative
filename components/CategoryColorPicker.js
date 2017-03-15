import React, { Component, PropTypes } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableWithoutFeedback,
    Animated,
    Image,
    Platform
} from 'react-native';
import { TriangleColorPicker } from 'react-native-color-picker'
import { IconToggle, Icon } from 'react-native-material-ui';

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 70,
        left:0,
        right:0,
        bottom:0,
        backgroundColor:'rgba(0,0,0,0.98)',
    }
})

class CategoryColorPicker extends Component {


    constructor(props) {
        super(props);
        this.state = {
            colorPickerZIndex: -1,
            colorPickerOpacity: new Animated.Value(0),
            buttonOpacity: new Animated.Value(0),
        }
    }

    componentWillReceiveProps(newProps) {
        console.log('colorpicker will receive props', newProps);
        if(newProps.displayButton !== this.props.displayButton) {
            const nextVal = newProps.displayButton ? 0 : 1;
            Animated.timing(
                this.state.buttonOpacity,
                {toValue: nextVal}
            ).start();
        }
        if(newProps.open !== this.props.open) {
            this.toggleColorPicker()
        }

    }


    toggleColorPicker = () => {
        console.log('toggle color picker', this.state.colorPickerZIndex);
        if(this.state.colorPickerZIndex === -1) { //color picker is hidden, show
            this.setState({colorPickerZIndex: 9});
            Animated.timing(
                this.state.colorPickerOpacity,
                {toValue: 1}
            ).start();
        } else {
            Animated.timing(
                this.state.colorPickerOpacity,
                {toValue: 0}
            ).start(() => {
                    console.log('color picker opactity set to 0, toggle zIndex');
                    this.setState({colorPickerZIndex: -1})
                });
        }

    }


    render() {
        console.log('render ColorPicker', this.state.colorPickerZIndex);
        return (

                <Animated.View style={
                    [styles.container,
                    {

                    zIndex: this.state.colorPickerZIndex,
                    //elevation: 2,
                    opacity: this.state.colorPickerOpacity,

                    transform:[
                            {
                                translateX: Platform.OS==='ios' ? 0 : this.state.colorPickerOpacity.interpolate({inputRange: [0,0.0001, 1], outputRange: [-3000,-560, 0]})
                            }
                        ]
                    }]}>

                    <TriangleColorPicker
                        oldColor={this.props.currentCategory.color}
                        onColorSelected={(color)=>{this.props.updateCategoryColor.call(null, this.props.currentCategory, color);this.toggleColorPicker();}}
                        onOldColorSelected={()=>{this.toggleColorPicker()}}
                        style={{flex: 1}}
                        />
                    <View style={{position:'absolute', top:0, right:0,zIndex: this.state.colorPickerZIndex+1}}>
                        <IconToggle onPress={()=>{this.toggleColorPicker()}}><Icon name='close' color="#fff" /></IconToggle>
                    </View>
                </Animated.View>
        )

    }
}

CategoryColorPicker.contextTypes = contextTypes;

export default CategoryColorPicker