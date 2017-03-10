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
        elevation: 4,
        width: 260,
        backgroundColor: '#FF5555',
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 4,
        shadowOffset:{width: 4, height: 0},
        position: 'absolute',
        left:     0,
        top:      20,
        bottom: 0,
        zIndex: 50
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


class AnimatedDrawer extends Component {


    constructor(props) {
        super(props);
        this.state= {
            drawerOpen: false,
            drawerAnim: new Animated.Value(0),
            overlayHidden: true,
            user: false,
            loginForm: <View></View>,
            showLoginForm: false,
            menuHeight: new Animated.Value(0),
            months: [],
            transactionsPerMonth: {},
            transactions: [],
            timeToDisplay: moment().format('YYYYMM')
        }
    }

    componentDidMount() {
        //Load user from db

        this.props.db.get('currentUser').then((user) => {
            //console.log('got user from local db', user);
            if(user.loggedIn) {
                this.setState({user: {name: user.email, fullname: user.fullname}})
                const remoteDB = new PouchDB('https://api.budgt.eu/u-'+md5(user.email), {ajax: {
                    headers: {
                        Authorization: user.auth
                    }
                }});
                this.props.setupSync.call(this, remoteDB);

            }
        }).catch((e) => {//console.log('could not get current local user', e)
         })
    }



