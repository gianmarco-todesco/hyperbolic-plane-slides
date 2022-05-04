

function arc(p0, e0, e1, curvature, t) {
    if(curvature == 0.0) return p0.add(e0.scale(t));
    let cy = 1.0/curvature;
    let radius = Math.abs(cy);
    let theta = t/radius;
    return p0.add(e1.scale(cy))
        .add(e0.scale(radius*Math.sin(theta)))
        .add(e1.scale(-cy*Math.cos(theta)));
}

class PsHem {
    constructor(scene) {
        let nu = this.nu = 250;
        let nv = this.nv = 50;
        let deltah = this.deltah = 0.0;
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
                let phi = u*2*Math.PI;
                

                let e0 = new BABYLON.Vector3(Math.cos(phi),0,Math.sin(phi));
                let e1 = new BABYLON.Vector3(0,1,0);
                let p0 = e0.scale(globalScale);
                let p = arc(p0, e0, e1, Math.sin(phi*5), v*3);
                vd.positions.push(p.x,p.y,p.z);
                vd.normals.push(0,0,0);
                vd.uvs.push(u,v);
            }
        }
        for(let i=0;i+1<nu;i++) {
            for(let j=0;j+1<nv;j++) {
                let k = i*nv+j;
                vd.indices.push(k,k+1,k+1+nv, k,k+1+nv,k+nv);
            }
        }
        BABYLON.VertexData.ComputeNormals(vd.positions, vd.indices, vd.normals);
        
        let mesh = this.mesh = new BABYLON.Mesh('surface', scene);


        vd.applyToMesh(mesh, true);
    }

    /*

    update() {
        let positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        const nu = this.nu;
        const nv = this.nv;
        const deltah = this.deltah;
        const f = (u,v) => psHornFn(u,v,deltah);
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
    */
}
