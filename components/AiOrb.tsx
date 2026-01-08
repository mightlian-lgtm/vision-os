import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AppState } from '../types';

interface AiOrbProps {
  state: AppState;
}

const AiOrb: React.FC<AiOrbProps> = ({ state }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number>(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = 64; 
    const height = 64;
    
    // 1. Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.0;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Geometry: Increased density (~64 points)
    const geometry = new THREE.BufferGeometry();
    const points: number[] = [];
    const r = 0.95;

    const rings = [
        { lat: Math.PI / 7, count: 8 },
        { lat: Math.PI / 4, count: 12 },
        { lat: Math.PI / 2.5, count: 14 },
        { lat: Math.PI / 2, count: 14 },
    ];
    
    // Poles
    points.push(0, r * 1.05, 0);
    points.push(0, -r * 1.05, 0);

    rings.forEach(ring => {
        for (let i = 0; i < ring.count; i++) {
            const theta = (i / ring.count) * Math.PI * 2;
            // Top half
            points.push(r * Math.sin(ring.lat) * Math.cos(theta), r * Math.cos(ring.lat), r * Math.sin(ring.lat) * Math.sin(theta));
             // Bottom half
            points.push(r * Math.sin(ring.lat) * Math.cos(theta), -r * Math.cos(ring.lat), r * Math.sin(ring.lat) * Math.sin(theta));
        }
    });


    const positions = new Float32Array(points); // 2 + (8+12+14+14)*2 = 100
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // 3. Material
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.06,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // 4. Animation Loop
    let time = 0;
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      time += 0.015;
      
      const currentState = stateRef.current;
      const pts = particlesRef.current;

      if (pts) {
        const mat = pts.material as THREE.PointsMaterial;

        // --- STATE VISUALS ---
        if (currentState === AppState.ANALYZING) {
            pts.rotation.y += 0.08;
            pts.rotation.z += 0.04;
            mat.color.setHex(0xa78bfa); 
            mat.opacity = 0.9;
            mat.size = 0.09; 
            pts.scale.setScalar(1 + Math.sin(time * 10) * 0.05);

        } else if (currentState === AppState.RESULT) {
            pts.rotation.y += 0.02;
            mat.color.setHex(0x60a5fa); 
            mat.opacity = 0.8;
            mat.size = 0.08;
            pts.position.y = Math.sin(time * 2) * 0.05;
            pts.scale.setScalar(1);

        } else { // IDLE, MONITORING, FOCUSED
            pts.rotation.y += 0.005;
            mat.color.setHex(0xffffff); 
            mat.opacity = 0.4;
            mat.size = 0.06;
            pts.position.y = 0;
            pts.scale.setScalar(1);
        }
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const getWrapperStyle = (): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
          transition: 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
      };

      if (state === AppState.ANALYZING) {
          return { ...baseStyle, transform: 'scale(1.1)', background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(167, 139, 250, 0.8)', boxShadow: '0 0 30px rgba(139, 92, 246, 0.6), inset 0 0 15px rgba(139, 92, 246, 0.4)', animation: 'pulse-fast 0.8s infinite alternate' };
      } else if (state === AppState.RESULT) {
           return { ...baseStyle, transform: 'scale(1.05)', background: 'rgba(10, 20, 40, 0.5)', borderColor: 'rgba(96, 165, 250, 0.6)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(59, 130, 246, 0.2)', animation: 'float-slow 3s ease-in-out infinite' };
      } else { // IDLE, MONITORING, FOCUSED
           return { ...baseStyle, transform: 'scale(1)', background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', boxShadow: '0 0 10px rgba(255, 255, 255, 0.05)', animation: 'breathe-slow 5s ease-in-out infinite' };
      }
  };

  return (
    <>
        <style>{`
            @keyframes pulse-fast { 0% { transform: scale(1.1); box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); } 100% { transform: scale(1.15); box-shadow: 0 0 50px rgba(139, 92, 246, 0.9); } }
            @keyframes breathe-slow { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
            @keyframes float-slow { 0%, 100% { transform: translateY(0px) scale(1.05); } 50% { transform: translateY(-3px) scale(1.05); } }
        `}</style>
        <div ref={mountRef} className="w-16 h-16 rounded-full flex items-center justify-center border backdrop-blur-xl" style={getWrapperStyle()} />
    </>
  );
};

export default AiOrb;