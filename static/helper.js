//simple helper functions
function sortDict(ogDict){
    let keys = Object.keys(ogDict);
    let sortedKey = keys.sort(function(a,b){return ogDict[b]-ogDict[a]});
    let sortedArr = [];
    for(let key of sortedKey){
        sortedArr.push([key, ogDict[key]]);
    }
    return sortedArr;
}

function sortArr(ogArr, key){
    let newArr = ogArr.sort(function(a,b){return b[key]-a[key]})
    return newArr;
}

function EnterExec(jq, callback){ //press enter to execute
    $(jq).keypress(function(e){
        if(e.which == 13){
            callback();
        }
    });
}

//todo
function iterateAll(next_url){
    if(token){
        let temp = [];
        let continuue = true;
        try{
            while(continuue){
                spott_get_sync(next_url, token, function(xhr){
                    if(xhr == 'nooooooooo'){
                        continuue = false;
                        temp = null;
                    }else{
                        temp = temp.concat(xhr['items']);
                        if(xhr['next']){
                            next_url = xhr['next'];
                        }else{
                            continuue = false;
                        }
                    }
                });
            }
            return temp;
        }catch{
            alert('bruh');
            return;
        }
    }else{
        alert('pleas login');
        return;
    }
}

function DaystoToday(date){ //date in ISO format
    target = new Date(date);
    today = new Date();
    return Math.round((today-target)/86400000) //ms to day
}

function dict_len(dict){
    return Object.keys(dict).length;
}

function printable2(array, num, targetDiv, title1, title2, title3=null){ //array structure: [[a,b],[c,d],....]
    let tableHtml = '<table style=""><th>'+title1+'</th>'+
            '<th>'+title2+'</th>';
    if(title3){
        tableHtml += '<th>'+title3+'</th>';
    }
    for(let i=0; i<num; i++){
        if(!array[i]){ //is less than num artists
            break;
        }
        tableHtml += '<tr><td>'+array[i][0]+'</td>'+
                '<td>'+array[i][1]+'</td>'
        if(title3){
            tableHtml += '<td>'+array[i][2]+'</td>';
        }
        tableHtml += '</tr>';
    }
    $('#'+targetDiv).html(tableHtml);
}

function printable4(array, num, targetDiv, title1, title2, title3, title4=null){ //array structure: [[a,b],[c,d],....]
    let tableHtml = '<table style=""><th>'+title1+'</th>'+
            '<th>'+title2+'</th>'+
            '<th id="days_th">'+title3+'</th>';
    if(title4){
        tableHtml += '<th id="count_th">'+title4+'</th>';
    }
    for(let i=0; i<num; i++){
        if(!array[i]){ //is less than num artists
            break;
        }
        let [track, artists] = array[i][0].split(ARTIST_SEP);
        tableHtml += '<tr><td>'+track+'</td>'+
                '<td>'+artists+'</td>'+
                '<td>'+array[i][1]+'</td>';
        if(title4){
            tableHtml += '<td>'+array[i][2]+'</td>';
        }
        tableHtml += '</tr>';
    }
    $('#'+targetDiv).html(tableHtml);
}