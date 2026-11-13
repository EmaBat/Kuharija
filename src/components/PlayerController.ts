import type { Component } from "../Component.ts";

export class PlayerController implements Component {
    constructor(public speed: number = 3) {}
}