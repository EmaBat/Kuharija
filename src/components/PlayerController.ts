import type { Component } from "../Component.ts";

//halfWidth - polovica velikosti naše igralke
//Treba spremenit ko menjamo objekt ki se premika trenutno sem valju določila velikost 0.4
export class PlayerController implements Component {
    constructor(
        public speed: number = 3,
        public halfWidth: number = 0.2,
        public halfDepth: number = 0.2,
    ) {}
}