// ==UserScript==
// @name         qilongji2
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://*.90123.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(async function wrap() {
    // force async at first
    await lymTM.async();
    var time = lymTM.start();
    $ = time.$;
    await process(wrap, time);
    // log execution time
    time.end();
})();
var $;
var serverId; // 游戏服务器
var cityMapId; // 本城 mapId
var searchLimit = 70;// 搜索最远距离
async function process(func, time) {
    serverId = location.host.split('.').shift();
    // 验证码去掉自动提示
    lymTM.runJob(checkCodeThread, 300);
    setTimeout(lymTM.clearExpiredKeys,0);
    setTimeout(lymTM.clearExpiredKeysFromLocalStorage,0);

    // 狩猎
    if(location.pathname=="/outarms.ql"){
        // 自动狩猎手工设置
        lymTM.runJob(autoHuntingThread, 300);
        // 自动狩猎 随机延迟执行
        setTimeout(autoHuntingJobThread, randomSeconds(0.3,1.5));
    }
    // 军事指挥所
    if(location.href.includes("/building12.ql")){
        // 自动狩猎控制中心
        lymTM.runJob(outBoxAndheroInfoThread, 300);
        // 自动访车、恶魔城
        lymTM.runJob(outBoxAndheroInfoExThread, 300);
    }
    // 地图
    if(location.href.includes("/map/index.ql")){
        // 收集地图信息
        lymTM.runJob(collectMapThread, 100);
    }
    if(location.href.includes("city/index.ql")){
        var clearLink = $('<a>').attr('href','javascript:void(0)').css({'color':'green','margin-left':'5px'}).text('停止自动出征');
        var clearLinkEx = $('<a>').attr('href','javascript:void(0)').css({'color':'green','margin-left':'10px'}).text('清空任务');
        $('h1').append(clearLink).append(clearLinkEx);
        clearLink.click(()=>{
            var res = confirm("确认停止自动出征?");
            if(res){
                clearAuthHuntingValues();
                lymTM.alert('已停止自动出征',500)
            }
        });
        clearLinkEx.click(()=>{
            var res = confirm("确认清空任务?");
            if(res){
                clearAutoSearchValues();
                lymTM.alert('已清空任务',500)
            }
        });
    }
}


