import { useEffect } from 'react';
import * as THREE from 'three';

// Three.js animated wireframe scaffolding structure for login background.
export function ScaffoldScene({ container }) {
  useEffect(() => {
    if (!container.current) return;
    const el = container.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x061429, 14, 38);

    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.set(8, 6, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // === SCAFFOLD STRUCTURE ===
    const group = new THREE.Group();
    scene.add(group);

    const navyMat = new THREE.LineBasicMaterial({ color: 0x8DA2BF, transparent: true, opacity: 0.55 });
    const orangeMat = new THREE.LineBasicMaterial({ color: 0xE8742C, transparent: true, opacity: 0.95 });
    const dotMat = new THREE.PointsMaterial({ color: 0xE8742C, size: 0.08, transparent: true, opacity: 0.9 });

    // Multi-bay scaffold: 4 bays wide × 4 lifts high × 2 bays deep
    const bayW = 1.8, bayH = 1.6, bayD = 1.8;
    const cols = 5, lifts = 5, rows = 3;
    const offsetX = -(cols - 1) * bayW / 2;
    const offsetZ = -(rows - 1) * bayD / 2;

    function addLine(p1, p2, mat) {
      const g = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const ln = new THREE.Line(g, mat);
      group.add(ln);
      return ln;
    }
    function addNode(p) {
      const g = new THREE.BufferGeometry().setFromPoints([p]);
      const pt = new THREE.Points(g, dotMat);
      group.add(pt);
    }

    // Verticals (standards)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * bayW;
        const z = offsetZ + r * bayD;
        const useOrange = (c === 0 && r === 0) || (c === cols - 1 && r === 0);
        addLine(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, lifts * bayH, z), useOrange ? orangeMat : navyMat);
        for (let l = 0; l <= lifts; l++) {
          addNode(new THREE.Vector3(x, l * bayH, z));
        }
      }
    }

    // Horizontals (ledgers — along X)
    for (let l = 1; l <= lifts; l++) {
      for (let r = 0; r < rows; r++) {
        const z = offsetZ + r * bayD;
        for (let c = 0; c < cols - 1; c++) {
          const x1 = offsetX + c * bayW;
          const x2 = offsetX + (c + 1) * bayW;
          addLine(new THREE.Vector3(x1, l * bayH, z), new THREE.Vector3(x2, l * bayH, z), navyMat);
        }
      }
    }
    // Transoms (along Z)
    for (let l = 1; l <= lifts; l++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * bayW;
        for (let r = 0; r < rows - 1; r++) {
          const z1 = offsetZ + r * bayD;
          const z2 = offsetZ + (r + 1) * bayD;
          addLine(new THREE.Vector3(x, l * bayH, z1), new THREE.Vector3(x, l * bayH, z2), navyMat);
        }
      }
    }
    // Diagonal braces (X-pattern) on front face every other bay
    for (let l = 0; l < lifts; l++) {
      for (let c = 0; c < cols - 1; c++) {
        if ((c + l) % 2 === 0) {
          const x1 = offsetX + c * bayW;
          const x2 = offsetX + (c + 1) * bayW;
          const z = offsetZ;
          addLine(new THREE.Vector3(x1, l * bayH, z), new THREE.Vector3(x2, (l + 1) * bayH, z), navyMat);
        }
      }
    }

    // Animate
    let rafId;
    let t = 0;
    const animate = () => {
      t += 0.0035;
      group.rotation.y = Math.sin(t * 0.8) * 0.4 + t * 0.15;
      group.position.y = Math.sin(t * 1.5) * 0.15 - 3.5;
      camera.position.x = Math.sin(t * 0.4) * 1.2 + 8;
      camera.lookAt(0, 2, 0);
      orangeMat.opacity = 0.7 + Math.sin(t * 4) * 0.25;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);
  return null;
}
