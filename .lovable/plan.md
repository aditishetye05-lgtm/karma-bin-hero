

## Plan: Add Upload Photo Option to Scan & Verify Steps

### Overview
Add a file upload button alongside the camera option in both the initial capture step and the verification step, allowing users to pick a saved photo from their device gallery.

### Implementation Steps

1. **Add hidden file input ref and upload handler in `ScanFlow.tsx`**
   - Add a `fileInputRef` for the capture step and `verifyFileInputRef` for the verify step
   - Create `handleFileUpload` that reads the selected file as a data URL and sends it to `analyzeImage()`
   - Create `handleVerifyFileUpload` that reads the file and sends it through the verify flow

2. **Update the "capture" step UI**
   - Add an "Upload Photo" button next to "Open Camera" when camera is not active
   - Add an "Upload Photo" button next to "Capture & Analyze" when camera is active
   - Use the `ImagePlus` or `Upload` icon from lucide-react
   - Style consistently with existing eco-gradient buttons

3. **Update the "verify" step UI**
   - Add an "Upload Photo" button below the "Verify" button
   - When clicked, read the uploaded image and pass it to the verify-bin function instead of capturing from camera

4. **Handle verify with uploaded image**
   - Modify `handleVerifyCapture` to accept an optional image parameter so it can work with both camera capture and file upload
   - If image is passed directly, skip the `capturePhoto()` call

### Files Modified
- `src/components/scan/ScanFlow.tsx` — add file inputs, upload handlers, and UI buttons for both capture and verify steps

