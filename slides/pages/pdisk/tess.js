
class GenericTessellation {
    constructor(n1,n2) {
        this.n1 = n1;
        this.n2 = n2;

        // sin(pi/24)/sqrt(sin(pi5/6)^2-sin(pi/8)^2)
        // compute polygon radius 
        const R = this.R = Math.sin(Math.PI/2 - Math.PI/n1 - Math.PI/n2) / Math.sqrt(
            Math.pow(Math.sin(Math.PI/2 + Math.PI/n2),2)-
            Math.pow(Math.sin(Math.PI/n1),2));
            
        // compute polygon vertices and base matrices ( = rotation of pi/n2 around vertices)
        this.baseMatrices = [];
        this.basePoints = [];
        for(let i=0; i<n1; i++) {
            let phi = -2*Math.PI*i/n1;
            let p = [Math.cos(phi)*R, Math.sin(phi)*R];
            this.basePoints.push(p);
            let tmat = hTranslation1(p[0], p[1]);
            let mats = [];
            for(let j=1; j<this.n2; j++) {
                let mat = m4.multiply(m4.inverse(tmat), 
                    m4.multiply(m4.rotationZ(-2*Math.PI*j/n2), tmat));    
                mats.push(mat);
            }
            this.baseMatrices.push(mats);
        }
        this.cells = [{ mat: m4.identity()}];
        this.boundary = [];

        /*
        */
    }

    addFirstShell() {

        /*
        this.baseMatrices.forEach((mats,i) => {
            mats.forEach(mat => {
                this.cells.push({mat});
            });
        });
        */
        for(let i=0;i<this.n1;i++) {
            for(let j=0;j<this.n2-2; j++) {
                let mat = this.baseMatrices[i][j];
                this.cells.push({mat})
            }
        }

        this.boundary = [];
        let k = 1;
        for(let i=0; i<this.n1; i++) {
            for(let j=0; j<this.n2-2; j++) {
                let cell = this.cells[k++];
                let a = i + (j==0 ? 2 : 1);
                let b = i + this.n1 - 1; // (j==this.n2-3 ? this.n1 - 2: this.n1 - 1);
                for(let g = a; g<b; g++) {
                    let vIndex = g%this.n1;
                    let p = pTransform(cell.mat, this.basePoints[vIndex]);  
                    this.boundary.push({
                        p, 
                        cell, 
                        j:vIndex, 
                        type: g == a ? 1 : 2
                    })
                }
            }
        }

    }

    addShell() {
        let oldBoundary = this.boundary;
        let m = oldBoundary.length;
        this.boundary = [];
        
        
        for(let i = 0; i<m; i++) {
            let b = oldBoundary[i];
            let j0 = b.type == 1 ? 2 : 1;
            let j1 = this.n2 - 1;
            // if(b.type == 2) j1++;
            for(let j = j0; j < j1; j++) {
                let matB = m4.multiply(b.cell.mat, this.baseMatrices[b.j][j]);
                let newCell = { mat:matB };
                this.cells.push(newCell);

                // let t0 = oldBoundary[(i+m-1)%m].type == 1 ? 3 : 2;
                let t0 = 1;

                // if(j==0 && b.type==2) t0++;
                let t1 = this.n1 - 1;
                if(j==j1-1) t1--;
                for(let t = t0; t < t1; t++) {
                    let k = (t+b.j)%this.n1;
                    let p = pTransform(matB, this.basePoints[k]);
                    this.boundary.push({p, cell:newCell, j:k, type: t==t0 ? 1 : 2})
                }
    
            }


        }

    }


    adjustMatrix(hMatrix) {
        //let startTime = performance.now();
        let bestMatrix = null;
        let closestDistance;
        for(let i=0; i<this.n1; i++) {
            for(let j=0;j<this.n2-1; j++) {
                let matrix = m4.multiply(hMatrix, this.baseMatrices[i][j]);
                let p = pTransform(matrix, [0,0]);
                let d = getLength(p);
                if(bestMatrix == null || d < closestDistance) {
                    closestDistance = d;
                    bestMatrix = matrix;
                } 
            }
        }
        //let dt = performance.now() - startTime;
        return normalizeHMatrix(bestMatrix);
    }

}



class Colored83Tessellation {
    constructor() {
        let n1 = this.n1 = 8;
        let n2 = this.n2 = 3;

        // sin(pi/24)/sqrt(sin(pi5/6)^2-sin(pi/8)^2)
        // compute polygon radius 
        const R = this.R = Math.sin(Math.PI/2 - Math.PI/n1 - Math.PI/n2) / Math.sqrt(
            Math.pow(Math.sin(Math.PI/2 + Math.PI/n2),2)-
            Math.pow(Math.sin(Math.PI/n1),2));
            
        // compute polygon vertices and base matrices ( = rotation of pi/n2 around vertices)
        this.baseMatrices = [];
        this.basePoints = [];
        for(let i=0; i<n1; i++) {
            let phi = -2*Math.PI*i/n1;
            let p = [Math.cos(phi)*R, Math.sin(phi)*R];
            this.basePoints.push(p);
            let tmat = hTranslation1(p[0], p[1]);
            let mats = [];
            for(let j=1; j<this.n2; j++) {
                let mat = m4.multiply(m4.inverse(tmat), 
                    m4.multiply(m4.rotationZ(-2*Math.PI*j/n2), tmat));    
                mats.push(mat);
            }
            this.baseMatrices.push(mats);
        }
        let perm = this.colorPermutations = [           
            [1,2,0,3], // ok
            [0,2,3,1], // ok
            [3,0,2,1], // ok
            [3,1,0,2], // ok                
        ];

        this.cells = [{ mat: m4.identity(),  colors: [0,1,2,3]} ];
        this.boundary = [];

        /*
        */
    }

