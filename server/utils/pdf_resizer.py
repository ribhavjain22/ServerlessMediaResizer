import os
import fitz  # PyMuPDF
import logging
from PIL import Image
import io

logger = logging.getLogger(__name__)

def get_file_size(path):
    return os.path.getsize(path)

def resize_pdf(input_path, output_path, target_size_bytes):
    """
    Resizes PDF attempting to reach target_size_bytes using PyMuPDF.
    """
    original_size = get_file_size(input_path)
    logger.info(f"Original size: {original_size} bytes, Target: {target_size_bytes} bytes")

    # Method 1: Garbage Collection and Deflate (Losslessish)
    doc = fitz.open(input_path)
    
    # Check if we can just save it with deflation to meet target
    # garbage=4: deduplicate objects, clean unused
    # deflate=True: compress streams
    doc.save(output_path, garbage=4, deflate=True)
    current_size = get_file_size(output_path)
    
    if target_size_bytes > 0 and current_size <= target_size_bytes:
        logger.info(f"Method 1 (GC/Deflate) successful. New size: {current_size}")
        doc.close()
        return current_size

    # If target size is 0, we just returned the best lossless compression
    if target_size_bytes <= 0:
        doc.close()
        return current_size

    # Method 2: Image Downsampling
    # If still too big, we need to compress images.
    
    # We will try a few quality levels for images
    quality_steps = [
        {'dpi': 150, 'quality': 75},
        {'dpi': 96, 'quality': 65},
        {'dpi': 72, 'quality': 50},
        {'dpi': 50, 'quality': 40} # Aggressive
    ]

    for step in quality_steps:
        logger.info(f"Attempting compression with DPI: {step['dpi']}, Quality: {step['quality']}")
        
        doc = fitz.open(input_path) 
        images_found = False
        processed_xrefs = set()
        
        # Iterate over all pages
        for page_num in range(len(doc)):
            page = doc[page_num]
            # full=True digs into XObjects (forms, groups)
            image_list = page.get_images(full=True)
            
            for img_info in image_list:
                xref = img_info[0]
                images_found = True
                
                # Avoid processing the same image twice if it appears multiple times
                if xref in processed_xrefs:
                    continue
                processed_xrefs.add(xref)
                
                # Extract original image to get actual stream size
                # ... (rest of image processing logic)
                original_image = doc.extract_image(xref)
                if not original_image:
                    continue
                    
                original_bytes = original_image["image"]
                
                # Check if it's already a small image (ignore small icons/logos)
                if len(original_bytes) < 2048:
                    continue

                try:
                    # Create pixmap from original to process it
                    pix = fitz.Pixmap(doc, xref)
                    
                    # If CMYK, convert to RGB
                    if pix.n > 4:
                        pix = fitz.Pixmap(fitz.csRGB, pix)

                    # Create PIL Image
                    img_data = pix.tobytes()
                    pil_img = Image.open(io.BytesIO(img_data))
                    
                    # Resize logic
                    max_dim = int(11 * step['dpi']) 
                    width, height = pil_img.size
                    if width > max_dim or height > max_dim:
                        pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                    
                    # Compress to JPEG
                    buffer = io.BytesIO()
                    pil_img.convert('RGB').save(buffer, format='JPEG', quality=step['quality'], optimize=True)
                    new_img_data = buffer.getvalue()
                    
                    # Only replace if new is strictly smaller
                    if len(new_img_data) < len(original_bytes):
                        doc.update_stream(xref, new_img_data)
                    
                    pix = None 
                    
                except Exception as e:
                    logger.warning(f"Failed to process image xref {xref}: {e}")
        
        # Save attempt
        try:
            doc.save(output_path, garbage=4, deflate=True)
            current_size = get_file_size(output_path)
            logger.info(f"Size after step {step}: {current_size}")
            
            if current_size <= target_size_bytes:
                doc.close()
                return current_size
        except Exception as e:
             logger.error(f"Error saving PDF attempt: {e}")
             
        doc.close()

    # Fallback: Rasterization (Flattening)
    # If we are here, standard image compression didn't work (or there were no images).
    # We must rasterize the pages to guarantee size reduction.
    logger.info("Standard compression failed to meet target. Switching to Aggressive Rasterization.")
    
    raster_steps = [
        {'dpi': 150, 'quality': 70},
        {'dpi': 96, 'quality': 60},
        {'dpi': 72, 'quality': 50}
    ]
    
    for step in raster_steps:
        logger.info(f"Rasterizing with DPI: {step['dpi']}, Quality: {step['quality']}")
        try:
            src_doc = fitz.open(input_path)
            out_doc = fitz.open()
            
            for page in src_doc:
                # Render page to image
                pix = page.get_pixmap(dpi=step['dpi'])
                img_data = pix.tobytes("jpg", jpg_quality=step['quality'])
                
                # Create new page in output doc
                new_page = out_doc.new_page(width=page.rect.width, height=page.rect.height)
                
                # Insert the rendered image covering the whole page
                new_page.insert_image(page.rect, stream=img_data)
            
            src_doc.close()
            
            # Save
            out_doc.save(output_path, garbage=4, deflate=True)
            out_doc.close()
            
            current_size = get_file_size(output_path)
            logger.info(f"Size after rasterization: {current_size}")
            
            if current_size <= target_size_bytes:
                return current_size
                
        except Exception as e:
            logger.error(f"Rasterization failed: {e}")
            
    return current_size
