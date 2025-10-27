// Wheel3D Component - 3D Spinning Wheel with Realistic Physics
// Location: src/components/Wheel3D.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Wheel3D.scss';

const Wheel3D = ({
  segments = [],
  onSpinComplete,
  isSpinning = false,
  targetSegmentIndex = null,
  size = 400,
  disabled = false
}) => {
  const wheelRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const rotationRef = useRef(0);

  // Ensure we have segments
  const wheelSegments = segments.length > 0 ? segments : [
    { label: 'Prize 1', color: '#FF6B6B', probability: 0.25 },
    { label: 'Prize 2', color: '#4ECDC4', probability: 0.25 },
    { label: 'Prize 3', color: '#45B7D1', probability: 0.25 },
    { label: 'Prize 4', color: '#FFA07A', probability: 0.25 }
  ];

  const segmentAngle = 360 / wheelSegments.length;

  /**
   * Start spin animation with physics-based easing
   */
  const startSpin = useCallback((targetIndex) => {
    if (isAnimating || disabled) return;

    setIsAnimating(true);

    // Calculate target rotation
    // Add multiple full rotations for effect (5-7 spins)
    const minSpins = 5;
    const maxSpins = 7;
    const numberOfSpins = minSpins + Math.random() * (maxSpins - minSpins);
    const fullRotations = numberOfSpins * 360;

    // Calculate angle to land on target segment (accounting for pointer at top)
    // Pointer is at 12 o'clock, so we need to rotate so target segment center is at 12
    const targetAngle = targetIndex * segmentAngle;
    const centerOffset = segmentAngle / 2; // Center of segment
    const pointerAdjustment = 90; // Adjust so pointer aligns correctly
    
    // Add small random variance within segment (±30% of segment size)
    const variance = (Math.random() - 0.5) * segmentAngle * 0.6;
    
    const finalAngle = fullRotations + (360 - targetAngle + centerOffset + pointerAdjustment) + variance;

    // Animation parameters
    const duration = 4000 + Math.random() * 1000; // 4-5 seconds
    const startTime = Date.now();
    const startRotation = rotationRef.current % 360;

    // Ease out cubic function for realistic deceleration
    const easeOutCubic = (t) => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const easedProgress = easeOutCubic(progress);
      const currentRotation = startRotation + (finalAngle * easedProgress);

      rotationRef.current = currentRotation;
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsAnimating(false);
        
        // Normalize rotation for next spin
        const normalizedRotation = currentRotation % 360;
        rotationRef.current = normalizedRotation;
        setRotation(normalizedRotation);

        // Callback with result
        if (onSpinComplete) {
          setTimeout(() => {
            onSpinComplete(targetIndex);
          }, 200); // Small delay for effect
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isAnimating, disabled, segmentAngle, onSpinComplete]);

  /**
   * Handle external spin trigger
   */
  useEffect(() => {
    if (isSpinning && targetSegmentIndex !== null && !isAnimating) {
      startSpin(targetSegmentIndex);
    }
  }, [isSpinning, targetSegmentIndex, isAnimating, startSpin]);

  /**
   * Cleanup animation on unmount
   */
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  /**
   * Generate segment colors with good contrast
   */
  const getSegmentColor = (index) => {
    const segment = wheelSegments[index];
    if (segment.color) return segment.color;

    // Default gradient colors
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7B731', '#5F27CD', '#00D2D3',
      '#FF6348', '#2ECC71', '#3498DB', '#E74C3C'
    ];
    return colors[index % colors.length];
  };

  /**
   * Render wheel segments using SVG for precision
   */
  const renderSegments = () => {
    const center = size / 2;
    const radius = (size / 2) - 10; // 10px padding

    return wheelSegments.map((segment, index) => {
      const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
      const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

      // Calculate arc path
      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const largeArc = segmentAngle > 180 ? 1 : 0;

      const pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      // Calculate text position (middle of segment)
      const textAngle = ((index + 0.5) * segmentAngle - 90) * (Math.PI / 180);
      const textRadius = radius * 0.7;
      const textX = center + textRadius * Math.cos(textAngle);
      const textY = center + textRadius * Math.sin(textAngle);
      const textRotation = (index + 0.5) * segmentAngle;

      return (
        <g key={index}>
          {/* Segment */}
          <path
            d={pathData}
            fill={getSegmentColor(index)}
            stroke="#fff"
            strokeWidth="2"
            className="wheel-segment"
          />
          
          {/* Text */}
          <text
            x={textX}
            y={textY}
            fill="#fff"
            fontSize={wheelSegments.length > 8 ? '12' : '14'}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            className="segment-text"
          >
            {segment.label || segment.name || `Prize ${index + 1}`}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="wheel3d-container">
      {/* Center decoration */}
      <div className="wheel-center-decoration">
        <div className="center-circle"></div>
      </div>

      {/* Pointer/Arrow at top */}
      <div className="wheel-pointer">
        <div className="pointer-arrow"></div>
      </div>

      {/* Main wheel */}
      <div
        ref={wheelRef}
        className={`wheel3d ${isAnimating ? 'spinning' : ''} ${disabled ? 'disabled' : ''}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotate(${rotation}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="wheel-svg"
        >
          {/* Outer ring decoration */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) - 5}
            fill="none"
            stroke="#FFD700"
            strokeWidth="8"
            className="wheel-outer-ring"
          />
          
          {/* Segments */}
          {renderSegments()}
          
          {/* Inner circle decoration */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="30"
            fill="#fff"
            stroke="#FFD700"
            strokeWidth="3"
            className="wheel-inner-circle"
          />
          
          {/* Center dot */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="10"
            fill="#FFD700"
            className="wheel-center-dot"
          />
        </svg>

        {/* 3D effect shadow */}
        <div className="wheel-shadow"></div>
      </div>

      {/* Glow effect when spinning */}
      {isAnimating && (
        <div className="wheel-glow-effect"></div>
      )}
    </div>
  );
};

export default Wheel3D;

