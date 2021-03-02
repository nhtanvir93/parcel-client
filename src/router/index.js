import Vue from 'vue'
import Router from 'vue-router'
import ParcelRequest from '@/components/parcelRequest'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: ParcelRequest
    }
  ]
})