    addFirstShell() {   
        const perm = this.colorPermutations;  
        for(let i=0;i<this.n1;i++) {
            let mat = this.baseMatrices[i][0];
            this.cells.push({mat, colors: perm[i%4]});
        }

        this.boundary = [];
        let k = 1;
        for(let i=0; i<this.n1; i++) {
            for(let j=0; j<this.n2-2; j++) {
                let cell = this.cells[k++];
                let a = i + (j==0 ? 2 : 1);
                let b = i + this.n1 - 1; // (j==this.n2-3 ? this.n1 - 2: this.n1 - 1);
                for(let g = a; g<b; g++) {
                    let vIndex = g%this.n1;
                    let p = pTransform(cell.mat, this.basePoints[vIndex]);  
                    this.boundary.push({
                        p, 
                        cell, 
                        j:vIndex, 
                        type: g == a ? 1 : 2
                    })
                }
            }
        }

    }

    addShell() {
        let oldBoundary = this.boundary;
        let m = oldBoundary.length;
        this.boundary = [];
        
        
        for(let i = 0; i<m; i++) {
            let b = oldBoundary[i];
            let j0 = b.type == 1 ? 2 : 1;
            let j1 = this.n2 - 1;
            // if(b.type == 2) j1++;
            for(let j = j0; j < j1; j++) {
                let matB = m4.multiply(b.cell.mat, this.baseMatrices[b.j][j]);

                let permj = this.colorPermutations[b.j%4];
                let newCell = { mat:matB, colors: permj.map(t=>b.cell.colors[t])};

                this.cells.push(newCell);

                // let t0 = oldBoundary[(i+m-1)%m].type == 1 ? 3 : 2;
                let t0 = 1;

                // if(j==0 && b.type==2) t0++;
                let t1 = this.n1 - 1;
                if(j==j1-1) t1--;
                for(let t = t0; t < t1; t++) {
                    let k = (t+b.j)%this.n1;
                    let p = pTransform(matB, this.basePoints[k]);
                    this.boundary.push({p, cell:newCell, j:k, type: t==t0 ? 1 : 2})
                }
    
            }


        }

    }


    adjustMatrix(hMatrix) {
        //let startTime = performance.now();
        let bestMatrix = null;
        let closestDistance;
        for(let i=0; i<this.n1; i++) {
            for(let j=0;j<this.n2-1; j++) {
                let matrix = m4.multiply(hMatrix, this.baseMatrices[i][j]);
                let p = pTransform(matrix, [0,0]);
                let d = getLength(p);
                if(bestMatrix == null || d < closestDistance) {
                    closestDistance = d;
                    bestMatrix = matrix;
                } 
            }
        }
        //let dt = performance.now() - startTime;
        return normalizeHMatrix(bestMatrix);
    }

}



class Tessellation {
    constructor() {
        let R = this.R = 0.40561640080151573;
        this.baseMatrices = [];
        this.basePoints = [];
        for(let i=0; i<8; i++) {
            let phi = -2*Math.PI*(i)/8;
            let p = [Math.cos(phi)*R, Math.sin(phi)*R];
            this.basePoints.push(p);
            let tmat = hTranslation1(p[0], p[1]);
            let mat = m4.multiply(m4.inverse(tmat), 
                    m4.multiply(m4.rotationZ(-2*Math.PI/3), tmat));    
            this.baseMatrices.push(mat);
        }
        let perm = this.colorPermutations = [           
            [1,2,0,3], // ok
            [0,2,3,1], // ok
            [3,0,2,1], // ok
            [3,1,0,2], // ok                
        ];
        this.cells = [{ mat: m4.identity(), colors: [0,1,2,3]}];
        
        this.boundary = [];
        
        
        
    }

    addFirstShell() {
        let perm = this.colorPermutations;
        this.baseMatrices.forEach((mat,i) => {
            this.cells.push({mat, colors: perm[i%4]});
        });
        for(let i=0; i<8; i++) {
            let cell = this.cells[i+1]; 
            for(let j=2; j<7; j++) {
                let k = (i+j)%8;
                let p = pTransform(cell.mat, this.basePoints[k]);                
                this.boundary.push({
                    p, 
                    cell, 
                    j:k, 
                    type: j==2 ? 1 : 2
                })
            }            
        }
    }

    addShell() {
        let oldBoundary = this.boundary;
        let m = oldBoundary.length;
        this.boundary = [];
        let perm = this.colorPermutations;

        for(let i = 0; i<m; i++) {
            let b = oldBoundary[i];
            if(b.type == 1) continue;
            let matB = m4.multiply(b.cell.mat, this.baseMatrices[b.j]);
            let permj = perm[b.j%4];
            let newCell = { mat:matB, colors: permj.map(t=>b.cell.colors[t])};
            this.cells.push(newCell);
            let t0 = oldBoundary[(i+m-1)%m].type == 1 ? 3 : 2;
            for(let t = t0; t < 7; t++) {
                let k = (t+b.j)%8;
                let p = pTransform(matB, this.basePoints[k]);
                this.boundary.push({p, cell:newCell, j:k, type: t==t0 ? 1 : 2})
            }
        }

    }

    adjustMatrix(hMatrix) {
        //let startTime = performance.now();
        let bestMatrix = null;
        let closestDistance;
        for(let i=0; i<8; i++) {
            let matrix = m4.multiply(hMatrix, this.baseMatrices[i]);
            let p = pTransform(matrix, [0,0]);
            let d = getLength(p);
            if(bestMatrix == null || d < closestDistance) {
                closestDistance = d;
                bestMatrix = matrix;
            } 
        }
        //let dt = performance.now() - startTime;
        return normalizeHMatrix(bestMatrix);
    }
}

