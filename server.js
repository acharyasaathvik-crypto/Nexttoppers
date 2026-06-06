const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Agent to disable pooling for sensitive targets
const httpsAgent = new https.Agent({ keepAlive: false });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// New Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/pw', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pw.html')));
app.get('/player', (req, res) => res.sendFile(path.join(__dirname, 'public', 'player.html')));
app.get('/course', (req, res, next) => {
    if (req.query.target || req.query.endpoint) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'course_dynamic.html'));
});

// New Redirects
app.get('/player.html', (req, res) => res.redirect(301, '/player'));
app.get('/course_dynamic.html', (req, res) => res.redirect(301, '/course'));

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
 * Universal Proxy Endpoint
 */
app.all('/course', async (req, res) => {
    const { endpoint, target } = req.query;
    const method = req.method;
    
    let targetUrl;
    let targetMethod = method;
    
    // Base common headers
    let headers = { 
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0'
    };

    // Target-specific header logic
    if (target && (target.startsWith('nexttoppers') || target === 'deltastudy')) {
        headers = {
            ...headers,
            'Origin': 'https://nexttoppers.me.to',
            'Referer': 'https://nexttoppers.me.to/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Ch-Ua': '"Opera";v="131", "Not.A/Brand";v="8", "Chromium";v="147"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'app_id': '1770981347',
            'platform': '3',
            'user_id': (method === 'POST' ? req.body.user_id : req.query.user_id) || '2850138',
            'version': '1',
            'Content-Type': 'application/json'
        };
    } else if (target === 'penpencil') {
        headers = {
            ...headers,
            'Content-Type': 'application/json',
            'client-type': 'WEB',
            'client-version': '300',
            'Origin': 'https://stream.studyratna.cc',
            'Referer': 'https://stream.studyratna.cc/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
        };
    } else if (target === 'studyratna') {
        targetUrl = `https://stream.studyratna.cc/${endpoint}`;
        headers = {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9,id;q=0.8,hi;q=0.7,es;q=0.6,nl;q=0.5',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'sec-ch-ua': '"Opera";v="131", "Not.A/Brand";v="8", "Chromium";v="147"',
            'sec-ch-ua-arch': '"x86"',
            'sec-ch-ua-bitness': '"64"',
            'sec-ch-ua-full-version': '"131.0.5877.116"',
            'sec-ch-ua-full-version-list': '"Opera";v="131.0.5877.116", "Not.A/Brand";v="8.0.0.0", "Chromium";v="147.0.7727.138"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua-platform-version': '"19.0.0"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0',
            'Origin': 'https://stream.studyratna.cc',
            'Referer': 'https://stream.studyratna.cc/'
        };
    }

    // Authorization forwarding
    if (req.headers['authorization']) {
        headers['Authorization'] = req.headers['authorization'];
    }
    
    // Forward specific custom signatures/IDs
    ['dev-jisu-key', 'dev-jisu-protection-signature', 'dev-jisu-signature', 'client-id', 'randomid', 'x-sdk-version'].forEach(h => {
        if (req.headers[h]) headers[h] = req.headers[h];
    });

    let payload = method === 'POST' ? { ...req.body } : { ...req.query };
    delete payload.endpoint;
    delete payload.target;

    // Handle target URLs
    if (target === 'nexttoppers-home') {
        targetUrl = `https://home.nexttoppers.com/home/content`;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (target === 'nexttoppers-course') {
        targetUrl = `https://course.nexttoppers.com/course/${endpoint}`;
        headers['Content-Type'] = endpoint === 'content-details' ? 'application/json' : 'application/x-www-form-urlencoded';
        if (endpoint === 'content-details') targetMethod = 'GET';
    } else if (target === 'nexttoppers-test') {
        targetUrl = `https://test.nexttoppers.com/test/${endpoint}`;
        headers['Content-Type'] = endpoint === 'submit' ? 'application/json' : 'application/x-www-form-urlencoded';
        if (endpoint === 'get-test-data') targetMethod = 'GET';
    } else if (target === 'nexttoppers-extra') {
        targetUrl = `https://ntxapi.wasmer.app/?action=${payload.action}&content_id=${payload.content_id}&course_id=${payload.course_id}&rc=nt`;
        targetMethod = 'GET';
    } else if (target === 'penpencil') {
        targetUrl = `https://api.penpencil.co/${endpoint}`;
    } else if (target === 'studyratna') {
        targetUrl = `https://stream.studyratna.cc/${endpoint}`;
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

        const response = await withRetry(async () => {
            return await axios({
                method: targetMethod,
                url: targetUrl,
                headers: headers,
                data: axiosData,
                timeout: 15000,
                httpsAgent: target === 'studyratna' ? httpsAgent : undefined,
                proxy: false
            });
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
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Proxy running at http://localhost:${PORT}`);
    console.log(`========================================`);
});
