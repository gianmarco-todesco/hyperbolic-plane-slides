'use strict';

let canvas, engine, scene, camera;
let actController;
let edgeValue = 0.0;
let edgeTargetValue = 0.0; 

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
            -0.3, 1.02,
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
    let tx = oh.hexMaterial.diffuseTexture = new BABYLON.DynamicTexture('dt', {width:1024,height:1024}, scene);
    let ctx = tx.getContext();
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,1024,1024);
    tx.update();


    oh2 = new Octahedron(10);
    oh2.parameter = 0;
    oh2.hexMaterial.diffuseColor.set(0.8,0.3,0.03);

    oh2.node.position.set(0,0,0);

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
                    actController.onDrag(dx);

                }
                // console.log(pointerInfo);
            break;
        }
    });
}

function onKeyDown(e) {
    console.log(e);
    if(e.key == "ArrowRight") actController.next();
    else if(e.key == "ArrowLeft") actController.prev();
    else if(e.key == "e") edgeTargetValue = 1.0 - edgeTargetValue;
}


class ActController {
    constructor() {
        this.acts = [
            // new Act1(),
            new Act2(),
            new Act3(),
            new Act4(),
            new Act5(),
            new Act6(),
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
            this.currentAct = this.acts[this.currentActIndex];
            this.currentAct.start(1);
        }
    }
    setPrevAct() {
        if(this.currentActIndex > 0) {
            this.currentActIndex--;
            this.dir = 0;
            this.currentAct = this.acts[this.currentActIndex];
            this.currentAct.start(-1);
        }
    }
    tick() {
        if(this.currentAct != this.acts[this.currentActIndex]) {
            console.log("UGH ", this.currentActIndex)
            this.currentAct = this.acts[this.currentActIndex];
            this.currentAct.start(1);
        }
        this.currentAct.tick(this.dir);
        if(edgeValue != edgeTargetValue) {
            let d = engine.getDeltaTime() * 0.001 * 4;
            if(edgeValue < edgeTargetValue) 
                edgeValue = Math.min(edgeTargetValue, edgeValue + d);
            else 
                edgeValue = Math.max(edgeTargetValue, edgeValue - d);
            paintBorder(edgeValue);
        }
    }
    onDrag(d) {
        if(this.currentAct && this.currentAct.onDrag) this.currentAct.onDrag(d);
    }
}

function step(t,t0,t1) { return t<t0?0:t>t1?1:(t-t0)/(t1-t0); }
function smoothStep(t,t0,t1) { return t<t0?0:t>t1?1:(1-Math.cos(Math.PI*(t-t0)/(t1-t0)))*0.5; }

function paintBorder(value) {
    let tx = oh.hexMaterial.diffuseTexture;
    let ctx = tx.getContext();
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,1024,1024);
    let cx = 512, cy = 512;
    let radius = 280;
    ctx.beginPath();
    ctx.moveTo(cx+radius,cy);
    for(let i=1;i<=6;i++) {
        let phi = 2*Math.PI*i/6;
        ctx.lineTo(cx+radius*Math.cos(phi), cy+radius*Math.sin(phi));
    }
    ctx.closePath();
    ctx.lineWidth = 20;
    let v = Math.max(0,Math.min(255,Math.floor(255.0*(1-value))));
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.stroke();
    tx.update();
}

// octagon
class Act1 {
    constructor() {

    }

