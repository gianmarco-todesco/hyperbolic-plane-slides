'use strict';

let canvas, engine, scene, camera;
const slide = {
    name: 'Folding-pages'
};



function setup() {
    // il tag canvas che visualizza l'animazione
    canvas = document.getElementById('c');
    // la rotella del mouse serve per fare zoom e non per scrollare la pagina
    canvas.addEventListener('wheel', evt => evt.preventDefault());
    
    // engine & scene
    engine = slide.engine = new BABYLON.Engine(canvas, true);
    scene = slide.scene = new BABYLON.Scene(engine);
    scene.enablePhysics(new BABYLON.Vector3(0,0,0));
    // scene.enablePhysics(new BABYLON.Vector3(0,0, 0), new BABYLON.OimoJSPlugin());
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

let netViewer, net;

function populateScene() {

    netViewer = new NetViewer();
    net = new Net();
    net.setType(4);
    netViewer.update(net);	


    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001;
        net.vertices.forEach(v => {
            v.pos.copyFrom(v.sphere.position);
        });
        netViewer.update(net);
        netViewer.tick(engine.getDeltaTime());
    });

    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
          case BABYLON.KeyboardEventTypes.KEYDOWN:
            if(kbInfo.event.key == "q") {
                net.addNextFace();
                //netViewer.update(net);
            } 
            else if(kbInfo.event.key == "1") { net.setType(0); netViewer.clearPattern(); }
            else if(kbInfo.event.key == "2") { net.setType(1); netViewer.clearPattern(); }
            else if(kbInfo.event.key == "3") { net.setType(2); netViewer.clearPattern(); }
            else if(kbInfo.event.key == "4") { net.setType(3); netViewer.clearPattern(); }
            else if(kbInfo.event.key == "5") { net.setType(4); netViewer.clearPattern(); }
            else if(kbInfo.event.key == "d") {
                if(netViewer.patternVisibility > 0.0) netViewer.patternVisibilityTarget = 0.0;
                else if(net.type >= 3) netViewer.patternVisibilityTarget = 1.0;
            }
            break;
          case BABYLON.KeyboardEventTypes.KEYUP:
            // onKeyUp(kbInfo.event); 
            break;
        }
    });
}


class NetViewer {

    constructor() {

        this.cylinderMesh = BABYLON.MeshBuilder.CreateCylinder('c',{diameter:0.03, height:1}, scene);
        this.cylinderMesh.material = new BABYLON.StandardMaterial('cmat', scene);
        this.cylinderMesh.isVisible = false;
        this.cylinderMesh.material.diffuseColor.set(0,1,1);
        this.edgesInstances = [];

        let vd = this.vd = new BABYLON.VertexData();
        let maxTriangleCount = 5000;
        vd.positions = (new Array(3*3*maxTriangleCount)).fill(0);
        vd.normals = (new Array(3*3*maxTriangleCount)).fill(0);
        vd.indices = new Array(3*maxTriangleCount);
        vd.uvs = (new Array(2*3*maxTriangleCount)).fill(0);
        for(let i=0; i<maxTriangleCount*3; i++) vd.indices[i] = i;
        for(let i=0; i<maxTriangleCount; i++) {
            let k = i*3*2;
            [0,0,1,0,0,1].forEach((x,j) => vd.uvs[k+j] = x);
        }
        let mesh = this.trianglesMesh = new BABYLON.Mesh('surface', scene);
        vd.applyToMesh(mesh, true);
        mesh.material = new BABYLON.StandardMaterial('tmat', scene);
        mesh.material.diffuseColor.set(0.8,0.8,0.8);
        mesh.material.specularColor.set(0.1,0.1,0.1);
        mesh.material.backFaceCulling = false;
        mesh.material.twoSidedLighting = true;

        
        let tx = this.texture = new BABYLON.DynamicTexture('dt', {width:1024,height:1024}, scene);
        let ctx = tx.getContext();
        ctx.fillStyle = "white";
        ctx.fillRect(0,0,1024,1024);
        tx.update();
        this.patternVisibility = this.patternVisibilityTarget = 0.0;        
        mesh.material.diffuseTexture = this.texture;
    }

