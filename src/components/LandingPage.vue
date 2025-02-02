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
  background-color: #007bff;
  padding: 10px 20px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  color: white;
  text-decoration: none;
  font-size: 24px;
  font-weight: bold;
}

.navbar-nav {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-left: 20px;
}

.nav-link {
  color: white;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
}

.nav-link:hover {
  text-decoration: underline;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 35px 200px;
  background-color: white;
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
