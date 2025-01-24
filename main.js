import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import gsap from 'gsap';
import LocomotiveScroll from 'locomotive-scroll';
const scroll = new LocomotiveScroll({
  el: document.querySelector('.main'),
  smooth: true,
  multiplier: 0.5,
  lerp: 0.05
});


// Scene
const scene = new THREE.Scene();
// Camera
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3.5;

let model;
// Renderer 
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#canvas"),
    antialias: true,
    alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0x000000, 0); // Set clear color to transparent

// Post Processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.000030;
composer.addPass(rgbShiftPass);

// PMREM Generator
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// HDRI Environment
new RGBELoader()
    .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/paul_lobe_haus_1k.hdr', 
        function(texture) {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
            
            // GLTF Loader
            const loader = new GLTFLoader();
            loader.load(
                'scene.gltf', // Replace with your model path
                function(gltf) {
                    model = gltf.scene;
                    model.scale.set(1, 1, 1); // Adjust scale if needed
                    scene.add(model);
                },
                // Loading progress callback
                function(xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                // Error callback
                function(error) {
                    console.error('An error occurred loading the model:', error);
                }
            );
        }); 

window.addEventListener("resize", (e) => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("mousemove", (e) => {
    if(model) {
        const rotationX = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.12;
        const rotationY = (e.clientY / window.innerHeight - 0.5) * Math.PI * 0.12;
        gsap.to(model.rotation, {
            y: rotationX,
            x: rotationY,
            duration: 0.9,
            ease: "power2.out"
        });
    }
});

// Animation
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    
    // Animate RGB shift amount
    rgbShiftPass.uniforms['amount'].value = Math.sin(time) * 0.003 + 0.002;
    composer.render();
}
animate();


window.addEventListener('scroll',function(){
    const scrollY=window.scrollY;
    const maxScroll=300;

    const blur=Math.min((scrollY/maxScroll)*20,30);
    document.body.style.setProperty('--bg-blur',`${blur}px`);

    document.body.classList.add('scrolled');

})

// Website loader
window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity 1s ease';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 1000);
  }, 2000);
});
