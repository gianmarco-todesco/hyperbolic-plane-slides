'use strict';

let canvas, engine, scene, camera;
const innerRadius = 1.0;
let faceMesh;
let faces;
let parameter = 0.0;
let stage = 0;
let cubeNode;

const slide = {
    name: 'CubicAngelsAndDevils'
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
            10, 
            new BABYLON.Vector3(0,0,0), 
            scene);
    camera.attachControl(canvas,true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 13*2;            
    
    var eLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    var eLight2 = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, -1, 0), scene);

    // luce
    let light1 = new BABYLON.PointLight('light1',new BABYLON.Vector3(1,2,-1), scene);
    light1.intensity = 0.3;
    light1.parent = camera;
    
    // aggiungo i vari oggetti
    populateScene(scene);
    
    // main loop
    engine.runRenderLoop(()=>scene.render());

    // resize event
    window.addEventListener("resize", onResize);

    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
          case BABYLON.KeyboardEventTypes.KEYDOWN:
            onKeyDown(kbInfo.event); // key, code
            break;
          case BABYLON.KeyboardEventTypes.KEYUP:
            onKeyUp(kbInfo.event); 
            break;
        }
    });

    let pointerDown = false;
    let pointerOldX = 0;

    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                if(pointerInfo.event.button == 2) {
                    camera.inputs.attached.pointers.detachControl();
                    pointerDown = true;
                    pointerOldX = pointerInfo.event.clientX;
                }
            break;
            case BABYLON.PointerEventTypes.POINTERUP:
                // console.lo(pointerInfo);
                if(pointerDown) {
                    pointerDown = false;
                    camera.inputs.attached.pointers.attachControl();
                }
            break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                if(pointerDown) {
                    let dx = pointerInfo.event.clientX - pointerOldX;
                    pointerOldX = pointerInfo.event.clientX;
                    onDrag(dx);

                }
                // console.log(pointerInfo);
            break;
        }
      });
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


function onKeyDown(e) {
    console.log(e);
    if(e.key == 'a') {
        if(stage == 0) {
            stage = 1;
            parameter = 0.0;
            updateScene2();
        } 
    } else if(e.key == 's') {
        if(stage == 1) {
            stage = 0;
            parameter = 0.0;
            updateScene1();
        }
    }
}

function onKeyUp(e) {
}


function onDrag(dx) {
    if(stage == 0) {
        stage = 1;
        parameter = 0.0;
        updateScene2();
    } else if(stage == 1) {
        parameter = Math.max(0.0, Math.min(1.0, parameter += dx * 0.001));
        updateScene2();
    }
} 


function populateScene(scene) {

    // createGrid(scene);
    faceMesh = new BendingFace(50,50, scene);

    let material = faceMesh.mesh.material = new BABYLON.StandardMaterial('mat', scene);
    material.twoSidedLighting = true;
    material.backFaceCulling = false;
    material.diffuseColor.set(0.9,0.9,0.9);
    material.specularColor.set(0.1,0.1,0.1);    
    material.diffuseTexture = new BABYLON.Texture("angels_and_devils.png", scene)
    faceMesh.mesh.isVisible=false;
    
    cubeNode = new BABYLON.TransformNode('cubeNode', scene);
    
    faces = [];
    for(let i=0; i<25; i++) {
        let row = Math.floor(i/5);
        let col = i%5;
        let f = faceMesh.mesh.createInstance('f'+i);

        f.position.x = 2 * innerRadius * (col - 2);
        f.position.z = 2 * innerRadius * (row - 2);

        f.rotation.y = ((row+col)&1) * Math.PI/2;              
        faces.push(f);
        f.parent = cubeNode;

    }

    // animazione
    scene.registerBeforeRender(() => {

        let seconds = performance.now() * 0.001;
        // bendingFace.parameter = Math.sin(seconds)*0.5+0.5;

    });
}

