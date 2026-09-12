struct ObjectData {
    model: mat4x4f,
}

@group(0) @binding(0) var<uniform> viewProjMat: mat4x4f;
@group(1) @binding(0) var<uniform> object: ObjectData;

struct VertexOutput {
   @builtin(position) position: vec4f, 
   @location(0) color: vec4f,
}

@vertex
fn vertex(@builtin(instance_index) idx: u32,
          @location(0) position: vec3f,
          @location(1) color: vec4f) -> VertexOutput {
    var output: VertexOutput;
    output.position = viewProjMat * object.model * vec4f(position, 1.0);
    output.color = color;
    return output;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f {
    return input.color;
}