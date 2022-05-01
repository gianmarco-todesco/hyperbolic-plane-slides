'use strict';

let canvas, engine, scene, camera;
const slide = {
    name: 'Sodalite'
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

/*
function populateScene() {
    let torus = BABYLON.MeshBuilder.CreateTorus('torus',{
        diameter:6,
        thickness:1,
        tessellation:70

    },scene);
    torus.material = new BABYLON.StandardMaterial('mat',scene);
    torus.material.diffuseColor.set(0.8,0.4,0.1);

    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001;
        torus.rotation.x = t;
    });
}
*/


let hex;
let meshes = [];
let tess;

function populateScene() {
    createGrid(scene);
    const V3 = (x,y,z) => new BABYLON.Vector3(x,y,z);

    let lines1 = BABYLON.MeshBuilder.CreateLineSystem(
        "lines", {
            lines: [
                [V3(1,1,1), V3(-1,1,1),V3(-1,1,-1),V3(1,1,-1), V3(1,1,1)],
                [V3(1,-1,1), V3(-1,-1,1),V3(-1,-1,-1),V3(1,-1,-1), V3(1,-1,1)],
                [V3(1,1,1),V3(1,-1,1)],
                [V3(-1,1,1),V3(-1,-1,1)],
                [V3(-1,1,-1),V3(-1,-1,-1)],
                [V3(1,1,-1),V3(1,-1,-1)]
            ]                
        }, 
        scene);
    lines1.color.set(1,0.5,1)

    tess = new GenericTessellation(6,4);
    tess.addFirstShell();
    for(let i=0; i<3; i++) tess.addShell();
    console.log(tess.cells.length);

    let cell = tess.cells[5];
    
    /*
    let lines2 = BABYLON.MeshBuilder.CreateLineSystem(
        "lines", {
            lines: [
                [V3(0,-1,1), V3(-1,-1,0), V3(-1,0,1), V3(0,-1,1), V3(1,-1,0), V3(1,0,-1), V3(0,1,-1)]
            ]                
        }, 
        scene);
    lines1.color.set(1,0.5,1)
    */

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


    let startTime = performance.now();
    let hexes = [];
    for(let i=0;i<100; i++) {
        let hex2 = new BendingHexagon();
        hex2.createMesh();
        hex2.mesh.material = hex.mesh.material;
        hex2.computePoints2(tess,i)
        hex2.updateMesh(); 
        hexes.push(hex2);
    }
    console.log("time=", performance.now() - startTime)

    /* questo si
    let b = hex.mesh.createInstance('a');
    b.position.set(0,0,-2);
    b.rotation.y = Math.PI/2;
    meshes.push(b);
    b = hex.mesh.createInstance('a');
    b.position.set(-2,0,-2);
    b.rotation.y = Math.PI;
    meshes.push(b);
    b = hex.mesh.createInstance('a');
    b.position.set(-2,0,0);
    b.rotation.y = -Math.PI/2;
    meshes.push(b);

    b = hex.mesh.createInstance('a');
    b.position.set(0,2,0);
    b.rotation.x = Math.PI;
    b.rotation.y = -Math.PI/2;
    meshes.push(b);

    b = hex.mesh.createInstance('a');
    b.position.set(-2,2,0);
    // b.rotation.x = Math.PI;
    b.rotation.y = Math.PI/2;
    meshes.push(b);

    meshes[0].rotation.x=Math.PI;
    meshes[0].rotation.y=Math.PI/2;
    */

    /*

    let lines =[];
    let n = 10, m = 30;
    for(let i=0; i<n; i++) {
        let t = i/(n-1);
        let phi = Math.PI/4*t;
        let p1 = V3(0,0,0);
        let p4 = V3(1.0 - Math.sin(phi), 1.0,  1.0 - Math.cos(phi));
        let v4 = V3(0,-1,0).scale(0.25);
        let v1 = p4.subtract(p1).normalize().scale(0.25);
        let p2 = p1.add(v1);
        let p3 = p4.add(v4);

        let single = [];
        for(let j=0;j<m;j++) {
            let s = j/(m-1);
            let p12 = BABYLON.Vector3.Lerp(p1,p2,s);
            let p23 = BABYLON.Vector3.Lerp(p2,p3,s);
            let p34 = BABYLON.Vector3.Lerp(p3,p4,s);
            let p123 = BABYLON.Vector3.Lerp(p12,p23,s);
            let p234 = BABYLON.Vector3.Lerp(p23,p34,s);
            let p = BABYLON.Vector3.Lerp(p123,p234,s);
            single.push(p);
        }
        lines.push(single);
    }
    let lines3 = BABYLON.MeshBuilder.CreateLineSystem(
        "lines", { lines },
        scene);
    lines3.color.set(0.4,0.4,1)
*/
    
    /*
    let torus = BABYLON.MeshBuilder.CreateTorus('torus',{
        diameter:6,
        thickness:1,
        tessellation:70

    },scene);
    torus.material = new BABYLON.StandardMaterial('mat',scene);
    torus.material.diffuseColor.set(0.8,0.4,0.1);

    let sphere = BABYLON.MeshBuilder.CreateSphere('sphere',{
        diameter:4
    },scene);
    sphere.material = new BABYLON.StandardMaterial('mat',scene);
    sphere.material.diffuseColor.set(0.2,0.5,0.7);

    */
    let hex2 = hexes[3];
    


    


    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001 * 3;
        //hex.parameter = 0.5 + 0.5 * Math.sin(t);
        //hex.computePoints();
        //hex.updateMesh();

        let param = 0.5 + 0.5 * Math.sin(t);



        for(let j=0;j<64;j++) {
            let q = j>>3;
            let i = j%8;
            let h = hexes[j];
            let pp = [
                [1,1],[-1,1],[-1,-1],[1,-1],
                [-1,-1],[1,-1],[1,1],[-1,1]];
            h.vertices.forEach((v,i) => {
                BABYLON.Vector3.LerpToRef(
                    v.p0,
                    hex.vertices[i].p,
                    param,
                    v.p
                )
            });
            h.updateMesh();  
            h.mesh.position.set(
                param*(pp[i][0] - 2 + 4 * (q&1)),
                param*(8 - 2*(i>>2) - 2 + 4 * ((q>>1)&1)),
                param*(pp[i][1] - 2 + 4 * ((q>>2)&1)));
            h.mesh.rotation.x = -(i%2)*Math.PI * param;
            if(i&2) h.mesh.rotation.y = Math.PI * param;
    
            //h.mesh.rotation.y = (i%4)*Math.PI;
        
        }

        /*
        hexes.forEach(hex2 => {
            hex2.vertices.forEach((v,i) => {
                let p0 = v.p0;
                let p1 = hex.vertices[i].p;
                let p = BABYLON.Vector3.Lerp(p0,p1,param);
                v.p.copyFrom(p);
            });
            hex2.updateMesh();    
        })
        */
    });
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
    return lines;    
};