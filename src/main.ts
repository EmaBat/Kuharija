import { RenderState } from "./RenderState.ts";
import { updateBuffers } from "./systems/BufferUpdateSystem.ts";
import { prepareRendering } from "./systems/PrepareRenderSystem.ts";
import { render } from "./systems/RenderSystem.ts";
import { computeTransforms } from "./systems/TransformSystem.ts";
import { animate as animateScene, playAnimation } from "./systems/AnimationSystem.ts";
import { createBuffers } from "./systems/BufferInitSystem.ts";
import { GLTFParser } from "./parsers/GLTFParser.ts";
import { Camera } from "./components/Camera.ts";
import { computeSkins } from "./systems/SkinningSystem.ts";
import { KeyframeAnimations } from "./components/KeyframeAnimation.ts";
import { Transform, TransformType } from "./components/Transform.ts";
//test za omaro
import { Entity } from "./Entity.ts";
import { Mesh } from "./components/Mesh.ts";
import { BasicMaterial } from "./data/Material.ts";
import { createTempTexture } from "./Utils.ts";

//dodano za premikanje
import { Input } from "./Input.ts";
import { PlayerController } from "./components/PlayerController.ts";
import { movePlayer } from "./systems/PlayerMovementSystem.ts";

//dodano za kamero da sledi čarovcnici in lahko kroži okoli nje
import {
    followPlayer,
    OrbitCameraController,
} from "./systems/FollowCameraSystem.ts";

//dodano za trke
import { vec3, mat4, vec4} from "gl-matrix";
import { Collider } from "./components/Collider.ts";

// ------ Create sample scene ------ //
const gltfParser = new GLTFParser();

//============ DEMO SCENE ============//

const gltfContent = await fetch("data/demo_scene.gltf").then((r) => r.text());
gltfParser.setJson(gltfContent, 'data/');

const scene = await gltfParser.parseScene(0);
if (!scene) {
    throw Error("Could not get GLTF scene!");
}

//============ OMARA ============//
const omaraParser = new GLTFParser();
const omaraBuffer = await fetch("data/omara_test.glb")
    .then(r => r.arrayBuffer());

await omaraParser.setBinary(new Uint8Array(omaraBuffer));

const omaraScene = await omaraParser.parseScene(0);

if(!omaraScene){throw new Error("Omare ni mogoce naloziti.");}

console.log(scene);
const icosphere = scene.getEntityByName('Icosphere');
if (icosphere) {
    playAnimation(scene, icosphere, 'IkosferaAkcija');
}
//po uspesnem nalaganju scene
//pošičemo kamero
const cameraEntity = scene.getEntityByName("Camera");

if (!cameraEntity) {
    throw new Error("V sceni ni objekta Camera.");
}

//IGRALEC
const player = scene.getEntityByName("Okostje");

if (!player) {
    throw new Error("V sceni ni objekta Okostje.");
}

player.addComponent(new PlayerController(3));

//ODSTRANIMO STARO KOCKO
const cube = scene.getEntityByName("Cube");
if(cube){
    scene.removeEntity(cube);
}

//dodamo omaro
const omaraEntity = new Entity();
omaraEntity.name = "Omara";

const omaraTransform = new Transform(TransformType.Free);
omaraEntity.addComponent(omaraTransform);

scene.addEntity(omaraEntity);

//dodamo oba dela modela omare, en naj bo rjau drug pa rumen
for (const entity of omaraScene.entities) {
    const mesh = entity.getComponent(Mesh);
    if(mesh){
        const primitives = mesh.getPrimitivesByMaterial(BasicMaterial);
        if (primitives) {
            for (const primitive of primitives) {
                if (entity.name === "Cube") {
                    // Rjava omara
                    const barva = vec4.fromValues(0.45, 0.25, 0.12, 1);
                    primitive.material = new BasicMaterial(await createTempTexture(barva), barva);
                }else if(entity.name === "objekti"){
                    // Svetlo rumeni predmeti
                    const barva = vec4.fromValues(1, 0.85, 0.3, 1);
                    primitive.material = new BasicMaterial(await createTempTexture(barva),barva);
                }
            }
        }
    }
    entity.parent = omaraEntity;
    scene.addEntity(entity);
}

