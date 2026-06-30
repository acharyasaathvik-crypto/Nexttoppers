/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          NextToppers player — AES-CBC Decrypter           ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Algorithm  : AES-128-CBC                                   ║
 * ║  Key        : Ch@tS3cr3tK3y!16  (16 bytes, UTF-8)          ║
 * ║  IV         : Ch@tIV#16Bytes!!  (16 bytes, UTF-8)          ║
 * ║  Input      : Base64-encoded ciphertext                     ║
 * ║  Source     : eduvibe-nt.pages.dev — page-dac893543ed9b951 ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Works in   : Browser (Web Crypto API) & Node.js            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * USAGE — Browser:
 *   <script src="player_decrypt.js"></script>
 *   <script>
 *     EduVibeDecrypt.decrypt("TdGUdM/shgk9hjJc...").then(console.log);
 *     EduVibeDecrypt.decryptResponse(apiResponseObj).then(console.log);
 *   </script>
 *
 * USAGE — Node.js:
 *   const EduVibeDecrypt = require('./player_decrypt.js');
 *   const result = await EduVibeDecrypt.decrypt("TdGUdM/shgk9hjJc...");
 *   console.log(result);
 */

(function (root, factory) {
    // UMD — works as CommonJS (Node), AMD, or plain browser global
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('crypto')); // Node.js
    } else {
        root.EduVibeDecrypt = factory(null);         // Browser
    }
}(typeof self !== 'undefined' ? self : this, function (nodeCrypto) {

    /* ── Constants ───────────────────────────────────────────── */
    const AES_KEY = "Ch@tS3cr3tK3y!16";   // 16 bytes
    const AES_IV = "Ch@tIV#16Bytes!!";    // 16 bytes
    const ALGO = "aes-128-cbc";

    /* ── Environment detection ───────────────────────────────── */
    const isNode = typeof process !== 'undefined' && !!process.versions?.node;
    const isBrowser = !isNode && typeof crypto !== 'undefined' && !!crypto.subtle;

    /* ══════════════════════════════════════════════════════════
     *  BROWSER  —  Web Crypto API  (async)
     * ══════════════════════════════════════════════════════════ */
    async function _browserDecrypt(base64Ciphertext) {
        const enc = new TextEncoder();
        const keyBuf = enc.encode(AES_KEY);
        const ivBuf = enc.encode(AES_IV);
        const encrypted = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));

        const key = await crypto.subtle.importKey(
            "raw", keyBuf,
            { name: "AES-CBC" },
            false,
            ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: ivBuf },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    }

    /* ══════════════════════════════════════════════════════════
     *  NODE.JS  —  built-in crypto module  (sync, wrapped async)
     * ══════════════════════════════════════════════════════════ */
    function _nodeDecrypt(base64Ciphertext) {
        if (!nodeCrypto) throw new Error("Node crypto module not available.");
        const keyBuf = Buffer.from(AES_KEY, "utf8");
        const ivBuf = Buffer.from(AES_IV, "utf8");
        const encrypted = Buffer.from(base64Ciphertext, "base64");
        const decipher = nodeCrypto.createDecipheriv(ALGO, keyBuf, ivBuf);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString("utf8");
    }

    /* ══════════════════════════════════════════════════════════
     *  PUBLIC API
     * ══════════════════════════════════════════════════════════ */

    /**
     * Decrypt a raw base64 ciphertext string.
     * Always returns a Promise<string> regardless of environment.
     *
     * @param {string} base64Ciphertext  - The encrypted base64 string.
     * @returns {Promise<string>}        - Decrypted plaintext (usually a JSON string).
     */
    async function decrypt(base64Ciphertext) {
        if (!base64Ciphertext || typeof base64Ciphertext !== 'string') {
            throw new TypeError("decrypt() expects a non-empty base64 string.");
        }

        // Strip surrounding quotes if the server returned JSON-stringified value
        let clean = base64Ciphertext.trim();
        if (clean.startsWith('"') && clean.endsWith('"')) {
            clean = clean.slice(1, -1);
        }
        // Unescape forward slashes  (\/ → /)
        clean = clean.replace(/\\\//g, '/');

        if (isNode) {
            return _nodeDecrypt(clean);
        } else if (isBrowser) {
            return _browserDecrypt(clean);
        } else {
            throw new Error("No supported crypto API found (need browser Web Crypto or Node.js crypto).");
        }
    }

    /**
     * Decrypt the `data` field of a full API response object.
     * Handles the typical shape:
     *   { success: true, responseCode: 3025, message: "...", data: "<base64>" }
     *
     * Returns a new object with `data` replaced by the parsed JSON (or raw string).
     *
     * @param {object} apiResponse  - The raw API response object.
     * @returns {Promise<object>}   - Response with `data` decrypted and parsed.
     */
    async function decryptResponse(apiResponse) {
        if (!apiResponse || typeof apiResponse !== 'object') {
            throw new TypeError("decryptResponse() expects an API response object.");
        }
        if (!apiResponse.data) {
            console.warn("[EduVibeDecrypt] Response has no 'data' field — returning as-is.");
            return apiResponse;
        }

        const rawText = await decrypt(apiResponse.data);

        let parsed;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            parsed = rawText; // not JSON — return raw string
        }

        return { ...apiResponse, data: parsed };
    }

    /**
     * Quick test — decrypts the known sample from the NextToppers API
     * and logs the result to console.
     */
    async function selfTest() {
        const SAMPLE = "TdGUdM\\/shgk9hjJcxRHC9vfZouaeUkgv1eDMqWt3o+LTh+QYqSb68nva6XI\\/w1x\\/IjyaUltIBM3yYKE8HP\\/s19Y0io4Bzd3jMK00rB7UCi+\\/+j6YpDuGForN2B6JO5+zP0eqz8PIkHOD5Uz8C3iXqv1Q8n41UcDMycXZ8gu8ZzwxQK3tczkavKglW4V4Cev4nJq8ESiVEUB9Bp0sImpnQpxG44U\\/n1rwP4EY935hqzgpQW3FUeQVNTctnZ2cqb\\/Uvn1ARFf7p11TdkBD9tc5mu2lsyJafN19eVYUnWUpTGC07dGBLTwmnPOl80iKe80kzuN1aw3tJtwjycR8cBOA\\/YTk0B8xjY6XDZWawqzFO6yhp78v8oCi3feSHG31c9EG30GDqZx2ekZmYVDX0dhZ9NW+bN6fQp38kqM9fVQQRhwR7+J0S3\\/jFI5nKA1kny9SBwreiMGznF\\/MiMNP7EzY4\\/kojmG5sY3vmZVuukcQPkMUOep9HAqxIaI2k2obMTfWGofpSZLhWIik2KDD70bljny9\\/\\/1rjCBt\\/r625GaDwn69oXWkSeCWS1FPjcaDxVujWwoLjQJdulekpILN55pzZkysHdxCnFDA54p3b54pOhh2G35yJQ4H\\/MjeMhOZoaDP3\\/fPseV\\/MXdcU06VXe7pbie390tCoWoTIkirkkfzPiupI88nLR+9UJCDHy\\/9f1WFXoBIu1RGrmszrzvQLfo+My+T2PZkJLnsR3i8B7EGhhtGlrM3psXOwyKaFqa0n\\/KHImpngaYLy+89aCj\\/wTwWcV6t6CAntrvk\\/Pz5\\/8z48tHzRXnVQvo53OsYo6OZZJdRYAZvbhg3Nzjj+wEjFbMQspZtlqQb155UrdKcrVlEApyTXDjtV7PKSWjgL4m46HRA+zEbIJAv0GtHOex3oUMUyhnlCz9CBhUHP8l6NwJCLfyG50ivReof\\/QcEykdXM6nbY3MTRVgy4uDkvcMM7VcNGhcEhXSrvcKU1\\/GlPoF7DoLhAP8PSIGlKavB8Oo3Dt9cY4r\\/akfxa45HPSVvxzBoU9dXSBRnQq9wbppJ3OzIYvRjdii7pLMwtpCqZ3bXizu8";
        try {
            const result = await decrypt(SAMPLE);
            const parsed = JSON.parse(result);
            console.log("[EduVibeDecrypt] ✅ Self-test PASSED:", parsed);
            return parsed;
        } catch (err) {
            console.error("[EduVibeDecrypt] ❌ Self-test FAILED:", err.message);
            throw err;
        }
    }

    /* ── Expose public surface ───────────────────────────────── */
    return {
        decrypt,
        decryptResponse,
        selfTest,
        constants: { AES_KEY, AES_IV, ALGO }
    };

}));