var typeNameMappings = {'':'','a':''};
var autoHuntingListenerKeyPre = "autoHuntingListenerKey_serverId_";
var autoSearchListenerKeyPre = "autoSearchListenerKey_serverId_";
var autoHuntingKeyPre = "autoHuntingKey_serverId_";
var autoSearchKeyPre = "autoSearchKey_serverId_";
var mapKeyPre = "mapKey_serverId_";
var autoHuntingLockKeyPre = "autoHuntingLockKey_serverId_";
var autoSearchLockKeyPre = "autoSearchLockKey_serverId_";
var refreshControllerKeyPre = "refreshControllerKey_serverId_";
var completedHeroList=[];
function getRefreshControllerKey(){
    return refreshControllerKeyPre+serverId;
}
function getAutoHuntingListenerKey(mapId){
    return autoHuntingListenerKeyPre+serverId+'_mapId_'+mapId;
}
function getAutoSearchListenerKey(mapId){
    return autoSearchListenerKeyPre+serverId+'_mapId_'+mapId;
}
function getAutoHuntingKey(heroId){
    return autoHuntingKeyPre+serverId+'_heroId_'+heroId;
}
function getAutoHuntingLockKey(mapId){
    return autoHuntingLockKeyPre+serverId+'_mapId_'+mapId;
}
function getAutoSearchLockKey(heroId){
    return autoSearchLockKeyPre+serverId+'_heroId_'+heroId;
}
function getAutoSearchKey(heroId){
    return autoSearchKeyPre+serverId+'_heroId_'+heroId;
}
function getMapKey(type){
    return mapKeyPre+serverId+'_type_'+type;
}
function getValue(key){
    return lymTM.getValueFromLocalStorage(key);
}
function saveLockValue(key,value){
    var expiry = 20 * 1000;
    lymTM.setValueFromLocalStorage(key,value,expiry);
}
function saveValue(key,value,expiry = 5 * 60 * 60 * 1000){
    lymTM.setValueFromLocalStorage(key,value,expiry);
}
function saveValueNotExpire(key,value){
    var expiry = 1e13;
    lymTM.setValueFromLocalStorage(key,value,expiry);
}
function listAutoHuntingValues(){
    var keys = lymTM.listValueFromLocalStorage(autoHuntingKeyPre);
    var heroListInLocalStorage = keys.map((a,b)=>lymTM.getValueFromLocalStorage(a));
    var heroMapInLocalStorage = new Map();
    for(var item of heroListInLocalStorage){
        heroMapInLocalStorage.set(item.heroId,item);
    }
    return heroMapInLocalStorage;
}
function listMapValues(){
    var keys = lymTM.listValueFromLocalStorage(mapKeyPre);
    var mapListInLocalStorage = keys.map((a,b)=>lymTM.getValueFromLocalStorage(a));
    var mapMapInLocalStorage = new Map();
    for(var item of mapListInLocalStorage){
        mapMapInLocalStorage.set(item.key,item);
    }
    return mapMapInLocalStorage;
}
function clearAutoSearchValues(){
    for(let item of lymTM.listValueFromLocalStorage(autoSearchKeyPre).values()){
        lymTM.removeValueFromLocalStorage(item);
    }
}
function clearAuthHuntingValues(){
    for(var item of listAutoHuntingValues().values()){
        lymTM.removeValueFromLocalStorage(item.key);
    }
    for(let item of lymTM.listValueFromLocalStorage(autoHuntingLockKeyPre).values()){
        lymTM.removeValueFromLocalStorage(item);
    }
    for(let item of lymTM.listValueFromLocalStorage(autoHuntingListenerKeyPre).values()){
        lymTM.removeValueFromLocalStorage(item);
    }
}
function clearMapValues(){
    for(var item of lymTM.listValueFromLocalStorage(mapKeyPre).values()){
        lymTM.removeValueFromLocalStorage(item);
    }
}
function randomSeconds(min,max){
    return Math.random()*max*1000+1000*min;
}
function checkCodeThread(){
    $('input[name=checkCode]').attr('autocomplete','off');
}
async function autoHuntingThread(){
    // 在出征后，页面已改变。
    if(!$){
        saveValue(getRefreshControllerKey(),Math.random());
        lymTM.close();
    }
    var submit = await lymTM.async(()=>$('[name=outForm] :submit'));
    await lymTM.doOnceBy(submit, ()=>{
        var mapId = lymTM.splitTextByRegExp( $('input[name=_hook]').val(),/mapId:(\d*)/);
        // 准备页面，不操作
        if(mapId==''){
            return;
        }
        var timesInput = $('<input maxlength="2" type="number" max="99" min="1">').css({'width':'40px','margin-left':'10px'}).val(1);
        timesInput[0].oninput=(e)=>{
            var input = e.target;
            if(input.value<1){input.value=1;}
            if(input.value>99){input.value=99;}
            let color =input.value!=1?'lightgreen':'';
            if(input.value>10){color='pink';}
            input.style.backgroundColor=color;
        };
        timesInput[0].onchange = timesInput[0].oninput;
        timesInput[0].onmousewheel = (e)=>{};
        var timesLabel = $('<label>').text('自动重复次数').css({'margin-left':'3px','margin-right':'10px','color':'red'});
        submit.after(timesLabel).after(timesInput);
        document.onwheel = (e)=>{
            if(timesInput[0]!=document.activeElement){
                return;
            }
            if(e.wheelDelta>0){
                timesInput.val(+timesInput.val()+1).change();
            }
            else{
                timesInput.val(+timesInput.val()-1).change();
            }
        };
        var form =submit.attr('form');
        form.onsubmit=()=>{
            // 最终确认页 && 自动出征次数大于 1
            if(form.action.value==2 && timesInput.val()>1){
                var obj={};
                obj.heroIdList = $(form).find('[name=heroId]').map((a,b)=>b.value);
                obj.x = form.x.value;
                obj.y = form.y.value;
                obj.m = form.m.value;
                obj.mapId = mapId;
                if(mapId == ''){
                    alert('mapId 不正确');
                    return;
                }
                if(form.m.value == null){
                    alert('m 不正确');
                    return;
                }
                obj.url = `https://${serverId}.90123.com/outarms.ql?from=map&m=${form.m.value}&mapId=${mapId}&webprotocol=https:`
                obj.times = timesInput.val() -1;
                for(var i=0;i< obj.heroIdList.length;i++){
                    obj.heroId = obj.heroIdList[i];
                    obj.key = getAutoHuntingKey(obj.heroId);
                    saveValue(obj.key,obj);
                }
            }
        };
    });
}
async function autoHuntingJobThread(){
    var mapId = lymTM.splitTextByRegExp( $('input[name=_hook]').val(),/mapId:(\d*)/);
    // 准备页
    var isPreparePage = mapId=='';
    if(isPreparePage){
        mapId = lymTM.getQueryString('mapId',location.search);
    }
    var pics = $('.hero_info:first').find('input[name=heroId]');
    var heroMapInLocalStorage = listAutoHuntingValues();
    var heros = pics.map((a,b)=>{
        var heroId = b.value;
        return heroId;
    });
    // 没有英雄，说明已经出征过，刷新父页面
    if(heros.length==0){
        lymTM.setValue(getAutoHuntingListenerKey(mapId),'ok');
    }
    for(var j=0;j<heros.length;j++){
        var heroId = heros[j];
        var value = heroMapInLocalStorage.get(heroId);
        if(value != null && value.times>0 && value.mapId==mapId){
            for(var i=0;i<value.heroIdList.length;i++){
                var hasHero;
                for(var item in heros){
                    if(heros[item]==value.heroIdList[i]){
                        hasHero=true;
                        break;
                    }
                }
                if(!hasHero){
                    return;
                }
                if(isPreparePage){
                    // 每次只执行一个任务
                    await runWith(value);
                }
                else{
                    // 每次只执行一个任务
                    await checkWith(value,mapId);
                }
                break;
            }
        }
    }
}
async function runWith(value) {
    for(var i=0;i<value.heroIdList.length;i++){
        var heroCheckBox = $('.army_ge').parent().children('.hero_info:first').find('input[name=heroId][value='+value.heroIdList[i]+']');
        heroCheckBox.attr('checked',true).change();
        $('input[name=m][value='+value.m+']').attr('checked',true).change();
    }
    $('form[name=outForm] :submit').click();
}
async function checkWith(value,mapId) {
    if($('input[name=m]').val()!=value.m){
        alert('发现 m 不正确，如果是手动出征，请无视这条警告。');
        return;
    }
    if(mapId!=value.mapId){
        alert('发现 mapId 不正确，如果是手动出征，请无视这条警告。');
        return;
    }
    value.times--;
    saveValue(value.key,value);
    lymTM.setValue(getAutoHuntingListenerKey(mapId),'ok');
    $('form[name=outForm] :submit').click();
}
function url(src){
    if(src.startsWith("http")){
        return new URL(src);
    }
    var url = 'https://test'+(src.startsWith('/')?src:'/'+src);
    return new URL(url);
}
function removeKeyAndReload(){
    lymTM.removeValueFromLocalStorage(getRefreshControllerKey());
    location.reload();
}
async function outBoxAndheroInfoThread(){
    lymTM.addListener(getRefreshControllerKey(),removeKeyAndReload);
    if(getValue(getRefreshControllerKey())!=null){
        // 加入延迟，以减缓由代码问题引起的死循环刷新页面。
        await lymTM.async(1000);
        removeKeyAndReload();
    }
    var labelText = '剩余次数';
    var cityText = $('#scrInner .army_tip li.com_c>strong').text();
    var positionText = lymTM.splitTextByRegExp(cityText,/\((-*\d+\|-*\d+)\)/);
    var positionArray = positionText.split('|');
    cityMapId = (+positionArray[0]+5000)*10000+5000+(+positionArray[1]);
    // cityId = $('#cityList a:has(img[src*=city_on])').attr('cityId');
    // 城内英雄
    var picsInCity = $('.army_ge').parent().children('.hero_info:first').find('a.pic');
    var heroMapInLocalStorage = listAutoHuntingValues();
    var herosInCity = picsInCity.map((a,b)=>{
        var heroId = lymTM.getQueryString('heroId', url(b.href).search);
        return heroId;
    });
    // 城内英雄 和 城外英雄
    var heroLi = $('ul.hero_info>li:has(a.pic)');
    // 初始化所有英雄
    heroLi.map((a,b)=>{
        lymTM.doOnceBy(b, ()=>{
            var heroId = lymTM.getQueryString('heroId', url($(b).find('a.pic').attr('href')).search);
            var heroLabel = $('<label>').text(labelText).css({'margin-left':'3px','color':'red'}).hide();
            var heroDropDown = $('<select>').text(labelText).data('heroId',heroId).css({'margin-left':'3px','visibility':'visible','width':'80px'}).hide();
            heroDropDown.append($('<option>').val('').text('无任务'));
            heroDropDown.append($('<option>').val('17').text('扫恶魔城'));
            heroDropDown.append($('<option>').val('71').text('访风车'));
            heroDropDown.append($('<option>').val('72').text('访水车'));
            heroDropDown.append($('<option>').val('xlemjy').text('杀巡逻恶魔精英'));
            $(b).find('h3>span').after(heroDropDown).after(heroLabel);
            heroDropDown.change(()=>{
                var key = getAutoSearchKey(heroId);
                if(heroDropDown.val()){
                    value={key:key,heroId:heroId,type:heroDropDown.val(),cityMapId:cityMapId};
                    saveValue(key,value);
                }
                else{
                    lymTM.removeValueFromLocalStorage(key);
                }
            });
        });
    });
    // 给所有英雄增加额外提示信息
    for(var j=0;j<heroLi.length;j++){
        var b = heroLi[j];
        var heroId = lymTM.getQueryString('heroId', url($(b).find('a.pic').attr('href')).search);
        var value = heroMapInLocalStorage.get(heroId);
        var searchValue =getValue(getAutoSearchKey(heroId));
        // 删除已经完成的狩猎任务
        if(value!=null && value.times<=0){
            lymTM.removeValueFromLocalStorage(getAutoHuntingKey(heroId));
            value = null;
        }
        let lb = $(b).find('h3>span').next('label');
        // 有自动狩猎任务的英雄
        if(value != null){
            if(lb.text()!=labelText+value.times){
                lb.text(labelText+value.times).show();
                lb.next('select').hide();
            }
            for(var i=0;i<herosInCity.length;i++){
                if(herosInCity[i]==heroId){
                    if(value.times==1){
                        lb.text('准备出征中')
                    }
                    // 一次只能开一个新窗口
                    var lockObject = await lymTM.getLockObjectNoWait(getAutoHuntingLockKey(value.mapId),20);
                    if(lockObject==null){
                        break;
                    }
                    var checkResult = await lymTM.checkWithKeyLock(lockObject,lockObject.lockValue);
                    if(!checkResult){
                        break;
                    }
                    var win = lymTM.open(value.url);
                    var listenerKey = getAutoHuntingListenerKey(value.mapId);
                    var getAction = function(lockObject,win,isLastAction,value){
                        return async(a,b,c)=>{
                            // 等待子页面提交完
                            await lymTM.async(2000);
                            var isChildClosed = win.closed;
                            win.close();
                            // 兜底时如果子页面已关
                            if(isLastAction){
                                if(isChildClosed){
                                    // 说明已经被回调处理过，什么也不做
                                }
                                else if(value.hide){ // 是自动搜索借用的自动狩猎，无论子页面是否成功，都需要删掉自动狩猎对象。
                                    lymTM.removeValueFromLocalStorage(value.key);
                                    await lymTM.removeWithKeyLock(lockObject);
                                    location.reload();
                                }
                                else{
                                    await lymTM.removeWithKeyLock(lockObject);
                                    location.reload();
                                }
                            }
                            // 回调时刷新本页面
                            else{
                                if(value.hide){ // 是自动搜索借用的自动狩猎，无论子页面是否成功，都需要删掉自动狩猎对象。
                                    lymTM.removeValueFromLocalStorage(value.key);
                                }
                                await lymTM.removeWithKeyLock(lockObject);
                                location.reload();
                            }
                        }
                    };
                    lymTM.listenOnce(listenerKey, getAction(lockObject,win,false,value));
                    // 兜底关窗
                    setTimeout(getAction(lockObject,win,true,value),15*1000);
                }
            }
        }
        // 没有狩猎任务
        else{
            if(lb.is(':visible')){
                lb.text(labelText).hide();
            }
            lb.next('select').show();
        }

        // 有搜索任务的英雄
        if(searchValue){
            lb.next('select').val(searchValue.type);
            for(var k=0;k<herosInCity.length;k++){
                // 只操作在城内的英雄
                if(herosInCity[k]==heroId){
                    var mapValue = getValue(getMapKey(searchValue.type));
                    // 待刷新列表
                    var mapList = [];
                    for(var item in mapValue){
                        if(distance(item,cityMapId)<searchLimit){
                            // 时差秒
                            var datediff = (new Date()-new Date(mapValue[item].time))/1000;
                            var pendingDatediff = (new Date()-new Date(mapValue[item].pending))/1000;
                            // 更新时间早于 3 分钟前
                            if(datediff/60>3){
                                switch(+mapValue[item].type){
                                    case 17: // 恶魔城
                                    case 71: // 风车
                                    case 72: // 水车
                                        // 被攻击过，且更新时间小于12小时
                                        if(mapValue[item].status!=0&&datediff/3600<12){
                                        }
                                        // 正被攻击，且更新时间小于1小时
                                        else if(mapValue[item].pending&&pendingDatediff/3600<1){
                                        }
                                        else{
                                            mapList.push(mapValue[item]);
                                        }
                                        break;
                                }
                            }
                        }
                    }
                    var jsonArray = mapList.map((a,b)=>a.mapId);
                    if(jsonArray.length>=50){
                        jsonArray.length=50;
                        // alert(`地图数 ${jsonArray.length} 可能不正确！`);
                    }
                    var json = jsonArray.join();
                    if(jsonArray.length>0){
                        console.log('正在查询'+jsonArray.length+'个地址');
                        await lymTM.postForm(`https://${serverId}.90123.com/ajaxmap.ql`,`json={"mapIds":"${json}"}`,(a)=>{
                            var res = JSON.parse(a);
                            console.log(a);
                            var key = getMapKey(searchValue.type);
                            var mapValue = getValue(key);
                            for(var item in res){
                                var value = mapValue[item];
                                if(value){
                                    value.time = new Date();
                                    value.status = res[item].status;
                                }
                            }
                            saveValue(key,mapValue);
                        });
                    }
                    else{
                        var minDistance=999;
                        var minMapId;
                        for(let item in mapValue){
                            var cDistance = distance(item,cityMapId);
                            if(cDistance<searchLimit){
                                // 时差秒
                                let pendingDatediff = (new Date()-new Date(mapValue[item].pending))/1000;
                                switch(+mapValue[item].type){
                                    case 17: // 恶魔城
                                    case 71: // 风车
                                    case 72: // 水车
                                        // 未被攻击过
                                        if(mapValue[item].status==0){
                                            // 被攻击标志更新时间早于 1 小时前，或者没有正被攻击标志。
                                            if((mapValue[item].pending && pendingDatediff/3600>1||!mapValue[item].pending)){
                                                if(minDistance>cDistance){
                                                    minDistance = cDistance;
                                                    minMapId = item;
                                                }
                                            }
                                        }
                                        break;
                                }
                            }
                        }
                        if(minMapId){
                            await searchWithMapId(minMapId,heroId,searchValue.type);
                        }
                        else{
                            lymTM.alert('自动搜索完成，没有合适的地点。可能是没有刷地图引起的。');
                        }
                    }
                }
            }

        }


    }
}
async function searchWithMapId(mapId,heroId,type){
    // 一次只能开一个新窗口。 mapId 会被更新 pending，所以只需要保证 heroId 一次执行一个。
    var lockObject = await lymTM.getLockObjectNoWait(getAutoSearchLockKey(heroId),20);
    if(lockObject==null){
        return;
    }
    var checkResult = await lymTM.checkWithKeyLock(lockObject,lockObject.lockValue);
    if(!checkResult){
        return;
    }
    // var win = lymTM.open(`https://${serverId}.90123.com/outarms.ql?from=map&m=2&mapId=${mapId}&webprotocol=https:`);
    // var listenerKey = getAutoSearchListenerKey(mapId);
    // var getAction = function(lockObject,win,mapId){
    //     return async(a,b,c)=>{
    //         await lymTM.async(2000);
    //         win.close();
    //         await lymTM.removeWithKeyLock(lockObject);
    //         location.reload();
    //     }
    // };
    // lymTM.listenOnce(listenerKey, getAction(lockObject,win));
    var obj={};
    obj.heroIdList = {0:heroId,length:1};
    obj.x = Math.floor(mapId/10000-5000);
    obj.y = mapId%10000-5000;
    obj.m = 2;
    obj.mapId = mapId;
    obj.url = `https://${serverId}.90123.com/outarms.ql?from=map&m=${obj.m}&mapId=${mapId}&webprotocol=https:`
    obj.times = 1;
    obj.heroId = heroId;
    obj.key = getAutoHuntingKey(obj.heroId);
    // 隐藏显示出征次数
    obj.hide = true;
    saveValue(obj.key,obj);
    var key = getMapKey(type);
    var mapValue = getValue(key);
    mapValue[mapId].pending=new Date();
    saveValue(key,mapValue);
}
function distance(a,b){
    var mapId1 = +a;
    var mapId2 = +b;
    var x1 = Math.floor(mapId1/10000-5000);
    var x2 = Math.floor(mapId2/10000-5000);
    var y1 = mapId1%10000-5000;
    var y2 = mapId2%10000-5000;
    var distance = Math.sqrt(Math.pow(Math.abs(x1-x2),2) + Math.pow(Math.abs(y1-y2),2));
    return distance;
}
async function outBoxAndheroInfoExThread(){
    var autoSearchList = getValue(getAutoSearchKey());

}
async function collectMapThread(){
    var mapTitle=$('#ttlXy');
    lymTM.doOnceBy(mapTitle, ()=>{
        var clearLink = $('<a>').attr('href','javascript:void(0)').css({'color':'green','font-weight':'bold'}).text('清空已保存的地图');
        mapTitle.after(clearLink);
        clearLink.click(()=>{
            var res = confirm("确认清空已保存的地图?");
            if(res){
                clearMapValues();
                lymTM.alert('已清空保存的地图',500)
            }
        });
        var searchSelect = $('<select>').css({'visibility':'visible'});
        searchSelect.append($('<option>').val(0).text(`收集本城附近地图`));
        // 过多的地图会引起 localStorage 超出限制。按需使用该功能。
        for(var i=3;i<10;i++){
            searchSelect.append($('<option>').val(i).text(`${i}屏`));
        }
        mapTitle.after(searchSelect);
        searchSelect.change(async()=>{
            var index = searchSelect.val();
            if(!index){return;}
            var northBtn = $('map[name=drtGo]>area[name=n]');
            var eastBtn = $('map[name=drtGo]>area[name=e]');
            var westBtn = $('map[name=drtGo]>area[name=w]');
            var southBtn = $('map[name=drtGo]>area[name=s]');
            var middleBtn = $('map[name=drtGo]>area[name=m]');
            var delay = 1000;
            var mask = await lymTM.maskDivNoChoice();

            for(let j=0;j<index;j++){
                // do not wait for longtime when click middleBtn
                middleBtn.click();
                await lymTM.async(100);
                for(let l=0;l<j;l++){
                    eastBtn.click();
                    await lymTM.async(delay);
                }
                for(let k=0;k<index;k++){
                    northBtn.click();
                    await lymTM.async(delay);
                }
                middleBtn.click();
                await lymTM.async(100);
                for(let l=0;l<j;l++){
                    // do not wait for longtime when click eastBtn for the second time
                    eastBtn.click();
                    await lymTM.async(100);
                }
                for(let k=0;k<index;k++){
                    southBtn.click();
                    await lymTM.async(delay);
                }
                // 为 0 时，跳过以下重复的步骤。
                if(j==0){continue;}
                middleBtn.click();
                await lymTM.async(100);
                for(let l=0;l<j;l++){
                    westBtn.click();
                    await lymTM.async(delay);
                }
                for(let k=0;k<index;k++){
                    northBtn.click();
                    await lymTM.async(delay);
                }
                middleBtn.click();
                await lymTM.async(100);
                for(let l=0;l<j;l++){
                    // do not wait westBtn for the second time
                    westBtn.click();
                    await lymTM.async(100);
                }
                for(let k=0;k<index;k++){
                    southBtn.click();
                    await lymTM.async(delay);
                }
            }

            mask.hide();
            searchSelect.val(0);

        });
        mapTitle.after($('<br>'));
    });
    $('#mapArs>div>img').map((a,b)=>{
        lymTM.doOnceBy(b, ()=>{
            var imageUrl = url(b.src);
            var fileNameArray = imageUrl.pathname.split(/\/|\./);
            fileNameArray.pop();
            var fileName = fileNameArray.pop();
            var typeArray = fileName.replace('area_','').split(/_|_/);
            var type = typeArray.shift();
            var status = typeArray.join();
            var key = getMapKey(type);
            var id = b.parentElement.id.replace(/\D/g,'');
            var value = {
                mapId:id,
                href:imageUrl.href,
                type:type,
                name:typeNameMappings[type],
                status:status,
                key:key,
                time:new Date(),
            };
            var valueInStorage = getValue(key);
            if(valueInStorage==null){
                valueInStorage={};
            }
            var oldValue = valueInStorage[id];
            if(oldValue){
                oldValue.status = value.status;
                oldValue.href = value.href;
                oldValue.time = value.time;
            }
            else{
                valueInStorage[id]=value;
            }
            saveValueNotExpire(key,valueInStorage);
        });
    });
}







