import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

// Area lights from game room.blend. glTF cannot store area lights, so they are recreated here.
// `m` is the Blender (Z-up) world matrix, row-major; `size` is [x, y] before object scale.
const AREA_LIGHTS = [
  { W: 196.35, color: [0.453, 0.5205, 1.0], size: [2, 2], m: [[1, 0, 0, 0.0455], [0, 1, 0, -0.6194], [0, 0, 1, 8.4101], [0, 0, 0, 1]] },
  { W: 314.159, color: [0.2611, 0.592, 1.0], size: [1.03, 1.03], m: [[3.6182, 0, 0, -1.0353], [0, -9.9e-8, -2.2217, 3.728], [0, 2.2675, -9.7e-8, 2.9929], [0, 0, 0, 1]] },
  { W: 196.35, color: [0.51, 0.6525, 1.0], size: [2, 2], m: [[1, 0, 0, 0.0455], [0, 0.29996, -0.95395, -6.906], [0, 0.95395, 0.29996, 4.7953], [0, 0, 0, 1]] },
  { W: 196.35, color: [0.3923, 0.492, 1.0], size: [2, 2], m: [[-4.37e-8, 0.29628, -0.9551, -8.9732], [-1, -2.6e-8, 3.76e-8, -0.0948], [-1.39e-8, 0.9551, 0.29628, 4.8672], [0, 0, 0, 1]] },
]

// Blender Z-up -> glTF Y-up: (x, y, z) -> (x, z, -y)
const TO_YUP = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)

// Tuned so radiance matches the Blender (Cycles) render.
const AREA_INTENSITY_SCALE = 0.4

export function createAreaLights() {
  RectAreaLightUniformsLib.init()
  return AREA_LIGHTS.map(({ W, color, size, m }) => {
    const blender = new THREE.Matrix4().set(...m.flat())
    // Only the world side is converted: a light's local frame (it emits along local -Z) is unchanged.
    const world = new THREE.Matrix4().multiplyMatrices(TO_YUP, blender)
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    world.decompose(pos, quat, scale)
    const width = size[0] * scale.x
    const height = size[1] * scale.y
    const light = new THREE.RectAreaLight(new THREE.Color(...color), 1, width, height)
    light.intensity = (AREA_INTENSITY_SCALE * W) / (4 * Math.PI * width * height)
    light.position.copy(pos)
    light.quaternion.copy(quat)
    return light
  })
}
