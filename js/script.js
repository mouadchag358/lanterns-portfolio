import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const navigationLinks = [...document.querySelectorAll('.site-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
const revealItems = document.querySelectorAll('.reveal');

menuToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
});

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => revealObserver.observe(item));

const navigationObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navigationLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -55% 0px' });

sections.forEach((section) => navigationObserver.observe(section));

const glowColors = [0x00ff00, 0xffff00, 0xff0000, 0x00ff00];

const getGlowState = (time) => {
  const progress = (time % 45000) / 15000;
  const currentIndex = Math.floor(progress);
  const transition = progress - currentIndex;
  const color = new THREE.Color(glowColors[currentIndex]);
  color.lerp(new THREE.Color(glowColors[currentIndex + 1]), transition);
  return { color, intensity: 0.8 + Math.sin(transition * Math.PI) * 1.4 };
};

const threeCanvas = document.querySelector('.three-scene');

if (threeCanvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
  const group = new THREE.Group();
  const pointer = { x: 0, y: 0 };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  camera.position.z = 6;
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));

  const light = new THREE.PointLight(0x39ff14, 7, 8);
  light.position.set(1.5, 2, 3);
  scene.add(light);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.1, 24, 96),
    new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x008000, emissiveIntensity: 1.5, metalness: 0.55, roughness: 0.25 })
  );
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 2),
    new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true, transparent: true, opacity: 0.55 })
  );

  group.add(ring, core);
  group.position.set(1.6, 0.05, 0);
  group.rotation.set(0.25, -0.35, 0.2);

  const resizeScene = () => {
    const { clientWidth, clientHeight } = threeCanvas.parentElement;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  const updatePointer = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.5;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.35;
  };

  const renderScene = (time = 0) => {
    const glow = getGlowState(time);
    group.rotation.y += (pointer.x - group.rotation.y) * 0.025;
    group.rotation.x += (pointer.y + 0.25 - group.rotation.x) * 0.025;
    ring.material.color.copy(glow.color);
    ring.material.emissive.copy(glow.color);
    ring.material.emissiveIntensity = glow.intensity;
    core.material.color.copy(glow.color);
    light.color.copy(glow.color);
    light.intensity = glow.intensity * 4;
    if (!reducedMotion) {
      ring.rotation.z = time * 0.00025;
      core.rotation.y = time * 0.00035;
    }
    renderer.render(scene, camera);
    if (!reducedMotion) window.requestAnimationFrame(renderScene);
  };

  window.addEventListener('resize', resizeScene);
  window.addEventListener('pointermove', updatePointer, { passive: true });
  resizeScene();
  renderScene();
}

const sectionSceneTypes = {
  apropos: 'about',
  competences: 'skills',
  portfolio: 'portfolio',
  formation: 'formation',
  contact: 'contact'
};

const sectionScenes = Object.entries(sectionSceneTypes).map(([sectionId, sceneType]) => {
  const section = document.getElementById(sectionId);
  if (!section) return null;

  const canvas = document.createElement('canvas');
  canvas.className = 'section-scene';
  canvas.setAttribute('aria-hidden', 'true');
  section.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const group = new THREE.Group();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const material = new THREE.MeshBasicMaterial({ color: 0x00a651, wireframe: true, transparent: true, opacity: 0.2 });
  const light = new THREE.PointLight(0x00ff00, 2.5, 6);
  light.position.set(1, 1, 2);
  const geometry = sceneType === 'portfolio'
    ? new THREE.TorusKnotGeometry(1.3, 0.08, 96, 12)
    : sceneType === 'skills'
      ? new THREE.OctahedronGeometry(1.35, 1)
      : new THREE.IcosahedronGeometry(1.25, 1);
  const object = new THREE.Mesh(geometry, material);

  group.add(object);
  group.position.set(sectionId === 'portfolio' ? -3.2 : 3.2, 0, 0);
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(light);
  camera.position.z = 5;

  const resizeScene = () => {
    const { clientWidth, clientHeight } = section;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  const renderScene = (time = 0) => {
    const glow = getGlowState(time);
    material.color.copy(glow.color);
    material.opacity = 0.12 + glow.intensity * 0.1;
    light.color.copy(glow.color);
    light.intensity = glow.intensity * 1.8;
    if (!reducedMotion) {
      object.rotation.x = time * 0.00018;
      object.rotation.y = time * 0.00025;
    }
    renderer.render(scene, camera);
    if (!reducedMotion) window.requestAnimationFrame(renderScene);
  };

  window.addEventListener('resize', resizeScene);
  resizeScene();
  renderScene();
  return renderer;
}).filter(Boolean);

const projectGeometries = [
  THREE.TorusGeometry,
  THREE.BoxGeometry,
  THREE.SphereGeometry,
  THREE.ConeGeometry
];

document.querySelectorAll('.project-art').forEach((projectArt, index) => {
  const canvas = document.createElement('canvas');
  canvas.className = 'project-scene';
  canvas.setAttribute('aria-hidden', 'true');
  projectArt.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const group = new THREE.Group();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const geometry = index === 0
    ? new projectGeometries[index](0.9, 0.16, 18, 64)
    : index === 1
      ? new projectGeometries[index](1.35, 1.35, 1.35)
      : index === 2
        ? new projectGeometries[index](0.95, 20, 12)
        : new projectGeometries[index](0.9, 1.7, 20);
  const object = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x008000, emissiveIntensity: 0.8, metalness: 0.45, roughness: 0.3, wireframe: index !== 1 })
  );

  group.add(object);
  group.rotation.set(0.3, -0.4, 0.2);
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 1.7));
  const light = new THREE.PointLight(0x00ff00, 5, 6);
  light.position.set(1, 2, 3);
  scene.add(light);
  camera.position.z = 4.5;

  const resizeScene = () => {
    const { clientWidth, clientHeight } = projectArt;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  const renderScene = (time = 0) => {
    const glow = getGlowState(time);
    object.material.color.copy(glow.color);
    object.material.emissive.copy(glow.color);
    object.material.emissiveIntensity = glow.intensity;
    light.color.copy(glow.color);
    light.intensity = glow.intensity * 3;
    if (!reducedMotion) {
      object.rotation.x = time * 0.0003;
      object.rotation.y = time * 0.0004;
    }
    renderer.render(scene, camera);
    if (!reducedMotion) window.requestAnimationFrame(renderScene);
  };

  window.addEventListener('resize', resizeScene);
  resizeScene();
  renderScene();
});