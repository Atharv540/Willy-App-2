
import * as firebase from 'firebase';
require('@firebase/firestore');

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyDHXUykS1jLXp0DY8dXjOVB6svhFEAFSdA",
    authDomain: "willy-10620.firebaseapp.com",
    databaseURL: "https://willy-10620.firebaseio.com",
    projectId: "willy-10620",
    storageBucket: "willy-10620.appspot.com",
    messagingSenderId: "316573477864",
    appId: "1:316573477864:web:a965fd5b8ec3fe69a5925d"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore();