import { View, StyleSheet, Animated, TouchableWithoutFeedback, Image, Text } from 'react-native';
import React, { Component, PropTypes } from 'react';
import { Drawer, Avatar, Toolbar, Button, Icon, IconToggle } from 'react-native-material-ui';
import Container from './Container'
import MainUi from './MainUi'
import LoginForm from './LoginForm'
import UserMenu from './UserMenu'
import PouchDB from 'pouchdb-react-native'
import md5 from 'md5'
import moment from 'moment'
import {getAvailableMonths, getNumberOfTransactionsByMonth} from '../data/dataHandler'

const styles = StyleSheet.create({
    drawer: {
        flex: 1,
        elevation: 6,
        //width: 260,
        //backgroundColor:'transparent',
        //shadowColor: "#000",
        //shadowOpacity: 0.4,
        //shadowRadius: 4,
        //shadowOffset:{width: 4, height: 0},
        position: 'absolute',
        left:     0,
        top:      70,
        bottom: 0,
        right:-2000
    },
    menu: {
        elevation: 2,
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 3,
        shadowOffset:{width: 0, height: 0},
    },
    rightText: {
        fontSize: 10
    }
});

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};


class NewDrawer extends Component {


    constructor(props) {
        super(props);
        this.state= {
            drawerOpen: false,
            drawerAnim: new Animated.Value(0),
            overlayHidden: true,
            menuHeight: new Animated.Value(0),
            months: [],
            transactionsPerMonth: {},
            transactions: [],
            timeToDisplay: moment().format('YYYYMM'),
        }
    }

    signupPressed = () => {
        console.log('signup pressed');
    }

    componentWillReceiveProps(newprops) {
        //console.log('AnimatedDrawer receiving props', newprops);

        if(newprops.show !== this.state.drawerOpen) {
            this.toggleDrawer();
        }
    }

    animateMenu = (nextAnimValue) => {
        Animated.timing(
            this.state.menuHeight,
            {toValue: nextAnimValue}
        ).start();
    }


    toggleDrawer = () => {
        console.log('toggle drawer');
        const nextAnimValue = (this.state.drawerOpen ? 0 : 1);
        Animated.timing(
            this.state.drawerAnim,
            {toValue: nextAnimValue, duration: 200, useNativeDriver: true,}
        ).start(() => {
                if(!this.state.overlayHidden && !this.state.drawerOpen) {
                    this.setState({overlayHidden: true});
                }
            });
        this.setState({drawerOpen: !this.state.drawerOpen});
        if(this.state.overlayHidden) {
            this.setState({overlayHidden: false});
        }
    }

    render() {

        console.log('Render NewDrawer');

        const sections = this.props.months.map((y, i) => {
            var yearTransactions = 0;
            const year = moment(y[0], 'YYYYMM').format('YYYY');
            var items = y.map((m) => {
                yearTransactions += this.props.transactionsPerMonth[m];

                //console.log(m, this.state.timeToDisplay);
                return {
                    active: (this.props.currentDate === m),
                    value: moment(m, 'YYYYMM').format('MMMM'),
                    icon:'today',
                    right: <Text style={styles.rightText} onPress={this.props.changeDate.bind(this, m)}>{this.props.transactionsPerMonth[m]+''}</Text>,
                    onPress: this.props.changeDate.bind(this, m)
                };
            })
            items.push({
                active: (this.props.currentDate === year),
                value: 'All of '+year,
                icon:'event-note',
                right: <Text style={styles.rightText} onPress={this.props.changeDate.bind(this, year)}>{yearTransactions}</Text>,
                onPress: this.props.changeDate.bind(this, year)
            })
            var showDivider = !(i===this.props.months.length-1)
            //console.log('items', items, showDivider);
            return(
                <Drawer.Body.Section
                    key={year}
                    title={year}
                    divider={showDivider}
                    items={items}
                    />
            );
        });


        return (<Animated.View style={ [
                styles.drawer,
                {
                    transform:[
                        {
                            translateX: this.state.drawerAnim.interpolate({inputRange: [0,0.0001, 1], outputRange: [-3000,-280, 0]})
                        }
                    ]
                }
                ]}>
                <TouchableWithoutFeedback onPress={this.props.toggleDrawer}>

                    <Animated.View style={{position:'absolute', top: 0, left: 0, width: 800, bottom:0, opacity: this.state.drawerAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.6]}), backgroundColor: "#000", transform:[{translateX: this.state.drawerAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0]})}]}}>
                    </Animated.View>
                </TouchableWithoutFeedback>
                <View style={{flex:1, width: 260}}>
                <Drawer>
                    <UserMenu
                        user={this.props.user}
                        logout={this.props.logout}
                        animateMenu={this.animateMenu}
                        loginPressed={this.props.toggleLoginForm}
                        signupPressed={this.props.toggleSignupForm}
                        />
                    <Drawer.Body>
                        {this.props.user ?
                            <Animated.View style={{height: this.state.menuHeight, opacity: this.state.menuHeight.interpolate({ inputRange: [0, 110], outputRange: [0, 1] })}}>

                                <Drawer.Body.Section
                                    title="Manage account"
                                    divider
                                    items={[
                                    { icon: <IconToggle style={{width:40}} onPress={this.props.logout}><Icon style={{width:48}} name='power-settings-new'/></IconToggle>, value: <IconToggle onPress={this.props.logout}><Text>Logout</Text></IconToggle>, onPress: ()=>{this.props.logout.call(this)} },
                                ]}
                                    />
                            </Animated.View> : null}
                        {sections}

                    </Drawer.Body>
                </Drawer>
                </View>

            </Animated.View>
            );

    }
}


NewDrawer.contextTypes = contextTypes;

export default NewDrawer;