omaraEntity.addComponent(new Collider(
    vec3.fromValues(-0.75, 0, -0.2155),
    vec3.fromValues(0.75, 1.5, 0.2155)
));

//izracun oddaljenosti igralca od kocke
const playerTransform = player.getComponent(Transform);
//const cubeTransform = cube.getComponent(Transform);
const cubeTransform = omaraEntity.getComponent(Transform); //omara
const cameraTransform = cameraEntity.getComponent(Transform);
//Projekcijska matrika kamere
const camera = cameraEntity.getComponent(Camera);

if (!playerTransform || !cubeTransform || !cameraTransform || !camera) {
    throw new Error("Igralec, kocka ali kamera nima komponente Transform.");
}

/*
//==========Da se premika cilinder - tega še nočem ker ga hoče samo animirat da se premika
const cylinder = scene.getEntityByName('Okostje');
if (cylinder) {
    playAnimation(scene, cylinder, 'OkostjeAkcija')
}
*/

//============ LITTLE GUY ============//
/*
//const gltfContent = await fetch("data/little_guy.gltf").then((r) => r.text());
const gltfContent = await fetch("data/littleGuyEdit.gltf").then((r) => r.text());

gltfParser.setJson(gltfContent, 'data/');
const scene = await gltfParser.parseScene(0);
if (!scene) {
    throw Error("Could not get GLTF scene!");
}
console.log(scene);
const player = scene.getEntityByName('Okostje');
if (player) {
    playAnimation(scene, player, 'dance'); //ima tudi fight tako ločujemo katero animacijo naj predvajamo

}
    

*/
// ------ Initalize GPU/Rendering specific interfaces ------ //

if (!navigator.gpu) {
    throw Error("WebGPU not supported in this browser!");
}
const gpuAdapter = await navigator.gpu.requestAdapter();
if (!gpuAdapter) {
    throw Error("Could not get WebGPU adapter!");
}
const gpuDevice = await gpuAdapter.requestDevice();
gpuDevice.addEventListener('uncapturederror', (e) => console.error(e.error.message));
gpuDevice.lost.then((v) => {
    console.error(`GPU device lost: ${v.message} (${v.reason})`);
});

//dodamo objekt canvas
const canvas = document.querySelector('canvas');
if (!canvas) {
    throw Error("Could not find a canvas!");
}
const input = new Input(canvas);

//dodano da se kamera lahko premika okoli čarovnice
const orbitCamera = new OrbitCameraController(canvas);

const renderState = new RenderState(gpuDevice, canvas);


// ------ Create and write all buffers ------ //

createBuffers(renderState, scene);


// ------ Prepare pipelines ------ //

await prepareRendering(renderState, scene);

// ------ Events ------ //

function resize() {
    if (!canvas) {
        return;
    }
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    if (width === 0 || height === 0) {
        width = 1;
        height = 1;
    }

    let aspect = width / height;

    // Update the camera
    const cameraEntities = scene?.getEntitiesByComponent(Camera) ?? [];
    for (const cameraEntity of cameraEntities) {
        const camera = cameraEntity.getComponent(Camera)!;
        camera.aspect = aspect;
    }
    // Update the rendering textures
    renderState.updateRenderTextureSizes(width, height);
}

window.addEventListener('resize', (_) => resize());
resize();


// ------ Game states ------ //
enum GameMode {
    NORMAL,
    INTERACTION
}

let gameMode = GameMode.NORMAL;

// ------ graficni element ----- //
// MINI INVENTAR - vedno prikazan na dnu zaslona (zaenkrat sm naredila tkao da skoz vidimo prvih 5 dodanih elementou)
const inventar = document.createElement("div");
inventar.style.position = "absolute";
inventar.style.bottom = "20px";
inventar.style.left = "50%";
inventar.style.transform = "translateX(-50%)";
inventar.style.display = "flex";
inventar.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
inventar.style.padding = "5px";
inventar.style.gap = "3px";
inventar.style.border = "2px solid #777";
document.body.appendChild(inventar);

