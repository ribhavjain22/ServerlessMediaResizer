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

  <main class="landing-main">
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
/* Avoid styling global <body> inside a scoped component */

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  padding: var(--spacing-md) var(--spacing-xl);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  animation: navbarFadeIn 0.5s ease-out;
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

.landing-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(var(--spacing-2xl) + 72px) var(--spacing-xl) var(--spacing-2xl);
  background: 
    radial-gradient(circle at 0% 0%, rgba(0, 113, 227, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(0, 113, 227, 0.05) 0%, transparent 50%),
    linear-gradient(180deg, var(--apple-white) 0%, var(--apple-gray-50) 100%);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  animation: mainFadeIn 0.8s ease-out;
}

.columns {
  display: flex;
  gap: var(--spacing-xl);
  width: 100%;
  align-items: stretch;
  box-sizing: border-box;
}

.column {
  flex: 1 1 0;
  padding: 2rem;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  min-width: 260px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.column::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.column:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(255, 255, 255, 0.3);
}

.column:hover::before {
  left: 100%;
}

.image-conversion {
  background: linear-gradient(135deg, rgba(0, 113, 227, 0.05) 0%, rgba(255, 255, 255, 0.7) 100%);
}

.pdf-conversion {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(0, 113, 227, 0.05) 100%);
}

.column h2 {
  margin-top: 0;
}

button {
  margin-top: 1.5rem;
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  font-weight: 500;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--apple-blue-hover) 100%);
  color: white;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-full);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 113, 227, 0.4);
}

button:active {
  transform: translateY(0);
}

/* Add animations */
@keyframes navbarFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mainFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Add styles for headings and text */
.column h2 {
  margin: 0 0 1rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}

.column p {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
}
</style>
