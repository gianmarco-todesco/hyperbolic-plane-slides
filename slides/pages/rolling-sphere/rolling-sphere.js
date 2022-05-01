'use strict';

let canvas, engine, scene, camera;
const slide = {
    name: 'Rolling sphere'
};


function setup() {
    // il tag canvas che visualizza l'animazione
    canvas = document.getElementById('c');
    // la rotella del mouse serve per fare zoom e non per scrollare la pagina
    canvas.addEventListener('wheel', evt => evt.preventDefault());
    
    // engine & scene
    engine = slide.engine = new BABYLON.Engine(canvas, true);
    scene = slide.scene = new BABYLON.Scene(engine);
    
    // camera
    camera = new BABYLON.ArcRotateCamera('cam', 
            -Math.PI/2,0.7,
            15, 
            new BABYLON.Vector3(0,0,0), 
            scene);
    camera.attachControl(canvas,true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 13*2;            
    
    // luce
    let light1 = new BABYLON.PointLight('light1',new BABYLON.Vector3(0,1,0), scene);
    light1.parent = camera;
    
    // aggiungo i vari oggetti
    populateScene(scene);
    
    // main loop
    engine.runRenderLoop(()=>scene.render());

    // resize event
    window.addEventListener("resize", onResize);
}

function cleanup() {
    window.removeEventListener("resize", onResize);
    if(slide.engine) {
        slide.engine.stopRenderLoop()
        slide.scene.dispose()
        slide.engine.dispose()
        delete slide.scene;
        delete slide.engine; 
    }
}


function onResize() {
    engine.resize();
}

function createPlaneTexture() {
    let sz = 1024;
    var texture = new BABYLON.DynamicTexture(
        'a', {width:sz, height:sz}, scene, true);
    texture.wrapU = texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    let ctx = texture.getContext();
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,sz,sz);
    let xs = [0,sz/6,sz/4,sz/3,sz/2,2*sz/3,3*sz/4,sz*5/6,sz];
    let ys = [0,sz/4,sz/2,3*sz/4,sz];
    ctx.fillStyle = 'black';
    [
        [4,2,2,1,3,0],
        [4,2,4,0,5,0],
        [4,2,6,1,7,2],
        [4,2,6,3,5,4],
        [4,2,4,4,3,4],
        [4,2,2,3,1,2],
        [0,0,2,1,1,2],
        [5,0,8,0,6,1],
        [8,0,8,2,7,2],
        [7,2,8,4,6,3],
        [0,4,2,3,3,4],
        [0,4,0,2,1,2]
        
        
    ].forEach(([x0,y0,x1,y1,x2,y2]) => {
        ctx.beginPath();
        ctx.moveTo(xs[x0],ys[y0]);
        ctx.lineTo(xs[x1],ys[y1]);
        ctx.lineTo(xs[x2],ys[y2]);
        ctx.closePath();
        ctx.fill();    
    });

    

    texture.update();
    
    return texture;
}

let ground;
let texture;

function populateScene() {
    let sphere = BABYLON.MeshBuilder.CreateSphere('sphere',{
        diameter:6
    },scene);
    sphere.position.set(0,0,0)


    sphere.material = new BABYLON.ShaderMaterial("mat", scene, {
        vertex: "prova",
        fragment: "prova",
    },
    {
        attributes: ["position", "normal"],
        uniforms: [
            "world", "worldView", 
            "worldViewProjection", 
            "view", "projection", 
            "time"],
        samplers: ["myTexture"]
    });
   // material.backFaceCulling = false;


    ground = BABYLON.MeshBuilder.CreateGround('plane', {
        width:50,
        height:50
    }, scene)
    let qx = 20, qy = qx*Math.sqrt(3);
    ground.setVerticesData(BABYLON.VertexBuffer.UVKind, [0,0,qx,0,0,qy,qx,qy])
    ground.position.y = -3
    ground.material = new BABYLON.StandardMaterial('a', scene);
    ground.material.specularColor.set(0,0,0);

    texture = ground.material.diffuseTexture = createPlaneTexture();


    sphere.material.setTexture("myTexture", texture);

    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001;
        // torus.rotation.x = t;
        sphere.position.x = Math.sin(t);
    });
}




