import React, { Component, PropTypes } from 'react';
import {

    Text,
    View,
    Animated,
    TouchableWithoutFeedback,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import Container from './Container'
import Spinner from './Spinner'
import { Dialog, DialogDefaultActions } from 'react-native-material-ui';

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

class TransactionForm extends Component {


    constructor(props) {
        super(props);
        this.state= {
            amount: 0,
            item: '',
            category: '',
            focusedInput: 'none',
            loginError: false,
            submitting: false,
            spinnerOpacity: new Animated.Value(0)
        }
    }

    componentWillReceiveProps(newProps) {
        //console.log('login form will get new props', newProps, this.props);
        if (!newProps.show && this.props.show) {
            console.log('form is hiding, unfocus fields');
            this.refs.item.blur();
            this.refs.amount.blur();
            this.refs.category.blur();
        }
    }

    spinnerAnimation = (to, callback) => {
        Animated.timing(this.state.spinnerOpacity, {
            toValue: to,
            duration: 200,
            useNativeDriver: true,
        }).start(callback);
    };

    action = (pressed) => {
        if(pressed == 'Cancel') {
            return this.props.toggle.call(this);
        }

        const data = {amount: this.state.amount, item: this.state.item, category: this.state.category};
        console.log(data);

        const promise = this.props.action.call(this, data);
        if(!promise) {
            return;
        }
        //Display Spinner
        this.spinnerAnimation(1);
        this.refs.item.blur();
        this.refs.amount.blur();
        this.refs.category.blur();
        this.setState({submitting: true});
        promise.then((u) => {
            //this.toggleForm();
            this.spinnerAnimation(1, () => {this.setState({submitting: false});});

        }).catch((e) => {
            this.spinnerAnimation(1, () => {this.setState({loginError: true, submitting: false})});
        });

    }


    render() {
        console.log('render TransactionForm');
        const { primaryColor, primary2Color } = this.context.uiTheme.palette;
        var focusColor = primaryColor;
        var blurColor = "#ccc";
        if(this.state.loginError) {
            focusColor = "#F66";
            blurColor = "#F66";
        }

        return (

            <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={Platform.OS === 'ios' ? 70: -200}>

                <Dialog>

                    <Dialog.Title><Text>New transaction</Text></Dialog.Title>
                    <Dialog.Content>

                        <Text style={{color: '#666'}}>AMOUNT</Text>
                        <View style={{height: 35, borderBottomColor: (this.state.focusedInput === 'amount' ? focusColor : blurColor), borderBottomWidth: 2}}>
                        <TextInput
                            ref='amount'
                            style={{height: 35}}
                            onChangeText={(text) => this.setState({amount: text})}
                            autoCorrect={false}
                            autoCapitalize='none'
                            keyboardType='numeric'
                            underlineColorAndroid='transparent'
                            placeholder='20.00'
                            onFocus={() => {this.setState({focusedInput: 'amount'})}}
                            //onBlur={(a) => {console.log('amount blurred', a.nativeEvent); this.setState({focusedInput: 'none', amount: a.nativeEvent.text})}}
                            returnKeyType='go'
                            onSubmitEditing={this.action}
                            />
                        </View>
                        <View style={{height:25}}></View>
                        <Text style={{color: '#666'}}>ITEM</Text>
                        <View style={{height: 35, borderBottomColor: (this.state.focusedInput === 'item' ? focusColor : blurColor), borderBottomWidth: 2}}>
                        <TextInput
                            ref='item'
                            style={{height: 35}}
                            onChangeText={(text) => this.setState({item: text})}
                            autoCorrect={false}
                            underlineColorAndroid='transparent'
                            placeholder='Lunch'
                            onFocus={() => {this.setState({focusedInput: 'item'})}}
                            //onBlur={(a) => {console.log('item blurred', a.nativeEvent); this.setState({focusedInput: 'none', item: a.nativeEvent.text})}}
                            returnKeyType='go'
                            onSubmitEditing={this.action}
                            />
                        </View>
                        <View style={{height:25}}></View>
                        <Text style={{color: '#666'}}>CATEGORY</Text>
                        <View style={{height: 35, borderBottomColor: (this.state.focusedInput === 'category' ? focusColor : blurColor), borderBottomWidth: 2}}>
                        <TextInput
                            ref='category'
                            style={{height: 35}}
                            onChangeText={(text) => this.setState({category: text})}
                            autoCorrect={false}
                            underlineColorAndroid='transparent'
                            placeholder='Restaurant'
                            onFocus={() => {this.setState({focusedInput: 'category'})}}
                            //onBlur={(a) => {console.log('category blurred', a); this.setState({focusedInput: 'none', category: a.nativeEvent.text})}}
                            returnKeyType='go'
                            onSubmitEditing={this.action}
                            />
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <DialogDefaultActions
                            actions={['Cancel', 'Save']}
                            onActionPress={this.action}
                            />
                    </Dialog.Actions>
                    {this.state.submitting ?
                        <Animated.View style={{opacity: this.state.spinnerOpacity, backgroundColor: 'rgba(0,0,0,0.4)', position:'absolute', top: 0, left: 0, bottom: 0, right: 0, flex:1, justifyContent:'center', alignItems: 'center'}}><Spinner size={80} /></Animated.View> : null}
                </Dialog>
            </KeyboardAvoidingView>
        )
    }
}

TransactionForm.contextTypes = contextTypes;

export default TransactionForm