function updateScene1() {
    faceMesh.parameter = 0.0;
    faces.forEach((f,i) => {
        let row = Math.floor(i/5);
        let col = i%5;
        f.position.x = 2 * innerRadius * (col - 2);
        f.position.z = 2 * innerRadius * (row - 2);
        f.position.y = 0;
        f.rotation.set(0, ((row+col)&1) * Math.PI/2, 0);  
        f.rotationQuaternion = null;            
        f.isVisible = true;
    })
}


function getFaceMatrix(parentMatrix, faceIndex) {
    let r = innerRadius;
    return parentMatrix
        .multiply(BABYLON.Matrix.Translation(2*r,0,0))
        .multiply(BABYLON.Matrix.RotationY(Math.PI));
}

function getFaceMatrix(theta, j) {
    return BABYLON.Matrix.RotationY(((j+1)&1)*Math.PI/2)
    .multiply(BABYLON.Matrix.Translation(-innerRadius,0,0))
    .multiply(BABYLON.Matrix.RotationZ(theta))
    .multiply(BABYLON.Matrix.Translation(-innerRadius,0,0))
    .multiply(BABYLON.Matrix.RotationY(j*Math.PI/2));
}

function getLastFaceMatrix(theta) {
    return BABYLON.Matrix.Identity()
    .multiply(BABYLON.Matrix.Translation(-innerRadius,0,0))
    .multiply(BABYLON.Matrix.RotationZ(theta))
    .multiply(BABYLON.Matrix.Translation(-innerRadius*2,0,0))
    .multiply(BABYLON.Matrix.RotationZ(theta))
    .multiply(BABYLON.Matrix.Translation(-innerRadius,0,0)) 
}


function step(t,t0,t1) {
    return t<t0?0:t>t1?1:(t-t0)/(t1-t0);
}

function smoothStep(t,t0,t1) {
    return 0.5*(1.0 - Math.cos(Math.PI*step(t,t0,t1)));
}

function updateScene2() {


    faceMesh.parameter = smoothStep(parameter, 0.55, 0.9);
    faces.forEach((face,i) => face.isVisible = false);
    let t = smoothStep(parameter, 0.0, 0.45);
    let theta = t*Math.PI/2;
    cubeNode.position.y = t * innerRadius;

    const matrices = [BABYLON.Matrix.Identity()];
    for(let i=0; i<4;i++)
        matrices.push(getFaceMatrix(theta,i));
    matrices.push(getLastFaceMatrix(theta));

    matrices.forEach((matrix,i) => {
        let face = faces[i];
        face.position.set(0,0,0);
        face.rotation.set(0,0,0);
        matrix.decomposeToTransformNode(face);
        face.isVisible = true;
    })    
}



function createGrid(scene) {
    
    let Color4 = BABYLON.Color4;
    let Vector3 = BABYLON.Vector3;
     
    let m = 50;
    let r = 5;
    let pts = [];
    let colors = [];
    let c1 = new Color4(0.7,0.7,0.7,0.5);
    let c2 = new Color4(0.5,0.5,0.5,0.25);
    let cRed   = new Color4(0.8,0.1,0.1);
    let cGreen = new Color4(0.1,0.8,0.1);
    let cBlue  = new Color4(0.1,0.1,0.8);
    
    let color = c1;
    function line(x0,y0,z0, x1,y1,z1) { 
        pts.push([new Vector3(x0,y0,z0), new Vector3(x1,y1,z1)]); 
        colors.push([color,color]); 
    }
    
    for(let i=0;i<=m;i++) {
        if(i*2==m) continue;
        color = (i%5)==0 ? c1 : c2;
        let x = -r+2*r*i/m;        
        line(x,0,-r, x,0,r);
        line(-r,0,x, r,0,x);
    }
    
    let r1 = r + 1;
    let a1 = 0.2;
    let a2 = 0.5;
    
    // x axis
    color = cRed;
    line(-r1,0,0, r1,0,0); 
    line(r1,0,0, r1-a2,0,a1);
    line(r1,0,0, r1-a2,0,-a1);
        
    // z axis
    color = cBlue;
    line(0,0,-r1, 0,0,r1); 
    line(0,0,r1, a1,0,r1-a2);
    line(0,0,r1,-a1,0,r1-a2);
    
    // y axis
    color = cGreen;
    line(0,-r1,0, 0,r1,0); 
    line(0,r1,0, a1,r1-a2,0);
    line(0,r1,0,-a1,r1-a2,0);
    line(0,r1,0, 0,r1-a2,a1);
    line(0,r1,0, 0,r1-a2,-a1);
    
    const lines = BABYLON.MeshBuilder.CreateLineSystem(
        "lines", {
                lines: pts,
                colors: colors,
                
        }, 
        scene);
    lines.isPickable = false;
    return lines;    
};


