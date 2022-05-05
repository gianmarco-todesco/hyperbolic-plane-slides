'use strict';

let canvas, engine, scene, camera;
let actController;


const slide = {
    name: 'Angel and devils'
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

    actController = new ActController();

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

let oh;
let ohCopies = [];
let oh2;
let pyramids = [];

function populateScene() {
    let startTime = performance.now();
    createGrid(scene);
    oh = new Octahedron(10);
    oh.parameter = 1;

    oh2 = new Octahedron(10);
    oh2.parameter = 0;
    oh2.hexMaterial.diffuseColor.set(0.8,0.3,0.03);

    oh2.node.position.set(5,5,0);

    for(let i=1; i<8; i++) {
        let c = new OctahedronCopy(oh);
        ohCopies.push(c);
        let x = 2*(-1+2*(i&1));
        let y = 2*(-1+2*((i>>1)&1));
        let z = 2*(-1+2*((i>>2)&1));
        
        c.node.position.set(-5 + x,-5 + y,-5 + z);
    } 

    for(let i=0; i<6; i++) {
        let pyr = oh.createPyramid();
        pyramids.push(pyr);
        if(i<4) pyr.rotation.y = i*Math.PI/2;
        else pyr.rotation.z = (i==4 ? 1 : -1) * Math.PI/2;
    }

    console.log("t=", performance.now()-startTime);

    scene.registerBeforeRender(() => actController.tick());

    camera.inputs.attached.keyboard.detachControl();
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
          case BABYLON.KeyboardEventTypes.KEYDOWN:
            onKeyDown(kbInfo.event); // key, code
            break;          
        }
    });
}

function onKeyDown(e) {
    console.log(e);
    if(e.key == "ArrowRight") actController.next();
    else if(e.key == "ArrowLeft") actController.prev();
}


class ActController {
    constructor() {
        this.acts = [
            new Act1(),
            new Act2(),
            new Act3(),
            new Act4(),
        ];
        this.currentAct = null;
        this.currentActIndex = 0;
        this.dir = 0;
    }

    next() {
        if(this.currentActIndex+1 < this.acts.length) this.dir = 1;    
    }
    prev() {
        if(this.currentActIndex>0) this.dir = -1;
    }
    setNextAct() {
        if(this.currentActIndex+1 < this.acts.length) {
            this.currentActIndex++;
            this.dir = 0;
        }
    }
    setPrevAct() {
        if(this.currentActIndex > 0) {
            this.currentActIndex--;
            this.dir = 0;
        }
    }
    tick() {
        if(this.currentAct != this.acts[this.currentActIndex]) {
            this.currentAct = this.acts[this.currentActIndex];
            this.currentAct.start();
        }
        this.currentAct.tick(this.dir);
    }
}

function step(t,t0,t1) { return t<t0?0:t>t1?1:(t-t0)/(t1-t0); }
function smoothStep(t,t0,t1) { return t<t0?0:t>t1?1:(1-Math.cos(Math.PI*(t-t0)/(t1-t0)))*0.5; }

class Act1 {
    constructor() {

    }

    start() {
        console.log("start act 1")
        ohCopies.forEach(c=>c.isVisible=false);
        oh2.isVisible=false;
        pyramids.forEach(p=>{p.isVisible=true;p.position.set(0,0,0);});
        oh.isVisible = true;   
        oh.parameter = 1;
    }

    tick(dir) {
        if(dir>0) actController.setNextAct();

    }
}


class Act2 {
    constructor() {

    }

    start() {
        console.log("start act 2")
        ohCopies.forEach(c=>c.isVisible=false);
        oh2.isVisible=false;
        pyramids.forEach(p=>{p.isVisible=true;p.position.set(0,0,0);});
        oh.isVisible = true;   
        oh.node.position.set(0,0,0);
        this.param = 0.0;
        oh.parameter = 1;

    }

    tick(dir) {
        const speed = 10;
        if(dir < 0) { actController.setPrevAct(); return; }
        else if(dir > 0) { actController.setNextAct(); return; }
        const maxParam = 10;
        if(this.param < maxParam) {
            let dt = engine.getDeltaTime() * 0.001;
            this.param = Math.min(maxParam, this.param + dt * speed);
            let v = [[1,0,0],[0,0,-1],[-1,0,0],[0,0,1],[0,1,0],[0,-1,0]]
            .map(([x,y,z])=>new BABYLON.Vector3(x,y,z));
            pyramids.forEach((pyr,i) => { v[i].scaleToRef(this.param,  pyr.position);})
            if(this.param == maxParam) {
                pyramids.forEach(p=>{p.isVisible=false;});
            }
        } 
    }
}

