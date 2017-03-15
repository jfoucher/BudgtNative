import React, { Component, PropTypes } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableHighlight,
    Animated,
    ScrollView,
    Dimensions,

} from 'react-native';
import NativeMethodsMixin from 'NativeMethodsMixin'
import Container from './Container'
import CategoryColorPicker from './CategoryColorPicker'
import TouchableWithFeedback from './TouchableWithFeedback'
import { IconToggle, Icon } from 'react-native-material-ui';
import moment from 'moment'
import {shadeColor, getTextColor} from '../utils'


const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
    placeholderText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 25,
    }
})

class MainUi extends Component {

    constructor(props) {
        super(props);
        this.state = {
            transactions: [],
            categoryColumnWidth: new Animated.Value(1),
            categoryColumnOpen: true,
            currentCategory: false,
            viewHeight: 300,
            bgcolor:'#fff',
            placeholderOpacity: new Animated.Value(0),
            displayCategoriesText: true,
        }
    }


    componentWillReceiveProps(newProps) {
        console.log('componentWillReceiveProps mainUI', this.props, newProps, this.props===newProps);
        if(this.props.currentCategory && newProps.currentCategory === false) {
            const shade = (this.props.displayCategories.categories.length === 1 || this.props.transactionsForCategory.transactions.length > 1) ? -0.2 : 0;
            const color = shadeColor(this.props.currentCategory.color, shade);
            this.setState({bgcolor: color});
        }
        if(newProps.open !== this.state.categoryColumnOpen) {
            this.setState({categoryColumnOpen: newProps.open});
            const nextAnimValue = (newProps.open ? 1 : 0.2);
            this.toggleCategoryColumn(nextAnimValue);
        }
    }

    //
    //shouldComponentUpdate(nextProps, nextState) {
    //    //if(nextProps) {
    //        //console.log('should main ui update', this.props, nextProps, this.state, nextState);
    //    //}
    //
    //    if(nextProps.open !== this.props.open) {
    //        return true;
    //    }
    //    if(nextState.displayCategoriesText !== this.state.displayCategoriesText) {
    //        return true;
    //    }
    //    if(nextState.colorPickerZIndex !== this.state.colorPickerZIndex) {
    //        return true;
    //    }
    //
    //    if(nextProps.currentCategory && this.props.currentCategory && this.props.currentCategory.name === nextProps.currentCategory.name) {
    //        return false;
    //    }
    //
    //
    //    return true;
    //}


    toggleCategoryColumn = (nextAnimValue) => {
        //console.log('animation start, nextAnimValue is', nextAnimValue);
        if(nextAnimValue === 1) {
            this.setState({displayCategoriesText: true});
        }

        Animated.timing(
            this.state.categoryColumnWidth,
            {toValue: nextAnimValue}
        ).start(() => {
                //console.log('animation ended, nextAnimValue is', nextAnimValue);
                if(nextAnimValue === 0.2) {
                    this.setState({displayCategoriesText: false});
                }
            });

    }



    measureView(event) {
        //console.log('measureView', event.nativeEvent);
        if(this.state && this.state.viewHeight) {
            //console.log('this.state.viewHeight is set to', this.state.viewHeight);
            return;
        }
        //console.log('typeof set state', typeof this.setState);
        this.setState({viewHeight: event.nativeEvent.layout.height});
    }



