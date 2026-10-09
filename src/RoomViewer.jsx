import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createAreaLights } from './blenderLights.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// In the source model (Blender) the walls are the "Material.036" slot of the "Plane" object.
const WALL_MATERIAL = 'Material.036'
// Direction from the room's center to the camera: the corner view used in the Blender scene.
const VIEW_DIRECTION = new THREE.Vector3(-0.52, 0.55, 0.65).normalize()
// Blender exports lights in photometric units (candela, 683 lm/W), far brighter than
// what three.js shows at exposure 1, so scale them back down.
const LIGHT_SCALE = 0.4 / 683

export default function RoomViewer({ wallColor }) {
  const mountRef = useRef(null)
  const wallMaterialRef = useRef(null)
  const wallColorRef = useRef(wallColor)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mount = mountRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.AgXToneMapping
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0d0d12)
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.03
    scene.add(new THREE.AmbientLight(0x8fa8ff, 0.5)) // world color + stand-in for blue bounce light
    createAreaLights().forEach((l) => scene.add(l))

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.maxPolarAngle = Math.PI * 0.49 // stay above the floor

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf
    const tick = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    let disposed = false
    new GLTFLoader().load('/game-room.glb', (gltf) => {
      if (disposed) return
      let wallMesh
      gltf.scene.traverse((o) => {
        if (o.isLight) o.intensity *= LIGHT_SCALE
        if (o.isMesh && o.material?.name === WALL_MATERIAL) {
          wallMaterialRef.current = o.material
          wallMesh = o
        }
      })
      if (wallColorRef.current) wallMaterialRef.current?.color.set(wallColorRef.current)
      scene.add(gltf.scene)

      // Frame the whole room from a corner, looking at its center.
      const bounds = new THREE.Box3().setFromObject(wallMesh)
      const center = bounds.getCenter(new THREE.Vector3())
      const radius = bounds.getSize(new THREE.Vector3()).length() / 2
      const halfFov = Math.min(camera.fov, 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect) * (180 / Math.PI)) * (Math.PI / 360)
      const distance = (radius / Math.sin(halfFov)) * 1.05
      camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance)
      controls.target.copy(center)
      controls.minDistance = radius * 0.5
      controls.maxDistance = distance * 2
      controls.update()
      setLoading(false)
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    wallColorRef.current = wallColor
    if (wallColor) wallMaterialRef.current?.color.set(wallColor)
  }, [wallColor])

  return (
    <>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      {loading && <div className="loading">Loading room…</div>}
    </>
  )
}
