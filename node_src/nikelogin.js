class Task{
    constructor(data, controller){
        this.body = `{"username":"example@gmx.de","password":"yourpassword","client_id":"theclientID","ux_id":"com.nike.commerce.nikedotcom.web","grant_type":"password"}`
        this.start()
    }
    
    async start(){
        this.setTlsClient("chrome")
        return await this.init()
    }
    
    async init(){
        console.log("[product page] Getting session")
        let headers = [
            [ 'method', 'GET' ],
            [ 'authority', 'www.nike.com' ],
            [ 'scheme', 'https' ],
            [ 'path', '/de/' ],
            [ 'cache-control', 'max-age=0' ],
            [ 'sec-ch-ua', '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"' ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'upgrade-insecure-requests', '1' ],
            [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36' ],
            [ 'accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' ],
            [ 'sec-fetch-site', 'same-origin' ],
            [ 'sec-fetch-mode', 'navigate' ],
            [ 'sec-fetch-user', '?1' ],
            [ 'sec-fetch-dest', 'document' ],
            [ 'referer', 'https://www.nike.com/de/' ],
            [ 'accept-encoding', 'gzip, deflate, br' ],
            [ 'accept-language', 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7' ],
        ]


        // this.client equals client.request

        const response = await this.client("https://www.nike.com/de/", {
            headers
        })

        this.clientID = response.Body.match(/(?<=data-clientid=")(.*?)(?=")/)[0]
        // for retrieving the clientID

        return this.getAkamaiScript()
    }

    async getAkamaiScript(){
        console.log("[akamai] Getting akamai script")
        let headers = [
            [ 'method', 'GET' ],
            [ 'authority', 'www.nike.com' ],
            [ 'scheme', 'https' ],
            [ 'path', '/staticweb/988597f4a2dti21360ef36930d137c9c5' ],
            [ 'sec-ch-ua', '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"' ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36' ],
            [ 'accept', '*/*' ],
            [ 'sec-fetch-site', 'same-origin' ],
            [ 'sec-fetch-mode', 'no-cors' ],
            [ 'sec-fetch-dest', 'script' ],
            [ 'referer', 'https://www.nike.com/de/' ],
            [ 'accept-encoding', 'gzip, deflate, br' ],
            [ 'accept-language', 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7' ],
            [ 'cookie', this.cookie ]
        ]
        // I had a cookie parser in my sub class, so this.cookie contains all cookies 

        const response = await this.client("https://www.nike.com/staticweb/988597f4a2dti21360ef36930d137c9c5", {
            headers
        })

        return this.getAkamai()
    }

    async getAkamai(first = true){
        console.log("[akamai] Submitting sensor data")

        let headers = [
            [ 'method', 'POST' ],
            [ 'authority', 'www.nike.com' ],
            [ 'scheme', 'https' ],
            [ 'path', '/staticweb/988597f4a2dti21360ef36930d137c9c5' ],
            [ 'content-length', '3912' ],
            [ 'sec-ch-ua', '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"' ],
            [ 'x-newrelic-id', 'UwcDVlVUGwIHUVZXAQMHUA==' ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.41 Safari/537.36' ],
            [ 'content-type', 'text/plain;charset=UTF-8' ],
            [ 'accept', '*/*' ],
            [ 'origin', 'https://www.nike.com' ],
            [ 'sec-fetch-site', 'same-origin' ],
            [ 'sec-fetch-mode', 'cors' ],
            [ 'sec-fetch-dest', 'empty' ],
            [ 'referer', 'https://www.nike.com/de/' ],
            [ 'accept-encoding', 'gzip, deflate, br' ],
            [ 'accept-language', 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7' ],
            [ 'cookie', this.cookie ]
        ],
        {sensorData} = await this.getSensorData(this.cookieDict["_abck"], "https://www.nike.com/de/", "605f3192d9b69c0017801619", first)
        // getSensorData returns the sensordata

        const response = await this.client("https://www.nike.com/staticweb/988597f4a2dti21360ef36930d137c9c5", {
            headers,
            body: JSON.stringify({ sensor_data: sensorData })
        })
        if(this.cookieDict["_abck"].includes("||") || response.Body.replace(/\n/g, "") === '{"success":true}') return this.getAkamai(false)
        else {
            this.updateStatus("[akamai] Solved akamai")
            return this.resetPassword()
        }
    }

    async generateHeaders(){
        this.updateStatus("[fpjs] Getting Headers")
        const response = await this.client("http://88.99.175.38:3000/api/generateCryptRaw", {
            headers: [
                [ 'user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36' ],
            ]
        })
        this.userAgent = response.Body.split("\n")[2].replace("ua: ", "")
        this.headerData = response.Body.split("\n").map(e => e.split(" ")[1])

        return this.login()
    }


    async resetPassword(){
        this.updateStatus("[nike] requesting password rest")
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
            [ 'cookie', this.cookie]
        ],
        body = `{"login":"email@gmx.de","backendEnvironment":"identity","redirectUrl":"http://www.nike.com","messageTemplate":"TSD_PROF_PASSWORD_RESET_V1.0","email":"email@gmx.de","ux_id":"com.nike.commerce.nikedotcom.web","emailTemplate":"TSD_PROF_PASSWORD_RESET_V1.0"}`


        const response = await this.client(`https://unite.nike.com/resetPassword?appVersion=889&experienceVersion=889&uxid=com.nike.commerce.nikedotcom.web&locale=de_DE&backendEnvironment=identity&browser=Google%20Inc.&os=undefined&mobile=false&native=false&visit=1&visitor=${this.generateUUID()}&clientId=HlHa2Cje3ctlaOqnxvgZXNaAs7T9nAuH`, {
            headers,
            body
        })

        if(response.Status === 200) console.log("[login] Requested password reset")
        else console.log(`[login] password reset failed with status: ${response.Status}`)

        console.log(response)
    }

    async login(){
        this.updateStatus("[nike] Logging in")
        let headers = [
            [ 'method', 'POST' ],
            [ 'authority', 'unite.nike.com' ],
            [ 'scheme', 'https' ],
            [ 'path', '/login?appVersion=889&experienceVersion=889&uxid=com.nike.commerce.nikedotcom.web&locale=de_DE&backendEnvironment=identity&browser=Google%20Inc.&os=undefined&mobile=false&native=false&visit=1&visitor=' + this.generateUUID() ],
            [ 'content-length', '172' ],
            [ 'sec-ch-ua', '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"' ],
            [ 'x-kpsdk-cd', this.headerData[0] ],
            [ 'x-kpsdk-ct', this.headerData[1] ],
            [ 'sec-ch-ua-mobile', '?0' ],
            [ 'user-agent', this.userAgent ],
            [ 'content-type', 'application/json' ],
            [ 'accept', '*/*' ],
            [ 'origin', 'https://www.nike.com' ],
            [ 'sec-fetch-site', 'same-site' ],
            [ 'sec-fetch-mode', 'cors' ],
            [ 'sec-fetch-dest', 'empty' ],
            [ 'referer', 'https://www.nike.com/' ],
            [ 'accept-encoding', 'gzip, deflate, br' ],
            [ 'accept-language', 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7' ],
            [ 'cookie', this.cookie ]
        ],
        body = this.body
        const response = await this.client("https://unite.nike.com/login?appVersion=889&experienceVersion=889&uxid=com.nike.commerce.nikedotcom.web&locale=de_DE&backendEnvironment=identity&browser=Google%20Inc.&os=undefined&mobile=false&native=false&visit=1&visitor=f3a10f60-ab6e-46bf-8e6d-5dbfb0f47b13",{
            headers,
            body,
            followRedirect: false
        }) 
        if(response.Status === 200) console.log("[login] Successfully logged in")
        else console.log(`[login] Login failed with status: ${response.Status}`)

        console.log(response)
        return
    }
}




new Task()
