import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../components/LandingPage.vue'
import ImageConverter from '../components/ImageConverter.vue'
import PdfConverter from '../components/PdfConverter.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'LandingPage',
      component: LandingPage
    },
    {
      path: '/image-converter',
      name: 'ImageConverter',
      component: ImageConverter
    },
    {
      path: '/pdf-converter',
      name: 'PdfConverter',
      component: PdfConverter
    }
  ]
})

export default router
