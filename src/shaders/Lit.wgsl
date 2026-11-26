struct VertexInput {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
    @location(3) tangent: vec3f,
}

struct SkinnedVertexInput {
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f,
    @location(3) tangent: vec3f,
    @location(4) joints: vec4u,
    @location(5) weights: vec4f
}

struct VertexOutput {
   @builtin(position) position: vec4f, 
   @location(0) uv: vec2f,
   @location(1) normal: vec3f,
   @location(2) worldPosition: vec3f,
}

struct Camera {
    view: mat4x4f,
    projection: mat4x4f
}

struct Model {
    matrix: mat4x4f,
}

struct Material {
    baseColor: vec4f,
    // kot v Material: diffuse, specular, shininess, ambient
    params: vec4f,
    emissive: vec4f,
}

struct Light {
    //enako zaporedje kot v bufferju
    position_type: vec4f, //0-2: position, 3: type
    dir_range: vec4f, //0-2: direction, 3: range
    color_int: vec4f, //0-2: color, 3: intensity
    cosinus: vec4f //0: cosinus(innerConeAngle), 1: cosinus(outerConeAngle), 2-3: prazno
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> light: Light;
@group(1) @binding(0) var<uniform> model: Model;
@group(2) @binding(0) var<uniform> material: Material;
@group(2) @binding(1) var baseTexture: texture_2d<f32>;
@group(2) @binding(2) var textureSampler: sampler;
@group(3) @binding(0) var<storage, read> jointMatrices: array<mat4x4f>;

@vertex
fn vertex(input:VertexInput) -> VertexOutput {
    let position = camera.projection * camera.view * model.matrix * vec4f(input.position, 1.0);

    // za potrebe spot in point lighta - moramo poznati položaj piksla (točka)
    let worldPosition = model.matrix * vec4f(input.position, 1.0);

    var output: VertexOutput;
    output.position = position;
    output.uv = input.uv;
    // normala bo v koordinatah sveta
    // vec4f - naredi 4d vektor (zadnja koordinata je 0 -> smer ne točka), .xyz ohrani samo te tri komponente
    output.normal = (model.matrix * vec4f(input.normal, 0.0)).xyz; 
    output.worldPosition = worldPosition.xyz;
    return output;
}

@vertex
fn vertexSkinned(input: SkinnedVertexInput) -> VertexOutput {
    let skin =
        input.weights.x * jointMatrices[input.joints.x] +
        input.weights.y * jointMatrices[input.joints.y] +
        input.weights.z * jointMatrices[input.joints.z] +
        input.weights.w * jointMatrices[input.joints.w];

    let worldPosition = model.matrix * skin * vec4f(input.position, 1.0);

    var output: VertexOutput;
    output.position = camera.projection * camera.view * model.matrix * skin * vec4f(input.position, 1.0);
    output.uv = input.uv;
    output.normal = (model.matrix * skin * vec4f(input.normal, 0.0)).xyz; 
    output.worldPosition = worldPosition.xyz;
    return output;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f {
    let diffuseFactor  = material.params.x;
    let specularFactor = material.params.y;
    let shininess      = material.params.z;
    let ambientFactor  = material.params.w;

    //normala
    let N = normalize(input.normal);
    
    // vektor proti luči
    let lightPosition = vec3f(-1.0, 1.0, 1.0);
    // smer točke do luči
    //let L = normalize(lightPosition - input.worldPosition);
    let L = normalize(-light.dir_range.xyz);

    // lastna barva predmeta (kot če bi nanj sijala popolnoma bela svetloba) = barvaTexture * baseColor
    let barva_predmet = textureSample(baseTexture, textureSampler, input.uv) * material.baseColor;

    // barva luči
    let barva_luc = light.color_int.rgb * light.color_int.w;

    // geometrija
    let lambert = max(dot(N, L), 0);
    // razpršitev svetlobe
    let diffuse: f32 = lambert * diffuseFactor; 
    let light = diffuse + ambientFactor;
    let color = barva_predmet.rgb * (light * barva_luc);

    return vec4f(color, barva_predmet.a);

    // return textureSample(baseTexture, textureSampler, input.uv);
    //return textureSample(baseTexture, textureSampler, input.uv) * color;
}
