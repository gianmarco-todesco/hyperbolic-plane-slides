'use strict';

let canvas, engine, scene, camera;
let param1 = 0;
let param1Speed = 0;

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
            param1 += param1Speed*dt;
            if(param1>1) {param1 = 1; param1Speed=0;}
        } else if(param1Speed<0) {
            param1 += param1Speed*dt;
            if(param1<0) {param1 = 0; param1Speed=0;}

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
    if(e.key == 'q') param1Speed = 1;
}

function onKeyUp(e) {
    if(e.key == 'q') param1Speed = -1;
}


class Surface {
    constructor(f, nu, nv, scene) {
        this.nu = nu;
        this.nv = nv;
        let vd = new BABYLON.VertexData();
        vd.positions = [];
        vd.normals = [];
        vd.indices = [];
        vd.uvs = [];
        for(let i=0;i<nu;i++) {
            let u = i/(nu-1);
            for(let j=0;j<nv;j++) {
                let v = j/(nv-1);
                let p = f(u,v);
                let nrm = this.computeNormal(f,u,v);
                vd.positions.push(p.x,p.y,p.z);
                vd.normals.push(nrm.x,nrm.y,nrm.z);
                vd.uvs.push(u,v);
            }
        }
        for(let i=0;i+1<nu;i++) {
            for(let j=0;j+1<nv;j++) {
                let k = i*nv+j;
                vd.indices.push(k,k+1,k+1+nv, k,k+1+nv,k+nv);
            }
        }
        /*
            vd.normals = [];
            BABYLON.VertexData.ComputeNormals(
                vd.positions, 
                vd.indices, 
                vd.normals);
        */
        let mesh = this.mesh = new BABYLON.Mesh('surface', scene);
        vd.applyToMesh(mesh, true);
    }

    computeNormal(f,u,v) {
        const h = 0.0001;
        let dfdu=f(u+h,v).subtract(f(u-h,v));
        let dfdv=f(u,v+h).subtract(f(u,v-h));
        return BABYLON.Vector3.Cross(dfdu,dfdv).normalize();
    }

    update(f) {
        let positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        const nu = this.nu;
        const nv = this.nv;
        let k = 0;
        for(let i=0;i<nu;i++) {
            let u = i/(nu-1);
            for(let j=0;j<nv;j++) {
                let v = j/(nv-1);
                let p = f(u,v);
                let nrm = this.computeNormal(f,u,v);
                positions[k]=p.x; 
                positions[k+1]=p.y; 
                positions[k+2]=p.z; 
                normals[k]=nrm.x; 
                normals[k+1]=nrm.y; 
                normals[k+2]=nrm.z; 
                k += 3;
            }
        }
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        
    }
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


function f1_old(u,v,t) {
    let phi = Math.PI*1.8*v;
    let theta = Math.PI*1.8*u;
    const R0 = 3, R1 = 1;
    let psi = phi*3 + theta*3 + t*3;
    let r1 = R1 * (1+ 0.2*Math.sin(psi));
    let r = R0 + r1*Math.cos(theta);
    return new BABYLON.Vector3(
        r*Math.cos(phi), 
        r1*Math.sin(theta),
        r*Math.sin(phi));
}

function f1(u,v,t) {
    
    let phi = 2 * Math.PI * u, csPhi = Math.cos(phi), snPhi = Math.sin(phi);
    // v = v * m_maxV * 10;
    let vv = v * 10;
    let sech_v = 1/Math.cosh(vv);
    let x = csPhi*sech_v;
    let y = snPhi*sech_v ;
    let z = vv - Math.tanh(vv) ;
    let sc = 3;
    return new BABYLON.Vector3(x*sc,-z*sc+3 - param1 * phi ,y*sc,);
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

function populateScene(scene) {

    createGrid(scene);

    let srf = new Surface((u,v)=>f1(u,v,0), 70,70, scene);

    let material = srf.mesh.material = new BABYLON.StandardMaterial('mat', scene);
    material.twoSidedLighting = true;
    material.backFaceCulling = false;
    material.diffuseColor.set(0.9,0.9,0.9);
    material.specularColor.set(0.3,0.3,0.3);

    material.diffuseTexture = makeCheckboardTexture(scene);

    let c1 = srf.mesh.createInstance('c1');
    let c2 = srf.mesh.createInstance('c2');
    
    

    // animazione
    scene.registerBeforeRender(() => {

        if(param1 == 0.0) {
            c1.isVisible = c2.isVisible = false;
        } else {
            c1.isVisible = c2.isVisible = true;
            c1.position.y = param1 * 2 * Math.PI;
            c2.position.y = param1 * 2 * Math.PI * 2;

        }
        // tempo in secondi dopo l'inizio della visione della pagina
        let seconds = performance.now() * 0.001;

        srf.update((u,v) => f1(u,v,seconds));
    

    });
}

