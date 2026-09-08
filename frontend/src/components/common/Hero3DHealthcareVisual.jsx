import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Activity, ShieldCheck, Heart, FileText, Sparkles } from 'lucide-react';

/**
 * Hero3DHealthcareVisual
 * Lightweight, calm, interactive Three.js 3D medical sphere.
 * Contains:
 * - Transparent outer medical sphere with geometric facets
 * - Central 3D glowing medical cross
 * - AI neural nodes & anatomical vitals data points
 * - Orbiting soft ambient healthcare particles
 * - Parallax mouse response & ultra-slow majestic rotation
 * - Subtle floating HTML glass metric cards with responsive depth
 */
export const Hero3DHealthcareVisual = () => {
  const mountRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL not supported, falling back to 2D visual:', e);
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8;

    // Lighting (Medical Teal & Soft White)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x0ea5a8, 2.5, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0284c7, 2.0, 50);
    pointLight2.position.set(-5, -5, 3);
    scene.add(pointLight2);

    // Group for the entire sphere setup
    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    // 1. Outer Transparent Medical Sphere (Dual-layer wireframe + subtle glassy surface)
    const sphereGeo = new THREE.IcosahedronGeometry(2.5, 2);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5a8,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, wireframeMat);
    sphereGroup.add(sphereMesh);

    // Inner smooth faint translucent shell
    const innerShellGeo = new THREE.SphereGeometry(2.35, 32, 32);
    const innerShellMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.08,
      roughness: 0.2,
      metalness: 0.1,
    });
    const innerShellMesh = new THREE.Mesh(innerShellGeo, innerShellMat);
    sphereGroup.add(innerShellMesh);

    // 2. Central 3D Glowing Healthcare Cross
    const crossGroup = new THREE.Group();
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5a8,
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x0ea5a8,
      emissiveIntensity: 0.25,
    });

    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.35, 0.38), crossMat);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.38, 0.38), crossMat);
    crossGroup.add(vBar);
    crossGroup.add(hBar);
    sphereGroup.add(crossGroup);

    // 3. Stylized Anatomical Vitals Silhouette / Rings
    const ringMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(0, 0, 1.7, 1.7, 0, 2 * Math.PI, false, 0).getPoints(64).map(p => new THREE.Vector3(p.x, p.y, 0))
    ), ringMat);
    ring1.rotation.x = Math.PI / 3;
    sphereGroup.add(ring1);

    const ring2 = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(0, 0, 1.9, 1.9, 0, 2 * Math.PI, false, 0).getPoints(64).map(p => new THREE.Vector3(p.x, p.y, 0))
    ), ringMat);
    ring2.rotation.y = Math.PI / 4;
    sphereGroup.add(ring2);

    // 4. AI Neural Data Nodes (Small glowing spheres on surface points)
    const nodeGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const nodesGroup = new THREE.Group();

    const nodePositions = [
      [1.6, 1.2, 0.8],
      [-1.4, 1.4, -0.9],
      [1.2, -1.5, 0.9],
      [-1.5, -1.1, -0.8],
      [0.2, 2.1, 0.4],
      [0.3, -2.1, -0.3],
      [2.0, 0.3, -0.6],
      [-2.1, 0.2, 0.7],
    ];

    nodePositions.forEach(([x, y, z]) => {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, z);
      nodesGroup.add(node);
    });
    sphereGroup.add(nodesGroup);

    // 5. Connective AI Lines
    const linePoints = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const p1 = new THREE.Vector3(...nodePositions[i]);
        const p2 = new THREE.Vector3(...nodePositions[j]);
        if (p1.distanceTo(p2) < 2.5) {
          linePoints.push(p1, p2);
        }
      }
    }
    const linesGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x0ea5a8,
      transparent: true,
      opacity: 0.22,
    });
    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    sphereGroup.add(linesMesh);

    // 6. Ambient Floating Data Particles
    const particleCount = 70;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.0 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x0ea5a8,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    sphereGroup.add(particlePoints);

    // Animation & Smooth Parallax Loop
    let targetRotX = 0;
    let targetRotY = 0;
    let lastMouseMoveTime = Date.now();
    let animationFrameId;

    const onPointerMove = (e) => {
      lastMouseMoveTime = Date.now();
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      // Mouse tilts 3D object smoothly (max ~0.25 rad)
      targetRotY = x * 0.28;
      targetRotX = -y * 0.28;
      setMousePos({ x, y });
    };

    const onPointerLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
      setMousePos({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    container.addEventListener('mouseleave', onPointerLeave);

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // If user hasn't moved mouse for > 1.2 seconds, smoothly return targetRot toward 0
      if (Date.now() - lastMouseMoveTime > 1200) {
        targetRotX *= 0.95;
        targetRotY *= 0.95;
      }

      // Ultra-slow, calm majestic rotation
      sphereMesh.rotation.y = elapsedTime * 0.07;
      sphereMesh.rotation.x = Math.sin(elapsedTime * 0.04) * 0.08;

      // Slow cross counter-rotation
      crossGroup.rotation.y = -elapsedTime * 0.10;
      crossGroup.rotation.z = Math.cos(elapsedTime * 0.06) * 0.06;

      // Gentle floating pulse
      const pulseScale = 1 + Math.sin(elapsedTime * 1.2) * 0.018;
      crossGroup.scale.set(pulseScale, pulseScale, pulseScale);

      // Smooth parallax damping to target
      sphereGroup.rotation.y += (targetRotY - sphereGroup.rotation.y) * 0.06;
      sphereGroup.rotation.x += (targetRotX - sphereGroup.rotation.x) * 0.06;

      // 3D position subtle displacement (6px equivalent in 3D units: ~0.15)
      sphereGroup.position.x += (targetRotY * 0.4 - sphereGroup.position.x) * 0.06;
      sphereGroup.position.y += (targetRotX * 0.4 - sphereGroup.position.y) * 0.06;

      // Background particles move slightly slower (2px equivalent)
      particlePoints.rotation.y = elapsedTime * 0.04;
      particlePoints.position.x += (targetRotY * 0.15 - particlePoints.position.x) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      data-cursor="3d"
      className="relative w-full h-[450px] sm:h-[520px] flex items-center justify-center select-none"
    >
      
      {/* Soft radial backdrop accent behind sphere */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#0EA5A8]/15 via-[#0284C7]/10 to-transparent blur-3xl pointer-events-none" />

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full flex items-center justify-center relative z-10 cursor-grab active:cursor-grabbing"
      />

      {/* WebGL Fallback if device lacks hardware acceleration */}
      {!hasWebGL && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-[#D9E4E5]">
          <div className="w-20 h-20 rounded-3xl bg-[#E6F7F7] border border-[#0EA5A8]/30 flex items-center justify-center text-[#0EA5A8] mb-4">
            <Activity className="w-10 h-10 animate-pulse" />
          </div>
          <h4 className="text-sm font-bold text-[#172033]">AI Clinical Triage Sphere</h4>
          <p className="text-xs text-[#64748B] mt-1 max-w-xs">
            Interactive health telemetry and adaptive intelligence visualization.
          </p>
        </div>
      )}

      {/* Floating Glass Medical Cards with subtle Parallax */}
      {/* Top Right Card: Vital Metrics */}
      <div
        className="absolute top-6 sm:top-10 -right-2 sm:right-4 z-20 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#D9E4E5] shadow-lg shadow-black/5 transition-transform duration-300 ease-out hidden xs:flex items-center gap-3"
        style={{
          transform: `translate3d(${mousePos.x * -12}px, ${mousePos.y * -12}px, 0)`,
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 text-emerald-600 animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
            Live Vitals Telemetry
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-[#172033]">HR 72 bpm</span>
            <span className="text-emerald-600 text-[10px] font-bold font-mono">• SpO2 99%</span>
          </div>
        </div>
      </div>

      {/* Bottom Left Card: Hospital Report Extraction */}
      <div
        className="absolute bottom-6 sm:bottom-12 -left-2 sm:left-4 z-20 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#D9E4E5] shadow-lg shadow-black/5 transition-transform duration-300 ease-out flex items-center gap-3"
        style={{
          transform: `translate3d(${mousePos.x * 14}px, ${mousePos.y * 14}px, 0)`,
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 text-[#0EA5A8] flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5A8] block">
            Report Intelligence
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-bold text-[#172033]">Lab Report Extracted</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Floating Pill Badge: AI Autonomous Triage */}
      <div
        className="absolute top-1/2 -left-4 sm:left-2 -translate-y-1/2 z-20 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#D9E4E5] shadow-md shadow-black/5 text-xs font-bold text-[#172033] hidden md:flex items-center gap-2"
        style={{
          transform: `translate3d(${mousePos.x * 8}px, ${mousePos.y * 8}px, 0)`,
        }}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#0EA5A8]" />
        <span className="text-[11px]">AI Clinical Intelligence</span>
      </div>

    </div>
  );
};