    tick(dt) {
        if(this.patternVisibility == this.patternVisibilityTarget) return;
        else
        {
            let t = this.patternVisibility;
            let delta = dt * 0.001;
            if(this.patternVisibilityTarget > t) 
                t = Math.min(this.patternVisibilityTarget, t+delta);
            else 
                t = Math.max(this.patternVisibilityTarget, t-delta);
            this.updatePattern(t);
        }
    }
    clearPattern() {
        this.patternVisibility = this.patternVisibilityTarget = 0.0;
        this.updatePattern(0.0);
    }

    updatePattern(visibility) {
        this.patternVisibility = visibility;
        let tx = this.texture;
        let ctx = tx.getContext();
        ctx.fillStyle = "white";
        ctx.fillRect(0,0,1024,1024);
        if(visibility>0.0) {
            ctx.fillStyle = "rgba(0, 0, 0, " + visibility + ")";
            ctx.beginPath();
            ctx.moveTo(0,1023);
            ctx.lineTo(512,1023);
            ctx.lineTo(0,512);
            ctx.closePath();
            ctx.fill();
            const d = 16;
            ctx.fillRect(0,1024-d,1024,d);
            ctx.fillRect(0,0,d,1024);            
        }
        tx.update();
        this.cylinderMesh.material.alpha = 1-visibility;
        
    }



    update(net) {        
        const me = this;
        
        // vertices
        /*
        let vm = this.vertexMeshes;
        net.vertices.forEach((v,i) => {
            let inst;
            if(i<vm[0].instances.length) inst = vm[0].instances[i];
            else { inst = vm[0].mesh.createInstance('s'+i); vm[0].instances.push(inst); }
            inst.position.copyFrom(v.pos);
            inst.isVisible = true;
        });
        */
        this.recenter(net);
        

        // edges
        const eis = this.edgesInstances;
        if(this.patternVisibility >= 1.0) {
            // hide edges and vertices
            for(let i = 0; i<eis.length; i++) {
                eis[i].isVisible = false;
            }
            net.vertices.forEach(v => v.sphere.isVisible = false);
        } else {
            // show edges
            net.edges.forEach((e,i) => {
                let inst;
                if(i<eis.length) inst = eis[i];
                else { inst = me.cylinderMesh.createInstance('s'+i); eis.push(inst); }
                let p1 = e.va.pos, p2 = e.vb.pos;
                let delta = p2.subtract(p1);
                inst.position.set(0,0,0);
                inst.lookAt(delta);
                inst.rotate(BABYLON.Axis.X, Math.PI/2);
                inst.scaling.set(1,delta.length(),1);
                BABYLON.Vector3.LerpToRef(p1,p2,0.5,inst.position); 
                inst.isVisible = true;
            })
            for(let i = net.edges.length; i<eis.length; i++) {
                eis[i].isVisible = false;
            }
            net.vertices.forEach(v => v.sphere.isVisible = true);
            net.vMaterials.forEach(mat => mat.alpha = 1-this.patternVisibility);
        }

        this.updateFaces(net);
    }

    updateFaces(net) {
        // faces
        let positions = this.vd.positions;
        let normals = this.vd.normals;
        net.faces.forEach((f,i) => {
            let ii = [0,1,2];
            if(f.vertices[1].valence != 6) ii = [1,0,2];
            else if(f.vertices[2].valence != 6) ii = [2,0,1];
            let pts = ii.map(i=>f.vertices[i].pos);
            let k = 3*3*i;
            pts.forEach((pt,j) => {
                positions[k+j*3+0] = pt.x;
                positions[k+j*3+1] = pt.y;
                positions[k+j*3+2] = pt.z;
            });
            let [p1,p2,p3] = pts;
            let nrm = BABYLON.Vector3.Cross(p3.subtract(p1), p2.subtract(p1)).normalize();
            [nrm.x,nrm.y,nrm.z, nrm.x,nrm.y,nrm.z, nrm.x,nrm.y,nrm.z].forEach((x,j) => {
                normals[k+j] = x;
            });
        });
        for(let i=net.faces.length*3*3; i<positions.length; i++) {
            positions[i] = 0;
            normals[i] = 0;
        }

        this.trianglesMesh.updateVerticesData(
            BABYLON.VertexBuffer.PositionKind, 
            positions);
        // BABYLON.VertexData.ComputeNormals(positions, this.vd.indices, normals);
        this.trianglesMesh.updateVerticesData(
            BABYLON.VertexBuffer.NormalKind, 
            normals);
    }

