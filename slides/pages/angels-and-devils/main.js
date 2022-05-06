'use strict';

let canvas, engine, scene, camera;
let parameter = 0.0;
const diskRadius = 3.0; // attenzione: non controlla ancora la dimensione della tassellazione
let running = false;

const slide = {
    name: 'Sodalite'
};


let hex;
let meshes = [];
let tess;
let hexes;
let trajectories;
let tableNode;
let tableMeshes = [];
let extraHexes = [];


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
            1.13,0,
            8, 
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
    let startTime = performance.now();
    populateScene(scene);
    console.log("populate scene. time=", performance.now() - startTime);
    
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


function step(t,t0,t1) {
    return t<t0?0:t>t1?1:(t-t0)/(t1-t0);
}


function smoothstep(t,t0,t1) {
    return t<t0?0:t>t1?1:0.5*(1.0-Math.cos(Math.PI*(t-t0)/(t1-t0)));
}


function createTable() {
    let height = 0.1;
    let mainNode = new BABYLON.TransformNode('table-node', scene);
    
    let node = new BABYLON.TransformNode('table-node', scene);
    node.parent = mainNode;
    node.position.y = -height/2 - 0.001;

    const radius = diskRadius+0.01;
    let torus = BABYLON.MeshBuilder.CreateTorus('a', {
        diameter:radius*2,
        thickness:height,
        tessellation:100
    }, scene);
    torus.parent = node;
    tableMeshes.push(torus);

    let topDisk = BABYLON.MeshBuilder.CreateDisc('a', { radius: radius}, scene);
    topDisk.parent = node;
    topDisk.rotation.x = Math.PI/2;
    topDisk.position.y = height/2;
    tableMeshes.push(topDisk);

    let bottomDisk = topDisk.createInstance('table-bottom-disk');
    bottomDisk.parent = node;
    bottomDisk.rotation.x = -Math.PI/2;
    bottomDisk.position.y = -height/2;
    tableMeshes.push(bottomDisk);

    node.position.y = -height/2 - 0.001 ;

    let material = new BABYLON.StandardMaterial('table-mat', scene);
    torus.material = material;
    topDisk.material = material;
    material.diffuseColor.set(0.2,0.3,0.4);

    let border = BABYLON.MeshBuilder.CreateTorus('table-small-border', {
        diameter:2*diskRadius,
        thickness:0.05,
        tessellation:100
    }, scene);
    border.parent = node;
    border.position.y = height/2;
    border.scaling.y = 0.01
    let borderMaterial = new BABYLON.StandardMaterial('table-mat', scene);
    border.material = borderMaterial;
    borderMaterial.diffuseColor.set(0.1,0.1,0.1);
    tableMeshes.push(border);

    return mainNode;
}


function populateScene() {
    // createGrid(scene);
    // createCubeGrid(scene);

    const V3 = (x,y,z) => new BABYLON.Vector3(x,y,z);

    tableNode = createTable();


    tess = new GenericTessellation(6,4);
    tess.addFirstShell();
    for(let i=0; i<2; i++) tess.addShell();
    console.log(tess.cells.length);

    let cell = tess.cells[5];
    
    
    hex = new BendingHexagon();
    hex.createMesh();
    hex.mesh.material = new BABYLON.StandardMaterial('mat', scene);
    hex.mesh.material.backFaceCulling = false;
    hex.mesh.material.twoSidedLighting = true;
    hex.mesh.material.diffuseColor.set(1,1,1);
    hex.mesh.material.specularColor.set(0.01,0.01,0.01);
    hex.mesh.material.diffuseTexture = new BABYLON.Texture("heaven-and-hell.png",scene);
    meshes.push(hex.mesh);
    hex.mesh.isVisible = false;


    hexes = [];
    for(let i=0;i<tess.cells.length; i++) {
        let hex2 = i < 64 ? new BendingHexagon() : new BendingHexagon(3);
        hex2.createMesh();
        hex2.mesh.material = hex.mesh.material;
        hex2.computePoints2(tess,i)
        hex2.updateMesh(); 
        hex2.mesh.parent = tableNode;
        hexes.push(hex2);
    }
    for(let i=64;i<hexes.length; i++) extraHexes.push(hexes[i].mesh);
    
    trajectories = createTrajectories();

    scene.registerBeforeRender(animate);

    let pointerDown = false;
    let pointerOldX = 0;
    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                if(pointerInfo.event.button == 2) {
                    //pointerInfo.event.preventDefault();
                    //pointerInfo.event.stopPropagation();
                    //canvas.setPointerCapture(pointerInfo.event.pointerId);
                    
                    camera.inputs.attached.pointers.detachControl();
                    pointerDown = true;
                    pointerOldX = pointerInfo.event.clientX;
                }
            break;
            case BABYLON.PointerEventTypes.POINTERUP:
                // console.lo(pointerInfo);
                if(pointerDown) {
                    pointerDown = false;
                    //pointerInfo.event.preventDefault();
                    //pointerInfo.event.stopPropagation();
                    //pointerInfo.event.stopImmediatePropagation();
                    camera.inputs.attached.pointers.attachControl();
                }
            break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                if(pointerDown) {
                    //pointerInfo.event.preventDefault();
                    //pointerInfo.event.stopPropagation();
                    let dx = pointerInfo.event.clientX - pointerOldX;
                    pointerOldX = pointerInfo.event.clientX;
                    onDrag(dx);

                }
                // console.log(pointerInfo);
            break;
        }
    });

    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
          case BABYLON.KeyboardEventTypes.KEYDOWN:
            onKeyDown(kbInfo.event); // key, code
            break;
        }
    });
}


