# 🎥 Video Playback & Security Architecture Report

This document explains how video content is **securely delivered, decrypted, and played** in the browser for the LMS platform.

---

## 1. 🔄 High-Level Workflow

The platform uses **HLS (HTTP Live Streaming)** with **AES-128 encryption**, enhanced by a **custom decryption pipeline** to prevent key exposure and scraping.

### 🚀 Step-by-Step Pipeline

1. **API Authorization**
   - User clicks a lecture
   - Frontend sends an **authorized GET request (JWT-based)**

2. **Key Delivery**
   - Backend responds with:
     - `videoUrl`
     - `encryptionKey` (16-byte HEX)
     - `iv` (Initialization Vector)

3. **HLS Initialization**
   - `VideoPlayer` initializes **Hls.js** with a **Custom Loader**

4. **Manifest Sanitization**
   - `.m3u8` manifest is fetched
   - `CustomLoader`:
     - Intercepts manifest
     - Removes all `#EXT-X-KEY` tags  
   - Result:
     - No visible encryption metadata
     - Prevents key discovery via DevTools / crawlers

5. **Segment Interception**
   - Hls.js requests `.ts` (MPEG-TS) segments

6. **Web Worker Decryption**
   - Each segment is sent to:
     - `decryption.worker.js`
   - Uses:
     - `SubtleCrypto API`
     - AES-128-CBC decryption
   - Done **in-memory (never stored)**

7. **Buffer Injection**
   - Decrypted segment returned
   - Injected into `<video>` buffer for playback

---

## 2. ❓ Frequently Asked Questions

### 🔑 Where does the key come from?

- Not a `.key` file
- Delivered via API response

### IS THIS SECURE? METHOD 
- NO
- SIMILAR TECH IS USED IN APPX + GRAPY ITS EASY TO DOWLOAD STILL 

```env
Endpoint: ${process.env.NEXT_PUBLIC_API_URL}/courses/[slug]
Field: activeLecture.videoAsset.encryptionKey