



class DiskViewer {
    constructor(options) {
        options = options || {};
        let canvasId = options.canvasId || "c";
        let canvas = this.canvas = document.getElementById(canvasId);
        if(!canvas) throw "Canvas not found:" + canvasId;
        let gl = this.gl = canvas.getContext("webgl");
        const viewer = this;

        let scenes = this.scenes = options.scenes || [];
        scenes.forEach(scene => {
            scene.viewer = viewer;
            scene.gl = gl;
        });
        
        let bgColor = options.bgColor || [0.7,0.75,0.8,1];
        gl.clearColor(...bgColor);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.createEntities();
        
        this.draggableDots = [];
        this.currentDot = null;

        this.currentSceneIndex = null;
        this.currentScene = null;
        if(this.scenes.length > 0) {
            this.currentSceneIndex = 0;
            this.setCurrentScene(this.scenes[0]);
        }

        this.handlePointerEvents(canvas);  
        this.handleKeyboardEvents();  

        this.running = true;

        // animate function
        const animate = function(time) {
            if(!viewer.running) return;
            // let t0 = performance.now();
            twgl.resizeCanvasToDisplaySize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;    
            twgl.m4.ortho(-aspect, aspect, 1, -1, -1, 1, viewMatrix);
            viewer.entities.circle.material.setColor([0,0,0,1]);
            viewer.entities.circle.draw();
            if(viewer.currentScene && viewer.currentScene.render)
                viewer.currentScene.render();
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);      
    }

    stop() {
        this.running = false;
    }


    setCurrentScene(scene) {
        if(this.currentScene) {
            if(this.currentScene.stop) this.currentScene.stop();
        }
        this.currentScene = scene;
        if(this.currentScene) {
            if(this.currentScene.init && !this.currentScene.initDone) {
                this.currentScene.init();
            }
            if(this.currentScene.start) this.currentScene.start();
        }
    }

    createDraggableDot(x,y) {
        let dot = new DraggableDot(this, x,y);
        this.draggableDots.push(dot);
        return dot;
    }

    getDotNearby(p) {
        let found = null;
        let minDist = 0;
        this.draggableDots.forEach(dot => {
            let dist = getDistance(p, dot.pos);
            if(!found || dist < minDist) {
                found = dot;
                minDist = dist;
            }
        })
        if(found && minDist < 0.5) return found;
        else return null;
    }

    createEntities() {
        let gl = this.gl;
        let entities = this.entities = {};
        entities.circle = new Circle(gl, 1.02, 0.02, 100);
        entities.disk = new Disk(gl, 1.0, 100);
        let dotRadius = 0.02;        
        entities.dot = new Disk(gl, dotRadius, 30);
        entities.dotBorder = new Circle(gl, dotRadius, 0.005, 30);
    }

    pointerPosToWordPos(e) {
        let r = this.canvas.getBoundingClientRect();
        let x = 2*(e.clientX - r.x)/r.width-1;
        let y = 2*(e.clientY - r.y)/r.height-1;
        let p = twgl.m4.transformPoint(twgl.m4.inverse(viewMatrix), [x,y,0]);
        return [p[0],-p[1]]
    }

    _onPointerDown(e) {
        let p = this.pointerPosToWordPos(e);
        this.oldp = p;
        this.canvas.setPointerCapture(e.pointerId);
        this.buttonDown = true;
        let dot = this.getDotNearby(p);
        if(dot) {
            this.currentDot = dot;
        } else if(this.onPointerDown) this.onPointerDown({x:p[0], y:p[1], e});
    }
    _onPointerUp(e) {
        this.buttonDown = false;
        if(this.currentDot) {
            this.currentDot = null;
        } else if(this.onPointerDown) 
            this.onPointerUp(e);
    }

    _onPointerMove(e) {
        let p = this.pointerPosToWordPos(e);
        if(this.buttonDown) {
            // drag
            if(this.currentDot) this.currentDot.pos = p;
            else {
                let dx = p[0] - this.oldp[0];
                let dy = p[1] - this.oldp[1];
                this.oldp[0] = p[0];
                this.oldp[1] = p[1];    
                if(this.currentScene && this.currentScene.onPointerDrag) 
                    this.currentScene.onPointerDrag({x:p[0], y:p[1], dx, dy, e});    
            }
        } else {
            // move
            if(this.onPointerMove) this.onPointerMove({x:p[0], y:p[1], e});
        }
    }
    
    _onKeyDown(e) {
        console.log(e);
        if(e.code == "ArrowLeft") {
            if(this.currentSceneIndex>0) {
                this.currentSceneIndex--;
                this.setCurrentScene(this.scenes[this.currentSceneIndex]);
            }
        } else if(e.code == "ArrowRight") {
            if(this.currentSceneIndex+1<this.scenes.length) {
                this.currentSceneIndex++;
                this.setCurrentScene(this.scenes[this.currentSceneIndex]);
            }

        }
        else if(this.currentScene && this.currentScene.onKeyDown) this.currentScene.onKeyDown(e);
    }


    handlePointerEvents(canvas) {   
        const me = this;
        this.buttonDown = false;
        canvas.onpointerdown = e => me._onPointerDown(e);
        canvas.onpointerup   = e => me._onPointerUp(e);
        canvas.onpointermove = e => me._onPointerMove(e);
    }

    handleKeyboardEvents() {
        const me = this;
        document.addEventListener('keydown', e => me._onKeyDown(e));
    }
       
}


class DraggableDot {
    constructor(viewer, x, y) {
        this.viewer = viewer;
        this.x = x;
        this.y = y;
        this.fillColor = [1,0,1,1];
        this.strokeColor = [0,0,0,1];        
    } 

    get pos() {
        return [this.x, this.y];
    }
    set pos(p) {
        this.x = p[0];
        this.y = p[1];        
    }

    draw() {
        let dot = this.viewer.entities.dot;
        let dotBorder = this.viewer.entities.dotBorder;
        let material = dot.material;

        let mat = twgl.m4.translation([this.x, this.y,0.0]);
        twgl.v3.copy(this.fillColor, material.uniforms.color);
        let oldMat = material.uniforms.modelMatrix;
        material.uniforms.modelMatrix = mat;   
        dot.draw();
        twgl.v3.copy(this.strokeColor, material.uniforms.color);
        dotBorder.draw();
        material.uniforms.modelMatrix = oldMat;
    }

}

