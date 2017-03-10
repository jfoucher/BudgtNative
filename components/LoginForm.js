import React, { Component, PropTypes } from 'react';
import {

    Text,
    View,
    Animated,
    TouchableWithoutFeedback,
    TextInput,
    KeyboardAvoidingView
} from 'react-native';
import Container from './Container'
import Spinner from './Spinner'
import { Dialog, DialogDefaultActions } from 'react-native-material-ui';

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

class LoginForm extends Component {


    constructor(props) {
        super(props);
        this.state= {
            email: '',
            focusedInput: 'none',
            loginError: false,
            submitting: false,
            spinnerOpacity: new Animated.Value(0)
        }
    }

    componentWillReceiveProps(newProps) {
        //console.log('login form will get new props', newProps, this.props);
        if (newProps.show !== this.props.show) {
            console.log('form is hiding, unfocus fields');
            this.refs.email.blur();
            this.refs.password.blur();
        }
    }

    spinnerAnimation = (to, callback) => {
        Animated.timing(this.state.spinnerOpacity, {
            toValue: to,
            duration: 200,
            useNativeDriver: true,
        }).start(callback);
    };

    login = (pressed) => {
        if(pressed == 'Cancel') {
            return this.props.toggle.call(this);
        }
        const promise = this.props.login.call(this, {email: this.state.email, password: this.state.password}, pressed);
        if(!promise) {
            return;
        }
        //Display Spinner
        this.spinnerAnimation(1);
        this.setState({submitting: true});
        promise.then((u) => {
            //this.toggleForm();
            this.spinnerAnimation(1, () => {this.setState({submitting: false});});

        }).catch(() => {
            this.spinnerAnimation(1, () => {this.setState({loginError: true, submitting: false})});
        })

    }


    render() {
        const { primaryColor, primary2Color } = this.context.uiTheme.palette;
        var focusColor = primaryColor;
        var blurColor = "#ccc";
        if(this.state.loginError) {
            focusColor = "#F66";
            blurColor = "#F66";
        }

        return (


            <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={70}>

                <Dialog>

                    <Dialog.Title><Text>Login to sync</Text></Dialog.Title>
                    <Dialog.Content>

                        <Text style={{color: '#666'}}>EMAIL</Text>
                        <View style={{height: 35, borderBottomColor: (this.state.focusedInput === 'email' ? focusColor : blurColor), borderBottomWidth: 2}}>
                        <TextInput
                            ref='email'
                            style={{height: 35}}
                            onChangeText={(text) => this.setState({email: text})}
                            autoCorrect={false}
                            autoCapitalize='none'
                            keyboardType='email-address'
                            placeholder='your@email.com'
                            onFocus={() => {this.setState({focusedInput: 'email'})}}
                            onBlur={(a) => {this.setState({focusedInput: 'none', email: a.nativeEvent.text})}}
                            returnKeyType='go'
                            onSubmitEditing={this.login}
                            />
                        </View>
                        <View style={{height:25}}></View>
                        <Text style={{color: '#666'}}>PASSWORD</Text>
                        <View style={{height: 35, borderBottomColor: (this.state.focusedInput === 'password' ? focusColor : blurColor), borderBottomWidth: 2}}>
                        <TextInput
                            ref='password'
                            secureTextEntry={true}
                            style={{height: 35}}
                            onChangeText={(text) => this.setState({password: text})}
                            placeholder='password'
                            autoCorrect={false}
                            onFocus={() => {this.setState({focusedInput: 'password'})}}
                            onBlur={(a) => {this.setState({focusedInput: 'none', password: a.nativeEvent.text})}}
                            returnKeyType='go'
                            onSubmitEditing={this.login}
                            />
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <DialogDefaultActions
                            actions={['Cancel', 'Login']}
                            onActionPress={this.login}
                            />
                    </Dialog.Actions>
                    {this.state.submitting ?
                        <Animated.View style={{opacity: this.state.spinnerOpacity, backgroundColor: 'rgba(0,0,0,0.4)', position:'absolute', top: 0, left: 0, bottom: 0, right: 0, flex:1, justifyContent:'center', alignItems: 'center'}}><Spinner size={80} /></Animated.View> : null}
                </Dialog>

            </KeyboardAvoidingView>
        )
    }
}

LoginForm.contextTypes = contextTypes;

export default LoginForm