import React from "react";
import * as THREE from "three";
import {
  useHitTest,
  ARCanvas,
  DefaultXRControllers,
  useXREvent
} from "@react-three/xr";
import { Ring, Circle, Line, Text } from "@react-three/drei";

const Reticle = React.forwardRef((props, ref) => (
  <mesh ref={ref}>
    <Ring args={[0.045, 0.05, 32]} rotateX={-Math.PI / 2} />
    <Circle args={[0.005, 32]} rotateX={-Math.PI / 2} />
  </mesh>
));

const XREvent = ({ onSelect }) => {
  useXREvent("select", onSelect);

  return null;
};

const matrixToVector = (matrix) => {
  const vector = new THREE.Vector3();
  vector.setFromMatrixPosition(matrix);
  return vector;
};

const getDistance = (points) => {
  if (points.length === 2) return points[0].distanceTo(points[1]);
};

const getCenterPoint = (points) => {
  const [[x1, y1, z1], [x2, y2, z2]] = points;
  return [(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2];
};

const CanvasInner = () => {
  const reticleRef = React.createRef();
  const [lineStart, setLineStart] = React.useState();
  const [lineEnd, setLineEnd] = React.useState();
  const [measurements, setMeasurements] = React.useState([]);

  useHitTest((hit) => {
    if (reticleRef.current) {
      hit.decompose(
        reticleRef.current.position,
        reticleRef.current.rotation,
        reticleRef.current.scale
      );

      const lastMeasurement = measurements[measurements.length - 1];

      if (lineStart && !lastMeasurement[1]) {
        setLineEnd(matrixToVector(reticleRef.current.matrix));
      }
    }
  });

  const onSelect = () => {
    if (reticleRef.current) {
      const vector = matrixToVector(reticleRef.current.matrix);

      if (lineStart && lineEnd) {
        setMeasurements((_measurements) => {
          const [
            lastMeasurement,
            ...restMeasurements
          ] = _measurements.reverse();
          const updatedLastMeasurement = [lastMeasurement[0], vector];

          return [...restMeasurements, updatedLastMeasurement];
        });
        setLineStart(null);
        setLineEnd(null);
      } else {
        // Uncomment code below if you only want 1 measurement
        // setMeasurements([])
        setLineStart(vector);
        setLineEnd(vector);
        setMeasurements((_measurements) => [..._measurements, [vector, null]]);
      }
    }
  };

  return (
    <>
      <hemisphereLight
        args={["#FFFFFF", "#BBBBFF", 1]}
        position={[0.5, 1, 0.25]}
      />

      <Reticle ref={reticleRef} />

      {lineStart && lineEnd && (
        <Line points={[lineStart, lineEnd]} color="#FFFFFF" lineWidth={2} />
      )}

      {measurements
        .filter((measurement) => measurement[1])
        .map((measurement) => {
          const distance = Math.round(getDistance(measurement) * 100);
          const [x, y, z] = getCenterPoint(measurement);

          return (
            <mesh>
              <React.Suspense fallback={null}>
                <Text
                  position={[x, y + 0.033, z]}
                  fontSize={0.033}
                  color="#FFFFFF"
                  anchorX="center"
                  anchorY="middle"
                >
                  {distance + " cm"}
                </Text>
              </React.Suspense>
              <Line points={measurement} color="#FFFFFF" lineWidth={2} />
            </mesh>
          );
        })}

      <XREvent onSelect={onSelect} />
      <DefaultXRControllers />
    </>
  );
};

const App = () => (
  <>
    <ARCanvas
      vr="false"
      camera={{
        fov: 70,
        near: 0.01,
        far: 20
      }}
      sessionInit={{ requiredFeatures: ["hit-test"] }}
    >
      <CanvasInner />
    </ARCanvas>
  </>
);

export default App;
