<template>
  <div class="landing-page">
    <header class="navbar">
      <a href="#" class="navbar-brand">ConvertEase</a>
      <nav class="navbar-nav">
        <ul class="navbar-nav">
        <li class="nav-item"><a href="#" class="nav-link" @click.prevent="navigate('LandingPage')">Home</a></li>
        <li class="nav-item"><a href="#" class="nav-link">Features</a></li>
      </ul>
      </nav>
    </header>

    <main id="app">
      <section class="columns">
        <div class="column image-conversion">
          <h2>Image Conversion</h2>
          <p>Resize images to various dimensions with ease and reduce them to the size you want!</p>
          <button @click="navigate('ImageConverter')">Go to Image Converter</button>
        </div>
        <div class="column pdf-conversion">
          <h2>PDF Conversion</h2>
          <p>Reduce the size of your PDFs without any hassle in browser itself ensuring privacy of data.</p>
          <button @click="navigate('PdfConverter')">Go to PDF Converter</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  name: 'LandingPage',
  methods: {
    navigate(route) {
      this.$router.push({ name: route });
    }
  }
}
</script>

<style scoped>
body {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  font-family: Arial, sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: var(--spacing-md) var(--spacing-xl);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--apple-gray-100);
}

.navbar-brand {
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 600;
  font-family: var(--font-family-display);
  letter-spacing: -0.01em;
}

.navbar-nav {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: var(--spacing-lg);
}

.nav-item {
  margin: 0;
}

.nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9375rem;
  font-family: var(--font-family-body);
  transition: color 0.2s ease;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.nav-link:hover {
  color: var(--color-text-primary);
  background-color: var(--apple-gray-50);
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  background: linear-gradient(180deg, var(--apple-gray-50) 0%, var(--apple-white) 100%);
  width: 300%;
  max-width: 1200px;
  box-sizing: border-box;
}

.columns {
  display: flex;
  justify-content: space-between;
  width: 300%;
  max-width: 1200px;
}

.column {
  width: 48%;
  padding: 20px;
  box-sizing: border-box;
  background-color: rgba(255, 255, 255, 0.7); /* Semi-transparent background */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.image-conversion {
  background-color: rgba(0, 123, 255, 0.1); /* Light blue semi-transparent background */
}

.pdf-conversion {
  background-color: rgba(0, 123, 255, 0.1); /* Light blue semi-transparent background */
}

.column h2 {
  margin-top: 0;
}

button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: #0056b3;
}
</style>
