import { quat, vec3 } from "gl-matrix";
import type { Component } from "../Component.ts";
import type { Entity } from "../Entity.ts";
import { Transform } from "./Transform.ts";

export enum KeyframeInterpolation {
    Constant,
    Linear,
    CubicSpline
}

export enum KeyframeTarget {
    Translation,
    Rotation,
    Scale
}

export type Keyframe = {
    time: number; // Seconds
    value: vec3 | quat;
};

export class KeyframeAnimationChannel {
    interpolation: KeyframeInterpolation;
    target: KeyframeTarget;
    keyframes: Keyframe[];

    keyframeIndex: number;
    previousTime: number;

    constructor(
        interpolation: KeyframeInterpolation,
        target: KeyframeTarget,
        keyframes: Keyframe[]
    ) {
        this.keyframeIndex = 0;
        this.previousTime = 0;

        this.interpolation = interpolation;
        this.target = target;
        this.keyframes = keyframes;
        keyframes.sort((a, b) => a.time - b.time);
    }

    _findKeyframe(passedTime: number) {
        for (let i = 0; i < this.keyframes.length; i++) {
            const keyframe = this.keyframes[i];
            if (keyframe.time > passedTime) {
                this.keyframeIndex = Math.max(0, i - 1);
                return;
            }
        }
        this.keyframeIndex = this.keyframes.length - 1;
    }

    update(entity: Entity, passedTime: number) {
        if (this.keyframes.length === 0) {
            return;
        }

        if (passedTime < this.previousTime) {
            this._findKeyframe(passedTime);
        }

        while (
            this.keyframeIndex < this.keyframes.length - 1 &&
            passedTime >= this.keyframes[this.keyframeIndex + 1].time
        ) {
            this.keyframeIndex = Math.min(
                this.keyframes.length - 1,
                this.keyframeIndex + 1
            );
        }

        this.previousTime = passedTime;
        
        if (this.keyframeIndex >= this.keyframes.length - 1) {
            return;
        }

        const transform = entity.getComponent(Transform);
        if (!transform) {
            return;
        }

        const startKeyframe = this.keyframes[this.keyframeIndex];
        const endKeyframe = this.keyframes[this.keyframeIndex + 1];
        let t = (passedTime - startKeyframe.time) / (endKeyframe.time - startKeyframe.time);

        switch (this.target) {
            case KeyframeTarget.Translation: {
                transform.location = vec3.lerp(transform.location, startKeyframe.value, endKeyframe.value, t);
                break;
            }
            case KeyframeTarget.Rotation: {
                transform.rotation = quat.slerp(transform.rotation, startKeyframe.value, endKeyframe.value, t);
                break;
            }
            case KeyframeTarget.Scale: {
                transform.scale = vec3.lerp(transform.scale, startKeyframe.value, endKeyframe.value, t);
                break;
            }
        }
    }
}

export class KeyframeAnimation implements Component {
    channels: KeyframeAnimationChannel[];
    isLooping: boolean;
    isPaused: boolean;

    entity: Entity;
    passedTime: number;
    endTime: number;

    constructor(
        channels: KeyframeAnimationChannel[],
        isLooping: boolean,
        isPaused: boolean,
        entity: Entity
    ) {
        this.channels = channels;
        this.isLooping = isLooping;
        this.isPaused = isPaused;
        this.entity = entity;
        this.passedTime = 0.0;

        this.endTime = 0.0;
        for (const channel of channels) {
            const keyframes = channel.keyframes;
            if (keyframes.length === 0) {
                this.endTime = 0;
            } else {
                this.endTime = Math.max(keyframes[keyframes.length - 1].time, this.endTime);
            }
        }
    }

    play() {
        this.isPaused = false;
    }

    pause() {
        this.isPaused = true;
    }

    update(dt: number) {
        if (this.isPaused) {
            return;
        }

        if (this.passedTime > this.endTime && this.isLooping) {
            this.passedTime = 0.0;
        }

        for (const channel of this.channels) {
            channel.update(this.entity, this.passedTime);
        }

        this.passedTime += dt;
    }
}