import { vec3 } from "gl-matrix";
import type { Component } from "../Component.ts";


//Collider vsebuje lokalne meje objekta. 
// Sistem jih nato pretvori v svetovne koordinate, zato upošteva položaj, velikost in hierarhijo objekta.
//min in max določata dva nasprotna vogala omejitvenega kvadra pred transformacijo objekta.



export class Collider implements Component {
    enabled = true;

    constructor(
        public min: vec3,
        public max: vec3,
    ) {}
}