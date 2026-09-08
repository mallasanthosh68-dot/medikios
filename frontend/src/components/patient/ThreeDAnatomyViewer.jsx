import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Search,
  CheckCircle2,
  AlertCircle,
  Mic,
  MicOff,
  Sparkles,
  Layers,
  X,
  Plus,
  ChevronRight,
  Eye,
  ShieldCheck,
} from 'lucide-react';

/**
 * 23 Anatomical Body Locations Specification:
 * HEAD: Head (1)
 * FACE: Eyes, Ears, Nose, Mouth, Teeth, Tongue (2-7)
 * UPPER BODY: Neck, Shoulders, Arms, Elbows, Wrists, Hands, Fingers (8-14)
 * TORSO: Chest, Stomach, Back (15-17)
 * LOWER BODY: Hips, Legs, Knees, Ankles, Feet, Toes (18-23)
 */
export const BODY_LOCATIONS = [
  // HEAD (1)
  {
    id: 'head',
    name: 'Head',
    category: 'head_face',
    categoryLabel: 'Head & Face',
    side: 'center',
    pos: [0, 2.30, 0.08],
    color: '#0284C7',
    colorHex: 0x0284c7,
    desc: 'Headache, migraine, dizziness, head trauma',
  },
  // FACE (2-7)
  {
    id: 'eyes',
    name: 'Eyes',
    category: 'head_face',
    categoryLabel: 'Head & Face',
    side: 'bilateral',
    leftPos: [-0.14, 2.18, 0.32],
    rightPos: [0.14, 2.18, 0.32],
    pos: [0.14, 2.18, 0.32],
    color: '#0284C7',
    colorHex: 0x0284c7,
    desc: 'Vision blur, eye pain, redness, irritation',
  },
  {
    id: 'ears',
    name: 'Ears',
    category: 'head_face',
    categoryLabel: 'Head & Face',
    side: 'bilateral',
    leftPos: [-0.36, 2.14, 0.04],
    rightPos: [0.36, 2.14, 0.04],
    pos: [0.36, 2.14, 0.04],
    color: '#0284C7',
    colorHex: 0x0284c7,
    desc: 'Earache, ringing / tinnitus, hearing change',
  },
  {
    id: 'nose',
    name: 'Nose',
    category: 'head_face',
    categoryLabel: 'Head & Face',
    side: 'center',
    pos: [0, 2.06, 0.36],
    color: '#0284C7',
    colorHex: 0x0284c7,
    desc: 'Congestion, runny nose, sinus pressure, nosebleed',
  },
  {
    id: 'mouth',
    name: 'Mouth',
    category: 'head_face',
    categoryLabel: 'Head & Face',
    side: 'center',
    pos: [0, 1.94, 0.33],
    color: '#0284C7',
    colorHex: 0x0284c7,
    desc: 'Mouth sores, dryness, throat irritation',
  },
  {
    id: 'teeth',
    name: 'Teeth',
    category: 'head_face',
    categoryLabel: 'Head & Face',
    side: 'center',
    pos: [0, 1.90, 0.32],
    color: '#0284C7',
    colorHex: 0x0284c7,
    desc: 'Toothache, temperature sensitivity, gum pain',
  },
  {
    id: 'tongue',
    name: 'Tongue',
    category: 'head_face',
    categoryLabel: 'Head & Face',
    side: 'center',
    pos: [0, 1.92, 0.29],
    color: '#0284C7',
    colorHex: 0x0284c7,
    desc: 'Tongue swelling, taste alteration, pain',
  },

  // UPPER BODY (8-14)
  {
    id: 'neck',
    name: 'Neck',
    category: 'upper_body',
    categoryLabel: 'Upper Body',
    side: 'center',
    pos: [0, 1.64, 0.06],
    color: '#10B981',
    colorHex: 0x10b981,
    desc: 'Stiff neck, soreness, swallowing discomfort',
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    category: 'upper_body',
    categoryLabel: 'Upper Body',
    side: 'bilateral',
    leftPos: [-0.72, 1.50, 0.02],
    rightPos: [0.72, 1.50, 0.02],
    pos: [0.72, 1.50, 0.02],
    color: '#10B981',
    colorHex: 0x10b981,
    desc: 'Shoulder impingement, rotator cuff, stiffness',
  },
  {
    id: 'arms',
    name: 'Arms',
    category: 'upper_body',
    categoryLabel: 'Upper Body',
    side: 'bilateral',
    leftPos: [-0.92, 1.18, 0.02],
    rightPos: [0.92, 1.18, 0.02],
    pos: [0.92, 1.18, 0.02],
    color: '#10B981',
    colorHex: 0x10b981,
    desc: 'Bicep/tricep pain, arm weakness, muscle aches',
  },
  {
    id: 'elbows',
    name: 'Elbows',
    category: 'upper_body',
    categoryLabel: 'Upper Body',
    side: 'bilateral',
    leftPos: [-0.98, 0.90, 0.02],
    rightPos: [0.98, 0.90, 0.02],
    pos: [0.98, 0.90, 0.02],
    color: '#10B981',
    colorHex: 0x10b981,
    desc: 'Tennis elbow, joint swelling, tenderness',
  },
  {
    id: 'wrists',
    name: 'Wrists',
    category: 'upper_body',
    categoryLabel: 'Upper Body',
    side: 'bilateral',
    leftPos: [-1.05, 0.54, 0.04],
    rightPos: [1.05, 0.54, 0.04],
    pos: [1.05, 0.54, 0.04],
    color: '#10B981',
    colorHex: 0x10b981,
    desc: 'Carpal tunnel, sprain, stiffness, tingling',
  },
  {
    id: 'hands',
    name: 'Hands',
    category: 'upper_body',
    categoryLabel: 'Upper Body',
    side: 'bilateral',
    leftPos: [-1.10, 0.32, 0.04],
    rightPos: [1.10, 0.32, 0.04],
    pos: [1.10, 0.32, 0.04],
    color: '#10B981',
    colorHex: 0x10b981,
    desc: 'Hand numbness, arthritis, swelling, tremor',
  },
  {
    id: 'fingers',
    name: 'Fingers',
    category: 'upper_body',
    categoryLabel: 'Upper Body',
    side: 'bilateral',
    leftPos: [-1.12, 0.14, 0.04],
    rightPos: [1.12, 0.14, 0.04],
    pos: [1.12, 0.14, 0.04],
    color: '#10B981',
    colorHex: 0x10b981,
    desc: 'Finger joint pain, numbness, swelling, stiffness',
  },

  // TORSO (15-17)
  {
    id: 'chest',
    name: 'Chest',
    category: 'torso',
    categoryLabel: 'Torso & Abdomen',
    side: 'center',
    pos: [0, 1.28, 0.28],
    color: '#F59E0B',
    colorHex: 0xf59e0b,
    desc: 'Chest tightness, discomfort, pain when breathing',
  },
  {
    id: 'stomach',
    name: 'Stomach',
    category: 'torso',
    categoryLabel: 'Torso & Abdomen',
    side: 'center',
    pos: [0, 0.80, 0.26],
    color: '#F59E0B',
    colorHex: 0xf59e0b,
    desc: 'Abdominal pain, cramping, nausea, bloating',
  },
  {
    id: 'back',
    name: 'Back',
    category: 'torso',
    categoryLabel: 'Torso & Abdomen',
    side: 'center',
    pos: [0, 1.10, -0.28],
    isPosterior: true,
    color: '#F59E0B',
    colorHex: 0xf59e0b,
    desc: 'Lower back stiffness, upper spine tension, muscle spasm',
  },

  // LOWER BODY (18-23)
  {
    id: 'hips',
    name: 'Hips',
    category: 'lower_body',
    categoryLabel: 'Lower Body',
    side: 'bilateral',
    leftPos: [-0.40, 0.34, 0.08],
    rightPos: [0.40, 0.34, 0.08],
    pos: [0.40, 0.34, 0.08],
    color: '#8B5CF6',
    colorHex: 0x8b5cf6,
    desc: 'Hip joint stiffness, pelvic discomfort, limited range',
  },
  {
    id: 'legs',
    name: 'Legs',
    category: 'lower_body',
    categoryLabel: 'Lower Body',
    side: 'bilateral',
    leftPos: [-0.38, -0.28, 0.08],
    rightPos: [0.38, -0.28, 0.08],
    pos: [0.38, -0.28, 0.08],
    color: '#8B5CF6',
    colorHex: 0x8b5cf6,
    desc: 'Thigh soreness, quad strain, calf tightness, cramps',
  },
  {
    id: 'knees',
    name: 'Knees',
    category: 'lower_body',
    categoryLabel: 'Lower Body',
    side: 'bilateral',
    leftPos: [-0.38, -0.90, 0.12],
    rightPos: [0.38, -0.90, 0.12],
    pos: [0.38, -0.90, 0.12],
    color: '#8B5CF6',
    colorHex: 0x8b5cf6,
    desc: 'Knee swelling, stiffness, pain when bending or walking',
  },
  {
    id: 'ankles',
    name: 'Ankles',
    category: 'lower_body',
    categoryLabel: 'Lower Body',
    side: 'bilateral',
    leftPos: [-0.38, -1.60, 0.08],
    rightPos: [0.38, -1.60, 0.08],
    pos: [0.38, -1.60, 0.08],
    color: '#8B5CF6',
    colorHex: 0x8b5cf6,
    desc: 'Ankle sprain, swelling, joint pain, tenderness',
  },
  {
    id: 'feet',
    name: 'Feet',
    category: 'lower_body',
    categoryLabel: 'Lower Body',
    side: 'bilateral',
    leftPos: [-0.40, -1.86, 0.18],
    rightPos: [0.40, -1.86, 0.18],
    pos: [0.40, -1.86, 0.18],
    color: '#8B5CF6',
    colorHex: 0x8b5cf6,
    desc: 'Arch pain, heel tenderness, tingling, numbness',
  },
  {
    id: 'toes',
    name: 'Toes',
    category: 'lower_body',
    categoryLabel: 'Lower Body',
    side: 'bilateral',
    leftPos: [-0.40, -1.90, 0.36],
    rightPos: [0.40, -1.90, 0.36],
    pos: [0.40, -1.90, 0.36],
    color: '#8B5CF6',
    colorHex: 0x8b5cf6,
    desc: 'Toe pain, swelling, nail sensitivity, numbness',
  },
];