    recenter(net) {
        let c = new BABYLON.Vector3(0,0,0);
        net.vertices.forEach(v => c.addInPlace(v.pos));
        c.scaleInPlace(1/net.vertices.length);
        let delta = c.scale(-0.01);
        //this.trianglesMesh.position.addInPlace(delta);
        //this.edgesInstances.forEach(inst => inst.position.addInPlace(delta));
        net.vertices.forEach(v => v.sphere.position.addInPlace(delta));
    }
}

class Vertex {
    constructor(index) {
        this.index = index;
        this.pos = new BABYLON.Vector3(0,0,0);
        this.force = new BABYLON.Vector3(0,0,0);
        this.edges = [];
        this.valence = 0;
        this.count = 0;
    }
}

class Edge {
    constructor(index, a,b) {
        this.index = index;
        this.id = [a,b].map(v=>v.index).sort();
        this.va = a;
        this.vb = b;
        this.faces = [];
        this.sideVertices = [];
    }
}

class Face {
    constructor(index,a,b,c) {
        this.index = index;
        this.id = [a,b,c].map(v=>v.index).sort();
        this.vertices = [a,b,c];
    }
}

class Net {
    constructor() {
        this.vertices = [];
        this.edges = [];
        this.faces = [];
        this.type = 0;
        this.vMaterials = [];
        for(let i=0; i<3; i++) {
            let mat = new BABYLON.StandardMaterial('a',scene);
            this.vMaterials.push(mat);
            mat.diffuseColor.set(...[[0.7,0.7,0.7],[0.1,0.1,0.1],[0.7,0.1,0.7]][i]);
        }
    }
    
    clear() {
        this.vertices.forEach(v=>v.sphere.dispose());
        this.vertices = [];
        this.edges = [];
        this.faces = [];        
    }

    addVertex(valence) {
        let i = this.vertices.length;
        let v = new Vertex(i);
        v.valence = valence;
        this.vertices.push(v);
        v.sphere = BABYLON.MeshBuilder.CreateSphere('a', {diameter:0.1}, scene);
        let matIndex = valence == 6 ? 0 : valence == 5 ? 1 : 2;
        v.sphere.material = this.vMaterials[matIndex];
        v.sphere.physicsImpostor = new BABYLON.PhysicsImpostor(v.sphere, 
            BABYLON.PhysicsImpostor.ParticleImpostor, { 
                mass: i== 0 ? 0.0 : 0.01 
            }, scene);
		
        return v;
    }

