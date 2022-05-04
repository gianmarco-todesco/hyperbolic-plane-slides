'use strict';

let canvas, engine, scene, camera;
let param1 = 0;
let param1Speed = 0;
const deltah = 0.2;
const globalScale = 3.0;

const slide = {
    name: 'Pseudosphere'
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

    scene.registerBeforeRender(() => {
        let dt = engine.getDeltaTime()*0.001;
        if(param1Speed>0) {
            param1 += param1Speed*dt*5;
            if(param1>1) {param1 = 1; param1Speed=0;}
        } else if(param1Speed<0) {
            param1 += param1Speed*dt*5;
            if(param1<0) {param1 = 0; param1Speed=0;}

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

let blossom = 0.0;

function onDrag(dx) {
    blossom = Math.max(0.0, Math.min(1.0, (blossom+dx*0.01)));
    updateTexture(psHem.mesh.material.diffuseTexture, 1-blossom)
}

function onResize() {
    engine.resize();
}


function onKeyDown(e) {
    if(e.key == 'q') param1Speed = 1;
}

function onKeyUp(e) {
    if(e.key == 'q') param1Speed = -1;
}


let psHorn;
let psHornInstances;

let psHem;


function populateScene(scene) {

    // createGrid(scene);

    psHorn = new PsHorn(scene);
    // psHorn.mesh.isVisible = false;
    let material = psHorn.mesh.material = new BABYLON.StandardMaterial('mat', scene);
    material.twoSidedLighting = true;
    material.backFaceCulling = false;
    material.diffuseColor.set(0.9,0.9,0.9);
    material.specularColor.set(0.3,0.3,0.3);

    material.diffuseTexture = makeCheckboardTexture(scene);

    let c1 = psHorn.mesh.createInstance('c1');
    let c2 = psHorn.mesh.createInstance('c2');
    psHornInstances = [c1, c2];


    psHem = new PsHem(scene);
    material = psHem.mesh.material = new BABYLON.StandardMaterial('mat', scene);
    material.twoSidedLighting = true;
    material.backFaceCulling = false;
    material.diffuseColor.set(0.9,0.9,0.9);
    material.specularColor.set(0.3,0.3,0.3);
    material.diffuseTexture = makeCheckboardTexture(scene);
    material.wireframe = false;
    updateTexture(psHem.mesh.material.diffuseTexture, 1-blossom);

    // animazione
    scene.registerBeforeRender(() => {

        if(param1 == 0.0) {
            c1.isVisible = c2.isVisible = false;
        } else {
            c1.isVisible = c2.isVisible = true;
            let dy = deltah * param1 * Math.PI * 2;
            c1.position.y = dy;
            c2.position.y = dy * 2;
        }
        // tempo in secondi dopo l'inizio della visione della pagina
        let seconds = performance.now() * 0.001;
        psHorn.deltah = deltah * param1;
        psHorn.update();
        // srf.update((u,v) => f1(u,v,seconds));
        

        //updateTexture(material.diffuseTexture, Math.sin(seconds)*0.5+0.5)
    });
}


function makeCheckboardTexture(scene) {
    const w = 1024, h = 1024;
    let tx = new BABYLON.DynamicTexture('a', { width:w, height:h}, scene);
    let ctx = tx.getContext();
    ctx.fillStyle = 'magenta'; // 'transparent';
    ctx.fillRect(0,0,w,h);
    let dx = 128, dy = 64;
    ctx.fillStyle = 'cyan';
    for(let i=0; i*dy<h; i++) {
        for(let j=0;j*dx<w;j++) {
            if((i+j)&1) {
                ctx.fillRect(j*dx,i*dy,dx,dy);
            }
        }
    }
    ctx.fillStyle = 'black';
    for(let i=0; i*dy<h; i++) ctx.fillRect(0,i*dy-3,w,7);
    for(let j=0; j*dx<w; j++) ctx.fillRect(j*dx-3,0,7,h);


    tx.update();
    tx.hasAlpha = true;
    return tx;
}

function updateTexture(texture, t) {
    const w = 1024, h = 1024;
    let ctx = texture.getContext();
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = 'magenta';
    
    ctx.fillRect(0,0,w,h);
    let dx = 128, dy = 128;
    ctx.fillStyle = 'cyan';
    for(let i=0; i*dy<h; i++) {
        for(let j=0;j*dx<w;j++) {
            if((i+j)&1) {
                ctx.fillRect(j*dx,i*dy,dx,dy);
            }
        }
    }
    ctx.fillStyle = 'black';
    //for(let i=0; i*dy<h; i++) ctx.fillRect(0,i*dy-3,w,7);
    //for(let j=0; j*dx<w; j++) ctx.fillRect(j*dx-3,0,7,h);

    ctx.clearRect(0,0,w,t*h);
    ctx.fillStyle = 'black';
    ctx.fillRect(0,t*h,w,25);
    // ctx.fillRect(0,0,w,t*h);

    texture.update();
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
