<template>
    <div>
        <mapbox-map
                :pickup-coordinates="pickupCoordinates"
                :dropoff-coordinates="dropoffCoordinates"
                :search-key="searchKey"
                @new-places-found="setPlaces">
        </mapbox-map>
        <parcel-request-form
                ref="parcelRequestForm"
                @new-pickup-coordinates-found="setPickupCoordinates"
                @new-dropoff-coordinates-found="setDropoffCoordinates"
                @new-search-key-found="setSearchKey"
                :places="places">
        </parcel-request-form>
    </div>
</template>

<script>
    import Map from './map';
    import ParcelRequestForm from './parcelRequestForm';
    import apiBaseUrl from './../App';

    export default {
        components : {
            'mapbox-map' : Map,
            'parcel-request-form' : ParcelRequestForm
        },
        data() {
            return {
                searchKey : null,
                places : null,
                pickupCoordinates : null,
                dropoffCoordinates : null
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
            }
        }
    }
</script>