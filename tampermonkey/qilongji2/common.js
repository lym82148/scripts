// ==UserScript==
// @name         Common
// @namespace    http://tampermonkey.net/
// @version      51
// @description  configs & util
// @author       Test
// @include      *
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        unsafeWindow
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        window.close
// ==/UserScript==

// unsafeWindow for Chrome console, window for other UserScript
unsafeWindow.lymTM = window.lymTM = {
    sleep: function (time) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve();
            }, time);
        });
    },

    transferJqueryObj: function (obj) {
        return this.isJqueryObj(obj) ? obj[0] : obj;
    },
    isJqueryObj: function (obj) {
        return ("jQuery" in unsafeWindow || "jQuery" in window) && obj instanceof jQuery || obj != null && obj[0] != null;
    },
    async: async function (obj, execTime = 99999999999, time = 100) {
        var untilTime = +new Date() + execTime;
        if (typeof obj == 'number') {// 参数是数字
            await this.sleep(obj);
        }
        else if (this.isJqueryObj(obj)) {// 参数是jQuery对象
            if (obj.selector == null) { console.log("obj.selector is null"); }
            while (!jQuery(obj.selector).length) {
                if (untilTime < new Date()) {
                    break;
                }
                await this.sleep(time);
            }
            return jQuery(obj.selector);
        }
        else if (obj) { // 参数是方法
            var res;
            while (true) {
                res = obj();
                if (this.isJqueryObj(res)) {
                    if (res.length) {
                        break;
                    }
                } else if (res) {
                    break;
                }
                if (untilTime < new Date()) {
                    break;
                }
                await this.sleep(time);
            }
            return res;
        } else { // 没有参数
            await this.sleep(0);
        }
    },
    createLabel: function (text) {
        var obj = document.createElement('label');
        obj.style.color = '#ff6e6e';
        obj.style.fontSize = '16px';
        obj.innerHTML = text;
        return obj;
    },
    createLink: function (text, href = 'javascript:void(0);') {
        var obj = document.createElement('a');
        obj.style.color = '#ff6e6e';
        obj.style.fontSize = '16px';
        obj.style.textDecoration = 'underline';
        obj.href = href;
        obj.target = '_blank';
        obj.innerHTML = text;
        return obj;
    },
    createButton: function (text, func) {
        var obj = document.createElement('a');
        obj.style.color = '#ff6e6e';
        obj.style.fontSize = '16px';
        obj.style.display = 'block';
        obj.style.textDecoration = 'underline';
        obj.href = 'javascript:void(0);';
        obj.onclick = func;
        obj.innerHTML = text;
        return obj;
    },
    getDropDownIcon: function () {
        return $('<svg viewBox="0 0 16 16" height="16" width="16"><path d="M4 6h8l-4 5z"></path></svg>');
    },
    localConfigs: { "swaggerTMConfig": "swaggerTMConfig", "idTMConfig": "idTMConfig" },
    regExps: {
        JiraStoryId: "[a-zA-Z]+-\\d+",
    },
    urls: {
        "test": "",
    },
    serviceConfigs: {},
    init: async function () {
    },
    consts: {
        'lymTMfinished': 'lymTMfinished'
    },
    keys: {
        'Branch': 'Branch'
    },
    sameHost(a, b) {
        try {
            var urlA = new URL(a);
            var urlB = new URL(b);
            return urlA.host == urlB.host;
        } catch (e) {
            //             console.log(e, a, b);
            return false;
        }
    },

    start: function () {
        this.runJob(
            function forDebug() {
            },
            10000
        );
        if (!window.$) {
            window.$ = unsafeWindow.jQuery ?? unsafeWindow.jQueryCourage;
        }
        return {
            startTime: Date.now(),
            reset: function () { this.startTime = Date.now(); },
            end: function (txt = '总') { console.log(`${txt}用时${(Date.now() - this.startTime) / 1000}秒`) },
            $: window.$
        };
    },
    getQueryString: function (name, search) {
        search = search || window.location.search;
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var r = search.substr(1).match(reg);
        if (r != null) {
            return unescape(r[2]);
        }
        return null;
    },
    nodeRemoveCallback: function (node, callback) {
        node.on('DOMNodeRemovedFromDocument', callback);
    },
    nodeInsertCallback: function (node, callback) {
        // use 'one' to avoid endless loop
        node.one('DOMNodeInserted', callback);
    },
    setValue: function (k, v, t = 600000) {
        if (k) {
            GM_setValue(k, { value: v, expire: Date.now() + t });
        }
    },
    setValueNotExpired: function (k, v) {
        this.setValue(k, v, Number.MAX_SAFE_INTEGER);
    },
    getValue: function (k) {
        var res = GM_getValue(k);
        if (res) {
            if (res.expire > Date.now()) {
                return res.value;
            } else {
                this.removeValue(k);
            }
        }
    },
    removeValue: function (k) {
        GM_deleteValue(k);
    },
    listValues: function () {
        return GM_listValues();
    },
    cleanValues: function () {
        for (var a of this.listValues()) {
            this.getValue(a);
        }
    },
    copy: function (data, info = 'text') {
        GM_setClipboard(data, info);
    },
    getMailTo: function (obj) {
        var to = escape(obj.to || '');
        var cc = escape(obj.cc || '');
        var bcc = escape(obj.bcc || '');
        var subject = escape(obj.subject || '');
        var body = escape(obj.body || '');
        return `mailto:${to}?cc=${cc}&bcc=${bcc}&subject=${subject}&body=${body}`;
    },
    dateFormat: function (date, fmt = 'yyyy-MM-dd hh:mm:ss') {
        var o = {
            "M+": date.getMonth() + 1, //月份
            "d+": date.getDate(), //日
            "h+": date.getHours(), //小时
            "m+": date.getMinutes(), //分
            "s+": date.getSeconds(), //秒
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度
            "S": date.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    },
    open: function (url, option) {
        return GM_openInTab(url, option);
    },
    openActive: function (url) {
        return GM_openInTab(url, { 'active': true });
    },
    ajax: function (request) {
        return GM_xmlhttpRequest({
            url: request.url,
            method: request.method,
            data: request.data,
            onreadystatechange: request.onreadystatechange,
            responseType: request.responseType,
        });
    },
    addListener: function (key, callback) {
        // function(name, old_value, new_value, remote)
        return GM_addValueChangeListener(key, callback);
    },
    removeListener: function (id) {
        return GM_removeValueChangeListener(id);
    },
    listenOnce: function (key, callback) {
        var id;
        var m = (a, b, c, d) => {
            callback(a, b, c, d);
            this.removeListener(id);
        };
        id = this.addListener(key, m);
        return id;
    },
    inputEvent: new Event('input', { bubbles: true }),
    changeEvent: new Event('change', { bubbles: true }),
    originSet: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set,
    originSetTextArea: Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set,
    originSetSelect: Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set,
    originSetOption: Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'selected').set,


    // for react change input value
    reactSet(obj, val) {
        var event = this.inputEvent;
        obj = this.transferJqueryObj(obj);
        var eventObj = obj;
        if (obj instanceof HTMLInputElement) {
            this.originSet.call(obj, val);
        } else if (obj instanceof HTMLTextAreaElement) {
            this.originSetTextArea.call(obj, val);
        } else if (obj instanceof HTMLSelectElement) {
            event = this.changeEvent;
        } else if (obj instanceof HTMLOptionElement) {
            this.originSetOption.call(obj, val);
            event = this.changeEvent;
            eventObj = obj.parentNode;
        }
        eventObj.dispatchEvent(event);
    },
    async get(url, success, error, $) {
        try {
            $ = $ ?? window.$ ?? unsafeWindow.$;
            var res = $.ajax({
                url: url, success: success, error: error
            });
            await res.promise();
            return res;
        } catch (e) { console.log(e); }
    },
    async post(url, data, success, error) {
        try {
            await $.ajax({
                url: url, data: data, type: 'POST', success: success, error: error, contentType: 'application/json'
            }).promise();
        } catch (e) { console.log(e); }
    },
    async getLegacy(url, success, error) {
        try {
            var promise = new Promise(function(resolve,reject){
                var successEx = async(e)=>{
                    if(success){success(e);}
                    resolve();};
                var errorEx = (e)=>{
                    if(error){error(e);}
                    reject();
                };
                var xhr = $.ajax({
                    url: url, type: 'GET', success: successEx, error: errorEx
                });
            });
            return promise;
        } catch (e) { console.log(e); }
    },
    async postForm(url, data, success, error) {
        try {
            var promise = new Promise(function(resolve,reject){
                var successEx = async(e)=>{
                    if(success){success(e);}
                    resolve();};
                var errorEx = (e)=>{
                    if(error){error(e);}
                    reject();
                };
                var xhr = $.ajax({
                    url: url, data: data, type: 'POST', success: successEx, error: errorEx, contentType: 'application/x-www-form-urlencoded'
                });
            });
            return promise;
        } catch (e) { console.log(e); }
    },
    listValueFromLocalStorage: function (key) {
        var res =[];
        for(var item in localStorage){
            if(item.includes(key)){
                res.push(item);
            }
        }
        return res;
    },
    clearLocalStorage: function(){
        localStorage.clear();
    },
    setValueFromLocalStorage: function (k, v, t = 600000) {
        if (k) {
            localStorage.setItem(k, JSON.stringify({ value: v, expire: Date.now() + t }));
        }
    },
    setValueNotExpiredFromLocalStorage: function (k, v) {
        this.setValueFromLocalStorage(k, v, Number.MAX_SAFE_INTEGER);
    },
    getValueFromLocalStorage: function (k) {
        var json = localStorage.getItem(k);
        var res = JSON.parse(json);
        if (res) {
            if (res.expire > Date.now()) {
                return res.value;
            } else {
                this.removeValueFromLocalStorage(k);
            }
        }
    },
    clearExpiredKeys: function(){
        var values = lymTM.listValues();
        for(var i=0;i< values.length;i++){
            try{
                lymTM.getValue(values[i]);
            }
            catch
            {
            }
        }
    },
    clearExpiredKeysFromLocalStorage: function(){
        for(var i=0;i< localStorage.length;i++){
            try{
                lymTM.getValueFromLocalStorage(localStorage.key(i));
            }
            catch
            {
            }
        }
    },
    removeValueFromLocalStorage(k) {
        localStorage.removeItem(k);
    },
    async getLockObject(key,seconds=5) {
        var lockKey = `lock:${key}`;
        var lockValue = this.randomString();
        while (true) {
            var lockObject = this.getValueFromLocalStorage(lockKey);
            if (lockObject == null) {
                this.setValueFromLocalStorage(lockKey, lockValue, seconds * 1000);
                console.log(`${Date.now()} take UpdateLock for key: ${key} take: ${lockValue}`);
                break;
            }
            await this.sleep(100);
        }
        return { key: key, lockKey: lockKey, lockValue: lockValue };
    },
    async getLockObjectNoWait(key,seconds=5) {
        var lockKey = `lock:${key}`;
        var lockValue = this.randomString();
        var lockObject = this.getValueFromLocalStorage(lockKey);
        if (lockObject == null) {
            this.setValueFromLocalStorage(lockKey, lockValue, seconds * 1000);
            console.log(`${Date.now()} take UpdateLock for key: ${key} take: ${lockValue}`);
            return { key: key, lockKey: lockKey, lockValue: lockValue };
        }
    },
    async removeWithKeyLock(lockObject) {
        await this.sleep(1000);
        var storageValue = this.getValueFromLocalStorage(lockObject.lockKey);
        if (storageValue != lockObject.lockValue) {
            console.log(`${Date.now()} check UpdateLock fail for key: ${lockObject.key} storage: ${storageValue} take: ${lockObject.lockValue}`);
            return false;
        }
        this.removeValueFromLocalStorage(lockObject.lockKey);
        return true;
    },
    async updateWithKeyLock(lockObject, value) {
        await this.sleep(1000);
        var storageValue = this.getValueFromLocalStorage(lockObject.lockKey);
        if (storageValue != lockObject.lockValue) {
            console.log(`${Date.now()} check UpdateLock fail for key: ${lockObject.key} storage: ${storageValue} take: ${lockObject.lockValue}`);
            return false;
        }
        this.setValueNotExpired(lockObject.key, value);
        if (this.getValueFromLocalStorage(lockObject.lockKey) == lockObject.lockValue) {
            console.log(`${Date.now()} remove UpdateLock for key: ${lockObject.key}`);
            this.removeValueFromLocalStorage(lockObject.lockKey);
        }
        return true;
    },
    async checkWithKeyLock(lockObject, value) {
        await this.sleep(1000);
        var storageValue = this.getValueFromLocalStorage(lockObject.lockKey);
        if (storageValue != lockObject.lockValue) {
            console.log(`${Date.now()} check UpdateLock fail for key: ${lockObject.key} storage: ${storageValue} take: ${lockObject.lockValue}`);
            return false;
        }
        return true;
    },
    async updateBuildHistory(jenkinsName, historyArr) {
        var currentKey = this.keys.BuildHistory;
        while (true) {
            var originalHistory = this.getBuildHistoryByNameFromCache(jenkinsName) ?? {};
            var updateFlag = false;
            for (var item of historyArr) {
                var originVersion = originalHistory[item.ver];
                if (originVersion == null || JSON.stringify(originVersion) != JSON.stringify(item)) {
                    originalHistory[item.ver] = item;
                    updateFlag = true;
                }
            }
            if (updateFlag) {
                var lockObject = await this.getLockObject(currentKey);
                var val = this.getBuildHistoryFromCache(currentKey);
                val[jenkinsName] = originalHistory;
                var res = await this.updateWithKeyLock(lockObject, val);
                if (res) {
                    return;
                }
                console.log(`${Date.now()} try again for key: ${lockObject.key}`);
            }
            else {
                return;
            }
        }
    },

    async maskDivNoChoice(){
        var maskDiv = $('<div style="background-color: #ade2ff99;height: 5000px;position: absolute;z-index: 9999;width: 100%;top: 0px;left: 0px;"></div>');
        maskDiv.css({'padding':'45%','font-size':'50px'});
        $('body').append(maskDiv);
        return maskDiv;
    },
    async maskDiv(condition, action, $, waitTime = 1500) {
        $ = $ || unsafeWindow.$;
        var maskDiv = $('<div style="background-color: #ade2ff99;height: 5000px;position: absolute;z-index: 9999;width: 65%;top: 0px;left: 0px;"></div>');
        var maskDivEx = $('<div style="background-color: #ffc6ba99;height: 5000px;position: absolute;z-index: 9999;width: 35%;top: 0px;left: 65%;"></div>');
        var userAction = false;
        var cancelSignal = false;
        maskDiv.click(function () {
            userAction = true;
            cancelSignal = false;
            maskDiv.remove();
            maskDivEx.remove();
        });
        maskDivEx.click(function () {
            userAction = true;
            cancelSignal = true;
            maskDiv.remove();
            maskDivEx.remove();
        });
        $('body').append(maskDiv).append(maskDivEx);
        // wait user cancel or 1.5 seconds
        await lymTM.async(() => userAction, waitTime);
        // wait condition, for example:chrome auto fill
        if (condition) {
            await lymTM.async(condition);
            // when user click, chrome auto fill event will trigger first,so we need to wait cancelSignal for a while;
            await lymTM.async(50);
        }
        if (!cancelSignal) {
            maskDiv.remove();
            maskDivEx.remove();
            action();
        }
    },
    guid() {
        var S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    runJob(func, ts, immediately = true) {
        var processing = false;
        var job = async () => {
            if (processing) {
                return;
            } else {
                processing = true;
                try {
                    await func();
                } catch (e) {
                    console.log(e);
                }
                processing = false;
            }
        };
        setInterval(job, ts);
        if (immediately) {
            setTimeout(job, 0);
        }
    },
    alreadyDone(obj) {
        var res = this.transferJqueryObj(obj);
        return res.lymTMDone;
    },
    done(obj) {
        var res = this.transferJqueryObj(obj);
        res.lymTMDone = true;
    },
    clear(obj) {
        var res = this.transferJqueryObj(obj);
        res.lymTMDone = false;
    },
    async doOnceBy(obj, func) {
        if (!this.alreadyDone(obj)) {
            await func(this.transferJqueryObj(obj));
            this.done(obj);
        }
    },
    async doOnce(func) {
        var obj = $('body');
        if (!this.alreadyDone(obj)) {
            await func();
            this.done(obj);
        }
    },
    levenshtein(a, b) {
        var dp = [0];
        for (let j = 1; j <= b.length; j++) dp[j] = j;
        var t1, t2;
        for (let i = 1; i <= a.length; i++) {
            t1 = dp[0]++;
            for (let j = 1; j <= b.length; j++) {
                t2 = dp[j];
                if (a[i - 1] == b[j - 1])
                    dp[j] = t1;
                else
                    dp[j] = Math.min(t1, Math.min(dp[j - 1], dp[j])) + 1;
                t1 = t2;
            }
        }
        return dp[b.length];
    },
    alert(msg, timeout = 1500) {
        var mask = $('<div style="overflow:hidden;background-color: #ade2ff;position: fixed;z-index: 9999;top: 20%;left: 33%;width:33%;min-height:80px;padding:15px;font-size:20px;font-weight:bold;display:none;border-radius:4px;border:2px solid dodgerblue"></div>');
        mask.html(msg);
        $('body').append(mask);
        mask.fadeIn(200);
        setTimeout(() => mask.fadeOut(500), timeout);
    },
    mockCondition: function (method, url, urlCondition, changeUrl, changeReq, changeRes) {
        var changeRequest, changeResponse;
        var flag = false;
        if (typeof urlCondition == "string") {
            flag = url.toLowerCase().includes(urlCondition.toLowerCase())
        } else if (typeof urlCondition == "function") {
            flag = urlCondition(url);
        } else if (urlCondition instanceof RegExp) {
            flag = urlCondition.test(url);
        }
        if (flag) {
            changeRequest = a => {
                var json = JSON.parse(a);
                if (changeReq) { json = changeReq(json); }
                return JSON.stringify(json);
            }
            changeResponse = a => {
                if (changeRes) { a = changeRes(a); }
                return a;
            }
        }
        if (changeUrl) {
            [url, method] = changeUrl(url, method);
        }
        return [changeRequest, changeResponse, url, method];
    },
    async mockApi(urlCondition, changeUrl, changeReq, changeRes) {
        var changeRequest, changeResponse, url, method;
        let origin = XMLHttpRequest.prototype.open;
        var mockCondition = this.mockCondition;
        XMLHttpRequest.prototype.open = function (...args) {
            [changeRequest, changeResponse, url, method] = mockCondition(args[0], args[1], urlCondition, changeUrl, changeReq, changeRes);
            // 在这里插入open拦截代码
            var tmp = this.__on_response;
            this.__on_response = (a) => {
                var aex = a;
                if (changeResponse) { aex = changeResponse(aex); }
                if (tmp) {
                    aex = tmp(aex);
                }
                return aex;
            };
            var argsEx = args;
            argsEx = args || [];
            argsEx = argsEx.slice(2);
            argsEx.unshift(url);
            argsEx.unshift(method);
            return origin.apply(this, argsEx);
        };
        let originSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (...args) {
            var argsEx = args;
            // 在这里插入send拦截代码
            if (changeRequest) {
                argsEx = args || [];
                argsEx = argsEx.slice(1);
                argsEx.unshift(changeRequest(args[0]));
            }
            return originSend.apply(this, argsEx);
        };
        var accessor = Object.getOwnPropertyDescriptor(
            XMLHttpRequest.prototype,
            "response"
        );

        Object.defineProperty(XMLHttpRequest.prototype, "response", {
            get: function () {
                let response = accessor.get.call(this);
                if (this.__on_response) {
                    // 在__on_response里修改你的response
                    response = this.__on_response(response)
                }
                return response;
            },
            set: function (str) {
                return accessor.set.call(this, str);
            },
            configurable: true,
        });
    },
    isGuid: function (guid) {
        var reg = new RegExp(/^[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}$/);
        if (reg.test(guid)) {
            return true;
        }
        return false;
    },
    getTextContent: function (obj) {
        var node = this.transferJqueryObj(obj);
        return [].filter.call(node.childNodes, a => a.nodeType == 3)[0]?.textContent;
    },
    wheel: async function (func) {
        // $(document) does not work sometimes, don't know why.
        $('body').on("mousewheel DOMMouseScroll", async function (e) {
            var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) ||
                (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
            if (delta != 0) {
                await func(delta);
            }
        });
    },
    urlIsOpen(url) {
        var obj = this.getValue(this.keys.Url);
        if (!obj) {
            return false;
        }
        if (obj[url] == 'open') {
            return true;
        }
        return false;
    },
    urlSetOpen(url) {
        var obj = this.getValue(this.keys.Url);
        if (!obj) {
            obj = {};
        }
        obj[url] = 'open';
        this.setValue(this.keys.Url, obj);
    },
    urlSetClose(url) {
        var obj = this.getValue(this.keys.Url);
        if (!obj) {
            obj = {};
        }
        obj[url] = 'close';
        this.setValue(this.keys.Url, obj);
    },
    randomString(length = 10) {
        var src = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var res = "";
        for (var i = 0; i < length; i++) {
            var id = Math.floor(Math.random() * 62);
            res += src[id];
        }
        return res;
    },
    splitTextByRegExp(text, exp) {
        if (exp.test(text)) {
            return RegExp.$1;
        }
        return '';
    },
    close() {
        close();
    },
};
lymTM.init();
