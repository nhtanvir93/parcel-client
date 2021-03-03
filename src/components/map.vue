<template>
    <div id="mapbox-map">
    </div>
</template>

<script>
    import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
    import * as turf from '@turf/turf';

    export default {
        props : ['searchKey', 'pickupCoordinates', 'dropoffCoordinates'],
        mounted() {
            this.init();
            this.markCurrentLocation();
        },
        data() {
            return {
                map : null,
                geoCoder : null,
                currentLocationCoordinates : null,
                currentLocationMarker : null,
                pickupAddressMarker : null,
                dropoffAddressMarker : null,
                radius : 50,
                minLongitude : null,
                minLatitude : null,
                maxLongitude : null,
                maxLatitude : null,
                perKmFuelCost : .05
            };
        },
        watch : {
            searchKey(newValue, oldValue) {
                this.searchForPlaces(newValue);
            },
            pickupCoordinates(newValue, oldValue) {
                if(this.pickupAddressMarker !== null) {
                    this.$emit('no-details-found');
                    this.pickupAddressMarker.remove();
                }

                if(newValue !== null) {
                    this.markPickupAddress(newValue);
                }

                this.drawLine();
            },
            dropoffCoordinates(newValue, oldValue) {
                if(this.dropoffAddressMarker !== null) {
                    this.$emit('no-details-found');
                    this.dropoffAddressMarker.remove();
                }

                if(newValue !== null) {
                    this.markDropoffAddress(newValue);
                }

                this.drawLine();
            }
        },
        methods : {
            init() {
                this.map = new mapboxgl.Map({
                    container: 'mapbox-map',
                    style: 'mapbox://styles/mapbox/streets-v11'
                });

                this.geoCoder = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl
                });
            },
            markCurrentLocation() {
                let root = this;

                if(navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            if(position) {
                                root.currentLocationCoordinates = [
                                    position.coords.longitude,
                                    position.coords.latitude
                                ];

                                let popup = new mapboxgl.Popup()
                                    .setText('Me')
                                    .addTo(root.map);

                                root.currentLocationMarker = new mapboxgl.Marker()
                                    .setLngLat(root.currentLocationCoordinates)
                                    .addTo(root.map)
                                    .setPopup(popup);

                                root.drawCircle();

                                root.getCurrentLocationPlace(root.currentLocationCoordinates);
                            }
                        },
                        function(error) {
                            alert(error.message);
                        }, {
                            enableHighAccuracy : true
                        });
                } else {
                    alert('Current location can not be marked because geolocation is not supported');
                }
            },
            searchForPlaces(searchKey) {
                if(searchKey === null) {
                    return false;
                }

                let root = this;
                let searchUrl = null;

                if(this.currentLocationCoordinates !== null) {
                    searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchKey}.json?access_token=${mapboxgl.accessToken}`
                    + `&proximity=${this.currentLocationCoordinates[0]},${this.currentLocationCoordinates[1]}`
                    + '&types=district,place,locality,neighborhood,address,poi&limit=10'
                    + `&bbox=${this.minLongitude},${this.minLatitude},${this.maxLongitude},${this.maxLatitude}`;
                } else {
                    searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchKey}.json?access_token=${mapboxgl.accessToken}`
                    + '&types=district,place,locality,neighborhood,address,poi&limit=10';
                }

                axios.get(searchUrl)
                    .then((response) => {
                        let data = response.data;

                        let from = turf.point([parseFloat(root.currentLocationCoordinates[0]), parseFloat(root.currentLocationCoordinates[1])]);
                        let to = null;
                        let options = {units: 'kilometers'};
                        let distance = null;

                        let tempCoordinates = null;
                        let filteredFeatures = [];

                        for(let i = 0; i < data.features.length; i++) {
                            tempCoordinates = data.features[i].geometry.coordinates;

                            to = turf.point([parseFloat(tempCoordinates[0]), parseFloat(tempCoordinates[1])]);
                            distance = turf.distance(from, to, options);

                            if(distance <= this.radius) {
                                filteredFeatures.push(data.features[i]);
                            }
                        }

                        data.features = filteredFeatures;

                        root.$emit('new-places-found', data);
                    }, (error) => {
                        root.$emit('new-places-found', null);
                    });
            },
            remarkCurrentLocation() {
                let popup = new mapboxgl.Popup()
                    .setText('Me')
                    .addTo(this.map);

                this.pickupAddressMarker = new mapboxgl.Marker()
                    .setLngLat(this.currentLocationCoordinates)
                    .addTo(this.map)
                    .setPopup(popup);
            },
            markPickupAddress(coordinates) {
                if(JSON.stringify(coordinates) === JSON.stringify(this.currentLocationCoordinates)) {
                    this.currentLocationMarker.remove();
                } else if(this.currentLocationMarker === null) {
                    this.remarkCurrentLocation();
                }

                let popup = new mapboxgl.Popup()
                    .setText('Pickup')
                    .addTo(this.map);

                this.pickupAddressMarker = new mapboxgl.Marker()
                    .setLngLat(coordinates)
                    .addTo(this.map)
                    .setPopup(popup);

                if(this.dropoffCoordinates === null) {
                    this.map.flyTo({
                        center : coordinates,
                        zoom : 16
                    });
                }
            },
            markDropoffAddress(coordinates) {
                let popup = new mapboxgl.Popup()
                    .setText('Dropoff')
                    .addTo(this.map);

                this.dropoffAddressMarker = new mapboxgl.Marker()
                    .setLngLat(coordinates)
                    .addTo(this.map)
                    .setPopup(popup);

                if(this.pickupCoordinates === null) {
                    this.map.flyTo({
                        center : coordinates,
                        zoom : 16
                    });
                }
            },
            drawLine() {
                let mapLayer = this.map.getLayer('straight-line');

                if(typeof mapLayer !== 'undefined') {
                    this.map.removeLayer('straight-line').removeSource('straight-line');
                }

                if(this.pickupCoordinates === null || this.dropoffCoordinates === null) {
                    return;
                }

                let coordinates = [
                    [parseFloat(this.pickupCoordinates[0]), parseFloat(this.pickupCoordinates[1])],
                    [parseFloat(this.dropoffCoordinates[0]), parseFloat(this.dropoffCoordinates[1])]
                ];

                this.map.addSource('straight-line', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': coordinates
                        }
                    }
                });

                this.map.addLayer({
                    'id': 'straight-line',
                    'type': 'line',
                    'source': 'straight-line',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#888',
                        'line-width': 8
                    }
                });

                // let features = turf.points(coordinates);

                // let center = turf.center(features);

                let bounds = coordinates.reduce(function (bounds, coord) {
                    return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[1]));

                this.map.fitBounds(bounds, {
                    padding: 50
                });

                this.getParcelDetails();
            },
            drawCircle() {
                let root = this;
                let options = {steps: 100, units: 'kilometers', properties: {foo: 'bar'}};
                let circle = turf.circle(this.currentLocationCoordinates, this.radius, options);

                this.map.on('load', function() {
                    root.map.addSource('location-circle', {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'geometry': circle.geometry
                        }
                    });

                    root.map.addLayer({
                        'id': 'location-circle',
                        'type': 'fill',
                        'source': 'location-circle',
                        'layout': {},
                        'paint': {
                            'fill-color': '#088',
                            'fill-opacity': 0.1
                        }
                    });

                    let getCircleBoundaries = root.getCircleBoundaries(circle.geometry.coordinates[0]);

                    let bounds = getCircleBoundaries.reduce(function (bounds, coord) {
                        return bounds.extend(coord);
                    }, new mapboxgl.LngLatBounds(getCircleBoundaries[0], getCircleBoundaries[1]));

                    root.map.fitBounds(bounds, {
                        padding: 50
                    });

                    root.setRectangleBoundaryBox(circle.geometry.coordinates[0]);
                });
            },
            getCircleBoundaries(coordinates) {
                let circleBoundaries = [
                    coordinates[0]
                ];

                let from = turf.point([parseFloat(coordinates[0][0]), parseFloat(coordinates[0][1])]);
                let to = null;
                let options = {units: 'kilometers'};
                let distance = null;

                let maxDistance = 0;
                let targetIndex = null;

                for(let i = 1; i < coordinates.length; i++) {
                    to = turf.point([parseFloat(coordinates[i][0]), parseFloat(coordinates[i][1])]);

                    distance = turf.distance(from, to, options);

                    targetIndex = distance > maxDistance ? i : targetIndex;
                    maxDistance = distance > maxDistance ? distance : maxDistance;
                }

                circleBoundaries.push(coordinates[targetIndex]);

                return circleBoundaries;
            },
            setRectangleBoundaryBox(coordinates) {
                let featureCollection = [];
                let tempTurfPoint = null;
                let enveloped = null;

                for(let i = 1; i < coordinates.length; i++) {
                    tempTurfPoint = turf.point([parseFloat(coordinates[i][0]), parseFloat(coordinates[i][1])]);

                    featureCollection.push(tempTurfPoint);
                }

                featureCollection = turf.featureCollection(featureCollection);

                enveloped = turf.envelope(featureCollection);

                this.minLongitude = enveloped.bbox[0];
                this.minLatitude = enveloped.bbox[1];
                this.maxLongitude = enveloped.bbox[2];
                this.maxLatitude = enveloped.bbox[3];
            },
            getCurrentLocationPlace(coordinates) {
                let searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}`;
                let root = this;

                axios.get(searchUrl)
                    .then((response) => {
                        let data = response.data;

                        root.$emit('current-location-coordinates', root.currentLocationCoordinates, data.features[0].place_name);
                    }, (error) => {
                        root.$emit('current-location-coordinates', root.currentLocationCoordinates, 'Your Location');
                    });
            },
            getParcelDetails() {
                let searchUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/` 
                + `${this.pickupCoordinates[0]},${this.pickupCoordinates[1]};${this.dropoffCoordinates[0]},${this.dropoffCoordinates[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full&annotations=distance,duration`;

                let parcelDetails = {
                    distance : 'N/A',
                    duration : 'N/A',
                    cost : 'N/A'
                };

                let root = this;

                axios.get(searchUrl)
                    .then((response) => {
                        let data = response.data;
                        console.log(data);
                        
                        parcelDetails.distance = (data.routes[0].distance/1000).toFixed(2);
                        parcelDetails.duration = data.routes[0].duration;
                        parcelDetails.cost = (parcelDetails.distance * this.perKmFuelCost).toFixed(2);

                        root.$emit('new-details-found', parcelDetails);
                    }, (error) => {
                        root.$emit('new-details-found', parcelDetails);
                    });
            }
        }
    }
</script>

<style scoped>
    #mapbox-map {
        width: 100%;
        height: 100vh;
    }
</style>