export default function ThreeDAnatomyViewer({
  onSelectZone,
  onConfirmSymptoms,
  selectedZoneId = null,
  initialSelections = [],
}) {
  const mountRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  // Active / Selected locations
  const [selectedLocations, setSelectedLocations] = useState(() => {
    if (selectedZoneId) {
      const match = BODY_LOCATIONS.find((l) => l.id === selectedZoneId);
      return match ? [{ ...match, side: 'center', symptomText: '' }] : [];
    }
    return initialSelections || [];
  });

  const [activeLoc, setActiveLoc] = useState(() => {
    if (selectedZoneId) {
      return BODY_LOCATIONS.find((l) => l.id === selectedZoneId) || BODY_LOCATIONS[14]; // default Chest
    }
    return BODY_LOCATIONS[14]; // default Chest
  });

  // Active side for bilateral items: 'left' | 'right' | 'center'
  const [selectedSide, setSelectedSide] = useState('center');
  const [symptomInput, setSymptomInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredLoc, setHoveredLoc] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [currentView, setCurrentView] = useState('front'); // 'front' | 'back'

  // Three.js internal references
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const bodyGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  const targetRotationY = useRef(0);
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });

  // Filtered locations based on search
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return BODY_LOCATIONS;
    const q = searchQuery.toLowerCase().trim();
    return BODY_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.categoryLabel.toLowerCase().includes(q) ||
        l.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Voice Speech Recognition setup
  const recognitionRef = useRef(null);
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSymptomInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  // 1. Initialize Three.js Clean Medical Humanoid Scene
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
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 560;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 6.2);
    cameraRef.current = camera;

    // Soft Healthcare Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x0ea5a8, 1.2);
    rimLight.position.set(-4, -2, -4);
    scene.add(rimLight);

    const softFill = new THREE.DirectionalLight(0x0284c7, 0.8);
    softFill.position.set(0, 4, -5);
    scene.add(softFill);

    // Root Group for 3D Body & Markers
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    // 2. Build Clean Medical Anatomical Silhouette (Smooth Humanoid Proportions)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85,
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5a8,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });

    const addBodyPart = (geom, x, y, z, rotX = 0, rotY = 0, rotZ = 0) => {
      const mesh = new THREE.Mesh(geom, bodyMaterial);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rotX, rotY, rotZ);
      bodyGroup.add(mesh);

      const wire = new THREE.Mesh(geom, wireMat);
      wire.position.set(x, y, z);
      wire.rotation.set(rotX, rotY, rotZ);
      bodyGroup.add(wire);
    };

    // Head (Cranium & Jaw contour)
    addBodyPart(new THREE.SphereGeometry(0.38, 32, 24), 0, 2.15, 0.05);
    // Neck
    addBodyPart(new THREE.CylinderGeometry(0.18, 0.22, 0.35, 24), 0, 1.68, 0.04);
    // Chest / Upper Torso
    addBodyPart(new THREE.BoxGeometry(0.92, 0.75, 0.45), 0, 1.25, 0.02);
    // Stomach / Mid Torso
    addBodyPart(new THREE.CylinderGeometry(0.42, 0.38, 0.65, 24), 0, 0.72, 0.02);
    // Hips / Pelvis
    addBodyPart(new THREE.BoxGeometry(0.85, 0.45, 0.42), 0, 0.30, 0.02);

    // Shoulders
    addBodyPart(new THREE.SphereGeometry(0.18, 20, 20), -0.58, 1.50, 0.02);
    addBodyPart(new THREE.SphereGeometry(0.18, 20, 20), 0.58, 1.50, 0.02);

    // Arms & Forearms (Bilateral)
    addBodyPart(new THREE.CylinderGeometry(0.14, 0.12, 0.60, 20), -0.74, 1.15, 0.02);
    addBodyPart(new THREE.CylinderGeometry(0.14, 0.12, 0.60, 20), 0.74, 1.15, 0.02);
    addBodyPart(new THREE.CylinderGeometry(0.11, 0.09, 0.55, 20), -0.85, 0.60, 0.03);
    addBodyPart(new THREE.CylinderGeometry(0.11, 0.09, 0.55, 20), 0.85, 0.60, 0.03);
    // Hands
    addBodyPart(new THREE.BoxGeometry(0.12, 0.22, 0.06), -0.92, 0.22, 0.03);
    addBodyPart(new THREE.BoxGeometry(0.12, 0.22, 0.06), 0.92, 0.22, 0.03);

    // Thighs / Upper Legs
    addBodyPart(new THREE.CylinderGeometry(0.20, 0.16, 0.85, 24), -0.28, -0.35, 0.02);
    addBodyPart(new THREE.CylinderGeometry(0.20, 0.16, 0.85, 24), 0.28, -0.35, 0.02);
    // Knees
    addBodyPart(new THREE.SphereGeometry(0.15, 20, 20), -0.28, -0.85, 0.04);
    addBodyPart(new THREE.SphereGeometry(0.15, 20, 20), 0.28, -0.85, 0.04);
    // Lower Legs / Calves
    addBodyPart(new THREE.CylinderGeometry(0.15, 0.11, 0.80, 24), -0.28, -1.30, 0.02);
    addBodyPart(new THREE.CylinderGeometry(0.15, 0.11, 0.80, 24), 0.28, -1.30, 0.02);
    // Feet
    addBodyPart(new THREE.BoxGeometry(0.18, 0.12, 0.42), -0.28, -1.82, 0.12);
    addBodyPart(new THREE.BoxGeometry(0.18, 0.12, 0.42), 0.28, -1.82, 0.12);

    // Subtle Medical Floor Disc
    const floorGeo = new THREE.CircleGeometry(2.8, 36);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5a8,
      transparent: true,
      opacity: 0.06,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.95;
    bodyGroup.add(floor);

    // 3. Create 3D Clickable Anatomical Markers Group
    const markersGroup = new THREE.Group();
    bodyGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Raycaster for mouse click / hover on markers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastIntersect = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObjects(markersGroup.children, true);
    };

    const handlePointerDown = (e) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - prevMousePosRef.current.x;
        targetRotationY.current += deltaX * 0.008;
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else {
        const intersects = getRaycastIntersect(e);
        if (intersects.length > 0) {
          const loc = intersects[0].object.userData.location;
          setHoveredLoc(loc);
          container.style.cursor = 'pointer';
        } else {
          setHoveredLoc(null);
          container.style.cursor = 'grab';
        }
      }
    };

    const handlePointerUp = (e) => {
      if (isDraggingRef.current) {
        // If it was a quick click without much drag, treat as click on marker
        const deltaX = Math.abs(e.clientX - prevMousePosRef.current.x);
        if (deltaX < 5) {
          const intersects = getRaycastIntersect(e);
          if (intersects.length > 0) {
            const loc = intersects[0].object.userData.location;
            const side = intersects[0].object.userData.side || 'center';
            handleMarkerClick(loc, side);
          }
        }
      }
      isDraggingRef.current = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(
        Math.min(camera.position.z + e.deltaY * 0.005, 8.5),
        3.8
      );
    };

    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Touch support for mobile
    let initialPinchDist = null;
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - prevMousePosRef.current.x;
        targetRotationY.current += deltaX * 0.008;
        prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && initialPinchDist) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = initialPinchDist - dist;
        camera.position.z = Math.max(Math.min(camera.position.z + diff * 0.01, 8.5), 3.8);
        initialPinchDist = dist;
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      initialPinchDist = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Auto-rotation (if user enabled)
      if (autoRotate && !isDraggingRef.current) {
        targetRotationY.current += 0.003;
      }

      // Smooth rotation dampening
      bodyGroup.rotation.y += (targetRotationY.current - bodyGroup.rotation.y) * 0.08;

      // Pulse markers
      markersGroup.children.forEach((markerMesh) => {
        const isSelected = markerMesh.userData.isSelected;
        if (isSelected) {
          const scale = 1 + Math.sin(elapsed * 4) * 0.18;
          markerMesh.scale.set(scale, scale, scale);
        } else {
          markerMesh.scale.set(1, 1, 1);
        }
      });

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
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [autoRotate]);

  // Re-render markers inside Three.js whenever selectedLocations or activeLoc changes
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    if (!markersGroup) return;

    // Clear existing markers
    while (markersGroup.children.length > 0) {
      const obj = markersGroup.children[0];
      markersGroup.remove(obj);
      obj.geometry?.dispose();
      obj.material?.dispose();
    }

    // Spawn 23 Anatomical Markers
    BODY_LOCATIONS.forEach((loc) => {
      const isSelected = selectedLocations.some((s) => s.id === loc.id);
      const isActive = activeLoc?.id === loc.id;

      // Determine marker color
      let markerColor = loc.colorHex;
      if (isSelected || isActive) {
        markerColor = 0xef4444; // Red for selected
      }

      const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: markerColor,
        emissive: markerColor,
        emissiveIntensity: isSelected || isActive ? 0.6 : 0.25,
        roughness: 0.2,
      });

      // If bilateral, place left and right markers
      if (loc.side === 'bilateral' && loc.leftPos && loc.rightPos) {
        // Left
        const leftMarker = new THREE.Mesh(sphereGeo, sphereMat);
        leftMarker.position.set(...loc.leftPos);
        leftMarker.userData = { location: loc, side: 'left', isSelected: isSelected || isActive };
        markersGroup.add(leftMarker);

        // Right
        const rightMarker = new THREE.Mesh(sphereGeo, sphereMat);
        rightMarker.position.set(...loc.rightPos);
        rightMarker.userData = { location: loc, side: 'right', isSelected: isSelected || isActive };
        markersGroup.add(rightMarker);
      } else {
        const centerMarker = new THREE.Mesh(sphereGeo, sphereMat);
        centerMarker.position.set(...loc.pos);
        centerMarker.userData = { location: loc, side: 'center', isSelected: isSelected || isActive };
        markersGroup.add(centerMarker);
      }
    });
  }, [selectedLocations, activeLoc]);

  // Handle marker selection
  const handleMarkerClick = (loc, side = 'center') => {
    setActiveLoc(loc);
    setSelectedSide(side);
    if (onSelectZone) {
      onSelectZone({
        id: loc.id,
        name: loc.name,
        category: loc.category,
        side: side,
        subtext: loc.desc,
      });
    }

    // Auto rotate to face the selected point if it's posterior (like Back)
    if (loc.isPosterior) {
      targetRotationY.current = Math.PI;
      setCurrentView('back');
    } else if (currentView === 'back') {
      targetRotationY.current = 0;
      setCurrentView('front');
    }
  };

  // Add location with symptom description
  const handleAddLocationSymptom = () => {
    if (!activeLoc) return;

    const existingIdx = selectedLocations.findIndex(
      (s) => s.id === activeLoc.id && s.side === selectedSide
    );

    const newEntry = {
      id: activeLoc.id,
      name: activeLoc.name,
      category: activeLoc.category,
      side: selectedSide,
      color: activeLoc.color,
      symptomText: symptomInput.trim() || activeLoc.desc,
    };

    let updated;
    if (existingIdx >= 0) {
      updated = [...selectedLocations];
      updated[existingIdx] = newEntry;
    } else {
      updated = [...selectedLocations, newEntry];
    }

    setSelectedLocations(updated);
    setSymptomInput('');

    if (onConfirmSymptoms) {
      onConfirmSymptoms({
        locations: updated,
        primaryLocation: newEntry,
        summaryText: `Reported symptoms in ${updated.map((u) => `${u.side !== 'center' ? `${u.side} ` : ''}${u.name} (${u.symptomText})`).join(', ')}.`,
      });
    }
  };

  const handleRemoveLocation = (id, side) => {
    const updated = selectedLocations.filter(
      (s) => !(s.id === id && s.side === side)
    );
    setSelectedLocations(updated);
  };

  const handleClearAll = () => {
    setSelectedLocations([]);
    setSymptomInput('');
  };

  // Camera View Toggle: Front / Back (Smooth rotation)
  const setCameraFront = () => {
    targetRotationY.current = 0;
    setCurrentView('front');
  };

  const setCameraBack = () => {
    targetRotationY.current = Math.PI;
    setCurrentView('back');
  };

  const resetCameraView = () => {
    targetRotationY.current = 0;
    setCurrentView('front');
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0.2, 6.2);
    }
  };

  const zoomCamera = (delta) => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(
        Math.min(cameraRef.current.position.z + delta, 8.5),
        3.8
      );
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-[#D9E4E5] shadow-xs overflow-hidden flex flex-col">
      
      {/* 1. TOP HEADER & INSTRUCTION BAR */}
      <div className="p-5 sm:p-6 border-b border-[#D9E4E5] bg-gradient-to-r from-white via-[#F8FAFC] to-[#E6F7F7]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/25 text-xs font-semibold text-[#0EA5A8] mb-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive 3D Anatomical Body Map</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#172033]">
            Where are you experiencing the problem?
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Select the area of your body that you want to tell us about. Drag to rotate • Scroll to zoom • Click any point.
          </p>
        </div>

        {/* Search Input Filter */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search body area (e.g. Chest, Knee)..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#D9E4E5] rounded-xl text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] transition-colors"
          />
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: 3D BODY MODEL (LEFT) + SYMPTOM INPUT PANEL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1">
        
        {/* LEFT COLUMN: 3D THREE.JS CANVAS & CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 relative bg-[#F8FAFC] border-b lg:border-b-0 lg:border-r border-[#D9E4E5] flex flex-col items-center justify-center min-h-[460px] sm:min-h-[540px] select-none">
          
          {/* Floating Camera Controls Toolbar */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#D9E4E5] shadow-xs">
            <button
              onClick={setCameraFront}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                currentView === 'front'
                  ? 'bg-[#0EA5A8] text-white shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F3F8F8]'
              }`}
            >
              Front View
            </button>
            <button
              onClick={setCameraBack}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                currentView === 'back'
                  ? 'bg-[#0EA5A8] text-white shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F3F8F8]'
              }`}
            >
              Back View
            </button>
            <button
              onClick={resetCameraView}
              title="Reset 3D View"
              className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => zoomCamera(-0.6)}
              title="Zoom In"
              className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => zoomCamera(0.6)}
              title="Zoom Out"
              className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold transition-all ${
                autoRotate
                  ? 'bg-cyan-100 text-cyan-800'
                  : 'text-[#94A3B8] hover:bg-[#F3F8F8]'
              }`}
            >
              Auto {autoRotate ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Color Code Legend */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D9E4E5] shadow-xs hidden sm:flex items-center gap-3 text-[10px] text-[#64748B] font-medium">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0284C7]" /> Head/Face</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]" /> Upper Body</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Torso</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Lower Body</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" /> Selected</span>
          </div>

          {/* Hover Tooltip Overlay */}
          {hoveredLoc && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-semibold pointer-events-none flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredLoc.color }} />
              <span>{hoveredLoc.name}</span>
              <span className="text-[10px] text-slate-300 font-normal">({hoveredLoc.desc})</span>
            </div>
          )}

          {/* 3D WebGL Canvas Mount */}
          <div
            ref={mountRef}
            className="w-full h-[460px] sm:h-[540px] cursor-grab active:cursor-grabbing relative z-10"
          />

          {/* 2D Fallback if WebGL unavailable */}
          {!hasWebGL && (
            <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center bg-white/95">
              <AlertCircle className="w-12 h-12 text-[#0EA5A8] mb-3" />
              <h4 className="text-base font-bold text-[#172033]">2D Interactive Body Map</h4>
              <p className="text-xs text-[#64748B] max-w-sm mt-1 mb-4">
                WebGL acceleration unavailable. Use the synchronized body location list to select your symptom areas.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SYMPTOM SPECIFICATION & NATURAL LANGUAGE INPUT (5 COLS) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
          
          <div className="space-y-6">
            
            {/* Active Selected Location Card */}
            {activeLoc ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#E6F7F7]/40 border border-[#D9E4E5] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                    Active Location
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/20">
                    {activeLoc.categoryLabel}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                    style={{ backgroundColor: activeLoc.color }}
                  >
                    🔴
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-[#172033] tracking-tight">
                      {activeLoc.name}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">{activeLoc.desc}</p>
                  </div>
                </div>

                {/* Bilateral Side Selector (If applicable: Left / Right / Both) */}
                {activeLoc.side === 'bilateral' && (
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                    <span className="text-[11px] font-bold text-[#475569] block mb-2">
                      Which side is affected?
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {['left', 'right', 'both'].map((side) => (
                        <button
                          key={side}
                          onClick={() => setSelectedSide(side)}
                          className={`py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                            selectedSide === side
                              ? 'bg-[#0EA5A8] text-white shadow-xs'
                              : 'bg-white border border-[#D9E4E5] text-[#64748B] hover:bg-[#F3F8F8]'
                          }`}
                        >
                          {side}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-[#CBD5E1] text-center text-xs text-[#64748B]">
                Click any marker on the 3D model or select an anatomical location below.
              </div>
            )}

            {/* Natural Language Symptom Input Box (Section 8) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#172033] flex items-center justify-between">
                <span>What are you experiencing in this area?</span>
                <span className="text-[10px] text-[#94A3B8] font-normal">Natural speech or text</span>
              </label>

              <div className="relative">
                <textarea
                  rows={3}
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder={`e.g. Sharp pain when breathing deeply, swelling since yesterday...`}
                  className="w-full p-3.5 bg-[#F8FAFC] border border-[#D9E4E5] rounded-2xl text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white transition-all resize-none"
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Stop voice recording' : 'Speak your symptoms'}
                    className={`p-2 rounded-xl transition-all shadow-xs cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white border border-[#D9E4E5] text-[#64748B] hover:text-[#0EA5A8] hover:border-[#0EA5A8]'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddLocationSymptom}
                  disabled={!activeLoc}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {activeLoc ? activeLoc.name : 'Area'} to Symptom List</span>
                </button>
              </div>
            </div>

            {/* Multiple Selected Areas Tags (Section 10) */}
            {selectedLocations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#D9E4E5]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#172033]">
                    Selected Areas ({selectedLocations.length})
                  </span>
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 custom-scrollbar">
                  {selectedLocations.map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#172033] shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-bold">
                        {item.side && item.side !== 'center' ? `${item.side} ` : ''}
                        {item.name}
                      </span>
                      {item.symptomText && (
                        <span className="text-[10px] text-[#64748B] max-w-[120px] truncate">
                          ({item.symptomText})
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveLocation(item.id, item.side)}
                        className="text-[#94A3B8] hover:text-[#DC2626] ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-[#D9E4E5] space-y-3">
            <button
              onClick={() => {
                if (selectedLocations.length === 0 && activeLoc) {
                  handleAddLocationSymptom();
                } else if (onConfirmSymptoms) {
                  onConfirmSymptoms({
                    locations: selectedLocations,
                    summaryText: `Patient highlighted symptom locations: ${selectedLocations.map((s) => s.name).join(', ')}.`,
                  });
                }
              }}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0C8F92] hover:to-[#0369A1] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue AI Health Check-Up</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Non-diagnostic disclaimer */}
            <p className="text-[11px] text-[#94A3B8] text-center leading-relaxed">
              MediKiosk symptom location tool helps you communicate where you feel discomfort. It is strictly non-diagnostic.
            </p>
          </div>

        </div>

      </div>

      {/* 3. SYNCHRONIZED 23 BODY LOCATIONS LIST / CHIPS (Section 14) */}
      <div className="p-5 sm:p-6 border-t border-[#D9E4E5] bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0EA5A8]" />
            <span className="text-xs font-bold text-[#172033]">
              All 23 Selectable Body Regions (Synchronized with 3D Model)
            </span>
          </div>
          <span className="text-[11px] text-[#64748B]">
            {filteredLocations.length} locations available
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredLocations.map((loc) => {
            const isSelected = selectedLocations.some((s) => s.id === loc.id);
            const isActive = activeLoc?.id === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleMarkerClick(loc, 'center')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected || isActive
                    ? 'bg-rose-500 text-white shadow-xs font-bold scale-102'
                    : 'bg-white border border-[#D9E4E5] text-[#475569] hover:border-[#0EA5A8] hover:text-[#0EA5A8]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isSelected || isActive ? '#ffffff' : loc.color,
                  }}
                />
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
