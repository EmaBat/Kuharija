export class ImageTexture {
    _originalImage: ImageBitmap;
    
    // GPU Data
    _texture: GPUTexture;
    _textureView: GPUTextureView;
    _isDirty: boolean;  // If we changed the original image

    constructor(
        image: ImageBitmap,
        device: GPUDevice
    ) {
        this._originalImage = image;
        this._texture = device.createTexture({
            size: [image.width, image.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this._textureView = this._texture.createView();
        this._isDirty = true;
    }
    
    copyImageToTexture(device: GPUDevice) {
        device.queue.copyExternalImageToTexture(
            { source: this._originalImage },
            { texture: this._texture },
            { width: this._originalImage.width, height: this._originalImage.height }
        );
    }

    getTexture(device: GPUDevice) {
        if (this._isDirty) {
            this.copyImageToTexture(device);
            this._isDirty = false;
        }
        return this._texture;
    }

    getTextureView(device: GPUDevice) {
        if (this._isDirty) {
            this.copyImageToTexture(device);
            this._isDirty = false;
        }
        return this._textureView;
    }
}