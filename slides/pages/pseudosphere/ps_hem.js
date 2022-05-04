

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
        let nu = this.nu = 20;
        let nv = this.nv = 3000;
        let du = 0.29;
        let curvature = 0.3;
                
        let deltah = this.deltah = 0.0;
        this.nu = nu;
        this.nv = nv;
        let vd = new BABYLON.VertexData();
        vd.positions = [];
        vd.normals = [];
        vd.indices = [];
        vd.uvs = [];

        let pts = [];
        let up = new BABYLON.Vector3(0,1,0);
        for(let j=0; j+1<nv; j++) {
            let v = j/(nv-1);
            let phi = -v*2*Math.PI;
            let e0 = new BABYLON.Vector3(Math.cos(phi),0,Math.sin(phi));
            let p = e0.scale(globalScale);
            pts.push({ p, e0 });
            vd.positions.push(p.x,p.y,p.z);
            vd.uvs.push(v,0.0);    
        }
        let k0 = 0;
        let k1 = pts.length;
        for(let i=1; ;i++) {

            // make right
            let m = pts.length;
            for(let j=0; j<m; j++) {
                let j1 = j==0 ? m-2 : j-1;
                let j2 = j==m-1 ? 1 : j+1;
                let rt = pts[j2].p.subtract(pts[j1].p);
                pts[j].rt = rt;
                let nrm = pts[j].e1 = BABYLON.Vector3.Cross(pts[j].e0, rt).normalize();
                vd.normals.push(nrm.x,nrm.y,nrm.z);
            }
            if(i>=nu) break;
            let u = i/(nu-1);

            // create new points
            let dup = false;
            let pts2 = [];  
            let m2 = dup ? m * 2 - 1: m;          
            for(let j=0;j<m2;j++) {
                let v = j/(m2-1);
                let e0, e1, oldp, rt;
                if(dup) {
                    let j1 = Math.floor(j/2);
                    if(j%2==0) {
                        e0 = pts[j1].e0;
                        e1 = pts[j1].e1;
                        oldp = pts[j1].p;
                        rt = pts[j1].rt;
                    } else {
                        let j2 = (j1 + 1) % m;
                        e0 = BABYLON.Vector3.Lerp(pts[j1].e0,pts[j2].e0,0.5).normalize();
                        e1 = BABYLON.Vector3.Lerp(pts[j1].e1,pts[j2].e1,0.5).normalize();
                        oldp = BABYLON.Vector3.Lerp(pts[j1].p,pts[j2].p,0.5);
                        rt = BABYLON.Vector3.Lerp(pts[j1].rt,pts[j2].rt,0.5);
                    }
                }
                else {
                    e0 = pts[j].e0;
                    e1 = pts[j].e1;
                    oldp = pts[j].p;
                    rt = pts[j].rt;                    
                }
                let psi = 
                    (Math.cos(2*Math.PI*v*3) *Math.exp(-Math.pow((u-0.05)*1.5,2)) * 0.4 + 
                     Math.cos(2*Math.PI*v*9) *Math.exp(-Math.pow((u-0.5)*6,2)) * 0.7 +
                     Math.cos(2*Math.PI*v*81) *Math.exp(-Math.pow((u-0.9)*9,2)) * 1.8
                     ) * curvature;
                let p = oldp.add(e0.scale(du*Math.cos(psi))).add(e1.scale(du*Math.sin(psi)));
                p.subtractToRef(oldp, e0).normalize();
                pts2.push({p, e0});
                vd.positions.push(p.x,p.y,p.z);
                vd.uvs.push(v,u);
            }
            if(dup) {
                for(let j=0; j+1<m; j++) {
                    let j1 = (j+1)%m;
                    let jb1 = 2*j, jb2 = (jb1+1)%m2, jb3 = (jb1+2)%m2;
                    vd.indices.push(
                        k0+j, k1+jb2, k1+jb1, 
                        k0+j, k0+j1, k1+jb2,
                        k1+jb2, k0+j1, k1+jb3);
                }    
            } else {
                for(let j=0; j+1<m; j++) {
                    let j1 = (j+1)%m;
                    vd.indices.push(k0+j, k0+j1, k1+j1, k0+j, k1+j1, k1+j);
                }    
            }
            k0 = k1;
            k1 += m2;
            pts = pts2;
        }

         
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
