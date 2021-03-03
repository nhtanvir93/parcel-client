<template>
    <div>
        <mapbox-map
                ref="mapboxMap"
                :pickup-coordinates="pickupCoordinates"
                :dropoff-coordinates="dropoffCoordinates"
                :search-key="searchKey"
                @current-location-coordinates="setCurrentLocationCoordinates"
                @new-places-found="setPlaces">
        </mapbox-map>
        <parcel-request-form
                ref="parcelRequestForm"
                @new-pickup-coordinates-found="setPickupCoordinates"
                @new-dropoff-coordinates-found="setDropoffCoordinates"
                @new-search-key-found="setSearchKey"
                :current-location-coordinates="currentLocationCoordinates"
                :current-location-name="currentLocationName"
                :places="places">
        </parcel-request-form>
    </div>
</template>

<script>
    import Map from './map';
    import ParcelRequestForm from './parcelRequestForm';

    export default {
        components : {
            'mapbox-map' : Map,
            'parcel-request-form' : ParcelRequestForm
        },
        data() {
            return {
                searchKey : null,
                places : null,
                currentLocationCoordinates : null,
                pickupCoordinates : null,
                dropoffCoordinates : null,
                currentLocationName : null
            };
        },
        methods : {
            setSearchKey(searchKey) {
                this.searchKey = searchKey;

                if(this.searchKey === null) {
                    this.places = null
                }
            },
            setPlaces(places) {
                this.places = places;
            },
            setPickupCoordinates(coordinates) {
                this.pickupCoordinates = coordinates;
            },
            setDropoffCoordinates(coordinates) {
                this.dropoffCoordinates = coordinates;
            },
            setCurrentLocationCoordinates(currentLocationCoordinates, currentLocationName) {
                this.currentLocationCoordinates = currentLocationCoordinates;
                this.currentLocationName = currentLocationName
            }
        }
    }
</script>