BABYLON.Effect.ShadersStore["provaVertexShader"]= `

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;

// Varying
varying vec4 vPosition;
varying vec3 vNormal;

void main() {

    vec4 p = vec4( position, 1. );

    vPosition = p;
    vNormal = normal;

    gl_Position = worldViewProjection * p;

}
`;

BABYLON.Effect.ShadersStore["provaFragmentShader"]= `
precision highp float;

uniform mat4 worldView, world, view;

varying vec4 vPosition;
varying vec3 vNormal;

uniform sampler2D myTexture;

void main(void) {


    

    vec3 cameraPos = (inverse(view)*vec4(0.0,0.0,0.0,1.0)).xyz;
    vec3 pos = ( world * vPosition ).xyz;
    vec3 norm = normalize( world * vec4(vNormal, 0.0) ).xyz;
    vec3 cameraDir = normalize(cameraPos - pos).xyz;


    vec3 r = normalize(reflect(-cameraDir, norm));

    if(r.y>0.0)
        gl_FragColor = vec4(0.0,1.0,1.0,1.0);
    else
    {
        float h = -3.0;

        float s = -(pos.y-h)/r.y;
        if(s>=0.0) {
            vec3 p = vec3(pos.x + r.x*s, -1.0, pos.z + r.z*s);

            vec4 color = texture2D(myTexture, 0.3*vec2(p.x,p.z*sqrt(3.0)));
            gl_FragColor = color;
    
        } else {
            gl_FragColor = vec4(0.0,0.0,0.0,1.0);

        }

    }
    
    /*
    
    

    if(r.y>=0.0)
        gl_FragColor = vec4(0.0,1.0,1.0,1.0);
    else 
    {
        float s = -(pos.y+2.0)/r.y;
        vec3 p = vec3(pos.x + r.x*s, -1.0, pos.z + r.z*s);
        float u = p.x - floor(p.x);
        float v = p.z - floor(p.z);
        gl_FragColor = vec4(u,v,1.0,1.0);
        
    }
    */

    /*
    if(r.y>=0.0) gl_FragColor = vec4(1.0,1.0,0.0,1.0);
    else
    {
        float s = vPosition.y/r.y;
        vec3 p = vec3(vPosition.x + r.x*s, 0.0, vPosition.z + r.z*s);
        float u = p.x - floor(p.x);
        float v = p.z - floor(p.z);
        gl_FragColor = vec4(u,v,0.0,1.0);
        gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }
    if(r.y>0.0)
        gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    else
        gl_FragColor = vec4(0.0,1.0,0.0,1.0);
    */

}
`;

BABYLON.Effect.ShadersStore["MirrorBallFragmentShader"]= `
precision highp float;
varying vec2 vUV;
varying vec3 v_norm;
varying vec3 v_pos;
varying float err;
varying vec3 v_color;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

vec4 lit(float l ,float h, float m) {
    return vec4(1.0,
                abs(l),//max(l, 0.0),
                (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                1.0);
}


// uniform sampler2D textureSampler;
void main(void) {
    if(err > 0.0 || abs(v_pos.x) > 5.0 || abs(v_pos.y) > 2.0 || abs(v_pos.z) > 2.0) discard;
    else 
    {
        vec3 norm = normalize(v_norm);
        vec3 surfaceToLight = normalize(v_surfaceToLight);
        vec3 surfaceToView = normalize(v_surfaceToView);
        vec3 halfVector = normalize(surfaceToLight + surfaceToView);
    
        if(dot(surfaceToView, norm)<0.0) {  norm = -norm; }
        float cs = dot(norm, surfaceToLight);
        vec4 litR = lit(cs,dot(norm, halfVector), 120.0);

        vec3 color = v_color * litR.y + vec3(1.0,1.0,1.0) * litR.z;
        gl_FragColor = vec4(color,1.0); // texture2D(textureSampler, vUV);    
    }
}
`
