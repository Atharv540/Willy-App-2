import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet
  , Alert, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config.js';

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        scannedStudentId:'',
        buttonState: 'normal'
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state

      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }
      
    }

    checkBookEligibility = async() => {
      const bookRef = await db.collection("books").where("bookId", "==", this.state.scannedBookId).get()
      var transactionType = ''

      if(bookRef.docs.length === 0){
        transactionType = false
      }
      else{
        bookRef.docs.map((docs)=>{
          var book = docs.data()

          if(book.bookAvailability){
            transactionType = 'Issue'
          }
          else{
            transactionType = 'Return'
          }
        })
      }

      return transactionType
    }

    checkStudentEligibilityForBookIssue = async() => {
      const studentRef = await db.collection("students").where("studentID", "==", this.state.scannedStudentId).get()
      var isStudentEligible = ""

      if(studentRef.docs.length === 0){
        ToastAndroid.show('This Student ID, dos not exist in the database.', ToastAndroid.LONG)
        isStudentEligible = false
        this.setState({
          scannedBookId: '',
          scannedStudentId: ''
        })
      }
      else{
        studentRef.docs.map((doc)=>{
          var student = doc.data()

          if(student.numberOfBooksIssued < 2){
            isStudentEligible = true
          }
          else{
            isStudentEligible = false
            ToastAndroid.show('The Student has already issued 2 books!', ToastAndroid.LONG);
            this.setState({
              scannedStudentId: '',
              scannedBookId: ''
            })
          }
        })
      }
      return isStudentEligible
    }

    checkStudentEligibilityForBookIssue = async() => {
      const transactionRef = await db.collection("transactions").where("bookID", "==", this.state.scannedBookId).limit(1).get()
      var isStudentEligible = ""

        transactionRef.docs.map((doc)=>{
          var lastTransaction = doc.data()

          if(lastTransaction.studentID === this.state.scannedStudentId){
            isStudentEligible = true
          }
          else{
            isStudentEligible = false
            ToastAndroid.show("The Book wasn't issued by this student", ToastAndroid.LONG);
            this.setState({
              scannedStudentId: '',
              scannedBookId: ''
            })
          }
        })
      return isStudentEligible
    }

    handleTransaction = async () => {

      var transactionType = await this.checkBookEligibility();

      if(!transactionType){
        ToastAndroid.show('This Book does not exist in the database!', ToastAndroid.LONG);
        this.setState({
          scannedBookId: '',
          scannedStudentId: ''
        })
      }

      else if(transactionType === 'Issue'){
        var isStudentEligible = await this.checkStudentEligibilityForBookIssue();

        if(isStudentEligible){
          this.initiateBookIssue();
          ToastAndroid.show('Book Issued to the Student', ToastAndroid.LONG);
        }
      }
      else if(transactionType === 'Return'){
        var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
        if(isStudentEligible){
          this.initiateBookReturn();
          ToastAndroid.show('Book is returned', ToastAndroid.LONG);
        }      
      }


      /*var transactionMessage
      db.collection('books').doc(this.state.scannedBookId).get()
        .then((doc)=>{
          console.log(doc.data())
          var book = doc.data()
            if(book.bookAvailability){
              this.initiateBookIssue();
              transactionMessage = 'bookIssued'
            }
            else{
              this.initiateBookReturn();
              transactionMessage = 'bookReturned'
            }
        })
        this.setState({
          transactionMessage: transactionMessage
        })
      */
    }
    initiateBookIssue = async () =>{
      db.collection('transactions').add({
        'studentId': this.state.scannedStudentId,
        'bookId': this.state.scannedBookId,
        'date': firebase.firestore.Timestamp.now().toDate(),
        'transactionType': 'Issue'
      })
      db.collection('books').doc(this.state.scannedBookId).update({
        'bookAvailability': false
      })
      db.collection('students').doc(this.state.scannedStudentId).update({
        'numberofBooksIssued': firebase.firestore.FieldValue.increment(1)
      })
      var issuedMessage = "Book Issued"
      Alert.alert(issuedMessage)
      this.setState({
        scannedBookId: '',
        scannedStudentId: ''
      })
    }
    initiateBookReturn = async () => {
      db.collection('transactions').add({
        'studentId': this.state.scannedStudentId,
        'bookId': this.state.scannedBookId,
        'date': firebase.firestore.Timestamp.now().toDate(),
        'transactionType': 'Issue'
      })
      db.collection('books').doc(this.state.scannedBookId).update({
        'bookAvailability': true
      })
      db.collection('students').doc(this.state.scannedStudentId).update({
        'numberofBooksIssued': firebase.firestore.FieldValue.increment(-1)
      })
      var transactionMessage = "Book Returned"
      Alert.alert(transactionMessage)
      this.setState({
        scannedBookId: '',
        scannedStudentId: ''
      })
    }
    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              onChangeText = {
                  text => {this.setState({
                    scannedBookId: text
                  })
                }
              }
              style={styles.inputBox}
              placeholder="Book Id"
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              onChangeText = {
                  text => {this.setState({
                    scannedStudentId: text
                  })
                }
              }
              style={styles.inputBox}
              placeholder="Student Id"
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <TouchableOpacity
            style={styles.submitButton} onPress={ async() =>{
              this.handleTransaction()
            }
            }>
              <Text style={styles.submitButtonText}>SUBMIT</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
      backgroundColor: 'red',
      width: 100,
      height: 50
    },
    submitButtonText:{
      padding: 10,
      textAlign: 'center',
      fontSize: 20,
      fontWeight:'bold',
      color: 'white'
    }
  });