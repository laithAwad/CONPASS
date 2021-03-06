/* eslint-disable no-alert */
import {
  YellowBox,
  View, Text, TouchableOpacity, Alert, Platform, AsyncStorage
} from 'react-native';
import _ from 'lodash';
/* eslint-disable no-plusplus */
import React, { Component } from 'react';
import DialogInput from 'react-native-dialog-input';
import firebase from 'firebase';
import i18n from 'i18n-js';
import { Agenda } from 'react-native-calendars';
import * as Permissions from 'expo-permissions';
import { Notifications } from 'expo';
import styles from './styles';

YellowBox.ignoreWarnings(['Setting a timer']);
const _console = _.clone(console);
console.warn = (message) => {
  if (message.indexOf('Setting a timer') <= -1) {
    _console.warn(message);
  }
};

export default class DashboardScreen extends Component {
  _isMounted = false

  constructor(props) {
    super(props);
    this.state = {
      items: {},
      isDialogVisible: false,
      notifyEvents: this.notify(props.navigation.state.params.events),
      pushNotficationToken: '',
      timeToNotify: 1,
      synchronizedEvents:
        this.structureSynchronizedEvents(props.navigation.state.params.events.items)
    };
  }

  async componentDidMount() {
    this.registerForPushNotificationsAsync();
    this._isMounted = true;
    if (Platform.OS === 'android') {
      Notifications.createChannelAndroidAsync('reminders', {
        name: 'Reminders',
        priority: 'max',
        vibrate: [0, 250, 250, 250],
      });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Registers device to receive push notifications
   */
  registerForPushNotificationsAsync = async () => {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    if (status !== 'granted') {
      Alert.alert(i18n.t('permissionNotGranted'),
    i18n.t('allowNotifications'),
    [
      { text: 'ok' }
    ]);
    }
  }

  /**
   *
   * @param {object} day - information of the current day
   * formats items with information of the day
   */
  loadItems = (day) => {
    setTimeout(() => {
      const uppderBoundForSync = 85;
      const lowerBoundForSync = -15;
      for (let i = lowerBoundForSync; i < uppderBoundForSync; i++) {
        const time = day.timestamp + i * 24 * 60 * 60 * 1000;
        const strTime = this.timeToString(time);
        if (!this.state.items[strTime]) {
          this.state.items[strTime] = [];
          const todayEvents = this.state.synchronizedEvents
            .filter((event) => { return strTime === event.date; });
          const numItems = todayEvents.length;
          for (let j = 0; j < numItems; j++) {
            this.state.items[strTime].push({
              name: todayEvents[j].title,
              startTime: todayEvents[j].startTime,
              endTime: todayEvents[j].endTime,
              description: todayEvents[j].description,
              address: todayEvents[j].address,
              height: 80
            });
          }
        }
      }
      const newItems = {};
      Object.keys(this.state.items).forEach((key) => { newItems[key] = this.state.items[key]; });
      if (this._isMounted) {
        this.setState({
          items: newItems
        });
      }
    }, 1000);
  }

  /**
   *
   * @param {object} events - All the user events
   * Formats the events to only return required events
   */
  notify = (events) => {
    const notifyArray = [];
    events.items.forEach((element) => {
      const date = new Date(element.start.dateTime);
      if (element.summary) {
        if (element.summary.includes('conpass') && date.getTime() > (new Date()).getTime()) {
          notifyArray.push({
            startDate: element.start.dateTime,
            summary: element.summary,
          });
        }
      }
    });
    return notifyArray;
  };

    /**
    * Schedules push notifications to user upon adjusting the timer
    */
    sendPushNotification = () => {
      Notifications.cancelAllScheduledNotificationsAsync();
      this.state.notifyEvents.forEach((element) => {
        const localNotification = {
          to: this.state.pushNotficationToken,
          sound: 'default',
          priority: 'high',
          title: 'Conpass Notification',
          body: element.summary,
          channelId: 'reminders',
          ios: { _displayInForeground: true }
        };
        const date = new Date(element.startDate);

        const t = date.getTime() - this.state.timeToNotify * 60 * 1000;
        const schedulingOptions = {
          time: t
        };
        Notifications.scheduleLocalNotificationAsync(localNotification, schedulingOptions);
      });
      return 'Notifications sent';
    }

    /**
    * @param {boolean} boolean - True or false
    * Shows or hides the dialong box of 'Adjust time' button
    */
    showDialog=(boolean) => {
      if (this._isMounted) {
        this.setState({ isDialogVisible: boolean });
      }
    }

    /**
   * @param {integer} number - Time in minutes
   * Sets the minutes in which the user wants to get notfications before
   */
    sendInput = (number) => {
      if (/^\d+$/.test(number.toString())) {
        if (this._isMounted) {
          this.setState({ timeToNotify: number });
          this.setState({ isDialogVisible: false });
        }
      } else {
        // your call back function
        Alert.alert(i18n.t('numbersOnly'),
          '',
          [
            { text: 'ok' }
          ]);
        return;
      }
      setTimeout(() => {
        this.sendPushNotification();
      }, 100);
    }

    /**
     * Fetches new events on google calendar
     */
     refreshCalendar =async () => {
       const accessToken = await AsyncStorage.getItem('accessToken');
       const userInfoResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?key=AIzaSyBAHObp5Ic3CbJpkX2500tNhf53e_3wBMA&timeMin=2020-01-01T01:00:00.000Z', {
         headers: { Authorization: `Bearer ${accessToken}` },
       });
       const jsonFile = await userInfoResponse.json();
       const { error } = jsonFile;
       if (error) {
         firebase.auth().signOut();
         this.props.navigation.navigate('LoginScreen');
         Alert.alert(i18n.t('logInAgain'),
           '',
           [
             { text: 'ok' }
           ]);
         return;
       }
       const stringFile = JSON.stringify(jsonFile);
       AsyncStorage.setItem('events', stringFile);
       this.props.navigation.navigate('FetchScreen');
     }

