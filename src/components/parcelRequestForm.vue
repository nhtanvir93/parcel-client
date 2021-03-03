<template>
    <div id="parcel-form-request">
        <form>
            <p id="form-header">Parcel request</p>
            <div class="input-group input-group-sm mb-3">
                <input autocomplete="off" type="text" class="form-control input-sm" @keyup="search($event)" id="pickup-address" placeholder="Pickup address" v-model="pickupAddress"
                       aria-label="pickup-address" aria-describedby="pickup-address">
                <div class="autocomplete-items">
                    <div v-for="(matchedPickupAddress, index) in matchedPickupAddresses" :key="`pickup-address-${index}`" @click="setPickupCoordinates($event)">
                        {{ matchedPickupAddress.place_name ? matchedPickupAddress.place_name : matchedPickupAddress.name }}
                        <input type="hidden" class="pickup-place-name" :value="matchedPickupAddress.place_name ?
                                                                                 matchedPickupAddress.place_name : matchedPickupAddress.name">
                        <input type="hidden" class="pickup-longitude" :value="matchedPickupAddress.geometry ?
                                                                                 matchedPickupAddress.geometry.coordinates[0] : matchedPickupAddress.longitude">
                        <input type="hidden" class="pickup-latitude" :value="matchedPickupAddress.geometry ?
                                                                                 matchedPickupAddress.geometry.coordinates[1] : matchedPickupAddress.latitude">
                    </div>
                </div>
            </div>
            <div class="input-group input-group-sm">
                <input autocomplete="off" type="text" class="form-control input-sm" @keyup="search($event)" id="dropoff-address" placeholder="Dropoff address" v-model="dropoffAddress"
                       aria-label="dropoff-address" aria-describedby="dropoff-address">
                <div class="autocomplete-items">
                    <div v-for="(matchedDropoffAddress, index) in matchedDropoffAddresses" :key="`dropoff-address-${index}`" @click="setDropoffCoordinates($event)">
                        {{ matchedDropoffAddress.place_name ? matchedDropoffAddress.place_name : matchedDropoffAddress.name }}
                        <input type="hidden" class="dropoff-place-name" :value="matchedDropoffAddress.place_name ?
                                                                                 matchedDropoffAddress.place_name : matchedDropoffAddress.name">
                        <input type="hidden" class="dropoff-longitude" :value="matchedDropoffAddress.geometry ?
                                                                                 matchedDropoffAddress.geometry.coordinates[0] : matchedDropoffAddress.longitude">
                        <input type="hidden" class="dropoff-latitude" :value="matchedDropoffAddress.geometry ?
                                                                                 matchedDropoffAddress.geometry.coordinates[1] : matchedDropoffAddress.latitude">
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script>
    import { apiBaseUrl } from './../App';

    export default {
        props : ['places'],
        mounted() {
            this.initIcons();
        },
        watch : {
            places(newPlaces, oldPlaces) {
                if(this.isPickupAddressSearch) {
                    this.matchedDropoffAddresses = [];
                    this.matchedPickupAddresses = newPlaces === null ? [] : newPlaces.features;
                } else {
                    this.matchedPickupAddresses = [];
                    this.matchedDropoffAddresses = newPlaces === null ? [] : newPlaces.features;
                }
            }
        },
        data() {
            return {
                pickupAddress : null,
                dropoffAddress : null,
                matchedPickupAddresses : [],
                matchedDropoffAddresses : [],
                isPickupAddressSearch : null,
                timer : null
            }
        },
        methods : {
            getSearchElement() {
                let searchSpan = document.createElement('span');
                searchSpan.setAttribute('class', 'input-group-text');
                searchSpan.setAttribute('style', 'background-color: white;');

                let searchIcon = document.createElement('i');
                searchIcon.setAttribute('class', 'fas fa-spinner fa-pulse');
                searchIcon.setAttribute('style', 'width: 25px; display: flex; justify-content: center; color: forestgreen;');

                searchSpan.append(searchIcon);

                return searchSpan;
            },
            getCloseElement() {
                let root = this;

                let closeSpan = document.createElement('span');
                closeSpan.setAttribute('class', 'input-group-text');
                closeSpan.setAttribute('style', 'background-color: white;');

                let closeIcon = document.createElement('i');
                closeIcon.setAttribute('class', 'fas fa-times');
                closeIcon.setAttribute('style', 'width: 25px; display: flex; justify-content: center; color: red;');

                closeIcon.addEventListener('click', function(event){
                    let targetElement = event.target;
                    let targetId = targetElement.parentNode.parentNode.querySelector('input').getAttribute('id');

                    if(targetId == 'pickup-address') {
                        root.pickupAddress = null;
                        root.$emit('new-pickup-coordinates-found', root.pickupAddress);
                        root.matchedPickupAddresses = [];
                    } else {
                        root.dropoffAddress = null;
                        root.$emit('new-dropoff-coordinates-found', root.dropoffAddress);
                        root.matchedDropoffAddresses = [];
                    }

                    root.reloadValidIcon(targetId);
                });

                closeIcon.addEventListener('mouseenter', function (event) {
                    event.target.style.cursor = 'pointer';
                });

                closeSpan.append(closeIcon);

                return closeSpan;
            },
            getCarElement() {
                let carSpan = document.createElement('span');
                carSpan.setAttribute('class', 'input-group-text');
                carSpan.setAttribute('style', 'background-color: white;');

                let carIcon = document.createElement('i');
                carIcon.setAttribute('class', 'fas fa-car');
                carIcon.setAttribute('style', 'width: 25px; display: flex; justify-content: center; color: blue;');

                carSpan.append(carIcon);

                return carSpan;
            },
            initIcons() {
                document.getElementById('pickup-address').parentNode.appendChild(this.getCarElement());
                document.getElementById('dropoff-address').parentNode.appendChild(this.getCarElement());
            },
            removeOldIcons(inputId) {
                let spans = document.getElementById(inputId).parentNode.querySelectorAll('span');

                for(let i = 0; i < spans.length; i++) {
                    spans[i].remove();
                }
            },
            reloadValidIcon(inputId, value = '') {
                let targetElement = document.getElementById(inputId);
                value = value ? targetElement.value : '';

                this.removeOldIcons(inputId);

                if(value != '') {
                    document.getElementById(inputId).parentNode.appendChild(this.getCloseElement());
                } else {
                    document.getElementById(inputId).parentNode.appendChild(this.getCarElement());
                }
            },
            search(event) {
                let root = this;

                clearTimeout(this.timer);

                this.timer = setTimeout(function() {
                    let targetElement = event.target;
                    let targetId = targetElement.getAttribute('id');
                    let value = targetElement.value;

                    root.reloadValidIcon(targetId, value);

                    if(value == '') {
                        root.$emit('new-search-key-found', null);
                    }

                    if(targetId == 'pickup-address') {
                        root.matchedPickupAddresses = [];
                        root.isPickupAddressSearch = true;

                        if(value != '') {
                            axios.get(`${apiBaseUrl}api/get-matched-locations/${value}`)
                                .then((response) => {
                                    if(response.data.success) {
                                        root.matchedPickupAddresses = response.data.data;
                                    } else {
                                        root.$emit('new-search-key-found', value);
                                    }
                                })
                                .catch((error) => {
                                    root.$emit('new-search-key-found', value);
                                });
                        }
                    } else {
                        root.matchedDropoffAddresses = [];
                        root.isPickupAddressSearch = false;

                        if(value != '') {
                            axios.get(`${apiBaseUrl}api/get-matched-locations/${value}`)
                                .then((response) => {
                                    if(response.data.success) {
                                        root.matchedDropoffAddresses = response.data.data;
                                    } else {
                                        root.$emit('new-search-key-found', value);
                                    }
                                })
                                .catch((error) => {
                                    root.$emit('new-search-key-found', value);
                                });
                        }
                    }
                }, 200);
            },
            setPickupCoordinates(event) {
                let selectedItemDiv = event.target;
                let coordinates = [
                    selectedItemDiv.querySelector('input.pickup-longitude').value,
                    selectedItemDiv.querySelector('input.pickup-latitude').value
                ];
                let name = selectedItemDiv.querySelector('input.pickup-place-name').value;

                this.matchedPickupAddresses = [];
                this.pickupAddress = name;
                this.$emit('new-pickup-coordinates-found', coordinates);

                this.saveLocation(name, coordinates);
            },
            setDropoffCoordinates(event) {
                let selectedItemDiv = event.target;
                let coordinates = [
                    selectedItemDiv.querySelector('input.dropoff-longitude').value,
                    selectedItemDiv.querySelector('input.dropoff-latitude').value
                ];
                let name = selectedItemDiv.querySelector('input.dropoff-place-name').value;

                this.matchedDropoffAddresses = [];
                this.dropoffAddress = name;
                this.$emit('new-dropoff-coordinates-found', coordinates);

                this.saveLocation(name, coordinates);
            },
            saveLocation(name, coodinates) {
                axios.post(`${apiBaseUrl}api/locations`, {
                    name : name,
                    longitude : parseFloat(coodinates[0]),
                    latitude : parseFloat(coodinates[1])
                })
                .then((response) => {
                    console.log(response.data.message);
                }, (error) => {
                    console.log(error.message);
                });
            }
        }
    }
</script>

<style scoped>
    #parcel-form-request {
        position: absolute;
        top: 6px;
        left: 2%;
        width: 96%;
        background-color: white;
        padding: 6px;
    }
    #form-header {
        text-align: center;
        margin-bottom: 5px;
    }
    input {
        border-right: none;
    }
    .autocomplete {
        position: relative;
        display: inline-block;
    }
    .autocomplete-items {
        position: absolute;
        border: 1px solid #d4d4d4;
        border-bottom: none;
        border-top: none;
        z-index: 99;
        top: 100%;
        left: 0;
        right: 0;
        font-size: 12px;
    }
    .autocomplete-items div{
        padding: 5px;
        cursor: pointer;
        background-color: #fff;
        border-bottom: 1px solid #d4d4d4;
    }
    .autocomplete-items div:hover {
        background-color: #e9e9e9;
    }
    .autocomplete-active {
        background-color: DodgerBlue !important;
        color: #ffffff;
    }
</style>