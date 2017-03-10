import React, { Component, PropTypes } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    Image,
    Navigator, NativeModules, StatusBar,
    TouchableWithoutFeedback,
    Animated
} from 'react-native';

import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import TransactionForm from './TransactionForm'
import MainUi from './MainUi'
import Container from './Container'
import NewDrawer from './NewDrawer'
import AnimatedDrawer from './AnimatedDrawer'
import AnimatedDialog from './AnimatedDialog'
import { ActionButton, Toolbar } from 'react-native-material-ui';
import {getCategoriesForTime, getTransactionsForCategoryAndTime, getAvailableMonths, getNumberOfTransactionsByMonth} from '../data/dataHandler'
import PouchDB from 'pouchdb-react-native'
import moment from 'moment'
import md5 from 'md5'
import {guid} from '../utils'

const db = new PouchDB('Budgt6');
var sync = false;



//get all transactions and subscribe.

const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};



class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            categories: [],
            transactions: [],
            showDrawer: false,
            user: false,
            showLoginDialog: false,
            showSignupDialog: false,
            showTransactionDialog: false,
            displayCategories: {categories: [], total:0},
            transactionsForCategory: {transactions: [], total: 0},
            currentCategory: false,
            currentDate: moment().format('YYYYMM'),
            categoryColumnOpen: true,
        }
    }

    toggleDrawer = () => {
        this.setState({showDrawer: !this.state.showDrawer})
    }

    toggleLoginForm = () => {
        this.setState({showLoginDialog: !this.state.showLoginDialog})
    }
    toggleSignupForm = () => {
        this.setState({showSignupDialog: !this.state.showSignupDialog})
    }
    toggleTransactionForm = () => {
        console.log('show transaction form');
        this.setState({showTransactionDialog: !this.state.showTransactionDialog})
    }

    getAllData() {
        console.log('getting all data');
        var transactions = [];
        var categories = [];

        return db.allDocs({include_docs: true}).then((d) => {
            //console.log('got all data', d);
            transactions = d.rows.filter((r) => {
                return (r.doc.type && r.doc.type === 'transaction');

            }).map((r) => {return r.doc});
            categories = d.rows.filter((r) => {
                return (r.doc.type && r.doc.type === 'category')
            }).map((r) => {return r.doc});

            transactions.filter((t) => {
                if(typeof t.category === 'string') {
                    //console.log('removing transaction', t)
                    db.remove(t);
                }
                //console.log(t.amount)
                return true
            });
            this.setState({categories: categories, transactions: transactions});

            this.changeDate(this.state.currentDate);
            //console.log('transactions and categories', transactions, categories);
        })
    }


    componentDidMount() {
        this.getAllData().then(() => {
            console.log('changing date in mount');
            this.changeDate();
        });

        db.get('currentUser').then((user) => {
            //console.log('got user from local db', user);
            if(user.loggedIn) {
                this.setState({user: user});

                const remoteDB = new PouchDB('https://api.budgt.eu/u-'+md5(user.email), {ajax: {
                    headers: {
                        Authorization: user.auth
                    }
                }});
                this.setupSync(remoteDB);

            }
        }).catch((e) => {
            //console.log('could not get current local user', e)
        })

    }

    changeDate = (newDate = moment().format('YYYYMM')) => {
        console.log('change date from ', this.state.currentDate,' to ', newDate);
        if(this.state.currentDate !== newDate) {
            this.setState({categoryColumnOpen: true});
        }
        const displayCategories = getCategoriesForTime(this.state.transactions, newDate);
        if(this.state.currentCategory) {
            this.getCategoryTransactions(this.state.currentCategory)
        }
        this.setState({displayCategories: displayCategories, currentDate: newDate, showDrawer: false});
    }

    getCategoryTransactions = (category) => {

        console.log('getCategoryTransactions', category);
        if(category.name !== this.state.currentCategory.name) {
            const displayTransactions = getTransactionsForCategoryAndTime(this.state.transactions, category, this.state.currentDate);
            //console.log('change category, transactions are ', displayTransactions);
            this.setState({
                transactionsForCategory: displayTransactions,
                currentCategory: category,
                categoryColumnOpen: false
            });
        } else {
            this.setState({
                transactionsForCategory: [],
                currentCategory: false,
                categoryColumnOpen: true

            });
        }
    }



    updateCategoryColor = (categoryName, color) => {
        //alert(`Color selected for category ${categoryName}: ${color}`);

        //this.state.transactions contains all transactions
        //this.state.categories contains all categories
        const catName = categoryName.toLowerCase();
        const {transactions, categories} = this.state;
        categories.map((c) => {
            if(catName === c.name.toLowerCase()) {
                c.color = color;
                db.put(c)
            }
            return c;
        });
        transactions.map((t) => {
            if(t.category && t.category.name && catName === t.category.name.toLowerCase()) {
                t.category['color'] = color;
                db.put(t)
            }
            return t;
        });
        this.setState({transactions: transactions, categories: categories});
    }



    signup = (data, action) => {
        //console.log('signup', data, action);
        return new Promise((resolve, reject) => {
            setTimeout(() => {resolve()}, 3000)
        });


    }

    saveTransaction = (data, action) => {
        //console.log('save transaction', data, action);
        return new Promise((resolve, reject) => {

            //get categories and find one, or create new one

            var cat = this.state.categories.filter((c) => {
                return c.name.toLowerCase() == data.category.toLowerCase()
            });
            var category = {
                _id: 'c-'+guid(),
                name: data.category,
                color:'#CCCCCC',
                type:"category"
            }
            if(cat.length) {
                category = cat[0];
            }


            db.put({
                _id: 't-'+guid(),
                type:'transaction',
                amount: Number(data.amount),
                category: category,
                name: data.item,
                date: new Date()
            }).then((t) => {
                this.toggleTransactionForm();
                //console.log('transaction saved', t);
                db.put(category).then(() => {

                    this.getAllData().then(()=>{resolve(t);})
                }).catch(() => {
                    this.getAllData()
                });


            }).catch((e) => {
                //console.log('transaction errot', e)
                reject(e)
            });
            //setTimeout(() => {resolve()}, 3000)
        });


    }

    logout = () => {
        db.get('currentUser').then((u) => {
            u.loggedIn = false;
            u.auth = false;
            db.put(u);
        })
        this.setState({user: false});
    }

    login = (data, action) => {
        //console.log('logging in', data, action);
        if(action == 'Cancel') {
            this.toggleLoginForm()
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
            //console.log('logged in, got user', user);
            //this.setState({user:user});
            //Set up sync
            //console.log('username', username);
            const userDatabase = 'https://api.budgt.eu/u-'+md5(user.name.toLowerCase());
            //console.log('remote user database', userDatabase);
            const remoteDB = new PouchDB(userDatabase, ajaxOpts);

            remoteDB.get('currentUser').then((u) => {
                //console.log('got remote currentUser', u)
                u.auth = 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                u.loggedIn =  true;
                //console.log('setting this.state.user to', u);
                this.setState({user: u});
                db.put(u).then((newUser) => {
                    this.toggleLoginForm();
                    this.setupSync(remoteDB);
                    //console.log('user updated from ', u, 'to', newUser);

                }).catch((putUserError) => {
                    db.get('currentUser').then((u) => {
                        u.auth = 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                        u.loggedIn =  true;
                        db.put(u);
                        this.toggleLoginForm();
                        this.setupSync(remoteDB);
                    })
                    //console.log('could not create local user', putUserError)
                });
            }).catch((e) => {
                //console.log('no remote current user', e)
                //No remote current user, create local
                const currentUser = {
                    _id: 'currentUser',
                    email: user.name,
                    username: user.name.toLowerCase(),
                    fullname: user.fullname,
                    loggedIn:  true,
                    auth: 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                };

                //console.log('currentUser', currentUser);
                db.put(currentUser).then((newUser) => {
                    this.toggleLoginForm();
                    this.setupSync(remoteDB);
                    this.setState({user: newUser});
                    //console.log('user cretaed from ', currentUser, 'to', newUser);

                }).catch((putUserError) => {
                });
            });
        }).catch((e) => {
            //console.log('no user', e)
        });

        return loginPromise;

    }




    setupSync = (remoteDB) => {
        //console.log('setting up sync', sync);
        const self = this;
        if(!sync) {
            sync = db.sync(remoteDB, {
                live: true,
                retry: true
            });
            sync.on('change', function (change) {
                //console.log('change sync', change);
                //This is inefficient, try and do something better.
                self.getAllData();
            }).on('error', function (err) {
                //console.error('sync error', err);
            });
        }
        //console.log('Sync is set up', sync);

    }

    render() {

        //console.log('render app', this.state);
        const { primaryColor, primary2Color } = this.context.uiTheme.palette;

        const logo = require('../images/logo.png');
        const title =
            <View style={{flex:1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
                <Image source={logo} style={{}} />
                <Text style={{color:"#fff", fontSize: 30, marginLeft:10}} >Budgt</Text>
            </View>
        return (


                <Container>
                    <StatusBar barStyle='light-content' translucent={true} />

                    <View style={{
                        backgroundColor: primary2Color,
                        height: 20,
                        zIndex:45,
                        //elevation: 1,
                        //shadowColor: "#000",
                        //shadowOpacity: 0.5,
                        //shadowRadius: 2,
                        //shadowOffset:{width: 0, height: 1},
                    }} />



                    <Toolbar

                        leftElement={this.state.showDrawer ? 'close' : "menu"}
                        centerElement={title}
                        onLeftElementPress={this.toggleDrawer}
                        />

                    <MainUi
                        displayCategories={this.state.displayCategories}
                        updateCategoryColor={this.updateCategoryColor}
                        changeCurrentCategory={this.getCategoryTransactions}
                        currentCategory={this.state.currentCategory}
                        transactionsForCategory={this.state.transactionsForCategory}
                        open={this.state.categoryColumnOpen}
                        />
                    <ActionButton onPress={this.toggleTransactionForm}/>
                    <NewDrawer
                        user={this.state.user}
                        show={this.state.showDrawer}
                        months={getAvailableMonths(this.state.transactions)}
                        transactionsPerMonth={getNumberOfTransactionsByMonth(this.state.transactions)}
                        toggleDrawer={this.toggleDrawer}
                        toggleLoginForm={this.toggleLoginForm}
                        toggleSignupForm={this.toggleSignupForm}
                        changeDate={this.changeDate}
                        currentDate={this.state.currentDate}
                        logout={this.logout}
                        />

                    {(this.state.user === false) ? <AnimatedDialog
                        show={this.state.showLoginDialog}
                        toggle={this.toggleLoginForm}
                        inner={<LoginForm toggle={this.toggleLoginForm} show={this.state.showLoginDialog} login={this.login} />}
                        /> : null}

                    {(this.state.user === false) ? <AnimatedDialog
                        show={this.state.showSignupDialog}
                        toggle={this.toggleSignupForm}
                        inner={<SignupForm toggle={this.toggleSignupForm} show={this.state.showSignupDialog} action={this.signup} />}
                        /> : null}

                    <AnimatedDialog
                        show={this.state.showTransactionDialog}
                        toggle={this.toggleTransactionForm}
                        inner={<TransactionForm toggle={this.toggleTransactionForm} show={this.state.showTransactionDialog} action={this.saveTransaction} />}
                        />





                </Container>









        )
    }
}

App.contextTypes = contextTypes;

export default App