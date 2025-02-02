const apiKey = process.env.TOGGL_API_KEY;
const auth = `Basic ${Buffer.from(`${apiKey}:api_token`).toString('base64')}`


function getCurrentTimeEntry() {
    return fetch("https://api.track.toggl.com/api/v9/me/time_entries/current", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": auth
        },
    })
    .then(resp => {
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        return resp.json();
    })
    .catch(err => {
        console.error('Error:', err.message)
        throw err;
    });
}

(async () => {
    try {
        const entry = await getCurrentTimeEntry();
        console.log('Fetched entry:', entry);
    } catch (err) {
        console.error('Final error:', err.message);
    }
})();