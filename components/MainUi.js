import React, { Component, PropTypes } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableHighlight,
    Animated,
    ScrollView,
    Dimensions
} from 'react-native';
import Container from './Container'
import { ActionButton, Toolbar, IconToggle, Icon } from 'react-native-material-ui';
import moment from 'moment'
import {shadeColor} from '../utils'
import { TriangleColorPicker } from 'react-native-color-picker'

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};



class MainUi extends Component {

    constructor(props) {
        super(props);
        this.state = {
            transactions: [],
            categoryColumnWidth: new Animated.Value(1),
            categoryColumnOpen: true,
            currentCategory: false,
            colorPickerZIndex: 0,
            colorPickerOpacity: new Animated.Value(0),
            viewHeight: 300
        }
    }


    //shouldComponentUpdate(nextProps, nextState) {
    //    if(this.state.colorPickerZIndex !== nextState.colorPickerZIndex) {
    //        return false;
    //    }
    //    return true;
    //}

    componentWillReceiveProps(newProps) {
        if(newProps.open !== this.state.categoryColumnOpen) {
            this.setState({categoryColumnOpen: newProps.open});
            this.toggleCategoryColumn();
        }
    }

    displaySecondPane = () => {
        
        const fontSize = 20;
        if(!this.props.currentCategory) {
            return null;
        }
        if(this.props.currentCategory && this.props.currentCategory.categories) {
            //category is the "Other" grouping
            return this.props.currentCategory.categories.map((c, i) => {

                const percent = c.amount / this.props.currentCategory.amount;
                const itemHeight = (this.state.viewHeight * percent < 10 ? 10 : this.state.viewHeight * percent);

                //console.log('get new color', transactionsForCategory.length, this.state.currentCategory.color, shade, color);
                //Get category color brightness
                const m = c.color.match(/^#([0-9a-f]{6})$/i)[1];
                var brightness = 0;
                if( m) {

                    brightness = (299*parseInt(m.substr(0,2),16)+
                        587*parseInt(m.substr(2,2),16)+
                        114*parseInt(m.substr(4,2),16))/1000

                }

                var textColor = '#FFF';
                if(brightness > 180) {
                    textColor = '#333';
                }

                return (

                    <View key={c.name} style={{flex: percent, backgroundColor: c.color, flexDirection:'column', alignItems: 'stretch', justifyContent:'center'}}>
                        <Animated.Text
                            numberOfLines={1}
                            style={{
                            textAlign: 'center',
                            padding:0,
                            margin:0,
                            lineHeight: (itemHeight < fontSize ? itemHeight : fontSize),
                            fontSize: (itemHeight/2 < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [itemHeight*0.75, 0]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [fontSize, 0]})),
                            color: textColor}}>
                            {c.name} {c.amount.toFixed(2)}
                        </Animated.Text>
                    </View>
                )
            });

        }
        return this.props.transactionsForCategory.transactions.map((t, i) => {

            const percent = t.amount / this.props.transactionsForCategory.total;
            const itemHeight = (this.state.viewHeight * percent < 10 ? 10 : this.state.viewHeight * percent);
            const shade = this.props.transactionsForCategory.transactions.length > 1 ? i / this.props.transactionsForCategory.transactions.length-0.2 : 0
            const color = shadeColor(t.category.color, shade);

            //console.log('get new color', transactionsForCategory.length, this.state.currentCategory.color, shade, color);
            //Get category color brightness
            const m = color.match(/^#([0-9a-f]{6})$/i)[1];
            var brightness = 0;
            if( m) {

                brightness = (299*parseInt(m.substr(0,2),16)+
                    587*parseInt(m.substr(2,2),16)+
                    114*parseInt(m.substr(4,2),16))/1000

            }

            var textColor = '#FFF';
            if(brightness > 180) {
                textColor = '#333';
            }

            const dateText = percent < 0.05 ? null : <Animated.Text numberOfLines={1} style={{textAlign: 'center', padding:0, margin:0, fontSize: (itemHeight/2 < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [itemHeight*0.65, 0]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [fontSize*0.75, 0]})), color: textColor}}>{moment(t.date).calendar()}</Animated.Text>


            const colorPicker = (i==0) ? <Animated.View style={{opacity: this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [1, 0]}),position:'absolute', top:0, right:0}}>
                <IconToggle onPress={this.toggleColorPicker}><Icon name='color-lens' color={textColor} /></IconToggle>
            </Animated.View> : null;

            return (

                <View key={t.name+''+t.date} style={{flex: (percent < 0.015 ? 0.015 : percent), backgroundColor: color, flexDirection:'column', alignItems: 'stretch', justifyContent:'center'}}>
                    {colorPicker}
                    <Animated.Text numberOfLines={1} style={{textAlign: 'center', padding:0, margin:0, lineHeight: (itemHeight < fontSize ? itemHeight : fontSize), fontSize: (itemHeight/2 < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [itemHeight*0.75, 0]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [fontSize, 0]})), color: textColor}}>{t.name} {t.amount.toFixed(2)}</Animated.Text>
                    {dateText}
                </View>
            )
        });


    }


    toggleCategoryColumn = () => {

            const nextAnimValue = (this.state.categoryColumnOpen ? 0.2 : 1);

            Animated.timing(
                this.state.categoryColumnWidth,
                {toValue: nextAnimValue}
            ).start();



    }

    toggleColorPicker = () => {
        console.log('toggle color picker');
        if(this.state.colorPickerZIndex === 0) { //color picker is hidden, show
            this.setState({colorPickerZIndex:90})
            Animated.timing(
                this.state.colorPickerOpacity,
                {toValue: 1}
            ).start();
        } else {
            Animated.timing(
                this.state.colorPickerOpacity,
                {toValue: 0}
            ).start(() => {
                    this.setState({colorPickerZIndex:0})
                });
        }

    }



    measureView(event) {
        //console.log('measure view', event.nativeEvent.layout);
        this.setState({
            viewHeight: event.nativeEvent.layout.height
        })
    }


    render() {

        var {height, width} = Dimensions.get('window');

        const fontSize = 20;

        const categoriesChartDisplay = this.props.displayCategories.categories.map((c) => {
            if(!c.color) {
                c.color='#FF0000';
            }
            const percent = c.amount / this.props.displayCategories.total;
            const itemHeight = (this.state.viewHeight * percent < 12 ? 12 : this.state.viewHeight * percent);

            //console.log('item height', itemHeight, fontSize, percent*100);

            //Get category color brightness
            const m = c.color.match(/^#([0-9a-f]{6})$/i)[1];
            var brightness = 0;
            //console.log('matching color', c.color, m);
            if( m) {

                brightness = (299*parseInt(m.substr(0,2),16)+
                    587*parseInt(m.substr(2,2),16)+
                    114*parseInt(m.substr(4,2),16))/1000

            }

            //console.log('brightness for category '+c.name+' is ', brightness);
            var textColor = '#FFF';
            if(brightness > 180) {
                textColor = '#333';
            }

            return (
            <TouchableHighlight
                activeOpacity={.6}
                underlayColor='#fff'
                style={{
                    flex: percent,
                    alignItems:'stretch',
                    justifyContent:'center'
                    }}
                key={c.name}
                onPress={this.props.changeCurrentCategory.bind(this, c)}
                >
                <View style={{
                    backgroundColor: c.color,
                    flex:1,
                    flexDirection:'column',
                    alignItems: 'stretch',
                    justifyContent:'center'
                }}>
                    <Animated.Text
                        numberOfLines={1}
                        style={{
                            textAlign: 'center',
                            fontSize: (itemHeight < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [12, itemHeight*0.95]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [12, fontSize]})),
                            color: textColor
                        }}
                        >
                        {c.name} {c.amount.toFixed(2)}
                    </Animated.Text>
                </View>
            </TouchableHighlight>
            )
        });


        const transactionsChartDisplay = this.displaySecondPane();


        //console.log(transactionsChartDisplay);
        return (
            <View style={{position:'absolute', top:70, bottom:0, left:0, right:0}}  onLayout={(event) => this.measureView(event)}>
                <Animated.View style={{position: 'absolute', top: 0, left:0, right:0, bottom:0, zIndex: this.state.colorPickerZIndex, opacity: this.state.colorPickerOpacity, backgroundColor:'rgba(0,0,0,0.98)'}}>
                    <View style={{position:'absolute', top:0, right:0, zIndex:100}}>
                        <IconToggle onPress={this.toggleColorPicker}><Icon name='close' color="#fff" /></IconToggle>
                    </View>
                    <TriangleColorPicker
                        oldColor={this.state.currentCategory.color}
                        onColorSelected={(color)=>{this.props.updateCategoryColor.call(null, this.state.currentCategory.name, color);this.toggleColorPicker();}}
                        onOldColorSelected={(color)=>{this.props.updateCategoryColor.call(null, this.state.currentCategory.name, color);this.toggleColorPicker()}}
                        style={{flex: 1}}
                        />
                </Animated.View>
                    <View style={{flex:1, flexDirection: 'row', alignItems:'stretch'}}>
                        <Animated.View style={{width: this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [0, width]})}}>
                            {categoriesChartDisplay}
                        </Animated.View>
                        <Animated.View style={{width: this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [width, 0]}), backgroundColor:(this.state.currentCategory ? this.state.currentCategory.color : '#fff')}}>

                            {transactionsChartDisplay}
                        </Animated.View>
                    </View>

            </View>
        )
    }
}

MainUi.contextTypes = contextTypes;

export default MainUi