function bump(dist, t1, t) {
    if(t<0) return dist;
    else if(t>1) return 0;
    if(t<t1) return dist * (1-t/t1);
    let speed = dist/t1;
    let a = speed/(1-t1);
    return a*(t*t - t*(t1+1) + t1);    
}

class Act3 {
    constructor() {

    }

    start() {
        console.log("start act 3")
        ohCopies.forEach(c=>c.isVisible=false);
        oh2.isVisible=false;
        pyramids.forEach(p=>{p.isVisible=false;});
        oh.isVisible = true;   
        oh.parameter = 1;

        this.statTime = performance.now() * 0.001;
    }

    tick(dir) {
        if(dir < 0) { actController.setPrevAct(); return; }
        else if(dir > 0) { actController.setNextAct(); return; }

        let t = performance.now() * 0.001 - this.statTime;

        const t0 = 1;
        const t1 = 2;
        const t2 = 3;

        let lst = [oh];
        ohCopies.forEach(c=>lst.push(c));

        if(t<t0) {
            lst.forEach((c,i) => c.isVisible = i<2);
            let tt = step(t,0,t0);
            let tt1 = 0.7;
            let x = bump(10.0, tt1, tt) + 2;
            lst[0].node.position.set(Math.min(0, x - 4),0,0);
            lst[1].node.position.set(x, 0, 0);
        } else if(t<t1) {
            lst.forEach((c,i) => c.isVisible = i<4);

            let tt = step(t,t0,t1);
            let tt1 = 0.7;
            let z = bump(10.0, tt1, tt) + 2;
            let z1 =  Math.min(0, z - 4);
            
            lst[0].node.position.set( 2,0,z1);
            lst[1].node.position.set(-2,0,z1);
            lst[2].node.position.set( 2,0,z);
            lst[3].node.position.set(-2,0,z);
            
        } else if(t<t2) {
            let tt = step(t,t1,t2);
            let tt1 = 0.7;
            lst.forEach((c,i) => c.isVisible = true);

            let y = bump(-10.0, tt1, tt) - 2;
            let y1 =  Math.max(0, y + 4);

            lst[0].node.position.set( 2,y,-2);
            lst[1].node.position.set(-2,y,-2);
            lst[2].node.position.set( 2,y, 2);
            lst[3].node.position.set(-2,y, 2);

            lst[4].node.position.set( 2,y1,-2);
            lst[5].node.position.set(-2,y1,-2);
            lst[6].node.position.set( 2,y1, 2);
            lst[7].node.position.set(-2,y1, 2);

            
        } else {

            lst[0].node.position.set( 2,-2,-2);
            lst[1].node.position.set(-2,-2,-2);
            lst[2].node.position.set( 2,-2, 2);
            lst[3].node.position.set(-2,-2, 2);

            lst[4].node.position.set( 2,2,-2);
            lst[5].node.position.set(-2,2,-2);
            lst[6].node.position.set( 2,2, 2);
            lst[7].node.position.set(-2,2, 2);

            
        }
    }
}



class Act4 {
    constructor() {

    }

    start() {
        console.log("start act 4")
        ohCopies.forEach(c=>c.isVisible=true);
        oh2.isVisible=false;
        pyramids.forEach(p=>{p.isVisible=false;});
        oh.isVisible = true;   
        this.statTime = performance.now() * 0.001;
        let lst = this.lst = [oh];
        ohCopies.forEach(c=>lst.push(c));
        lst.forEach((c,i) => {
            c.node.position.set(-2+4*(i&1), -2+4*((i>>1)&1), -2+4*((i>>2)&1));
        });
        oh.parameter = 1;
    }

    tick(dir) {
        if(dir < 0) { actController.setPrevAct(); return; }
        else if(dir > 0) { actController.setNextAct(); return; }

        if(oh.parameter > 0.0) {
            let parameter = Math.max(0.0, oh.parameter - engine.getDeltaTime() * 0.001); 
            oh.parameter = parameter;    
        }
    }
}

