const { v4: uuidv4 } = require('uuid');

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
    },
    "custom": {
        http2Frame: {
            maxHeaderListSize: 262144,
            initialWindowSize: 6291456,
            initialHeaderTableSize: 65536,
            maxConcurrentStream: 1000,
            maxHeaderListSizeUnlimited: false,
            maxConcurrentStreamUnlimited: false
        },
    }
}

class client {
    constructor({ proxy = "", type = "chrome", timeout = 30, discardResponse = false, ja3 = "", storeCookies = false, rawClienthello, rawHttp2Frame, bindingPath, dllPath}){
        bindingPath = require("bindings")(process.platform).path
        dllPath = process.platform === "win32" ? "../index.dll" : "../index.dylib"
        delete require.cache[bindingPath];
        this.clientAddon = require(bindingPath);

        let { clienthello, http2Frame } = configs[type.toLowerCase()]

        this.dllPath = dllPath
        this.settings = {
            clienthello: clienthello || rawClienthello,
            http2Frame: http2Frame || rawHttp2Frame,
            proxy: proxy || "",
            uuid: uuidv4(),
            timeout,
            discardResponse,
            ja3
        }

        this.cookieDict = {}


        return this.initClient()
    }

    initClient() {
        this.clientAddon.Init( this.dllPath,
            JSON.stringify(this.settings)
        )
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
    
    reinit({ proxy, discardResponse, ja3, clienthello, http2Frame, timeout }) {
        if(proxy) this.settings.proxy = proxy
        if(discardResponse) this.settings.discardResponse = discardResponse
        if(ja3) this.settings.ja3 = ja3
        if(clienthello) this.settings.clienthello = clienthello
        if(http2Frame) this.settings.http2Frame = http2Frame
        if(timeout) this.settings.timeout = timeout

        return this.initClient()
    }

    encodeApplicationData(data) {
        let arr = []
        for(let [key, value] of Object.entries(data)){
            arr.push(`${key}=${typeof value === "object" ? JSON.stringify(value) : value}`)
        }

        return arr.join("&")
    }

    async request(url = "", data){
        if( data.proxy && data.proxy !== "" && data.proxy !== this.settings.proxy || 
            data.discardResponse && data.discardResponse !== this.settings.discardResponse || 
            data.ja3 && data.ja3 !== this.settings.ja3 && data.ja3 !== "" || 
            data.clienthello && data.clienthello !== this.settings.clienthello || 
            data.http2Frame && this.settings.http2Frame ||
            data.timeout && data.timeout !== this.settings.timeout ) this.reinit(data)

        if(data.json) data.body = JSON.stringify(data.json)
        if(typeof data.body === "object") data.body = JSON.stringify(data.body)
        if(data.applicationData) data.body = this.encodeApplicationData(data.applicationData)

        let reqData = {
            url,
            method: data.method || "GET",
            headers: data.headers || [],
            body: data.body || "",
            followRedirect: data.followRedirect === false ? false : true,
            EnableLog: true,
            uuid: this.settings.uuid,
        },
        response = await this.clientAddon.TlsClient(JSON.stringify(reqData))
        
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

        if(response.Status === 999) console.log(response.Body)
        if(this.storeCookies){
            this.handleCookies(response["Headers"]['Set-Cookie'])
        }

        return response
    }

}

module.exports = client