'use strict';

let canvas, engine, scene, camera;


window.addEventListener('DOMContentLoaded', () => {
    // il tag canvas che visualizza l'animazione
    canvas = document.getElementById('c');
    // la rotella del mouse serve per fare zoom e non per scrollare la pagina
    canvas.addEventListener('wheel', evt => evt.preventDefault());
    
    // engine & scene
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    
    // camera
    camera = new BABYLON.ArcRotateCamera('cam', 
            0.69,0.88,
            8.5, 
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
    window.addEventListener("resize", () => engine.resize());
});


class BendingHexagon {
    constructor() {
        const V3 = (x,y,z) => new BABYLON.Vector3(x,y,z);
        this.parameter = 0;
        this.vertices = [];
        let n = this.n = 10;
        let sides = this.sides = [];
        let center = {side:null, r:0,j:0, links : [], p : V3(0,0,0)};
        this.vertices.push(center);
        for(let side=0;side<6; side++) {
            let rows = [];
            for(let r=1; r<n; r++) {
                let row = [];
                for(let j=0; j<r; j++) {
                    let v = {side:side, r,j,links : []};
                    this.vertices.push(v);
                    row.push(v);
                }
                rows.push(row);
            }
            sides.push(rows);
        }
        let faces = this.faces = [];
        let links = this.links = [];
        function link(va,vb) {
            va.links.push(vb); 
            vb.links.push(va);
            links.push([va,vb]);
        }

        sides.forEach((side, sideIndex) => {
            let nextSide = sides[(sideIndex+1)%6];
            for(let r=1; r<n; r++) {
                let row = side[r-1];
                for(let j=0; j<r; j++) {
                    let v = row[j];
                    if(j+1<row.length) {
                        link(v, row[j+1]);
                    }
                    if(r<side.length) {
                        link(v, side[r][j]);
                        link(v, side[r][j+1]);
                    }                    
                }
                link(row[r-1], nextSide[r-1][0]);
                if(r>1) link(row[r-1], nextSide[r-2][0]);
                else link(row[r-1], center);

            }
        });

        let dts = this.dts = [
            { c: V3(-1, 1,-1),  a: V3( 1, 0, 0), b: V3( 0, 0, 1), up: V3( 0, 1, 0) },
            { c: V3(-1, 1, 1),  a: V3( 0, 0,-1), b: V3( 0,-1, 0), up: V3(-1, 0, 0) },
            { c: V3(-1,-1, 1),  a: V3( 0, 1, 0), b: V3( 1, 0, 0), up: V3( 0, 0, 1) },
            { c: V3( 1,-1, 1),  a: V3(-1, 0, 0), b: V3( 0, 0,-1), up: V3( 0,-1, 0) },
            { c: V3( 1,-1,-1),  a: V3( 0, 0, 1), b: V3( 0, 1, 0), up: V3( 1, 0, 0) },
            { c: V3( 1, 1,-1),  a: V3( 0,-1, 0), b: V3(-1, 0, 0), up: V3( 0, 0,-1) },
        ];
        sides.forEach((side, sideIndex) => {
            let dt = dts[sideIndex];
            let p0 = dt.c.add(dt.a);
            let p1 = dt.c.add(dt.b);
            let u = p1.subtract(p0).scale(1.0/(n-1));
            let v = p0.scale(1.0/(n-1));
            
            for(let r=1; r<n; r++) {
                for(let j=0; j<r; j++) {
                    let vertex = side[r-1][j];
                    vertex.p = v.scale(r).add(u.scale(j));
                }
            }
        });

        this.computePoints();

        
    } 

    computePoints() {
        const n = this.n;
        this.sides.forEach((side, sideIndex) => {
            let dt = this.dts[sideIndex];
            for(let i=0; i<n-1; i++) {
                let t = i/(n-1); 
                let phi = t*Math.PI/2;
                let pa = dt.c.add(dt.a.scale(Math.cos(phi))).add(dt.b.scale(Math.sin(phi)));
                let pb = BABYLON.Vector3.Lerp(dt.c.add(dt.a),dt.c.add(dt.b),t);
                let vertex = side[n-2][i];
                BABYLON.Vector3.LerpToRef(pa,pb,this.parameter,vertex.p);
            }
        });

        let startTime = performance.now();
        for(let i=0; i<50; i++)
            this.relax();
        // console.log("t=", performance.now() - startTime)

    }

    relax() {
        let vertices = this.vertices;
        vertices.forEach(v => v.oldp = v.p.clone());
        this.links.forEach(([va,vb]) => {
            let d = vb.oldp.subtract(va.oldp).scale(0.2);
            if(va.links.length == 6) va.p.addInPlace(d);
            if(vb.links.length == 6) vb.p.subtractInPlace(d);            
        });
    }
    
    createLines() {
        let lines = [];
        this.links.forEach(([va,vb]) => {
            lines.push([va.p,vb.p]);
        })
        let lines3 = BABYLON.MeshBuilder.CreateLineSystem(
            "lines", { lines },
            scene);
        lines3.color.set(0.4,0.4,1);
        return lines3;
    }

    createMesh() {
        let mesh = new BABYLON.Mesh('a',scene);
        let positions = this.vertices.flatMap(v=>[v.p.x,v.p.y,v.p.z]);
        let nrm = (new BABYLON.Vector3(1,1,1)).normalize();
        let normals = this.normals = this.vertices.flatMap(v => [nrm.x,nrm.y,nrm.z]);
        let indices = this.indices = [];
        let n = this.n;
        let q = n*(n-1)/2;
        for(let i=0; i<6;i++) {
            let k0 = 1+q*i;
            let k1 = 1+q*((i+1)%6);
            indices.push(0,k1,k0);
            for(let i=1; i<n-2; i++) {
                for(let j=0; j<i; j++) {
                    let k = k0 + i*(i+1)/2 + j;
                    indices.push(k,k+1,k+1+i+1);    
                }
            }
            
            for(let i=0; i<n-2; i++) {
                for(let j=0; j<=i; j++) {
                    let k = k0 + i*(i+1)/2 + j;
                    indices.push(k,k+i+2,k+i+1);    
                }
            }

            for(let i=0; i<n-2; i++) {
                indices.push(k0 + (i+2)*(i+3)/2 - 1, k0 + (i+1)*(i+2)/2 - 1, k1+i*(i+1)/2);
                indices.push(k0 + (i+2)*(i+3)/2 - 1, k1+i*(i+1)/2, k1+(i+1)*(i+2)/2);
            }
            
            indices.push(k0,k0+2,k0+1)

        }
        var vd = new BABYLON.VertexData();
        vd.positions = positions;
        vd.indices = indices;
        vd.normals = normals;
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        vd.applyToMesh(mesh, true);
        this.mesh = mesh;
        return mesh;
    }

    updateMesh() {        
        let positions = this.vertices.flatMap(v=>[v.p.x,v.p.y,v.p.z]);
        BABYLON.VertexData.ComputeNormals(positions, this.indices, this.normals);
                
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, this.normals);

    }


}

let hex;

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
    

    let b = hex.mesh.createInstance('a');
    b.position.set(0,0,-2);
    b.rotation.y = Math.PI/2;
    b = hex.mesh.createInstance('a');
    b.position.set(-2,0,-2);
    b.rotation.y = Math.PI;
    b = hex.mesh.createInstance('a');
    b.position.set(-2,0,0);
    b.rotation.y = -Math.PI/2;
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
    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001 * 3;
        hex.parameter = 0.5 + 0.5 * Math.sin(t);
        hex.computePoints();
        hex.updateMesh();
    });
}