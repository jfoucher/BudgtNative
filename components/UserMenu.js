import React, { Component, PropTypes } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableWithoutFeedback,
    Animated,
    Image,
    NativeModules, findNodeHandle
} from 'react-native';
import md5 from 'md5';
import { ListItem, Icon, IconToggle, Drawer, Avatar, Button} from 'react-native-material-ui';
import CachedImage from 'react-native-cached-image';

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
    avatar: {
        borderRadius: 30,
        borderWidth: 3,
        width: 60,
        height: 60}
})

class UserMenu extends Component {

    constructor(props) {
        super(props);
        this.state = {
            menuShown: false,
            menuArrow: 'arrow-drop-down'
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        if(this.props.user === nextProps.user) {
            return false;
        }
        return true;
    }

    toggleMenu = () => {

        const nextAnimValue = this.state.menuShown ? 0 : 110;
        //console.log('trying to make menu appear', nextAnimValue, this.state.menuShown);
        this.setState({menuShown: !this.state.menuShown, menuArrow:(this.state.menuArrow==='arrow-drop-up' ? 'arrow-drop-down' : 'arrow-drop-up')})
        this.props.animateMenu(nextAnimValue);


    }

    logout = () => {
        console.log('logout pressed');
        this.props.logout();
    }



    render() {
        console.log('render UserMenu');
        const { primaryColor, primary2Color } = this.context.uiTheme.palette;

        const img = <Image source={require('../images/bg.png')} />;



        var header =
            <Drawer.Header image={img}>
                <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
                    <View style={{backgroundColor: "#000", opacity: 0.5, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}></View>
                    <View style={{flex:1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'}}>

                        <Button raised accent text="Login" onPress={this.props.loginPressed} />
                        <Button raised accent text="Signup"  onPress={this.props.signupPressed} />

                    </View>
                    <Text style={{padding: 8, textAlign: 'center', color:"#fff", backgroundColor:'rgba(0,0,0,0)'}}>Login or signup to sync between all your devices</Text>

                </View>
            </Drawer.Header>

        if(this.props.user) {
            const avatarUrl = 'https://www.gravatar.com/avatar/'+md5(this.props.user.email)+'?s=180&d='+encodeURIComponent('https://api.adorable.io/avatars/120/'+md5(this.props.user.email)+'.png');


            const avatarImage = <CachedImage style={[styles.avatar, {borderColor: primaryColor}]} source={{uri: avatarUrl}} />
            header = <Drawer.Header.Account
                avatar={avatarImage}
                accounts={[]}
                footer={{
                                    onRightElementPress: this.toggleMenu,
                                    dense: true,
                                    centerElement: {
                                        primaryText: this.props.user.fullname,
                                        secondaryText: this.props.user.email,
                                    },
                                    rightElement: this.state.menuArrow,
                                }}
                />
        }


        return (
            <Drawer.Header image={img}>
                {header}
            </Drawer.Header>
        );

    }
}

UserMenu.contextTypes = contextTypes;

export default UserMenu