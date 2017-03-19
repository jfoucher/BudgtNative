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
            currentCategory: false,
        }
    }

    componentWillReceiveProps(newProps) {
        //console.log('colorpicker will receive props', newProps.currentCategory);
        if(newProps.displayButton !== this.props.displayButton) {
            const nextVal = newProps.displayButton ? 0 : 1;
            Animated.timing(
                this.state.buttonOpacity,
                {toValue: nextVal}
            ).start();
        }

        if(this.props.open === false && newProps.open === false) {
            this.setState({currentCategory: false});
        } else {
            this.setState({currentCategory: newProps.currentCategory});
        }
        if(newProps.open !== this.props.open) {
            this.toggleColorPicker()
        }

    }


    toggleColorPicker = () => {
        if(this.state.colorPickerZIndex === -1) { //color picker is hidden, show
            this.setState({colorPickerZIndex: 9});
            this.props.toggle(true);
            Animated.timing(
                this.state.colorPickerOpacity,
                {toValue: 1}
            ).start();
        } else {
            Animated.timing(
                this.state.colorPickerOpacity,
                {toValue: 0}
            ).start(() => {
                    this.props.toggle(false);
                    this.setState({currentCategory: false, colorPickerZIndex: -1});
                });
        }

    }


    render() {
        console.log('render ColorPicker');

        if(!this.state.currentCategory) {
            return null;
        }
        var zIndex = {}
        if(Platform.OS==='ios') {
            zIndex = {zIndex: this.state.colorPickerZIndex}
        }
        return (

        <Animated.View style={
                    [styles.container,
                    {


                    //elevation: 2,
                    opacity: this.state.colorPickerOpacity,

                    transform:[
                            {
                                translateX: Platform.OS==='ios' ? 0 : this.state.colorPickerOpacity.interpolate({inputRange: [0,0.0001, 1], outputRange: [-3000,-560, 0]})
                            }
                        ]
                    }, zIndex]}>

                    <TriangleColorPicker
                        defaultColor={this.state.currentCategory.color}
                        oldColor={this.state.currentCategory.color}
                        onColorSelected={(color)=>{this.props.updateCategoryColor.call(null, this.state.currentCategory, color);this.toggleColorPicker();}}
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