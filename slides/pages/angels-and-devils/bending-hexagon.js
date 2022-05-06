

class BendingHexagon {
    constructor(n = 5) {
        const V3 = (x,y,z) => new BABYLON.Vector3(x,y,z);
        this.parameter = 0;
        this.vertices = [];
        this.n = n;
        let sides = this.sides = [];
        this.uvs = [];
        let center = {side:null, r:0,j:0, links : [], p : V3(0,0,0)};
        this.vertices.push(center);
        this.uvs.push(0.5,0.5);
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
        let qs = [];
        for(let sideIndex = 0; sideIndex<6; sideIndex++) {
            let phi = Math.PI*2*sideIndex/6;
            let qr = 0.297;
            qs.push(new BABYLON.Vector2(
                Math.cos(phi)*qr, 
                Math.sin(phi)*qr));
        }
        sides.forEach((side, sideIndex) => {
            let dt = dts[sideIndex];
            let p0 = dt.c.add(dt.a);
            let p1 = dt.c.add(dt.b);
            let e0 = p1.subtract(p0).scale(1.0/(n-1));
            let e1 = p0.scale(1.0/(n-1));
            let q0 = qs[sideIndex];
            let q1 = qs[(sideIndex+1)%6];
            
            let g0 = q1.subtract(q0).scale(1.0/(n-1));
            let g1 = q0.scale(1.0/(n-1));
            
            for(let r=1; r<n; r++) {
                for(let j=0; j<r; j++) {
                    let vertex = side[r-1][j];
                    vertex.p = e1.scale(r).add(e0.scale(j));
                    let q = g1.scale(r).add(g0.scale(j));
                    let psi = Math.atan2(q.y,q.x);
                    let factor = Math.abs(Math.sin(psi*3));
                    q = q.scale(1-factor*0.08);
                    this.uvs.push(0.5+q.x,0.5+q.y);
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

    computePoints2(tess, cellIndex) {
        const n = this.n;
        let R = tess.R;
        let hMatrix = tess.cells[cellIndex].mat;
        let pts = [];
        for(let i=0;i<6;i++) {
            let phi = Math.PI*2*i/6;
            pts.push(p2k([R*Math.cos(phi), R*Math.sin(phi)]));
        }
        
        this.sides.forEach((side, sideIndex) => {
            let p0 = pts[sideIndex];
            let p1 = pts[(sideIndex+1)%6];
            let du = [(p1[0]-p0[0])/(n-1), (p1[1]-p0[1])/(n-1)];
            let dv = [p0[0]/(n-1),p0[1]/(n-1)];
            for(let i=0; i<n-1; i++) {
                for(let j=0; j<=i; j++) {
                    let q = k2p([dv[0]*(i+1)+du[0]*j,dv[1]*(i+1)+du[1]*j])
                    let pxz = pTransform(hMatrix, q);
                    let p = side[i][j].p;
                    p.x = pxz[0]*3;
                    p.y = 0;
                    p.z = pxz[1]*3;   
                                   
                }
            }

        });
        let pxz = pTransform(hMatrix, [0,0]);
        let p = this.vertices[0].p;
        p.x = pxz[0]*3;
        p.y = 0;
        p.z = pxz[1]*3;
        this.vertices.forEach(v => v.p0 = v.p.clone());
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
        vd.uvs = this.uvs;
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
