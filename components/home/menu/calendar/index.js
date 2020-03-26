import React, { Component } from 'react';
// import apiCalendar from 'react-google-calendar-api';
import {
  View, Text, Button, TouchableOpacity
} from 'react-native';

export default class Calendar extends Component {
  constructor(props){
    super(props);
  }

// '2020-03-24T00:00:00+00:00'
  componentDidMount() {
    this.getEvents();
  }

// timeMin=2020-03-24T00:00:00.000Z
  getEvents() {
    return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=2020-03-24T00:00:00.000Z', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ya29.a0Adw1xeWKP9dLAiDndQev1EJ6mps9BywoNOSAnwXZZ6nJ3KvS25y6ODOIevtV1cdDDJgMATabJ1fZw_qGfvvVduz6FKpzu4bH0DS5F6DAxUCirWGZgEsijOT0OWUw-CdEalLU0aCPnrYDJ62-1_0NWj9TyrGOX2s0NNY'
      }
    })
      .then((response) => { response.json(); })
      .then((responseJson) => {
        console.log('--->', responseJson.items[3]);
      })

      .catch((error) => {
        console.log('-!!!!!!!!!!!!!!!!!!!!');
        console.log(error);
      });
  }

  render() {
    return (
      <View>
        <Text>Calendar</Text>
        <Button title="Sign In" />
      </View>
    );
  }
}
