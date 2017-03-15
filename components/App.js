import React, { Component, PropTypes } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    Image,
    Navigator, NativeModules, StatusBar,
    TouchableWithoutFeedback,
    Animated,
    Platform
} from 'react-native';

import CategoryColorPicker from './CategoryColorPicker'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import TransactionForm from './TransactionForm'
import MainUi from './MainUi'
import Container from './Container'
import NewDrawer from './NewDrawer'
import AnimatedDialog from './AnimatedDialog'
import { ActionButton, Toolbar, Icon, IconToggle } from 'react-native-material-ui';
import {getCategoriesForTime, getTransactionsForCategoryAndTime, getAvailableMonths, getNumberOfTransactionsByMonth} from '../data/dataHandler'
import PouchDB from 'pouchdb-react-native'
import moment from 'moment'
import md5 from 'md5'
import {guid, getRandomColor, getTextColor, shadeColor} from '../utils'


const db = new PouchDB('Budgt');
var sync = false;
//db.destroy();

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
            colorPickerOpen: false
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

    //shouldComponentUpdate(nextProps, nextState) {
    //
    //    return true;
    //}


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

            this.setState({
                categories: categories,
                transactions: transactions,
                displayCategories:  getCategoriesForTime(transactions, this.state.currentDate)
            });

            //this.changeDate(this.state.currentDate);
            //console.log('transactions and categories', transactions, categories);
        }).catch((e) => {
            console.log('error', e);
            throw e;
        });
    }


    componentDidMount() {

        this.getAllData();

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



    updateCategoryColor = (category, color) => {
        //alert(`Color selected for category ${categoryName}: ${color}`);

        //this.state.transactions contains all transactions
        //this.state.categories contains all categories
        const catName = category.name.toLowerCase();
        category.color = color;
        const {transactions, categories} = this.state;
        categories.map((c) => {
            if(catName === c.name.toLowerCase()) {
                c.color = color;
                db.put(c).then(()=>{}).catch(()=>{})
            }
            return c;
        });
        transactions.map((t) => {
            if(t.category && t.category.name && catName === t.category.name.toLowerCase()) {
                t.category['color'] = color;
                db.put(t).then(()=>{}).catch(()=>{})
            }
            return t;
        });
        //if(this.state.currentCategory) {
        //    this.getCategoryTransactions(this.state.currentCategory)
        //}
        //this.changeDate();
        this.setState({transactions: transactions, categories: categories, currentCategory: category, displayCategories: getCategoriesForTime(transactions, this.state.currentDate)});
    }



    signup = (data) => {

        console.log('signup in App', data);
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

        const user = {
            _id: "org.couchdb.user:"+username,
            password: data.password,
            name: username,
            roles: [],
            type:'user',
            fullname: data.name,
            created_at: new Date(),
            source: 'native',
            platform: Platform.OS
        }

        const usersDB = new PouchDB('https://api.budgt.eu/_users', {skip_setup:true, ajax: {cache: false}});
        var signupPromise = usersDB.put(user);

        //const remoteDB = new PouchDB('https://api.budgt.eu/u-'+md5(username), {skip_setup:true, ajax: {cache: false}});

        const promise = new Promise((resolve, reject) => {

            signupPromise.then((r) => {

                console.log('remote user signup ok', r);

                //This creates the remote database with the current user as only authenticated user
                fetch('https://api.budgt.eu/db.php', {
                    method: 'GET'
                }).then((r) => {
                    console.log('Successfully created user database', r);

                    //Then create local user with same data in "data" field
                    //and loggedIn field to true
                    const newUser = {
                        _id: 'currentUser',
                        loggedIn: true,
                        fullname: data.name,
                        email: data.email,
                        username: username,
                        auth: 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                    };
                    db.get('currentUser').then((r) => {

                        newUser._rev = r._rev;
                        console.log('got local user on signup', r, newUser)
                    })
                        .catch(() => {})
                        .then(() => {
                            db.put(newUser).then((rr)=>{
                                //login
                                console.log('sucessfully created local user', rr);
                                const userDatabase = 'https://api.budgt.eu/u-'+md5(user.name.toLowerCase());
                                const remoteDB = new PouchDB(userDatabase, ajaxOpts);
                                this.toggleSignupForm();
                                this.setupSync(remoteDB);
                                this.setState({user: newUser});
                                resolve(newUser);
                            }).catch((e) => {
                                if(e.status === 409) {
                                    reject({message: 'You already have an account on this machine, try logging in with it.', error: e, link:{"label": 'more info', url:"https://budgt.eu/"}});
                                } else {
                                    reject({message: 'Could not create your account, sorry. Contact us if this error persists', error: e});
                                }

                                //console.log('Could not create local user', e);
                            })

                        })



                }).catch((e) => {
                    reject({message: 'Could not create the remote database', error: e});
                    //TODO Display alert with error message
                    //console.log(e)
                })
            }).catch((e) => {
                //console.log(e);
                //TODO Display alert with error message
                if(e.status === 409) {
                    reject({message: 'This account already exists, try logging in', error: e});
                } else {
                    //console.log('remote db is','https://api.budgt.eu/u-'+md5(username));
                    //console.log('Could not create your account, sorry. Are you online?', e)
                    reject({message: 'Could not create your account, sorry. Are you online?', error: e});
                }

                console.log('SIGNUP FAILED', e);
            });
        });

        promise.then((u) => {
            console.log('user signup ok', u)
        }).catch((e) => {
            console.log('user signup fail', e);
        });

        return promise;

    }

    saveTransaction = (data) => {
        console.log('save transaction', data);
        return new Promise((resolve, reject) => {

            //get categories and find one, or create new one
            console.log(data.amount, Number(data.amount));
            if(isNaN(Number(data.amount))) {
                reject();
                return;
            }

            var cat = this.state.categories.filter((c) => {
                return c.name.toLowerCase() == data.category.toLowerCase()
            });
            var category = {
                _id: 'c-'+guid(),
                name: data.category,
                color: getRandomColor(),
                //TODO generate color
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

                    this.getAllData().then(()=>{resolve(t);}).catch((e) => {reject()})
                }).catch(() => {
                    this.getAllData().then(()=>{resolve(t);}).catch((e) => {reject()})
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
            db.put(u).then(()=>{}).catch(()=>{});
        }).catch((e) => {});
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
        
        const userDatabase = 'https://api.budgt.eu/u-'+md5(username.toLowerCase());
        //console.log('remote user database', userDatabase);
        const remoteDB = new PouchDB(userDatabase, ajaxOpts);
        
        const promise =  new Promise((resolve, reject) => {
            loginPromise.then((user) => {
                remoteDB.get('currentUser').then((remoteUser) => {
                    console.log('got remote currentUser', remoteUser)
                    remoteUser.auth = 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                    remoteUser.loggedIn =  true;
                    console.log('trying to put user to local db', remoteUser);

                    db.put(remoteUser).then((newUser) => {
                        resolve(remoteUser);
                        console.log('user updated from ', remoteUser, 'to', newUser);

                    }).catch((putUserError) => {
                        console.log('could not update local user from remote', putUserError, remoteUser);

                        db.get('currentUser').then((localu) => {
                            console.log('got local user to update it', localu);
                            localu.auth = 'Basic ' + window.btoa(username + ':' + data.password) //TODO change this ASAP
                            localu.loggedIn =  true;
                            localu.email = user.name,
                            localu.username = user.name.toLowerCase(),
                            localu.fullname = user.fullname,
                            db.put(localu).then(()=>{
                                resolve(localu);
                            }).catch((e)=>{
                                console.log('could not update local user with', localu, e);
                                delete(remoteUser._rev)
                                db.put(remoteUser).then(()=> {
                                    console.log('could put local user without rev')
                                    resolve(remoteUser);
                                }).catch((e) => {
                                    console.log('could NOT put local user without rev',e)
                                    reject(e);
                                });

                            });

                        }).catch((e) => {
                            console.log('could not get local user', e);
                            delete(remoteUser._rev);
                            db.put(remoteUser).then(()=> {
                                console.log('could put local user without rev')
                                resolve(remoteUser);
                            }).catch((e) => {
                                console.log('could NOT put local user without rev',e)
                                reject(e);
                            });
                            //reject(e);
                        });
                        //console.log('could not create local user', putUserError)
                    });
                }).catch((e) => {
                    console.log('no remote current user', e)
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
                        resolve(currentUser);
                        console.log('user cretaed from ', currentUser, 'to', newUser);

                    }).catch((putUserError) => {
                        console.log('could not create local user', currentUser, putUserError)
                        db.get('currentUser').then((uu) => {
                            currentUser._rev = uu._rev;

                            console.log('trying to put local user once more', currentUser);

                            db.put(currentUser).then(() => {
                                console.log('Finally!!', currentUser);
                                resolve(currentUser);

                            }).catch((pue) => {
                                console.log('Still could not create local user!!', currentUser, pue);
                                reject(pue);
                            });
                        });
                    });
                });
            }).catch((e) => {
                reject(e);
                console.log('no user', e)
            });
        });
        
        promise.then((user) => {
            this.toggleLoginForm();
            this.setupSync(remoteDB);
            this.setState({user: user});
        })
        return promise



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
                //TODO This is inefficient, try and do something better.
                console.log('getAllData called from sync event');
                self.getAllData();
            }).on('error', function (err) {
                //console.error('sync error', err);
            });
        }
        //console.log('Sync is set up', sync);

    }

    render() {

        console.log('Render App');
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
                        //zIndex:45,
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
                    {this.state.currentCategory.categories ? null: <Animated.View style={{backgroundColor:'transparent', position:'absolute', top:70, right:0, width:48, height:48, opacity: this.state.categoryColumnOpen ? 0: 1}}>
                        <IconToggle onPress={()=>{this.setState({colorPickerOpen: !this.state.colorPickerOpen})}}><Icon name='color-lens' color={getTextColor(shadeColor(this.state.currentCategory.color, (this.state.transactionsForCategory&&this.state.transactionsForCategory.transactions&&this.state.transactionsForCategory.transactions.length > 1 ? -0.2 : 0)))} /></IconToggle>
                    </Animated.View>}

                    <ActionButton onPress={this.toggleTransactionForm}/>
                    <CategoryColorPicker
                        open={this.state.colorPickerOpen}
                        updateCategoryColor={this.updateCategoryColor}
                        currentCategory={this.state.currentCategory}
                        />
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

                    {this.state.user ? <View/> : <AnimatedDialog
                        show={this.state.showLoginDialog}
                        toggle={this.toggleLoginForm}
                        inner={<LoginForm toggle={this.toggleLoginForm} show={this.state.showLoginDialog} login={this.login} />}
                        />}

                    {this.state.user ? <View/> : <AnimatedDialog
                        show={this.state.showSignupDialog}
                        toggle={this.toggleSignupForm}
                        inner={<SignupForm toggle={this.toggleSignupForm} show={this.state.showSignupDialog} action={this.signup} />}
                        />}

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