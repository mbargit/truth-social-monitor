const configs = {
    "chrome": {
        clienthello: "HelloChrome_91",
        http2Frame: {
            maxHeaderListSize: 262144,
            initialWindowSize: 6291456,
            initialHeaderTableSize: 65536,
            maxConcurrentStream: 1000,
            maxHeaderListSizeUnlimited: false,
            maxConcurrentStreamUnlimited: false
        },
        pseudoHeaders: ["Method", "Authority", "Scheme", "Path"]
    },
    "ios": {
        clienthello: "HelloIOS_14_2",
        http2Frame: {
            initialHeaderTableSize: 4096,
            initialWindowSize: 2097152,
            maxConcurrentStream: 100,
            maxHeaderListSizeUnlimited: true
        },
        pseudoHeaders: ["Method", "Scheme", "Path", "Authority"]
    },
    "firefox": {
        clienthello: "HelloFirefox_88",
        http2Frame: {
            maxHeaderListSize: 262144,
            initialWindowSize: 131072,
            initialHeaderTableSize: 65536,
            maxConcurrentStream: 1000,
            maxHeaderListSizeUnlimited: true,
            maxConcurrentStreamUnlimited: true
        },
        pseudoHeaders: ["Method", "Path", "Authority", "Scheme"]
    }
}

class client {
    constructor(config){
        let bindingPath = require("bindings")(process.platform).path
        delete require.cache[bindingPath];
        this.client = require(bindingPath);
        this.client.setPath("../index.dll")
        this.type = config.type.toLowerCase()
        this.storeCookies = config.storeCookies
        this.defaultProxy = config.proxy

        if(this.storeCookies) {
            this.cookieDict = {}
        }
    }

    set_cookieStr(){
        this.cookie = "";
        for(const [key, value] of Object.entries(this.cookieDict)){
            if(value !== '""'){
                this.cookie += `${key}=${value}; `
            }
        }
    }

    handleCookies(cookieArray){
        if(!cookieArray) return 
        if(typeof cookieArray === "string") cookieArray = cookieArray.split("/,/")
        for(let i = 0; i < cookieArray.length; i++){
            let co = cookieArray[i].split("; ")[0] + "; "
            for(let b = 0; b < co.length; b++){
                if(co[b] == '='){
                    this.cookieDict[co.slice(0, b)] = co.slice(b + 1, -2).split(";")[0]
                    break
                }
            }
        }
        this.set_cookieStr()
    }

    async request(url = "", data){
        if(data.json) data.body = JSON.stringify(data.json)
        if(typeof data.body === "object") data.body = JSON.stringify(data.body)

        let reqData = {
            url,
            method: data.method || "GET",
            headers: data.headers || [],
            followRedirect: data.followRedirect ? true : false,
            body: data.body || "",
            ja3: data.ja3 || "",
            discardResponse: data.discardResponse ? true : false ,
            http2Frame: configs[this.type] ? configs[this.type]["http2Frame"] : data.http2Frame,
            clienthello: configs[this.type] ? configs[this.type]["clienthello"] : data.clienthello,
            proxy: data.proxy || this.defaultProxy || "",
            timeout: data.timeout || 30,
            EnableLog: true,
        },
        response = await this.client.TlsClient(JSON.stringify(reqData))
        console.log(reqData)
        try{
            response = JSON.parse(response)
            /*
                You recieve 3 things
                1. response.Body which is the response body
                2. response.Headers , the response Headers
                3. response.Status , the Status code of the request
                4. response.Url , the latest executed url of the request
            */            

        }catch(err){
            //console.log(err)

            /*

                A error means most of the times, that you had a connection problem with your proxy.
                Also wrong configs can be a reason for a error.
                Please dm me then.

            */
        }

        if(response.Status === 999) throw new Error (response.Body)
        if(this.storeCookies){
            this.handleCookies(response["Headers"]['Set-Cookie'])
        }

        return response
    }

}

module.exports = client