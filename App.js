import * as React from 'react';
import {View, StyleSheet, Text, Image} from 'react-native';
import SearchScreen from './screens/SearchScreen';
import BookTransactionScreen from './screens/BookTransactionScreen';
import {createAppContainer} from 'react-navigation'
import {createBottomTabNavigator} from'react-navigation-tabs'

export default class App extends React.Component{
  render(){
    return(
      <AppContainer/>
    )
  }
}
const TabNavigator = createBottomTabNavigator({
  'Transaction': { screen : BookTransactionScreen},
  'Search': {screen: SearchScreen},
},
{
 defaultNavigationOptions: ({navigation}) => ({
    tabBarIcon: () => {
      const routeName = navigation.state.routeName
      if ( routeName === 'Transaction'){
        return(
        <Image source={require('./assets/book.png')}
          style={{ width: 40, height: 40}}
        />
        )
      }
      else if ( routeName === 'Search'){
      return(
        <Image source={require('./assets/searchingbook.png')}
          style={{ width: 40, height: 40}}
        /> 
      )
      }
      }
   })
}
)

const AppContainer = createAppContainer(TabNavigator);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  }
})