    displayFirstPane = () => {
        //console.log('rendering first pane, this.state.displayCategoriesText is ', this.state.displayCategoriesText)
        if(!this.props.displayCategories || this.props.displayCategories.categories.length === 0) {
            //We don't have anything to display for this month, show helpful text

            Animated.timing(
                this.state.placeholderOpacity,
                {
                    toValue: 1,
                    duration: 1000
                }
            ).start();

            return (

                <Animated.View style={{
                        backgroundColor: this.context.uiTheme.palette.primary2Color,
                        flex:1,
                        flexDirection:'column',
                        alignItems: 'stretch',
                        justifyContent:'center',
                        padding: 20,
                        opacity: this.state.placeholderOpacity.interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 0, 1]})
                    }}>
                    <Text style={styles.placeholderText}>No transactions for this month yet. </Text>
                    <View style={{height:20}}></View>
                    <Text style={[styles.placeholderText, {fontSize: 18}]}>Click the orange button below to add your first one</Text>
                </Animated.View>
            )
        }

        const fontSize = 20;
        //console.log('render first pane', this.props.displayCategories);
        return this.props.displayCategories.categories.map((c) => {

            //console.log('generating categories display', c);
            if(!c.color) {
                c.color='#FF0000';
            }
            const percent = c.amount / this.props.displayCategories.total;
            const itemHeight = (this.state.viewHeight * percent < 12 ? 12 : this.state.viewHeight * percent);

            //console.log('item height', itemHeight, fontSize, percent*100);

            //Get category text color
            const textColor = getTextColor(c.color);

            return (
                <TouchableWithFeedback
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
                        {this.state.displayCategoriesText ? <Animated.Text
                            numberOfLines={1}
                            style={{
                            textAlign: 'center',
                            fontSize: (itemHeight < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [0, itemHeight*0.95]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [0, fontSize]})),
                            color: textColor,
                            opacity: this.state.categoryColumnWidth.interpolate({inputRange: [0, 0.5, 1], outputRange: [0, 1, 1]})
                        }}
                            >
                            {c.name} {c.amount.toFixed(2)}
                        </Animated.Text> : null}
                    </View>
                </TouchableWithFeedback>
            )

        });


    }

    displaySecondPane = () => {

        const fontSize = 20;
        if(!this.props.currentCategory) {
            return <View style={{flex: 1, backgroundColor: this.state.bgcolor, flexDirection:'column', alignItems: 'stretch', justifyContent:'center'}}></View>;
        }
        if(this.props.currentCategory && this.props.currentCategory.categories) {
            //category is the "Other" grouping
            return this.props.currentCategory.categories.map((c, i) => {

                const percent = c.amount / this.props.currentCategory.amount;
                const itemHeight = (this.state.viewHeight * percent < 10 ? 10 : this.state.viewHeight * percent);

                const textColor = getTextColor(c.color);

                return (

                    <View key={c.name} style={{flex: percent, backgroundColor: c.color, flexDirection:'column', alignItems: 'stretch', justifyContent:'center'}}>

                        <Animated.Text
                            numberOfLines={1}
                            style={{
                            textAlign: 'center',
                            padding:0,
                            margin:0,
                            lineHeight: (itemHeight < fontSize ? itemHeight : fontSize),
                            fontSize: (itemHeight < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [itemHeight*0.75, 0]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [fontSize, 0]})),
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
            //console.log('one transaction color', this.props.displayCategories.categories.length);
            const shade = (this.props.displayCategories.categories.length === 1 || this.props.transactionsForCategory.transactions.length > 1) ? i / this.props.transactionsForCategory.transactions.length-0.2 : 0;
            const color = shadeColor(t.category.color, shade);


            const textColor = getTextColor(color);

            const dateText = percent < 0.05 ? null : <Animated.Text numberOfLines={1} style={{textAlign: 'center', padding:0, margin:0, fontSize: (itemHeight < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [itemHeight*0.45, 0]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [fontSize*0.5, 0]})), color: textColor}}>{moment(t.date).calendar()}</Animated.Text>



            return (

                <View key={t.name+''+t.date} style={{flex: (percent < 0.015 ? 0.015 : percent), backgroundColor: color, flexDirection:'column', alignItems: 'stretch', justifyContent:'center'}}>
                    <Animated.Text numberOfLines={1} style={{textAlign: 'center', padding:0, margin:0, lineHeight: (itemHeight < fontSize ? itemHeight : fontSize), fontSize: (itemHeight < fontSize ? this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [itemHeight*0.75, 0]}) : this.state.categoryColumnWidth.interpolate({inputRange: [0.2, 1], outputRange: [fontSize*.9, 0]})), color: textColor}}>{t.name} {t.amount.toFixed(2)}</Animated.Text>
                    {dateText}
                </View>
            )
        });


    }



    render() {

        console.log('render MainUI');

        const categoriesChartDisplay = this.displayFirstPane();
        const transactionsChartDisplay = this.displaySecondPane();
        //console.log('categoriesChartDisplay', categoriesChartDisplay);
        return (
            <View style={{position:'absolute', top:70, bottom:0, left:0, right:0}} onLayout={(e)=>{this.measureView(e)}}>


                <View style={{flex:1, flexDirection: 'row', alignItems:'stretch'}}  ref="mainUI">
                    <Animated.View style={{flex: this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [0, 1]})}}>
                        {categoriesChartDisplay}
                    </Animated.View>
                    <Animated.View style={{flex: this.state.categoryColumnWidth.interpolate({inputRange: [0, 1], outputRange: [1, 0]}), backgroundColor:this.state.bgcolor}}>
                        {transactionsChartDisplay}
                    </Animated.View>
                </View>

            </View>
        )
    }
}

MainUi.contextTypes = contextTypes;

export default MainUi