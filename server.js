const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Utility for retrying async operations
 */
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`[Retry] Attempt ${i + 1} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Universal Proxy Endpoint (Supports POST and GET)
 */
app.all('/course', async (req, res) => {
    const { endpoint, target } = req.query;
    const method = req.method;
    const DEBUG_TEST_MODE = false;
    
    let targetUrl;
    let targetMethod = method;
    
    // Original Browser-like headers
    let headers = { 
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Origin': 'https://nexttoppers.free.nf',
        'Referer': 'https://nexttoppers.free.nf/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Ch-Ua': '"Opera";v="131", "Not.A/Brand";v="8", "Chromium";v="147"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0',
        'app_id': '1770981347',
        'platform': '3',
        'user_id': (method === 'POST' ? req.body.user_id : req.query.user_id) || '2850138',
        'version': '1',
        'Content-Type': 'application/json'
    };

    if (req.headers['authorization']) {
        headers['Authorization'] = req.headers['authorization'];
    }

    let payload = method === 'POST' ? { ...req.body } : { ...req.query };
    // Remove proxy-specific params from payload
    delete payload.endpoint;
    delete payload.target;

    // Task 4 & 14: Ensure compatibility by sending BOTH keys if either is present
    if (payload.tile_id !== undefined || payload.title_id !== undefined) {
        const idValue = payload.tile_id || payload.title_id;
        payload.tile_id = idValue;
        payload.title_id = idValue;
    }

    if (target === 'nexttoppers-home') {
        targetUrl = `https://home.nexttoppers.com/home/content`;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (target === 'nexttoppers-course') {
        targetUrl = `https://course.nexttoppers.com/course/${endpoint}`;
        headers['Content-Type'] = endpoint === 'content-details' ? 'application/json' : 'application/x-www-form-urlencoded';
        
        // Specific fix: content-details is often a GET request in Nexttoppers
        if (endpoint === 'content-details') {
            targetMethod = 'GET';
        }
    } else if (target === 'nexttoppers-test') {
        targetUrl = `https://test.nexttoppers.com/test/${endpoint}`;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (endpoint === 'get-test-data') targetMethod = 'GET';
    } else if (target === 'nexttoppers-extra') {
        targetUrl = `https://ntxapi.wasmer.app/?action=${payload.action}&content_id=${payload.content_id}&course_id=${payload.course_id}&rc=nt`;
        targetMethod = 'GET';
    } else {
        const finalEndpoint = endpoint || 'course-details';
        targetUrl = `https://apiserver.deltastudy.site/api/mastersahab/course?endpoint=${finalEndpoint}`;
        headers['Content-Type'] = 'application/json';
    }

    // Append params for GET requests
    if (targetMethod === 'GET') {
        const queryParams = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => {
            if (v !== undefined && v !== null) queryParams.append(k, String(v));
        });
        const queryString = queryParams.toString();
        if (queryString) {
            targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString;
        }
    }

    console.log(`========================================`);
    console.log(`[Proxy Request] ${targetMethod} -> ${targetUrl}`);

    try {
        let axiosData = undefined;
        if (targetMethod === 'POST') {
            if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                const params = new URLSearchParams();
                Object.entries(payload).forEach(([k, v]) => {
                    if (v !== undefined && v !== null) params.append(k, String(v));
                });
                axiosData = params.toString();
            } else {
                axiosData = payload;
            }
        }

        const axiosConfig = {
            method: targetMethod,
            url: targetUrl,
            headers: headers,
            data: axiosData,
            timeout: 15000
        };

        const response = await withRetry(async () => {
            return await axios(axiosConfig);
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[Proxy Error]`, error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    console.log(`========================================`);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Proxy running at http://localhost:${PORT}`);
    console.log(`========================================`);
});
