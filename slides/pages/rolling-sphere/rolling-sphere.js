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
            -Math.PI/2,0.0,
            20, 
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
let sphereRadius = 7;
let ball;

function populateScene() {

    let skySphere = BABYLON.MeshBuilder.CreateSphere('skysphere',{
        diameter: 1000
    }, scene);
    skySphere.material = new BABYLON.StandardMaterial('skysphereMat', scene);
    skySphere.material.diffuseTexture = new BABYLON.Texture('./sunset.png', scene);
    skySphere.material.backFaceCulling = false;
    skySphere.material.specularColor.set(0,0,0);
    skySphere.material.twoSidedLighting = true;


    let sphere = ball = BABYLON.MeshBuilder.CreateSphere('sphere',{
        diameter:sphereRadius*2
    },scene);
    sphere.position.set(50,0,0)


    sphere.material = new BABYLON.ShaderMaterial("mat", scene, {
        vertex: "MirrorBall",
        fragment: "MirrorBall",
    },
    {
        attributes: ["position", "normal"],
        uniforms: [
            "world", "worldView", 
            "worldViewProjection", 
            "view", "projection", 
            "time", 
            "floorPosition",
            "textureScale"
        ],
        samplers: ["myTexture"]
    });
   // material.backFaceCulling = false;


    ground = BABYLON.MeshBuilder.CreateGround('plane', {
        width:500,
        height:500
    }, scene)
    let qx = 40, qy = qx*Math.sqrt(3);
    ground.setVerticesData(BABYLON.VertexBuffer.UVKind, [-qx,-qy,qx,-qy,-qx,qy,qx,qy])
    ground.position.y = -sphereRadius
    ground.material = new BABYLON.StandardMaterial('a', scene);
    ground.material.specularColor.set(0,0,0);

    texture = ground.material.diffuseTexture = createPlaneTexture();


    sphere.material.setTexture("myTexture", texture);
    sphere.material.setFloat("floorPosition", -sphereRadius);
    sphere.material.setFloat("textureScale", 0.2)

    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001;
        // sphere.position.x = Math.sin(t);
    });


    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
          case BABYLON.KeyboardEventTypes.KEYDOWN:
            onKeyDown(kbInfo.event);
            break;
          case BABYLON.KeyboardEventTypes.KEYUP:
            break;
        }
    });
      

}


function onKeyDown(e) {
    if(e.key == "p") {
        console.log(e);
        var animation = new BABYLON.Animation(
            "myAnimation", 
            "position.x", 
            30, 
            BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        var keys = [{frame:0, value:30}, {frame:70, value:0}];
        animation.setKeys(keys);
    
        var easingFunction = new BABYLON.QuarticEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    
        animation.setEasingFunction(easingFunction);
    
        ball.animations = [animation];
    
        scene.beginAnimation(ball, 0,100, true);
    
    } else if(e.key == "f") {
        let f2 = document.getElementById("f2");
        f2.style.visibility = f2.style.visibility == "hidden" ? "visible" : "hidden";

    }
}


BABYLON.Effect.ShadersStore["MirrorBallVertexShader"]= `

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

BABYLON.Effect.ShadersStore["MirrorBallFragmentShader"]= `
precision highp float;

uniform mat4 worldView, world, view;

varying vec4 vPosition;
varying vec3 vNormal;

uniform sampler2D myTexture;
uniform float floorPosition, textureScale;

void main(void) {


    

    vec3 cameraPos = (inverse(view)*vec4(0.0,0.0,0.0,1.0)).xyz;
    vec3 pos = ( world * vPosition ).xyz;
    vec3 norm = normalize( world * vec4(vNormal, 0.0) ).xyz;
    vec3 cameraDir = normalize(cameraPos - pos).xyz;


    vec3 r = normalize(reflect(-cameraDir, norm));

    vec4 color;

    if(r.y>0.0) {
        vec4 color1 = vec4(0.02,0.4,0.8,1.0);
        vec4 color2 = vec4(0.7,0.3,0.01,1.0);
        
        color = (1.0-r.y)*color2 + r.y*color1;

    }
    else
    {


        float h = floorPosition;
        float s = -(pos.y-h)/r.y;
        if(s>=0.0) {
            vec3 p = vec3(pos.x + r.x*s, -1.0, pos.z + r.z*s);

            color = texture2D(myTexture, -textureScale*vec2(p.x,p.z*sqrt(3.0)));
    
        } else {
            color = vec4(0.0,0.0,0.0,1.0);

        }
        if(r.y>-0.1) {
            float t = (r.y+0.1)/0.1;
            color = vec4(0.4,0.4,0.4,1.0) * t + color * (1.0-t);
        }
    }
    
    float d = dot(r, normalize(vec3(0.2,1,-0.2)));
    vec4 specular = vec4(0,0,0,0);
    if(d>0.0)
        specular = vec4(0.5,0.5,0.5,1.0) * pow(d,70.0);
    gl_FragColor = color + specular;
    

}
`;