class BendingFace {
    constructor(nu, nv, scene) {
        this.nu = nu;
        this.nv = nv;
        let vd = this.vd = new BABYLON.VertexData();
        vd.positions = new Array(3*nu*nv).fill(0);
        vd.normals = new Array(3*nu*nv).fill(0);
        vd.indices = [];
        vd.uvs = new Array(2*nu*nv).fill(0);
        this.uvs = new Array(2*nu*nv).fill(0);
        for(let i=0;i+1<nu;i++) {
            for(let j=0;j+1<nv;j++) {
                let k = i*nv+j;
                vd.indices.push(k,k+1,k+1+nv, k,k+1+nv,k+nv);
            }
        }
        const uvScale = 1.0;
        for(let i=0;i<nu;i++) {
            let u = i/(nu-1);
            for(let j=0;j<nv;j++) {
                let v = j/(nv-1);
                let k = i*nv+j;
                vd.uvs[2*k] = 0.5 + (u - 0.5) * uvScale;
                vd.uvs[2*k+1] = 0.5 + (v - 0.5) * uvScale;
                this.uvs[2*k] = u;
                this.uvs[2*k+1] = v;
            }
        }
        this._parameter = 0.0;
        this.computePoints()
        let mesh = this.mesh = new BABYLON.Mesh('surface', scene);
        vd.applyToMesh(mesh, true);
    }

    computePoints() {
        let positions = this.vd.positions;
        let normals = this.vd.normals;
        let uvs = this.uvs;
        let n = this.nu*this.nv;
        let nrm1 = new BABYLON.Vector3(0,1,0);
        let nrm2 = new BABYLON.Vector3(0,1,0);
        let p1 = new BABYLON.Vector3();
        let p2 = new BABYLON.Vector3();
        let p = new BABYLON.Vector3();
        let nrm = new BABYLON.Vector3();
        
        let parameter = this._parameter;
        let r = Math.sqrt(3);
        
        for(let i=0;i<n;i++) {
            const u = uvs[i*2], v = uvs[i*2+1];
            nrm2.x = p1.x = -1+2*v;
            nrm2.z = p1.z = -1+2*u;
            nrm2.y = 1;
            let d = nrm2.length();
            nrm2.scaleInPlace(1/d);
            nrm2.scaleToRef((1-parameter)*d + parameter*r, p);
            BABYLON.Vector3.LerpToRef(nrm1, nrm2, parameter, nrm);
            nrm.normalize();            
            normals[i*3] = nrm.x;
            normals[i*3+1] = nrm.y;
            normals[i*3+2] = nrm.z;
            positions[i*3] = p.x*innerRadius;
            positions[i*3+1] = (p.y-1.0)*innerRadius;
            positions[i*3+2] = p.z*innerRadius;
        }
    }

    get parameter() { return this._parameter; }
    set parameter(p) {
        if(this._parameter == p) return;
        this._parameter = p;
        this.computePoints() 
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this.vd.positions);
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, this.vd.normals);      
    }
}


