/* eslint-disable import/first */
/* eslint-disable no-undef */
/* eslint-disable max-len */

import React from 'react';
import { shallow } from 'enzyme';
import { configureStore } from 'redux-mock-store';
import TheMap from '../components/map/index';


const mockRegion = {
  latitude: 45.492408,
  longitude: -73.582153,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04
};

const mockStore = configureStore([]);
const store = mockStore({
  myState: 'sample text',
});


const mockPoi = {
  result: {
    name: 'some name',
    formattedAddress: 'some address',
    geometry:
    {
      location: {
        lat: 45.492409,
        lng: -73.582153
      },
    }
  }
};


const setDestinationIfSelected = jest.fn();
const updateRegionCloser = jest.fn();


it('Should fit screen to updated components', () => {
  const coordinatesPre = {
    lat: 123,
    long: 123
  };

  const coordinatesChanged = {
    lat: 666,
    long: 666
  };

  const fitToCoordinates = jest.fn();
  wrapper = shallow(<TheMap store={store} nearbyMarkers={[]} updatedCoordinates={coordinatesPre} updatedRegion={mockRegion} />);
  const spyFitToCoordinates = jest.spyOn(wrapper.instance(), 'fitScreenToPath');
  wrapper.instance().setState({ mapRef: { fitToCoordinates } });
  wrapper.setProps({ updatedCoordinates: coordinatesChanged });
  expect(spyFitToCoordinates).toBeCalled();
});

it('Should fetch and send the selected point of interest to the home component', async () => {
  component = shallow(<TheMap store={store} nearbyMarkers={[]} updatedRegion={mockRegion} setDestinationIfSelected={setDestinationIfSelected} updateRegionCloser={updateRegionCloser} />);
  const spySetDestinationIfSelected = jest.spyOn(component.instance().props, 'setDestinationIfSelected');
  const spyUpdateRegionCloser = jest.spyOn(component.instance().props, 'updateRegionCloser');
  global.fetch = jest.fn().mockImplementation(() => {
    const promise = new Promise((resolve) => {
      resolve({
        json: () => {
          return mockPoi;
        }
      });
    });
    return promise;
  });

  await component.instance().selectPoi({ nativeEvent: { placeId: '123' } });
  expect(spySetDestinationIfSelected).toHaveBeenCalled();
  expect(spyUpdateRegionCloser).toHaveBeenCalled();
});
