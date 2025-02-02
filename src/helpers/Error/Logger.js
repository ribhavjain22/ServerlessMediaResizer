// Logger.js
class Logger {
    constructor(context) {
        this.context = context;
    }

    logError(error) {
        console.error(`Error in ${this.context}:`, error.message);
        console.error(`Stack trace:`, error.stack);
        alert(`An error occurred in ${this.context}: ${error.message}`);
    }
}

export default Logger;