// Ustvarimo 5 polj
for(let i = 0; i < 5; i++){
    const polje = document.createElement("div");
    polje.style.width = "80px";
    polje.style.height = "60px";
    polje.style.border = "2px solid #555";
    polje.style.color = "white";
    polje.style.display = "flex";
    polje.style.alignItems = "center";
    polje.style.justifyContent = "center";
    inventar.appendChild(polje);
}

// VELIK INVENTAR
const celotenInventar = document.createElement("div");
celotenInventar.style.position = "absolute";
celotenInventar.style.top = "50%";
celotenInventar.style.left = "50%";
celotenInventar.style.transform = "translate(-50%, -50%)";
celotenInventar.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
celotenInventar.style.padding = "20px";
celotenInventar.style.border = "3px solid #777";
celotenInventar.style.display = "none"; //na zacetku je skrit
document.body.appendChild(celotenInventar);

celotenInventar.style.gridTemplateColumns = "repeat(4, 90px)";
celotenInventar.style.gridTemplateRows = "repeat(4, 70px)";
celotenInventar.style.gap = "5px";

for(let i = 0; i < 3*3; i++){
    const polje = document.createElement("div");
    polje.style.backgroundColor = "rgba(40, 40, 40, 0.9)";
    polje.style.border = "2px solid #555";
    polje.style.color = "white";

    polje.style.display = "flex";
    polje.style.alignItems = "center";
    polje.style.justifyContent = "center";
    celotenInventar.appendChild(polje);
}

let stevecSestavin = 0;
function posodobiSeznam(ime: string){
    if(stevecSestavin < 5){
        const polje = inventar.children[stevecSestavin] as HTMLElement;
        polje.textContent = ime;
    }
    stevecSestavin++;
}

function posodobiVelikInventar(){
    for(let i = 0; i < stevecSestavin; i++){
        const polje = celotenInventar.children[i] as HTMLElement;
        polje.textContent = sestavine[i]; 
    }
}

function izprazniMiniInventar(){
    for(let i = 0; i < 5; i++){
        const polje = inventar.children[i] as HTMLElement;
        polje.textContent = "";
    }
}

function izprazniVelikInventar(){
    for(let i = 0; i < 3*3; i++){
        const polje = celotenInventar.children[i] as HTMLElement;
        polje.textContent = ""; 
    }
}

// ------ Start game loop ------ //

//definicija matrike predmetov v omari, trenutno 4x4:
const omara = [
    ["krogla1", "krogla2", "piramida1"],
    ["kocka1", "kocka2", "krogla3"],
    ["krogla4", "piramida2", "piramida3"]
];

const sestavine: string[] = [];

