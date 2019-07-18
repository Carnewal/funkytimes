// Glitch app

const fetch = require('node-fetch');
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const { URLSearchParams } = require('url');

app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

app.get('/status', (_, res) => res.json({ ok: true }));

app.get('/inside/:cookie', async (req, res) => {
    const userAgent = req.headers['user-agent']
    console.log(userAgent)
    const { cookie } = req.params;
    console.log(cookie)

    const result = await fetch('https://funkytime.com/inside', {
        credentials: 'include',
        headers: {
            'User-Agent': userAgent,
            Cookie: cookie,
        },
        referrer: 'https://www.funkytime.com/login/',
        referrerPolicy: 'no-referrer-when-downgrade',
        body: null,
        method: 'GET',
        mode: 'no-cors',
    });
    const text = await result.text();

    const data = JSON.parse(text.split('projData = ')[1].split(';')[0]);

    res.json({
        cookie,
        result: {
            headers: result.headers.raw(),
            statusText: result.statusText,
            text,
        },
        data,
    });
});

app.post('/timeentries', async (req, res) => {
    const userAgent = req.headers['user-agent']
    console.log(userAgent)
    const { entries, cookie } = req.body;
    const results = await Promise.all(
        entries.map(async entry => {
            const params = new URLSearchParams();
            [
                ['from', entry.from],
                ['to', entry.to],
                ['projectname', entry.projectName],
                ['projectid', entry.project],
                ['date', entry.date],
                ['taskid', entry.task],
                ['description', ''],
                ['expenseid[]', ''],
                ['expenseimage[]', ''],
                ['expensetype[]', ''],
                ['expenseamount[]', ''],
                ['currencyid[]', ''],
                ['currencyamount[]', ''],
                ['expensedescription[]', ''],
                ['expenseid[]', ''],
                ['expenseimage[]', ''],
                ['expensedescription[]', ''],
                ['expensetype[]', '1'],
                ['expenseamount[]', ''],
                ['expenseid[]', ''],
                ['expenseimage[]', ''],
                ['expensetype[]', '10'],
                ['expenseamount[]', ''],
                ['expensedescription[]', ''],
                ['next', ''],
            ].forEach(([k, v]) => params.append(k, v));
            return fetch('https://funkytime.com/inside/timeentry', {
                credentials: 'include',
                headers: {
                    'User-Agent': userAgent,
                    Cookie: cookie,
                },
                referrer: 'https://www.funkytime.com/login/',
                referrerPolicy: 'no-referrer-when-downgrade',
                mode: 'cors',
                body: params,
                method: 'POST',
            }).then(res => res.text());
        })
    );

    return res.json({ data: { results } })

});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening ')
})