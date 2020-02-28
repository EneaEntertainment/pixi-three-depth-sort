import * as THREE from 'three';
import * as PIXI from 'pixi.js';

let tick = 0;

/**
 *
 * Boot
 *
 * @export
 * @class Boot
 */
export default class Boot
{
    /**
     * Creates an instance of Boot.
     */
    constructor()
    {
        // init renderers
        this.initThreeRenderer();
        this.initPixiRenderer();

        // create scenes
        this.createThreeScene();
        this.createPixiScene();

        // render loop
        this.renderLoop = this.renderLoop.bind(this);

        this.renderLoop();

        // resize
        const windowResizeHandler = () =>
        {
            const { innerWidth, innerHeight } = window;

            // three
            this.threeRenderer.setSize(innerWidth, innerHeight);

            this.threeCamera.aspect = innerWidth / innerHeight;
            this.threeCamera.updateProjectionMatrix();

            // pixi
            this.pixiRenderer.resize(innerWidth, innerHeight);

            // reposition element(s)
            this.onResize(innerWidth, innerHeight);
        };

        windowResizeHandler();

        window.addEventListener('resize', windowResizeHandler);
    }

    /**
     *
     * initThreeRenderer
     *
     */
    initThreeRenderer()
    {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', { alpha: false });

        // renderer
        this.threeRenderer = new THREE.WebGLRenderer({
            canvas    : canvas,
            context   : context,
            stencil   : true,
            antialias : true,
            alpha     : true
        });

        // scene
        this.threeScene = new THREE.Scene();

        // camera
        this.threeCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 16);

        this.threeCamera.position.set(0, 4, 10);
        this.threeCamera.lookAt(0, 0, 0);

        // append renderer
        document.getElementById('canvas-holder').appendChild(this.threeRenderer.domElement);
    }

    /**
     *
     * initPixiRenderer
     *
     */
    initPixiRenderer()
    {
        const options =
        {
            view              : this.threeRenderer.domElement,
            clearBeforeRender : false
        };

        this.pixiRenderer = new PIXI.Renderer(options);

        this.pixiScene = new PIXI.Container();
    }

    /**
     *
     * createThreeScene
     *
     */
    createThreeScene()
    {
        this.threeScene.add(new THREE.AmbientLight(0x404040));

        const light = new THREE.PointLight(0xFFFFFF, 1, 100);

        light.position.set(7, 7, 5);

        this.threeScene.add(light);

        const geometry = new THREE.BoxGeometry(5, 5, 5);

        const material = new THREE.MeshPhongMaterial({
            color      : 0x4040c0,
            shininess  : 0.25,
            specular   : 0x808080,
            depthWrite : true
        });

        this.threeCube = new THREE.Mesh(geometry, material);

        this.threeScene.add(this.threeCube);
    }

    /**
     *
     * createPixiScene
     *
     */
    createPixiScene()
    {
        // mesh with zDepth
        const geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition',
                [
                    -400, -200,
                    400, -200,
                    0.0, 400.0
                ], 2)

            .addAttribute('aColor',
                [
                    1, 0, 0,
                    0, 1, 0,
                    0, 0, 1
                ], 3);

        const vertex = `
            precision mediump float;
            attribute vec2 aVertexPosition;
            attribute vec3 aColor;
        
            uniform mat3 translationMatrix;
            uniform mat3 projectionMatrix;
            uniform float zDepth;
        
            varying vec3 vColor;
        
            void main()
            {
                vColor = aColor;
                gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, zDepth, 1.0);
            }`;

        const fragment = `
            precision mediump float;

            varying vec3 vColor;

            void main()
            {
                gl_FragColor = vec4(vColor, 1.0);
            }`;

        const program = new PIXI.Program(vertex, fragment);
        const shader = new PIXI.Shader(program);

        this.pixiTriangleMesh = new PIXI.Mesh(geometry, shader);

        this.pixiTriangleMesh.state.depthTest = true;

        // zDepth should be value calculated from projection
        this.pixiTriangleMesh.shader.uniformGroup.uniforms.zDepth = 0.992;

        this.pixiScene.addChild(this.pixiTriangleMesh);

        // logo
        this.pixiSprite = new PIXI.Sprite.from('images/logos.png');

        this.pixiSprite.anchor.set(0.5);
        this.pixiSprite.blendMode = PIXI.BLEND_MODES.SCREEN;

        this.pixiScene.addChild(this.pixiSprite);
    }

    /**
     *
     * onResize
     *
     * @param {number} width
     * @param {number} height
     */
    onResize(width, height)
    {
        this.pixiTriangleMesh.x = width >> 1;
        this.pixiTriangleMesh.y = height >> 1;

        this.pixiSprite.x = width >> 1;
        this.pixiSprite.y = height >> 1;
    }

    /**
     *
     * renderLoop
     *
     */
    renderLoop()
    {
        requestAnimationFrame(this.renderLoop);

        tick++;

        const d = 0.01;

        this.threeCube.rotation.x -= d;
        this.threeCube.rotation.y -= d;
        this.threeCube.rotation.z -= d;

        this.pixiSprite.scale.set((0.1 * Math.sin(d * tick)) + 1.25);
        this.pixiTriangleMesh.scale = this.pixiSprite.scale;

        /**
         * https://github.com/pixijs/pixi.js/issues/5411#issuecomment-460868533
         *
         * @ivanpopelyshev thanks!
         */
        this.threeRenderer.state.reset();
        this.pixiRenderer.reset();

        this.threeRenderer.render(this.threeScene, this.threeCamera);

        this.threeRenderer.state.reset();
        this.pixiRenderer.reset();

        this.pixiRenderer.render(this.pixiScene);
    }
}