let lastTime = performance.now();
function update(timestamp: number) {
    if(!scene){return;}

//dodano za premikanje (omejiš velik preskok po daljši prekinitvi izrisovanja)
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    animateScene(scene, dt);
    computeTransforms(scene);

    if (cameraEntity && player && gameMode==GameMode.NORMAL && celotenInventar.style.display === "none") { //gameMode==GameMode.NORMAL ker ne zelimo da se igralec premika ce daje sestavine v kosarico
        // Nastavimo smer kamere glede na trenutno miško.
        followPlayer(cameraEntity, player, orbitCamera);

        // Premaknemo igralko glede na to smer.
        movePlayer(scene, input, dt, cameraEntity);
    }

    computeTransforms(scene);

    if (cameraEntity && player && gameMode==GameMode.NORMAL) { //gameMode==GameMode.NORMAL ker ne zelimo da se igralec premika ce daje sestavine v kosarico
        // Kamera sledi novemu položaju igralke.
        followPlayer(cameraEntity, player, orbitCamera);
    }

    //ce "Enter" preverimo ali je igralec dovol blizu kocke
    if(input.justPressed("Enter") && cameraTransform && playerTransform && cubeTransform){
    /*!!trenutno deluje ce se igralec pribliza "severne in juzne" strani kocke, to moramo se popraviti...odvisno od tega kaksna bo scena!!*/
        //dobimo lokacijo igralca in kocke in kamere
        const playerPosition = vec3.create();
        const cubePosition = vec3.create();


        mat4.getTranslation(playerPosition, playerTransform.worldMatrix);
        mat4.getTranslation(cubePosition, cubeTransform.worldMatrix);
    
        const dx = playerPosition[0] - cubePosition[0];
        const dz = playerPosition[2] - cubePosition[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
    
        if(gameMode === GameMode.NORMAL){
            if(distance < 1.5){ //men se zdi 1.5 kr okej
                gameMode = GameMode.INTERACTION;
                console.log("Vstop v INTERACTION!");
                cameraTransform.transformType = TransformType.LookAt; //"kamero zelimo usmeriti proti doloceni tocki"
                //                                                  kamera:       gor/dol             blizu/dalec
                // tukej je specificna gled ena omaro narejeno!
                cameraTransform.location = vec3.fromValues(cubePosition[0], cubePosition[1] + 0.75, cubePosition[2]+5);//doloci kje se kamera nahaj
                cameraTransform.target = vec3.fromValues(cubePosition[0], cubePosition[1] + 0.75, cubePosition[2]);
                cameraTransform.up = vec3.fromValues(0, 1, 0);
            }else{
                console.log("predalec od kocke!");
            }
        }else{
            gameMode = GameMode.NORMAL;
            console.log("vrnitev v NORMAL!");
        }
    }
    computeTransforms(scene);

    //local->world->view->clip->ndc
    if(gameMode === GameMode.INTERACTION && input.justClicked() && camera && cameraTransform && cubeTransform){
        // 1. INVERZNA PROJEKCIJSKA MATRIKA, inverseProjection naredi clip->view
        /*
        pri ray castingu poznamo polozaj klika na zaslonu, zelimo ugotoviti v katero smer
        v 3D prostoru ta klik kaze. to je ravno obratni postopek tega, ko pri izrisovanju
        poznamo polozaj objekta v 3D prostoru in zelimo ugotoviti kjer se pojavi na zaslonu
        ->zato rabimo inverzno projekcijsko matriko
        */
        const projectionMatrix = camera.perspectiveProjection; 
        const inverseProjection = mat4.create();
        if(!mat4.invert(inverseProjection, projectionMatrix)){throw new Error("Projekcijske matrike ni mogoce invertirati.");} //ta vrstica tudi izracuna inverz!
    
        // 2. INVERZNA POGLEDNA MATRIKA, inverseViewMatrix naredi view -> world
        // Pri TransformType.LookAt je viewMatrix ze pogledna matrika
        const inverseViewMatrix = mat4.create();
        if(!cameraTransform.viewMatrix){throw new Error("Kamera nima pogledne matrike.");}
        if(!mat4.invert(inverseViewMatrix, cameraTransform.viewMatrix)){throw new Error("Pogledne matrike ni mogoce invertirati.");}
    
        // 3. NDC -> VIEW, iz 2D polozaja na zaslonu zelimo dobit 3D tocko v k.s. kamere (view)
        //WebGPU uporablja globino NDC v obmocju [0, 1]
        const pointNDC = vec4.fromValues(input.getMouseX(), input.getMouseY(), 1, 1); //x,y polozaja zaslona normalizirana na [-1,1], z=1 ker je far plane (z izbiro z=1 izberem eno tocko v zarku), w=1 ker je homogena koordinata
        //tocko pretvorim iz ndc v view koordinate:
        const pointView = vec4.create();
        vec4.transformMat4(pointView, pointNDC, inverseProjection);
    
        // Perspektivno deljenje
        if(Math.abs(pointView[3]) < 0.000001){throw new Error("Perspektivno deljenje ni mogoce.");} //safety measure da nebi delili z 0 
        pointView[0] /= pointView[3];
        pointView[1] /= pointView[3];
        pointView[2] /= pointView[3];
        pointView[3] = 1;
        
        //pointView je zdaj 3D tocka na oddaljeni ravnini kamere (far plane) skozi katero poteka zarek nasega klika! ta tocka je v k.s. kamere view!

        // 4. VIEW -> WORLD, sedaj bomo pointView pretvorili v k.s. sveta, s pomocjo inverseViewMatrix ker dela tocno to:
        const pointWorld = vec4.create();
        vec4.transformMat4(pointWorld, pointView, inverseViewMatrix);
        //console.log("Tocka v WORLD:", ...pointWorld);
    
        // 5. IZRACUN ZARKA V WORLD, sedaj zelim dobiti vektor ki poteka iz kamere do tocke pointWorld (te ki seka far plane)
        const pointWorld3 = vec3.fromValues(pointWorld[0], pointWorld[1], pointWorld[2]); //vec4->vec3
    
        // izhodisce zarka O=polozaj kamere v WORLD
        const cameraPosition = vec3.create();
        mat4.getTranslation(cameraPosition, inverseViewMatrix);
    
        // smer zarka D = normalize(Pworld - O)... P=tocka na zarku ki smo jo zgoraj izracunale iz klika
        const rayDirection = vec3.create();
        vec3.subtract(rayDirection, pointWorld3, cameraPosition);
        vec3.normalize(rayDirection, rayDirection); //normaliziram samo zato da bo dolzina=1, smer se itak ne spremeni
        //console.log("Smer zarka WORLD:", ...rayDirection);
    
        // 6. PRETVORBA ZARKA WORLD -> LOCAL, zato ker je lazje v teh koordinatah izracunat presek zarka s kocko (kasneje omaro)
        //cubeTransform.worldMatrix pretvarja local->word, mi zelimo ravno obratno zato naredimo inverz
        const inverseCubeMatrix = mat4.create(); 
        if(!mat4.invert(inverseCubeMatrix, cubeTransform.worldMatrix)){throw new Error("Matrike kocke ni mogoce invertirati.");}
    
        //izhodisce zarka v lokalnem koordinatnem sistemu kocke
        const rayOriginLocal = vec3.create();
        vec3.transformMat4(rayOriginLocal, cameraPosition, inverseCubeMatrix); //inverseCubeMatrix pretvarja iz world->local, dobimo lokalno izhodisce zarka!

        // smer zarka v lokalnem koordinatnem sistemu kocke
        // w=0, ker je smerni vektor in translacija nanj ne vpliva
        const rayDirection4 = vec4.fromValues(rayDirection[0], rayDirection[1], rayDirection[2], 0); //vec3->vec4
        const rayDirectionLocal4 = vec4.create();
        vec4.transformMat4(rayDirectionLocal4, rayDirection4, inverseCubeMatrix); //rayDirectionLocal4=smer zarka v local koordinatah
        const rayDirectionLocal = vec3.fromValues(rayDirectionLocal4[0], rayDirectionLocal4[1], rayDirectionLocal4[2]); //vec4->vec3
        //console.log("Smer zarka LOCAL:", ...rayDirectionLocal);

        /*
        rayOriginLocal=izhodisce zarka O, v koordinatah kocke
        rayDirectionLocal=smer zarka D, v koordinatah kocke
        zato lahko zarek zapisem kot P(t)=O+t*D
        
        7. PRESECISCE S SPREDNJO PLOSKVIJO KOCKE
        Trenutni Collider ima lokalne meje [-1, 1]
        predpostavimo da je sprednja ploskev pri local=1 saj ima kocka local koordinate [-1,1]
        zaenkrat preverjamo ali se zarek seka z neskoncno ravnino z=1!!! ni se omejeno na kocko
        */
        //const frontZ = 1;
        const frontZ = 0.2155;
        if(Math.abs(rayDirectionLocal[2]) > 0.000001){ //preverimo ali je zarek vzporeden z ravnino, preverjamo z komponento, 
                                                       //ce Dz=0 se zarek sploh ne premiko po osi z! zato ne more preckati ravnine z=1 lahko pa v njej ze lezi
                                                       //preveriti moramo seveda zato da ne bomo delili z 0     
            //ker vemo da Pz(t)=Oz+t*Dz in da Pz(t)=1 ker z=1, lahko t izrazimo: t=(1-Oz)/Dz VSE SAMO ZA z KOORDINATO!
            const t = (frontZ - rayOriginLocal[2]) / rayDirectionLocal[2]; // izracun parametra t, frontZ==1 poglej 5 vrstic gor
            //console.log("Izracunan t:", t);
    
            //presecisce mora biti pred izhodiscem zarka!
            if(t >= 0){
                // P(t)=O+t*D, sedaj racunamo celotno tocko P!
                const tD = vec3.create();
                vec3.scale(tD, rayDirectionLocal, t);
                const P = vec3.create();
                vec3.add(P, rayOriginLocal, tD);
                //console.log("Presecisce LOCAL:", ...P);
    
                // 8. PREVERJANJE MEJA SPREDNJE PLOSKVE
                //kocka ima lokalne koordinate [-1,1] ker ze vemo Pz=1, preverimo se x in y koordinato:
                //if(P[0] >= -1 && P[0] <= 1 && P[1] >= -1 && P[1] <= 1){
                if(P[0] >= -0.75 && P[0] <= 0.75 && P[1] >= 0 && P[1] <= 1.5){ 
                    // zarek je zadel sprednjo ploskev kocke!!

                    // 9. DOLOCANJE POLJA V MREZI 4 x 4, sedaj vemo da je zarek padeu v sprednjo stran kocke
                    // pretvorba lokalnih koordinat iz [-1, 1] v [0, 1], samo zato ker je lazje
                    // x: 0=levi rob, 1=desni rob, y: 0=zgornji rob!, 1=spodnji rob
                    //const u = (P[0] + 1) / 2; tako je blo prej ker je blo normalizirano (ker kocka)
                    //const v = (1 - P[1]) / 2;
                    const u = (P[0] + 0.75) / 1.5;
                    const v = (1.5 - P[1]) / 1.5;
    
                    //izracun stolpca in vrstice, oba sta na intervalu [0,1], vsako koordinato zelimo razdeliti na 4 enako 
                    //velike dele stiri samo zato ker sam nareidla 4x4 grid.
                    const stolpec = Math.min(2, Math.floor(u * 3));
                    const vrstica = Math.min(2, Math.floor(v * 3));
                    
                    //ker imamo ix stolpca in vrstice tocno vemo katera sestavina je izbrana
                    const ime = omara[vrstica][stolpec];
                    if(!sestavine.includes(ime)){
                        sestavine.push(ime); //nocemo da se sestavine podvajajo
                        posodobiSeznam(ime);
                    } 

                    // Stevilka polja od 0 do 15
                    const slot = vrstica * 3 + stolpec; //izracun pravilne celice grida
    
                    //console.log("Vrstica:", vrstica);
                    //console.log("Stolpec:", stolpec);
                    console.log("Izbrano polje:", slot);
                    console.log("sestavina:", ime);
    
                }else{
                    console.log("Klik izven kocke");
                }
    
            }else{
                console.log("Presecisce je za kamero");
            }
        }else{
            console.log("Zarek je vzporeden s sprednjo ploskvijo");
        }
    }

    //ce player pritisne "space" naj se pokaze velik inventar
    if(input.justPressed("Space")){
        if(celotenInventar.style.display === "none"){
            posodobiVelikInventar(); //izpis vseh pobranih sestavin
            inventar.remove(); //pobrisemo mini inventar zacasno, dokler se ne vrnemo nazaj
            celotenInventar.style.display = "grid";
        }else{
            document.body.appendChild(inventar);
            celotenInventar.style.display = "none";
        }
    }

    // ce igralec pritisne X, izpraznimo inventar
    if(input.justPressed("KeyX")){
        sestavine.length=0;
        stevecSestavin=0;
        posodobiVelikInventar();
        izprazniMiniInventar();
        izprazniVelikInventar();
    }


    computeSkins(scene);
    updateBuffers(renderState, scene);
    //izrisi
    render(renderState, scene);

    //pobrisi
    input.endFrame();
    requestAnimationFrame(update);

    /*
    animateScene(scene, dt);
    //dodano za premikanje igralca
    movePlayer(scene, input, dt);
    //sledenje čarovnici
    if (cameraEntity && player) {
        followPlayer(cameraEntity, player);
    }
    //followPlayer(cameraEntity, player);

    computeTransforms(scene);
    computeSkins(scene);
    updateBuffers(renderState, scene);
    render(renderState, scene);

    requestAnimationFrame(update);
    */
}

requestAnimationFrame(update);