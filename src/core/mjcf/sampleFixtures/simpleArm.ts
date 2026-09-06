/** A small hand-authored MJCF fixture (primitives only, no external mesh
 * files) used for tests and as the editor's default/demo document: a
 * two-link arm on a fixed base, with one motor and one position actuator,
 * and a jointpos + framepos sensor pair. */
export const SIMPLE_ARM_MJCF = `<mujoco model="simple_arm">
  <compiler angle="degree" eulerseq="xyz"/>
  <option gravity="0 0 -9.81"/>
  <asset>
    <material name="metal" rgba="0.6 0.6 0.65 1"/>
    <material name="accent" rgba="0.85 0.25 0.15 1"/>
  </asset>
  <worldbody>
    <light pos="0 0 3" dir="0 0 -1" diffuse="1 1 1"/>
    <body name="base" pos="0 0 0.05">
      <geom name="base_geom" type="box" size="0.15 0.15 0.05" material="metal" contype="1" conaffinity="1"/>
      <body name="shoulder_link" pos="0 0 0.05">
        <joint name="shoulder_joint" type="hinge" axis="0 1 0" pos="0 0 0" range="-90 90" damping="0.2"/>
        <inertial pos="0 0 0.15" mass="1.2" diaginertia="0.01 0.01 0.002"/>
        <geom name="shoulder_geom" type="capsule" size="0.04 0.15" pos="0 0 0.15" material="accent" contype="1" conaffinity="1"/>
        <body name="forearm_link" pos="0 0 0.3">
          <joint name="elbow_joint" type="hinge" axis="0 1 0" pos="0 0 0" range="-120 10" damping="0.15"/>
          <inertial pos="0 0 0.12" mass="0.8" diaginertia="0.006 0.006 0.001"/>
          <geom name="forearm_geom" type="capsule" size="0.035 0.12" pos="0 0 0.12" material="metal" contype="1" conaffinity="1"/>
          <site name="gripper_site" pos="0 0 0.24" size="0.01"/>
        </body>
      </body>
    </body>
  </worldbody>
  <actuator>
    <motor name="shoulder_motor" joint="shoulder_joint" gear="10" ctrlrange="-1 1"/>
    <position name="elbow_position" joint="elbow_joint" kp="20" ctrlrange="-2.09 0.17"/>
  </actuator>
  <sensor>
    <jointpos name="shoulder_pos_sensor" joint="shoulder_joint"/>
    <framepos name="gripper_pos_sensor" objtype="site" objname="gripper_site"/>
  </sensor>
</mujoco>
`
