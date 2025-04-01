const client = require("./tlsclient")

const tls = new client({
    type: "chrome",
    storeCookies: false,
    proxy: null
})

async function main(){
    const response = await tls.request("https://ja3er.com/json", {
        clienthello: "HelloChrome_91",
        proxy: "http://127.0.0.1:8888",
        headers: [
            [ 'method', 'GET' ],
            [ 'scheme', 'https' ],
            [ 'sec-ch-ua', '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"' ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'upgrade-insecure-requests', '1' ],
            [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36' ],
            [ 'accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' ],
            [ 'sec-fetch-site', 'same-origin' ],
            [ 'sec-fetch-mode', 'navigate' ],
            [ 'sec-fetch-user', '?1' ],
            [ 'sec-fetch-dest', 'document' ],
            [ 'accept-language', 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7' ],
        ],
    })
    console.log(response)
}

main()