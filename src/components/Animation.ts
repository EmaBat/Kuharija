import type { Component } from "../Component.ts";
import type { Entity } from "../Entity.ts";


type ProceduralAnimationFunction = {
    (entity: Entity, dt: number, passedTime: number, duration: number): void
};


export class ProceduralAnimationChannel {
    animation: ProceduralAnimationFunction;
    duration: number;
    passedTime: number;
    isCyclic: boolean;
    isPaused: boolean;

    constructor(
        animation: ProceduralAnimationFunction,
        duration: number,
        isCyclic: boolean
    ) {
        this.animation = animation;
        this.duration = duration;
        this.passedTime = 0;
        this.isCyclic = isCyclic;
        this.isPaused = true;
    }

    play() {
        this.isPaused = false;
    }

    pause() {
        this.isPaused = true;
    }

    update(entity: Entity, dt: number) {
        if (this.isPaused) {
            return;
        }

        if (this.isCyclic) {
            this.passedTime = this.passedTime % this.duration;
        }
        if (this.passedTime > this.duration) {
            return;
        }

        this.animation(entity, dt, this.passedTime, this.duration);

        this.passedTime += dt;
    }
}


export class ProceduralAnimation implements Component {
    channels: ProceduralAnimationChannel[];
    entity: Entity;

    constructor(channels: ProceduralAnimationChannel[], entity: Entity) {
        this.entity = entity;
        this.channels = channels;
    }

    playAll() {
        for (const channel of this.channels) {
            channel.play();
        }
    }

    pauseAll() {
        for (const channel of this.channels) {
            channel.pause();
        }
    }

    update(dt: number) {
        for (const channel of this.channels) {
            channel.update(this.entity, dt);
        }
    }
}