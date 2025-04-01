const client = require("./tlsclient")

const tls = new client({
    type: "chrome",
    storeCookies: false,
    proxy: "", 
    timeout: 30, 
    discardResponse: false, 
    ja3: "", 
})
/*  As argument you can specify the fingerprint instance. You can choose between Chrome, Firefox or Ios
    The client takes a object as argument,
        You can set a type, the browser that you want to emulate, (chrome, firefox or ios)
        You can set a option whether cookies should automatically get processed (== true)
        You can set a default proxy, the format is "http://user:pass@ip:port/" and it will be used for all your requests (you can change it), default is "" -> localhost
        You can set a default timeout in seconds, default is 30 seconds
        You can set a clienthello, down below are the different options, default is the one you set as a type
        You can set a http2 settings frame, which defaults to the one you set as a type, to look at the format, please scroll down or visit the implementation of "config" in tlsclient.js
        You can set a ja3 string, you have to set as clienthello: HelloCustom if you are gonna use a ja3 string (not recommended). It defaults to "" -> none

        Default is chrome and no automatically cookie processing.
        Note that a cookie string is stored in {instance}.cookie and a cookie dictionary in {instance}.cookieDict
*/

// You mustnt have concurrent requests, the requests should follow after each other


async function main(){
    const response = await tls.request("https://ja3er.com/json", {
        method: "GET",
        /*
            If youre making a http2 request, you dont have to specify

            Default is GET
        */
        discardResponse: false,
        /*
            Discards the response body if true, you will still see the response Status and Headers,

            Default ist false

        */
        followRedirect: false,
        /*
            Will follow redirects if true

            Default is false
        */
        clienthello: "HelloChrome_91",
        proxy: "http://127.0.0.1:8888",        /*
            proxy needs to be in this format: "http://user:pass@ip:port/"
            If no should be used, leave it empty like that

            Default is the on you set in the constructor or localhost empty
        */
        body: "", 
        /*
            body has to be a string. Always.
            If youre sending json data, write this: body: JSON.stringify(yourjsondata)
            This will change in the future

            Default is empty
        */
        headers: [
            // Note pseudo headers without ":"
            [ 'method', 'GET' ],
            [ 'scheme', 'https' ],
            // You can remove the path header, it will be calculated anyways
            [ 'path', '/' ],
            [ 'sec-ch-ua', '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"' ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'upgrade-insecure-requests', '1' ],
            [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36' ],
            [ 'accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' ],
            [ 'purpose', 'prefetch' ],
            [ 'sec-fetch-site', 'none' ],
            [ 'sec-fetch-mode', 'navigate' ],
            [ 'sec-fetch-user', '?1' ],
            [ 'sec-fetch-dest', 'document' ],
            [ 'accept-encoding', 'gzip, deflate, br' ],
            [ 'accept-language', 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7' ],
        ]
        /*
            Yes, headers need to be in that format to maintain header order.
            The order is 1:1, like really 1:1 not like some other clients.
            If none pseudo headers are set, they will be automatically set, but note, 
            many antibots require a specific order for pseudo headers
            Content-length is calculated automatically
            This tls client accepts all three encoding types. gzip, deflate and br.

            You dont need to set any of those arguments if you dont want to change the default value of them.

            A request can look like this:

            const response = await tls.request("https://www.zalando.de/herren-home/")
        */
    })

    console.log(response)
}

async function postRequest(){

    /*
        Uses a chrome fingerprint
    */

    let headers = [
        [ 'method', 'POST' ],
        [ 'authority', 'unite.nike.com' ],
        [ 'scheme', 'https' ],
        [ 'path', '/resetPassword?appVersion=889&experienceVersion=889&uxid=com.nike.commerce.nikedotcom.web&locale=de_DE&backendEnvironment=identity&browser=Google%20Inc.&os=undefined&mobile=false&native=false&visit=1&visitor=ca2fef60-5f10-4bb9-8c53-8085b29f3f21&clientId=HlHa2Cje3ctlaOqnxvgZXNaAs7T9nAuH' ],
        [ 'content-length', '268' ],
        [ 'sec-ch-ua', '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"' ],
        [ 'sec-ch-ua-mobile', '?0' ],
        [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36' ],
        [ 'content-type', 'application/json' ],
        [ 'accept', '*/*' ],
        [ 'origin', 'https://www.nike.com' ],
        [ 'sec-fetch-site', 'same-site' ],
        [ 'sec-fetch-mode', 'cors' ],
        [ 'sec-fetch-dest', 'empty' ],
        [ 'referer', 'https://www.nike.com/' ],
        [ 'accept-encoding', 'gzip, deflate, br' ],
        [ 'accept-language', 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7' ],
        [ 'cookie', `Your cookies` ]
    ],

    /*
        The order of the headers is 1:1 to how you specify it
    */

    body = JSON.stringify({"login":"email@gmx.de","backendEnvironment":"identity","redirectUrl":"http://www.nike.com","messageTemplate":"TSD_PROF_PASSWORD_RESET_V1.0","email":"email@gmx.de","ux_id":"com.nike.commerce.nikedotcom.web","emailTemplate":"TSD_PROF_PASSWORD_RESET_V1.0"})
    
    /*
        the body has to be a string. JSON data can be sent with JSON.stringify(jsonData).
        content-type should be "application/json" when sending json data
    */

    const response = await tls.request(`https://unite.nike.com/resetPassword?appVersion=889&experienceVersion=889&uxid=com.nike.commerce.nikedotcom.web&locale=de_DE&backendEnvironment=identity&browser=Google%20Inc.&os=undefined&mobile=false&native=false&visit=1&visitor=Someuuid&clientId=HlHa2Cje3ctlaOqnxvgZXNaAs7T9nAuH`, {
        headers,
        body
    })
    console.log(response)
    console.log(response.Status) 
    console.log(response.Body)
    console.log(response.Headers)

}


async function imitateBrowser(){
    const customTls = new client({
        type: "custom"
    })
    /*

        Currently there are 3 configurations
        1. const chromeClient = new client({
            type: "chrome"
        })
           - imitates the clienthello and http2 config from chrome. (>chrome 91)
           - The pseudo header order is 1. method 2. authority 3. scheme 4. path 

        2. const firefoxClient = new client({
            type: "firefox"
        })
           - imitates the clienthello and http2 config from firefox. (firefox version 88)
           - The pseudo header order is 1. method 2. path 3. authority 4. scheme 

        3. const iosClient = new client({
            type: "ios"
        })
           - imitates the clienthello and http2 config from ios 14.4.2
           - The pseudo header order is 1. method 2. scheme 3. path 4. authority
    
        Of course you can use own configurations or even perhaps include your own in tlsclient.js under the configs dict

        You can choose between these clienthellos:
            - HelloChrome_Auto which is HelloChrome91
            - HelloChrome_91
            - HelloChrome_83
            - HelloChrome_72
            - HelloChrome_70
            - HelloChrome_62
            - HelloChrome_58

            - HelloFirefox_88
            - HelloFirefox_65
            - HelloFirefox_63
            - HelloFirefox_56
            - HelloFirefox_55

            - HelloAndroid_10
            - HelloAndroid_8

            - HelloIOS_14_2
            - HelloIOS_12_1
            - HelloIOS_11_1

            - HelloRandomizedNoALPN, which is basically forcing a http1 connection
            - HelloRandomized

            - HelloCustom

            When choosing HelloCustom, you need to specify a ja3 hash like this:

            const response = await tls.request(url, {
                headers: [
                    ["Your ordered", "Headers"]
                ],
                clienthello: "HelloCustom",
                ja3: "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0" 
            })
    */
    const response = await customTls.request("https://ja3er.com/json", {
        headers: [
            ["Some", "ordered"],
            ["headers", "yes"]
        ],
        clienthello: "HelloIOS_12_1"
    })
    console.log(response)
    /*
        {
        Status: 200,
        Body: '{"ja3_hash":"5c118da645babe52f060d0754256a73c", "ja3": "771,49196-49195-49188-49187-49162-49161-52393-49200-49199-49192-49191-49172-49171-52392-157-156-61-60-53-47-49160-49170-10,65281-0-23-13-5-13172-18-16-11-10,29-23-24-25,0", "User-Agent": "Go-http-client/1.1"}',
        Headers: {
                'Access-Control-Allow-Origin': '*',
                Connection: 'keep-alive',
                'Content-Length': '264',
                'Content-Type': 'application/json',
                Date: 'Tue, 25 May 2021 19:47:04 GMT',
                Server: 'nginx',
                'Set-Cookie': 'visited=5c118da645babe52f060d0754256a73c'
            }
        }
    */

    /*
        If you want to set custom http2 settings, you can do so when specifying the http2 frame

        const response = await tls.request("https://someurl.com/", {
            http2Frame: {
                maxHeaderListSize: 262144,
                initialWindowSize: 131072,
                initialHeaderTableSize: 65536,
                maxConcurrentStream: 1000,
                maxHeaderListSizeUnlimited: true,
                maxConcurrentStreamUnlimited: true
            },
            clienthello: "HelloFirefox_88"
        })
    */
}

async function features(){
    let tlsNoRespBody = new client({
        type: "chrome",
        proxy: "", 
        /* Log into charles to see actual size */
        discardResponse: true
    })
    /*
        Some cool features that the client offers is a discard response body setting, which allows you to only recieve the response Status and Headers
        This feature will save proxy usage. You can use it like that:

        let tlsNoRespBody = new client({
            type: "chrome",
            discardResponse: true
        })

        console.log(response)
    */

    let NoResponseBody = await tlsNoRespBody.request("https://www.footlocker.de/",{})
    NoResponseBody = await tlsNoRespBody.request("https://www.footlocker.de/",{})
    NoResponseBody = await tlsNoRespBody.request("https://www.footlocker.de/",{})
    NoResponseBody = await tlsNoRespBody.request("https://www.footlocker.de/",{})
    NoResponseBody = await tlsNoRespBody.request("https://www.footlocker.de/",{})

    console.log(NoResponseBody)
    /*
        {
            Status: 200,
            Body: '',
            Headers: {
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                'Access-Control-Allow-Origin': '*',
                Age: '30322',
                'Content-Length': '556227',
                'Content-Type': 'text/html; charset=utf-8',
                Date: 'Tue, 25 May 2021 19:49:41 GMT',
                Etag: 'W/"87cc3-zIxYv5yJtYJun3nRhIfYQ/zNx9E"',
                Locid: 'tf-573fea20-659c-4221-8ef3-6e5e89484270-sta',
                Server: 'nginx',
                Vary: 'Accept-Encoding',
                'X-Cache': 'HIT, HIT',
                'X-Frame-Options': 'SAMEORIGIN',
                'X-Powered-By': 'Express',
                'X-Served-By': 'cache-fra19181-FRA, cache-hhn4082-HHN',
                'X-Timer': 'S1621972182.844491,VS0,VE2'
            }
        }
    */

    /*
        The next feature is followRedirect: true, which is pretty self explainatory
        It doesnt follow a direct, instead it shows the request which initialises the redirect
        It is a 30X response and in response.Headers.Location should be the redirect url
    */

    const response = await tls.request("https://www.courir.com/",{
        followRedirect: false
    })

    console.log(response)
    /*
        {
            Status: 302,
            Body: '',
            Headers: {
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Cf-Cache-Status': 'DYNAMIC',
                'Cf-Ray': '65514f63c89e2199-DUS',
                'Cf-Request-Id': '0a46aff25b00002199193b8000000001',
                'Content-Type': 'text/html;charset=UTF-8',
                Date: 'Tue, 25 May 2021 19:53:29 GMT',
                'Expect-Ct': 'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
                Expires: 'Thu, 01 Dec 1994 16:00:00 GMT',
                Location: 'https://www.courir.com/on/demandware.store/Sites-Courir-FR-Site/fr_FR/DDUser-Challenge?redirect=%2Fon%2Fdemandware.store%2FSites-Courir-FR-Site',
                Pragma: 'no-cache',
                Server: 'cloudflare',
                'Set-Cookie': 'dwac_ccd2e4f073e53d48878d46ecd7=tk0iLGkB_4Z5KBbImxPhBqAh6VsMs_wHlIQ%3D|dw-only|||EUR|false|Europe%2FParis|true; Path=/; Secure; SameSite=None/,/cqcid=adZwalYJyjdKuwUhiXoBjbBMkO; Path=/; Secure; SameSite=None/,/cquid=||; Path=/; Secure; SameSite=None/,/sid=tk0iLGkB_4Z5KBbImxPhBqAh6VsMs_wHlIQ; Path=/; Secure; SameSite=None/,/datadome=Br9c9iLd33NV~e2cOTB-ZehX.4GEEKR3Vex8LuGbS2YTalJmmoC4v32teeOkPx~CeqYBV0m28yzS5V3S-AwYTbKrbKjE2SL_09TUPGVciY; Domain=.courir.com; Expires=Wed, 25-May-2022 19:53:29 GMT; Path=/; Secure; SameSite=None/,/dwanonymous_2b56b589bb7b2b1d9b76b81a77e4abe7=adZwalYJyjdKuwUhiXoBjbBMkO; Version=1; Comment="Demandware anonymous cookie for site Sites-Courir-FR-Site"; Max-Age=15552000; Expires=Sun, 21-Nov-2021 19:53:29 GMT; Path=/; Secure; SameSite=None/,/dwsid=H2WI2P41k3xxhbsKfw4bbwkJQ6-bh5D9nCmUsti90Kb8b1yMJbA-GKhbs_-kWlkVyqgzENBGRpSk9swgaaQWFg==; path=/; HttpOnly; Secure; SameSite=None',
                'X-Dwsid-Samesite': 'None'
            }
        }
    */
}

async function cookieExample(){
    const tlsWithCookies = new client({
        type: "chrome",
        storeCookies: true
    })
    /*
        Pretty self explainatory
        Cookies will be taken aswell and will be stored in this.cookie and this.cookieDict
    */

    const response = await tlsWithCookies.request("https://www.zalando.de/herren-home/", {})

    console.log(tlsWithCookies.cookieDict, tlsWithCookies.cookie)

    /*
        Cookies will be stored in the instance as cookieDict variable
        And a string, which is ready to be used in the headers in this.cookie 

        Output:
        {
            frsx: 'AAAAAGeKhboXeLwQZ6vJQ3Lwr0H8m4oUpEJEd773G6Ux9IIhBAXYXDnnE_4if9vjN7ywiFH2KzeZ9pnmYgqZSj8ocGyCSdYZLNPoJB93jDvBDqZlN56eKmDd_rIwyysG461AQOEDbPaJAeU-0PeITag=',
            'Zalando-Client-Id': '6a7d40bb-032e-4d12-90d8-6aea1a954c94',
            mpulseinject: 'false',
            bm_sz: '5C18D82EB76EFD06A7D54BD65505736E~YAAQPYoUAjzWbqV5AQAA3Wh/pQvt8A+FRry/FXE8sf8YoanfOSYfiHJDB+RvxyZzu8dinJwgpW5b5s/xq/ZLQEz0a0/vfXmA2XYLemksvJpnJmQK2BHL7hlS4lg1yD1iZ8JygowJasXSiMRs04VlUB4u3T6Y7VNJCFxjIp0SMQVJ3TxuE8K2I4QvjTc35dItl+1jHq+SXAtLXmolOkkwcWFYqaGzM09q0rKzdOZfZb+Fq8LNPmG6UApmeR53cy1nO3bQXSC/lMM4e90=',
            _abck: '4B0051B480A33800D38ADBB3EDEAA991~-1~YAAQPYoUAj3WbqV5AQAA3Wh/pQVkdVaqDPk0t8mylP3Lpz4FTQByUDCQ5Wf657MSt3f3vLYZTOpkbukg9vdRO5E58poBa+Vf51QCUonDGiT5YViCJX6jRg+Y5pn5o7U0VuDTfI82Lnk7O0lZJgYg87/ID+0v/iN3F5JUwDcD787c51KFxvWXEwbaBCOAeSmUmseOLoC9BbQq5obldTl+/sHALmFy+5AQxVmT7jucoF09l6CTXC9EE84GZytu/BCFOmlLqYcLBZHBuQ4XE6461kdK8d1fHO7OwIDqcIPfQ/TtQxoMWmbo4HbjHQiNWTfL1473hkVkSeHeaF3iGOhT/5gKorgCMTq+m4FBw22pTmSxl0QnRGwKOht0~-1~-1~-1'
        } frsx=AAAAAGeKhboXeLwQZ6vJQ3Lwr0H8m4oUpEJEd773G6Ux9IIhBAXYXDnnE_4if9vjN7ywiFH2KzeZ9pnmYgqZSj8ocGyCSdYZLNPoJB93jDvBDqZlN56eKmDd_rIwyysG461AQOEDbPaJAeU-0PeITag=; Zalando-Client-Id=6a7d40bb-032e-4d12-90d8-6aea1a954c94; mpulseinject=false; 
        bm_sz=5C18D82EB76EFD06A7D54BD65505736E~YAAQPYoUAjzWbqV5AQAA3Wh/pQvt8A+FRry/FXE8sf8YoanfOSYfiHJDB+RvxyZzu8dinJwgpW5b5s/xq/ZLQEz0a0/vfXmA2XYLemksvJpnJmQK2BHL7hlS4lg1yD1iZ8JygowJasXSiMRs04VlUB4u3T6Y7VNJCFxjIp0SMQVJ3TxuE8K2I4QvjTc35dItl+1jHq+SXAtLXmolOkkwcWFYqaGzM09q0rKzdOZfZb+Fq8LNPmG6UApmeR53cy1nO3bQXSC/lMM4e90=; _abck=4B0051B480A33800D38ADBB3EDEAA991~-1~YAAQPYoUAj3WbqV5AQAA3Wh/pQVkdVaqDPk0t8mylP3Lpz4FTQByUDCQ5Wf657MSt3f3vLYZTOpkbukg9vdRO5E58poBa+Vf51QCUonDGiT5YViCJX6jRg+Y5pn5o7U0VuDTfI82Lnk7O0lZJgYg87/ID+0v/iN3F5JUwDcD787c51KFxvWXEwbaBCOAeSmUmseOLoC9BbQq5obldTl+/sHALmFy+5AQxVmT7jucoF09l6CTXC9EE84GZytu/BCFOmlLqYcLBZHBuQ4XE6461kdK8d1fHO7OwIDqcIPfQ/TtQxoMWmbo4HbjHQiNWTfL1473hkVkSeHeaF3iGOhT/5gKorgCMTq+m4FBw22pTmSxl0QnRGwKOht0~-1~-1~-1;
    */

    const responseWithCookies = await tlsWithCookies.request("https://www.zalando.de/herren-home/", {
        headers: [
            [ 'cookie' , this.cookie ]
        ]
    })

}

async function requestWithTimeout(){
    /*
        Using a timeout a really simple.
        In the request option specify timeout to the desired seconds.
        The default timeout is 30 Seconds
    */
   
    const responseWithTimeout = await tls.request("https://www.zalando.de/herren-home/", {
        timeout: 1 
        /* Please dont set it in here, since a new handshake has to be initialized, instead set it in the constructor */
    })
    console.log(responseWithTimeout.Status)
}

async function runBenchmark(){
    const benchmark = new client({
        type: "chrome"
    })
    /*
        Important for many tasks is to set UV_THREADPOOL_SIZE before starting the node process
    */
    let responseWithTimeout = await benchmark.request("https://www.zalando.de/", {
    })
    responseWithTimeout = null
}

async function Benchmark(){
    for(let i = 0; i < 1000; i++){
        await runBenchmark()
    }
}

async function fingerprintRequest() {
    let response = await tls.request("https://client.tlsfingerprint.io:8443/", {
        headers: [
            [ 'method', 'GET' ],
            [ 'authority', 'client.tlsfingerprint.io' ],
            [ 'scheme', 'https' ],
            [ 'cache-control', 'max-age=0' ],
            [ 'sec-ch-ua', '"Not;A Brand";v="99", "Google Chrome";v="92", "Chromium";v="92"' ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'upgrade-insecure-requests', '1' ],
            [ 'origin', 'https://www.nakedcph.com'],
            [ 'content-type', 'application/x-www-form-urlencoded' ],
            [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36' ],
            [ 'accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' ],
            [ 'sec-fetch-site', 'same-origin' ],
            [ 'sec-fetch-mode', 'navigate' ],
            [ 'sec-fetch-dest', 'document' ],
            [ 'accept-encoding', 'gzip, deflate, br' ],
            [ 'accept-language', 'en-US,en;q=0.9' ],
        ]
    })

    console.log("Request with the new chrome fingerprint (>91)", response.Body)

    response = await tls.request("https://client.tlsfingerprint.io:8443/", {
        clienthello: "HelloChrome_83",
        headers: [
            [ 'method', 'GET' ],
            [ 'authority', 'client.tlsfingerprint.io' ],
            [ 'scheme', 'https' ],
            [ 'cache-control', 'max-age=0' ],
            [ 'sec-ch-ua', '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"' ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'upgrade-insecure-requests', '1' ],
            [ 'origin', 'https://www.nakedcph.com'],
            [ 'content-type', 'application/x-www-form-urlencoded' ],
            [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4515.107 Safari/537.36' ],
            [ 'accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' ],
            [ 'sec-fetch-site', 'same-origin' ],
            [ 'sec-fetch-mode', 'navigate' ],
            [ 'sec-fetch-dest', 'document' ],
            [ 'accept-encoding', 'gzip, deflate, br' ],
            [ 'accept-language', 'en-US,en;q=0.9' ],
        ]
    })

    console.log("Request with the old chrome fingerprint (83-88)", response.Body)

}

main()

/*
    Troubleshooting:
    
    Errors:
        "panic: runtime error: index out of range [0] with length 0" means, that you forgot a "," in your header array.
        For example: headers = [
            ["Some","ordered"]
            ["Header", "WithError"]
        ] should be:
        headers = [
            ["Some", "ordered"],
            ["Header", "WithnoError"]
        ]

        No request is made, means that the index.dll is not found. Note, the index.dll file has to be in the root directory (Where you start the script from)


*/