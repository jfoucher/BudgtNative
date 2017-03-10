/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';
import App from './components/App'

import { COLOR, ThemeProvider } from 'react-native-material-ui';



//db.put({_id:'4711', text: 'this is a test'}).then(() =>{
//    db.get('4711')
//        .then(doc => console.log(doc))
//} );


const uiTheme = {
    palette: {
        primaryColor: COLOR.teal500,
        primary2Color: COLOR.teal700,
        accentColor: COLOR.orange500,
    },
    toolbar: {
        container: {
            height: 50,
        },
    },
    drawerHeader: {
        contentContainer: {
            backgroundColor: COLOR.teal500,
        }
    },
    drawerHeaderListItem: {
        secondaryText: {
            color: '#FFF'
        },
        primaryText: {
            color: '#FFF'
        },
        rightElement: {
            color: '#FFF'
        }
    }
};


export default class BudgtNative extends Component {
  render() {
    return (
        <ThemeProvider uiTheme={uiTheme}>
            <App />
        </ThemeProvider>
    );
  }
}


AppRegistry.registerComponent('BudgtNative', () => BudgtNative);