    componentWillReceiveProps(newprops) {
        //console.log('AnimatedDrawer receiving props', newprops);

        if(newprops.show !== this.state.drawerOpen) {
            this.toggleDrawer();
        }

        //Set months

        if(this.props.transactions.length !== newprops.transactions.length) {
            this.setState({
                months: getAvailableMonths(newprops.transactions),
                transactionsPerMonth: getNumberOfTransactionsByMonth(newprops.transactions),
                transactions: newprops.transactions,
            });
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
            {toValue: nextAnimValue, duration: 1000}
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

    logout = () => {
        this.props.db.get('currentUser').then((u) => {
            u.loggedIn = false;
            u.auth = false;
            this.props.db.put(u);
        })
        this.setState({user: false});
    }

    login = (data, action) => {
        //console.log('logging in', data, action);
        if(action == 'Cancel') {
            this.loginPressed()
            return;
        }



        //DO login to db from here
        const username = data.email.toLowerCase();
        const ajaxOpts = {
            ajax: {
                headers: {
                    Authorization: 'Basic ' + window.btoa(username + ':' + data.password)
                }
            },
            auth: {
                username: username,
                password: data.password
            }
        };

        const usersDB = new PouchDB('https://api.budgt.eu/_users', {skip_setup:true, ajax: {cache: false}});
        var loginPromise = usersDB.get('org.couchdb.user:'+username, ajaxOpts);

        loginPromise.then((user) => {
           // console.log('got user', user)
            this.setState({user:user});
            this.loginPressed();
            //Set up sync

            const remoteDB = new PouchDB('https://api.budgt.eu/u-'+md5(username), ajaxOpts);

            this.props.setupSync.call(this, remoteDB);
            remoteDB.get('currentUser').then((u) => {
                u.auth = 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                u.loggedIn =  true;
                this.props.db.put(u).then((newUser) => {
                    //console.log('user updated from ', u, 'to', newUser);

                }).catch((putUserError) => {
                    //console.log('could not create local user', putUserError)
                });
            }).catch(() => {
                //No remote current user, create local
                const currentUser = {
                    _id: 'currentUser',
                    email: this.state.user.name,
                    username: this.state.user.name.toLowerCase(),
                    fullname: this.state.user.fullname,
                    loggedIn:  true,
                    auth: 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                };

                //console.log('currentUser', currentUser);
                this.props.db.put(currentUser).then((newUser) => {
                    //console.log('user cretaed from ', currentUser, 'to', newUser);

                }).catch((putUserError) => {
                });
            })
        }).catch((e) => {
            //console.log('no user', e)
        });

        return loginPromise;

    }

    loginPressed = () => {
        //Display Login form
        console.log('login button pressed');
        var loginForm = <View></View>;
        if(!this.state.showLoginForm) { //Showing login form
            loginForm = <LoginForm show={true} toggle={this.loginPressed} login={this.login} />
        }

        this.setState({showLoginForm: !this.state.showLoginForm, loginForm: loginForm});
    }

    signupPressed = () => {

    }


    render() {

        const logo = require('../images/logo.png');


        const sections = this.state.months.map((y, i) => {
            var yearTransactions = 0;
            const year = moment(y[0], 'YYYYMM').format('YYYY');
            var items = y.map((m) => {
                yearTransactions += this.state.transactionsPerMonth[m];

                //console.log(m, this.state.timeToDisplay);
                return {
                    active: (this.state.timeToDisplay === m),
                    value: moment(m, 'YYYYMM').format('MMMM'),
                    icon:'today',
                    right: <Text style={styles.rightText} onPress={() => {this.setState({timeToDisplay: m}); this.toggleDrawer();}}>{this.state.transactionsPerMonth[m]+''}</Text>,
                    onPress:() => {this.setState({timeToDisplay: m}); this.toggleDrawer();}
                };
            })
            items.push({
                active: (this.state.timeToDisplay === year),
                value: 'All of '+year,
                icon:'event-note',
                right: <Text style={styles.rightText} onPress={() => {this.setState({timeToDisplay: year});this.toggleDrawer();}}>{yearTransactions}</Text>,
                onPress:() => { this.setState({timeToDisplay: year}); this.toggleDrawer();}
            })
            var showDivider = !(i===this.state.months.length-1)
            //console.log('items', items, showDivider);
            return(
                <Drawer.Body.Section
                    key={year}
                    title={year}
                    divider={showDivider}
                    items={items}
                    />
            );
        })

        var mainUI = <MainUi transactions={this.state.transactions} timeToDisplay={this.state.timeToDisplay} categories = {this.props.categories} updateCategoryColor={this.props.updateCategoryColor} />

        mainUI=null;

        return (

            <View>

                <TouchableWithoutFeedback onPress={this.loginPressed}>
                    <View style={{zIndex:(this.state.showLoginForm ? 81 : 0), backgroundColor: '#000', opacity: (this.state.showLoginForm ? 0.5 : 0), position:'absolute', top:0, bottom: 0, left: 0, right:0, flex:1, flexDirection: 'row', justifyContent: 'center', paddingTop:50}}>
                        {this.state.loginForm}
                    </View>
                </TouchableWithoutFeedback>
                <View style={{zIndex:(this.state.showLoginForm ? 80 : 0), position:'absolute', top:0, bottom: 0, left: 0, right:0, flex:1, flexDirection: 'row', justifyContent: 'center', paddingTop:50}}>
                    {this.state.loginForm}
                </View>


                {mainUI}


                <TouchableWithoutFeedback onPress={this.toggleDrawer}>

                    <Animated.View style={{position:'absolute', top: 0, left: 0, right:0, bottom:0, zIndex: 20, opacity:  this.state.drawerAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.6]}), backgroundColor: "#000", transform:[{translateX: (this.state.overlayHidden ? -800 : 0)}]}}>
                    </Animated.View>
                </TouchableWithoutFeedback>


                <Animated.View style={ [
                styles.drawer,
                {
                    transform:[
                        {
                            translateX: this.state.drawerAnim.interpolate({inputRange: [0, 1], outputRange: [-280, 0]})
                        }
                    ]
                }
                ]}>

                    <Drawer>
                        <UserMenu
                            user={this.state.user}
                            logout={this.logout}
                            animateMenu={this.animateMenu}
                            loginPressed={this.loginPressed}
                            signupPressed={this.signupPressed}
                            />
                        <Drawer.Body>
                            {this.state.user ?
                                <Animated.View style={{height: this.state.menuHeight, opacity: this.state.menuHeight.interpolate({ inputRange: [0, 110], outputRange: [0, 1] })}}>

                                    <Drawer.Body.Section
                                        title="Manage account"
                                        divider
                                        items={[
                                    { icon: <IconToggle style={{width:40}} onPress={this.logout}><Icon style={{width:48}} name='power-settings-new'/></IconToggle>, value: <IconToggle onPress={this.logout}><Text>Logout</Text></IconToggle>, onPress: ()=>{this.logout.call(this)} },
                                ]}
                                        />
                                </Animated.View> : null}
                            {this.state.user ? sections : null}

                        </Drawer.Body>
                    </Drawer>
                </Animated.View>



            </View>
        );
    }
}

//<Drawer.Body.Section
//    divider={false}
//    items={[
//                                    { icon: 'bookmark-border', value: 'Notifications' },
//                                    { icon: 'today', value: 'Calendar', active: true },
//                                    { icon: 'people', value: 'Clients' },
//                                ]}
//    />
//<Drawer.Body.Section
//title="Personal"
//items={[
//{ icon: 'info', value: 'Info' },
//{ icon: 'settings', value: 'Settings' },
//]}
///>


AnimatedDrawer.contextTypes = contextTypes;

export default AnimatedDrawer;