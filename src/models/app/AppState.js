export class AppState {
    /**
     * @type {boolean}
     */
    isDownloading;

    /**
     * @type {boolean}
     */
    buttonsDisabled;

    /**
     * @type {boolean}
     */
    showResizeFields;

    /**
     * @type {boolean}
     */
    keepAspectRatio;

    /**
     * @type {string}
     */
    errorMessage;

    constructor() {
        this.isDownloading = false;
        this.buttonsDisabled = false;
        this.showResizeFields = false;
        this.keepAspectRatio = true;
        this.errorMessage = '';
    }
}