function onKeyDown(e) {
    if(e.key == "p") running = !running;
    
}

function onDrag(dx) {
    parameter = Math.max(0.0, Math.min(1.0, parameter + dx * 0.001));
    console.log(parameter); 
}

function createTrajectories() {
    let trajectories = [];

    for(let j=0;j<64;j++) {
        let q = j>>3;
        let i = j%8;
        let pp = [
            [1,1],[-1,1],[-1,-1],[1,-1],
            [-1,-1],[1,-1],[1,1],[-1,1]];
        let cellIndices = [4,5,0,2,6,7,1,3];
        // change position
        let targetPosition = new BABYLON.Vector3(
            pp[i][0] - 2 + 4 * (q&1), 
            3 - 2*(i>>2) - 4 * ((q>>1)&1), 
            pp[i][1] - 2 + 4 * ((q>>2)&1));        
        let targetQuaternion = BABYLON.Quaternion.FromEulerAngles(-(i%2)*Math.PI, i&2 ? Math.PI : 0, 0);
        trajectories.push({cellIndex:cellIndices[q], targetPosition, targetQuaternion});
    }

    trajectories.sort((a,b) => {
        if(a.cellIndex < b.cellIndex) return 1;
        else if(a.cellIndex > b.cellIndex) return -1;
        let pa = a.targetPosition;
        let pb = b.targetPosition;
        if(pa.y<pb.y) return 1;
        else if(pa.y>pb.y) return -1;
        let ra = pa.x*pa.x+pa.z*pa.z;
        let rb = pb.x*pb.x+pb.z*pb.z;
        return -(ra-rb);
    });

    // let tmp = trajectories[0]; trajectories[0] = trajectories[3]; trajectories[3] = tmp;
    return trajectories;
}

function setDiskIsVisible(visible) {
    tableMeshes.forEach(mesh => mesh.isVisible = visible);
    extraHexes.forEach(mesh => mesh.isVisible = visible);    
}

function animate() {

    if(running) parameter = Math.min(1.0, parameter + engine.getDeltaTime() * 0.001 * 0.05);

    let gParam = step(parameter, 0.1, 1.0);

    setDiskIsVisible(parameter < 0.9);
    tableNode.position.y = -2 * smoothstep(parameter, 0.0, 0.1) - 10 *  Math.pow(step(parameter,0.25, 1.0), 2);

    let tablePos = tableNode.position;

    for(let j=0;j<64;j++) {

        let flightTime = 0.25/8;
        let param = 0;
        if(j<8) {
            let takeOff = 0.25*j*(1/8);
            param = step(gParam, takeOff, takeOff + flightTime);
        } else {
            let takeOff = 0.25 + (j-8) * (1-0.25-flightTime)/63;
            param = step(gParam, takeOff, takeOff + flightTime);
        }

        let trajectory = trajectories[j];

        let h = hexes[j];
        // morph hexagon
        h.vertices.forEach((v,vIndex) => BABYLON.Vector3.LerpToRef(v.p0,hex.vertices[vIndex].p,param,v.p));            
        h.updateMesh();  

        // change position
        trajectory.targetPosition.subtract(tablePos).scaleToRef(param, h.mesh.position);

        // rotate
        BABYLON.Quaternion.Slerp(BABYLON.Quaternion.Identity(), trajectory.targetQuaternion, param).toEulerAnglesToRef(h.mesh.rotation);

    }

}