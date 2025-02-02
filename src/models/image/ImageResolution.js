export class ImageResolution {
    /**
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.validate();
    }

    validate() {
        if (!Number.isInteger(this.width) || !Number.isInteger(this.height)) {
            throw new Error("Width and height must be integers.");
        }
        if (this.width <= 0 || this.height <= 0) {
            throw new Error("Width and height must be positive values.");
        }
        if (this.width * this.height > 25600000) {
            throw new Error("The product of width and height must not exceed 25,600,000.");
        }
    }
}
