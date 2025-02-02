import { createRouter, createWebHistory } from 'vue-router';
import ImageConverter from './components/ImageConverter.vue';
import PdfConverter from './components/PdfConverter.vue';
import LandingPage from './components/LandingPage.vue';

const routes = [
    { path: '/', component: LandingPage, name: 'landing-page' },
    { path: '/ImageConverter', component: ImageConverter, name: 'ImageConverter' },
    { path: '/PdfConverter', component: PdfConverter, name: 'PdfConverter' }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