     /**
     * @param {String} description - A location to go to
     * Navigates to the home component
     */
     sendDirections = (description) => {
       if (!description) {
         Alert.alert(i18n.t('noAddress'),
           '',
           [
             { text: 'ok' }
           ]);
         return '';
       }
       this.props.navigation.navigate('HomeScreen', { description });
       return 'address sent';
     }

     /**
     * @param {integer} number - Time in minutes
     * Sets the minutes in which the user wants to get notfications before
     */
     rowHasChanged(r1, r2) {
       return r1.name !== r2.name;
     }

     /**
     * @param {integer} time - time of the event
     * restructure time in a certain format
     */
     timeToString(time) {
       const date = new Date(time);
       return date.toISOString().split('T')[0];
     }

     /**
     * @param {object} events - All the events the user has
     * Structures all the events the user has
     */
     structureSynchronizedEvents(events) {
       const tempArray = [];
       events.forEach((event) => {
         tempArray.push(
           {
             date: event.start.dateTime != null ? event.start.dateTime.substring(0, event.start.dateTime.indexOf('T')) : event.start.date,
             title: event.summary != null ? event.summary : 'No Title For this Event',
             startTime: event.start.dateTime != null ? event.start.dateTime : event.start.date,
             endTime: event.end.dateTime != null ? event.end.dateTime : event.end.date,
             description: event.description != null ? event.description : '',
             address: event.location != null ? event.location : ''
           }
         );
       });
       if (this._isMounted) {
         this.setState({
           synchronizedEvents: this.tempArray
         });
       }
       return tempArray;
     }


     /**
     * @param {object} item - information of item
     * present event in the agenda
     */
     renderItem(item) {
       const { address } = item;
       const { description } = item;
       return (
         <TouchableOpacity
           style={[styles.item, { height: item.height }]}
           onPress={() => {
             return Alert.alert(item.name,
               `${item.startTime}  -  ${item.endTime}\n${item.description}\n${item.address}`,
               [
                 { text: i18n.t('cancel') },
                 {
                   text: i18n.t('getDirections'),
                   onPress: () => {
                     if (address) { this.sendDirections(address.split(',')[0]); } else { this.sendDirections(description.split('\n')[0]); }
                   }
                 },
               ],
               { cancelable: false });
           }}
         >
           <Text style={{ color: 'white' }}>{item.name}</Text>
         </TouchableOpacity>
       );
     }


     /**
     * add line to empty day
     */
    renderEmptyDate = () => {
      return (
        <View
          style={{
            borderBottomColor: 'rgba(105,105,105,0.1)',
            borderBottomWidth: 1,
          }}
        />
      );
    }


    render() {
      return (
        <View
          style={{ height: '100%', width: '100%', position: 'absolute' }}
        >
          <DialogInput
            isDialogVisible={this.state.isDialogVisible}
            title={i18n.t('setReminderTime')}
            keyboardType="numeric"
            message={i18n.t('reminderMessage')}
            hintInput="e.g. 10"
            submitInput={(inputText) => { this.sendInput(inputText); }}
            closeDialog={() => { this.showDialog(false); }}
            submitText={i18n.t('submit')}
            cancelText={i18n.t('cancel')}
          />
          <Agenda
            items={this.state.items}
            loadItemsForMonth={this.loadItems}
            renderItem={(item) => { return this.renderItem(item, this.props); }}
            renderEmptyDate={this.renderEmptyDate}
            rowHasChanged={this.rowHasChanged}
            onRefresh={() => {
              this.refreshCalendar();
            }}
            theme={{
              calendarBackground: 'rgb(255,255,255)',
              selectedDayBackgroundColor: 'rgba(156,211,215,1)',
              agendaDayTextColor: 'black',
              agendaDayNumColor: 'black',
              agendaKnobColor: 'rgba(156,211,215,1)'
            }}
          />
          <View>
            <View style={{ flexDirection: 'row', position: 'absolute' }}>
              <TouchableOpacity
                style={styles.touchable}
                onPress={() => {
                  firebase.auth().signOut();
                }}
              >
                <Text>{i18n.t('logOut')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.touchable}
                onPress={() => {
                  this.showDialog(true);
                }}
              >
                <Text>{i18n.t('adjustTime')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
}