    start(dir) {
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

// octagon with moving pyramids
class Act2 {
    constructor() {
        this.maxParam = 10.0;
    }

    start(dir) {
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
        let dt = engine.getDeltaTime() * 0.001;
        if(dir < 0) { 
            const speed = 20;
            this.param = Math.max(0.0, this.param - dt * speed);
            this.updatePyramids();
            if(this.param == 0.0) actController.setPrevAct(); 
        }
        else if(dir > 0) {
            const speed = 10;
            this.param = Math.min(this.maxParam, this.param + dt * speed);
            this.updatePyramids();
            if(this.param == this.maxParam) actController.setNextAct(); 
        }
    }

    updatePyramids() {
        let v = [[1,0,0],[0,0,-1],[-1,0,0],[0,0,1],[0,1,0],[0,-1,0]]
            .map(([x,y,z])=>new BABYLON.Vector3(x,y,z));
        pyramids.forEach((pyr,i) => { v[i].scaleToRef(this.param,  pyr.position);})   
        let visiblePyramids = this.param < this.maxParam;
        pyramids.forEach(p=>{p.isVisible=visiblePyramids;})
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

    start(dir) {
        console.log("start act 3")
        ohCopies.forEach(c=>c.isVisible= (dir<0.0));
        oh2.isVisible=false;
        pyramids.forEach(p=>{p.isVisible=false;});
        oh.isVisible = true;   
        oh.parameter = 1;

        this.parameter = dir > 0.0 ? 0.0 : 3.0;
    }

    tick(dir) {

        const maxParameter = 3.0;
        if(dir>0.0) this.parameter = Math.min(maxParameter, this.parameter + engine.getDeltaTime()*0.001);
        else if(dir<0.0) this.parameter =  Math.max(0.0, this.parameter - engine.getDeltaTime()*0.001);


        //if(dir < 0) { actController.setPrevAct(); return; }
        //else if(dir > 0) { actController.setNextAct(); return; }

        let t = this.parameter;

        const t0 = 1;
        const t1 = 2;
        const t2 = 3;

        let lst = [oh];
        ohCopies.forEach(c=>lst.push(c));

        if(t<t0) {
            lst.forEach((c,i) => c.isVisible = i<2);
            let tt = step(t,0,t0);
            let tt1 = 0.8;
            let x = bump(10.0, tt1, tt) + 2;
            lst[0].node.position.set(Math.min(0, x - 4),0,0);
            lst[1].node.position.set(x, 0, 0);
        } else if(t<t1) {
            lst.forEach((c,i) => c.isVisible = i<4);

            let tt = step(t,t0,t1);
            let tt1 = 0.8;
            let z = bump(10.0, tt1, tt) + 2;
            let z1 =  Math.min(0, z - 4);
            
            lst[0].node.position.set( 2,0,z1);
            lst[1].node.position.set(-2,0,z1);
            lst[2].node.position.set( 2,0,z);
            lst[3].node.position.set(-2,0,z);
            
        } else if(t<t2) {
            let tt = step(t,t1,t2);
            let tt1 = 0.8;
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

        if(dir>0.0 && this.parameter == maxParameter) actController.setNextAct();
        else if(dir <0.0 && this.parameter == 0.0) actController.setPrevAct();
        
    }
}



class Act4 {
    constructor() {

    }

    start(dir) {
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
        oh.parameter = dir > 0.0 ? 1.0 : 0.0;
    }

    tick(dir) {
        if(dir != 0.0) {
            let dt = engine.getDeltaTime() * 0.001;
            let parameter  = dir > 0.0 ? Math.max(0.0, oh.parameter - dt) : Math.min(1.0, oh.parameter + dt); 
            oh.parameter = parameter;
            console.log(dir, parameter)
            if(dir>0.0 && parameter == 0.0) 
                actController.setNextAct();
            else if(dir<0.0 && parameter == 1.0) 
                actController.setPrevAct();
        }
    }
}


class Act5 {
    constructor() {
        
    }

    start(dir) {
        console.log("start act 5")
        ohCopies.forEach(c=>c.isVisible=true);
        oh2.isVisible=false;
        pyramids.forEach(p=>{p.isVisible=false;});
        oh.isVisible = true;   
        let lst = this.lst = [oh];
        ohCopies.forEach(c=>lst.push(c));
        lst.forEach((c,i) => {
            c.node.position.set(-2+4*(i&1), -2+4*((i>>1)&1), -2+4*((i>>2)&1));
        });
        oh.parameter = 0.0;
        if(dir<0) actController.setPrevAct();
    }

    tick(dir) {
        if(dir<0.0) actController.setPrevAct();
        else if(dir>0.0)  actController.setNextAct();
    }

};


class Act6 {
    constructor() {
        
    }

    start(dir) {
        console.log("start act 6")
        ohCopies.forEach((c,i)=>c.isVisible=i<6);
        oh2.isVisible=true;
        pyramids.forEach(p=>{p.isVisible=false;});
        oh.isVisible = true;   
        let lst = this.lst = [oh];
        ohCopies.forEach(c=>lst.push(c));
        lst.forEach((c,i) => {
            c.node.position.set(-2+4*(i&1), -2+4*((i>>1)&1), -2+4*((i>>2)&1));
            c.startPosition = c.node.position.clone();
            c.node.position.scaleInPlace(1.1);
        });
        oh.parameter = 0.0;
        this.parameter = 0.0;
    }

    tick(dir) {
        if(dir<0.0) actController.setPrevAct();
    }

    onDrag(d) {
        this.parameter = Math.max(0.0, Math.min(1.0, this.parameter + d*0.001));
        this.lst.forEach((c,i) => {
            c.startPosition.scaleToRef(1.0 + 5*this.parameter, c.node.position);
        })
    }

};
