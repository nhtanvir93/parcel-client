<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>

  window.axios = require('axios');
  window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

  window.mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
  mapboxgl.accessToken = 'pk.eyJ1Ijoibmh0YW52aXI5MyIsImEiOiJja2xsYmdhbWExMnpvMnVwZmI2NGZiemt3In0.2I5ndZ53xEca4T9dD3TX_A';

  export const apiBaseUrl = 'http://localhost:8000/';

  export default {
    name: 'App'
  }
</script>
