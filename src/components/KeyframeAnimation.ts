import { quat, vec3 } from "gl-matrix";
import type { Component } from "../Component.ts";
import type { Entity } from "../Entity.ts";
import { Transform } from "./Transform.ts";

/**
 * Interpolation of values between keyframes
 */
export enum KeyframeInterpolation {
    Constant,
    Linear,
    CubicSpline
}

/**
 * Which property is being animated
 */
export enum KeyframeTarget {
    Translation,
    Rotation,
    Scale
}

/**
 * A keyframe stores a specific value at a specific time,
 * thus creating change in values through the timeline
 */
export type Keyframe = {
    time: number;       // in seconds
    value: vec3 | quat; // can be vector or quaternion, since we have translation/scale/rotation
};

/**
 * An animation channel. Holds the keyframes of a specific
 * value animation, its interpolation, and what property should be animated.
 */
export class KeyframeAnimationChannel {
    interpolation: KeyframeInterpolation;
    target: KeyframeTarget;
    keyframes: Keyframe[];

    keyframeIndex: number;
    previousTime: number;

    constructor(interpolation: KeyframeInterpolation, target: KeyframeTarget, keyframes: Keyframe[]) {
        this.keyframeIndex = 0;
        this.previousTime = 0;

        this.interpolation = interpolation;
        this.target = target;
        this.keyframes = keyframes;
        // We sort the keyframes through time in advance
        // so that keyframe lookup is more efficient
        keyframes.sort((a, b) => a.time - b.time);
    }

    /**
     * Finds the last keyframe before current animation time.
     * This and the next keyframe can then be used to compute
     * new animation value.
     * @param passedTime Current time in animation, in seconds
     */
    _findKeyframe(passedTime: number) {
        // POSSIBLE CHALLENGE: There is surely a more efficient
        // way to get the keyframe interval for current time ... ;)
        for (let i = 0; i < this.keyframes.length; i++) {
            const keyframe = this.keyframes[i];
            if (keyframe.time > passedTime) {
                this.keyframeIndex = Math.max(0, i - 1);
                return;
            }
        }
        this.keyframeIndex = this.keyframes.length - 1;
    }

    /**
     * Computes the animated value for the current time.
     * 
     * NOTE: Currently, only linear interpolation is supported!
     * If you need other types of interpolation, you will need to
     * implement them yourselves.
     * @param entity The entity to update the value of
     * @param passedTime Current time in animation, in seconds
     */
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

/**
 * The component that handles the keyframed animation of the entity.
 * Currently only supports animation of {@link Transform} properties.
 * 
 * This component handles multiple animations by storing them as channels.
 * Each channel can run independently but the functionality has to be extended
 * for that.
 */
export class KeyframeAnimation implements Component {
    channels: KeyframeAnimationChannel[];
    // Whether the animation repeats after reaching its end.
    // This currently repeats all channels.
    isLooping: boolean;
    isPaused: boolean;

    entity: Entity;
    passedTime: number;
    duration: number;

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

        // We compute full animation duration from keyframe data,
        // taking the duration of the longest channel.
        this.duration = 0.0;
        for (const channel of channels) {
            const keyframes = channel.keyframes;
            if (keyframes.length === 0) {
                this.duration = 0;
            } else {
                this.duration = Math.max(keyframes[keyframes.length - 1].time, this.duration);
            }
        }
    }

    /**
     * Plays the entire animation
     */
    play() {
        this.isPaused = false;
    }

    /**
     * Pauses the animation
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Updates the animated data based on passed time.
     * @param dt Time duration from previous frame to this one, in seconds
     */
    update(dt: number) {
        if (this.isPaused) {
            return;
        }

        if (this.passedTime > this.duration && this.isLooping) {
            this.passedTime = 0.0;
        }

        for (const channel of this.channels) {
            channel.update(this.entity, this.passedTime);
        }

        this.passedTime += dt;
    }
}