    getEdge(a,b) {
        let id = [a,b].map(v=>v.index).sort();
        return this.edges.find(e => e.id[0]==id[0] && e.id[1]==id[1]);
    }
    addEdge(a,b) {
        let e = this.getEdge(a,b);
        if(e) return e;
        e = new Edge(this.edges.length,a,b);
        this.edges.push(e);
        a.count ++;
        b.count ++;
        a.edges.push(e);
        b.edges.push(e);
        var joint = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.SpringJoint, {
            length: 1,
            stiffness: 1,
            damping: 0.1
        });
		a.sphere.physicsImpostor.addJoint(b.sphere.physicsImpostor, joint);
        return e;
    }

    getFace(a,b,c) {
        let id = [a,b,c].map(v=>v.index).sort();
        return this.faces.find(f => f.id[0]==id[0] && f.id[1]==id[1] && f.id[2]==id[2]);
    }
    addFace(a,b,c) {
        let f = this.getFace(a,b,c);
        if(f) return f;
        f = new Face(this.faces.length, a,b,c);
        this.faces.push(f);
        let ab = this.addEdge(a,b);
        let bc = this.addEdge(b,c);
        let ca = this.addEdge(c,a);
        ab.faces.push(f);
        ab.sideVertices.push(c);
        bc.faces.push(f);
        bc.sideVertices.push(a);
        ca.faces.push(f);
        ca.sideVertices.push(b); 
        [ab,bc,ca].forEach(e => {
            if(e.sideVertices.length == 2) {
                let v1 = e.sideVertices[0];
                let v2 = e.sideVertices[1];
                var joint = new BABYLON.PhysicsJoint(BABYLON.PhysicsJoint.SpringJoint, {
                    length: 2.0,
                    stiffness: 1,
                    damping: 0.1
                });
                v1.sphere.physicsImpostor.addJoint(v2.sphere.physicsImpostor, joint);
                
            }
        })       
        return f;
    }


    setType(type) {
        // type : 0=5, 1=6, 2=7, 3=5/6, 4=7/6
        this.type = type;
        this.clear();
        let n = [5,6,7,5,7][type];
        let n2 = [5,6,7,6,6][type];
        let v0 = this.addVertex(n);
        let vv = [];
        for(let i=0; i<n; i++) {
            let v = this.addVertex(n2);
            let phi = Math.PI*2*i/n;
            v.pos.x = Math.cos(phi);
            v.pos.z = Math.sin(phi);
            v.sphere.position.copyFrom(v.pos);
            vv.push(v);
        }
        for(let i=0;i<n;i++) {
            this.addFace(v0,vv[i],vv[(i+1)%n]);
        }
        this.boundary = vv;
    }

    
    addNextFace() {
        if(this.boundary.length<3) return;
        let boundary = this.boundary;
        let vb = boundary[0];
        if(vb.valence == vb.count) {
            this.addFace(vb, boundary[boundary.length-1],boundary[1]);
            boundary.splice(0,1);
        } else {
            let va = boundary[boundary.length-1];

            let valence;
            if(this.type<3) valence = va.valence;
            else if(va.valence == vb.valence) valence = this.type == 4 ? 7 : 5;
            else valence = 6;

            let edge = this.getEdge(va,vb);
            let oldFace = edge.faces[0];
            let vd = oldFace.vertices.find(v => v != va && v != vb);
            let newVertex = this.addVertex(valence);
            let edgeMidPoint = BABYLON.Vector3.Lerp(va.pos,vb.pos,0.5);
            edgeMidPoint.addToRef(edgeMidPoint.subtract(vd.pos), newVertex.pos);
            newVertex.pos.y += (-1+2*Math.random())*0.01;
            this.addFace(va,newVertex,vb);
            this.boundary.push(newVertex);

            newVertex.sphere.position.copyFrom(newVertex.pos);
        }
    }

    computeEdgeEnergy(e) {
        let energy = 0.0;
        let v0 = e.va;
        let v1 = e.vb;
        energy += 100*Math.pow(BABYLON.Vector3.Distance(v0.pos,v1.pos)-1, 2);
        if(e.faces.length == 2) {
            let p0 = v0.pos;
            let p1 = v1.pos;
            let p2 = e.sideVertices[0].pos;
            let p3 = e.sideVertices[1].pos;
            let nrm0 = BABYLON.Vector3.Cross(p3.subtract(p0), p1.subtract(p0)).normalize();
            let nrm1 = BABYLON.Vector3.Cross(p1.subtract(p0), p2.subtract(p0)).normalize();
            energy += 30*Math.pow((1-BABYLON.Vector3.Dot(nrm0,nrm1)),3);            
        }
        return energy;
    }

    computeVertexEnergy(v, pos) {
        let oldPos = v.pos;
        v.pos = pos;
        let energy = 0.0;
        v.edges.forEach(e => {
            energy += this.computeEdgeEnergy(e);
        });
        v.pos = oldPos;
        return energy;
    }
}

