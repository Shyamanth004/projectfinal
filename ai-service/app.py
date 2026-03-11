from flask import Flask, request, jsonify
from PIL import Image
import imagehash
from ultralytics import YOLO

app = Flask(__name__)

# 🔥 Load trained YOLO model (make sure best.pt is in ai_service folder)
model = YOLO("best.pt")

# Store hashes ONLY for daily posts
stored_hashes = []

# 🎯 Class rules
DAILY_CLASSES = [
    "garbage_van",
    "garbage_container",
    "garbage_bin"
]

COMPLAINT_CLASSES = [
    "overflowing_garbage_bin",
    "garbage_pile"
]

CONFIDENCE_THRESHOLD = 0.6


@app.route("/")
def home():
    return jsonify({
        "message": "AI service with YOLO is running successfully!"
    })


@app.route("/upload-image", methods=["POST"])
def upload_image():

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files["image"]
    upload_type = request.form.get("type", "daily")  # daily | complaint

    try:
        image = Image.open(image_file)
        width, height = image.size
        img_format = image.format

        # ✅ Common validation
        if img_format not in ["JPEG", "PNG", "JPG"]:
            return jsonify({
                "status": "rejected",
                "reason": "Unsupported image format"
            }), 400

        # ====================================================
        # 🔒 DAILY POST VALIDATION
        # ====================================================
        if upload_type == "daily":

            if width < 200 or height < 200:
                return jsonify({
                    "status": "rejected",
                    "reason": "Image resolution too low for daily post"
                }), 400

            # Duplicate detection
            image_hash = imagehash.phash(image)
            for h in stored_hashes:
                if abs(image_hash - h) <= 5:
                    return jsonify({
                        "status": "rejected",
                        "reason": "Duplicate or reused image detected"
                    }), 400

            # 🔍 Run YOLO detection
            results = model(image)

            valid_detected = False
            detected_classes = []

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = model.names[cls_id]

                    detected_classes.append({
                        "class": label,
                        "confidence": confidence
                    })

                    if label in DAILY_CLASSES and confidence > CONFIDENCE_THRESHOLD:
                        valid_detected = True

            if not valid_detected:
                return jsonify({
                    "status": "rejected",
                    "reason": "Daily post must contain garbage bin/container/van",
                    "detections": detected_classes
                }), 400

            stored_hashes.append(image_hash)

            return jsonify({
                "status": "accepted",
                "type": "daily",
                "message": "Valid daily waste post",
                "detections": detected_classes
            }), 200

        # ====================================================
        # 🔓 COMPLAINT VALIDATION
        # ====================================================
        elif upload_type == "complaint":

            if width < 150 or height < 150:
                return jsonify({
                    "status": "rejected",
                    "reason": "Image resolution too low for complaint"
                }), 400

            # 🔍 Run YOLO detection
            results = model(image)

            valid_detected = False
            detected_classes = []

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = model.names[cls_id]

                    detected_classes.append({
                        "class": label,
                        "confidence": confidence
                    })

                    if label in COMPLAINT_CLASSES and confidence > CONFIDENCE_THRESHOLD:
                        valid_detected = True

            if not valid_detected:
                return jsonify({
                    "status": "rejected",
                    "reason": "Complaint must show overflowing bin or garbage pile",
                    "detections": detected_classes
                }), 400

            return jsonify({
                "status": "accepted",
                "type": "complaint",
                "message": "Valid complaint image",
                "detections": detected_classes
            }), 200

        # ====================================================
        # ❌ INVALID TYPE
        # ====================================================
        else:
            return jsonify({
                "status": "rejected",
                "reason": "Invalid upload type"
            }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "reason": "Invalid image file",
            "details": str(e)
        }), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)