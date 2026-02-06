import os
import logging
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from utils.pdf_resizer import resize_pdf

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = '/tmp/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "pdf-resizer"}), 200

@app.route('/resize-pdf', methods=['POST'])
def resize_pdf_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Get target size from request form data (default to 0 which means standard compression)
    # The frontend should send 'targetSize' in KB or Bytes. Let's assume KB for user friendliness but handle conversion.
    # Actually, receiving bytes is more precise.
    try:
        target_size_kb = int(request.form.get('targetSize', 0))
    except ValueError:
        return jsonify({"error": "Invalid targetSize"}), 400

    if file:
        filename = secure_filename(file.filename)
        input_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(input_path)
        
        output_filename = f"resized_{filename}"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)

        try:
            logger.info(f"Starting resize for {filename} with target size {target_size_kb}KB")
            
            # Call the resizing logic
            final_size_bytes = resize_pdf(input_path, output_path, target_size_kb * 1024)
            
            logger.info(f"Resize complete. Final size: {final_size_bytes} bytes")

            return send_file(
                output_path, 
                as_attachment=True, 
                download_name=output_filename,
                mimetype='application/pdf'
            )

        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return jsonify({"error": str(e)}), 500
        finally:
            # Cleanup files
            try:
                if os.path.exists(input_path):
                    os.remove(input_path)
                # We typically don't delete output immediately if we are streaming it, 
                # but send_file with logic might need care. 
                # Flask's send_file can take a file object or path.
                # Use a background task or rely on /tmp cleanup if ephemeral.
                # For now, we won't strictly delete output_path here to ensure send_file works,
                # but in a serverless container /tmp is cleared anyway.
                pass 
            except Exception as cleanup_error:
                logger.warning(f"Cleanup error: {cleanup_error}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
