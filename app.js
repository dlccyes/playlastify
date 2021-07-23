
function get_token_implicit(){ //implicit grant flow
    var url='https://accounts.spotify.com/authorize'
    url += "?client_id=" + client_id;
    url += "&response_type=token";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&scope="+scopes;
    // url += "&show_dialog=true";
    location.href = url;
}

function login_token(){
    var url = String(window.location);
    if(url.search(/=/)!=-1){
        token = url.slice(url.search(/=/)+1,url.search(/&/));
        $('#logincomp').show();
    }else{
        $('#logincomp').hide();
    }
}

function login(){ //Authorization Code Flow
    var url='https://accounts.spotify.com/authorize'
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&scope="+scopes;
    // url += "&show_dialog=true";
    location.href = url;
}

function get_token(){ //Authorization Code Flow
    var newurl = String(window.location);
    var code = newurl.slice(newurl.search(/=/)+1,);
    var tolkien = null;
    $.ajax({
        method: "POST",
        url: "https://accounts.spotify.com/api/token",
        data: {
          "grant_type":    "authorization_code",
          "code":          code,
          "redirect_uri":  redirect_uri,
          "client_id":     client_id,
          "client_secret": client_secret,
        },
        async: false,
        success: function(result){
            tolkien = result['access_token'];
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus);
            console.log(jqXHR);
        },
        timeout: 5000
    });
    return tolkien; 
}

function spott_get(url, token, callback, async=true){
    if(token){
        $.ajax({
            async: async,
            url : url,
            dataType : 'json',
            type : 'GET',
            // async: false;
            headers : {
                // 'Acccept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+ token,
            },
            success: function(xhr) {
                if(callback){
                    callback(xhr);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('please logieen');
                if(callback){
                    callback('nooooooooo');
                }
                console.log('error ' + textStatus);
                console.log(jqXHR);
            },
            timeout: 5000
        });
    }else{
        alert('please login to Spotify first');
    }
}

function spott_get_sync(url, token, callback){ //sync version
    spott_get(url, token, callback, async=false);
}

function get_all_playlists(){
    if(token){
        // var continuue = true;
        temp = iterateAll('https://api.spotify.com/v1/me/playlists?limit=50');
        return temp;

    }else{
        // console.log('no token');
        alert('please login first');
    }

}

function get_all_liked_songs(){
    if(token){
        savedTracks = iterateAll('"https://api.spotify.com/v1/me/tracks?limit=50');
    }else{
        alert('please login first');
    }
}

function TrackNameArtistDate(tracks){
    var tracknameartistdate = {};
    for(var item of tracks){
        temp = item['track']['name']+' - ';
        for(var artist of item['track']['artists']){
            temp += artist['name'] + ', ';
        }
        temp = temp.slice(0,-2); //remove last ', '
        tracknameartistdate[temp] = DaystoToday(item['added_at']);
    }
    console.log(tracknameartistdate);
    return tracknameartistdate;
}

function ArtistDistribution(tracks){
    var artists = {};
    for(var item of tracks){
        // console.log(item);
        for(var artist of item['track']['artists']){
            if(!artists[artist['name']]){ //if artist isn't added before
                artists[artist['name']] = 0;
            }
            artists[artist['name']] += 1;
        }
    }
    // console.log(artists);
    return sortDict(artists);
}

function sortDict(ogDict){
    var keys = keys = Object.keys(ogDict);
    sortedKey = keys.sort(function(a,b){return ogDict[b]-ogDict[a]});
    sortedArr = [];
    // console.log(sortedKey);
    for(var key of sortedKey){
        sortedArr.push([key, ogDict[key]]);
    }
    // console.log(sortedArr);
    return sortedArr;
}

function sortArr(ogArr, key){
    newArr = ogArr.sort(function(a,b){return b[key]-a[key]})
    return newArr;
}

function get_playlist_audio_features(all_tracks){
    idStr = '';
    i=0;
    var playlistAudioFeaturesRaw = [];
    var playlistAudioFeatures = {'acousticness':0,'danceability':0,'duration_ms':0,'energy':0,'instrumentalness':0,
    'liveness':0,'loudness':0,'speechiness':0,'tempo':0,'valence':0};
    for(var item of all_tracks){
        i++;
        idStr += item['track']['id']+',';
        if(i%100 == 0 || item == all_tracks[all_tracks.length-1]){ //i|100 or i=last 
            // console.log(idStr);
            url = 'https://api.spotify.com/v1/audio-features?ids='+idStr;
            spott_get_sync(url, token, function(xhr){
                playlistAudioFeaturesRaw = playlistAudioFeaturesRaw.concat(xhr['audio_features']);
            });
            idStr = '';
        }
    }
    // console.log(playlistAudioFeaturesRaw);
    num = 0;
    for(var item of playlistAudioFeaturesRaw){
        if(item){
            for(var key in playlistAudioFeatures){
                // console.log(playlistAudioFeaturesRaw[i][key]);
                // console.log(item);
                playlistAudioFeatures[key] += item[key];
            }
            num += 1;
        }else{ //item = null when local
        }
    }
    // console.log(playlistAudioFeatures);
    for(var key in playlistAudioFeatures){
        playlistAudioFeatures[key] /= num; //avg
    }
    // console.log(playlistAudioFeatures);
    return playlistAudioFeatures;
}

function avg_popularity(all_tracks){
    var temp = 0;
    for(var item of all_tracks){
        if(item['track']['popularity']){
            temp += item['track']['popularity'];
        }
    }
    temp /= all_tracks.length;
    console.log(temp)
    return temp;
}

function get_playlist_details(use_liked_song=false){
    if(token){
        if(use_liked_song){
            var playlist_name = 'Liked Songs';
        }else{
            var playlists = get_all_playlists();
            name = $('#playlist_input').val();
            var playlist_id = '';
            var playlist_name = '';
            if($("#playlistExactMatch").prop("checked")==true){ //need exact match
                for(var i=0; i<playlists.length; i++) {
                    if(playlists[i]['name'] == name){ //ignore case and search
                        playlist_id = playlists[i]['id'];
                        playlist_name = playlists[i]['name'];
                    }
                }        
            }else{
                for(var i=0; i<playlists.length; i++){ //no need exact match
                    if(playlists[i]['name'].toLowerCase().indexOf(name.toLowerCase()) != -1){ //ignore case and search
                        playlist_id = playlists[i]['id'];
                        playlist_name = playlists[i]['name'];
                    }
                }
            }
            var current_playlist;
        }
        if(playlist_id != ''){
            if(use_liked_song){
                next_url = 'https://api.spotify.com/v1/me/tracks?limit=50';
                // spott_get_sync(next_url, token, function(xhr){
                //     console.log('saved',xhr);
                //     // temp = temp.concat(xhr['items']);
                //     // if(xhr['next']){
                //     //     next_url = xhr['next'];
                //     // }else{
                //     //     continuue = false;
                //     // }
                // });
                liked_songs = iterateAll('https://api.spotify.com/v1/me/tracks?limit=50');
                all_tracks = liked_songs;
                console.log('saved',liked_songs);
            }else{
                spott_get_sync('https://api.spotify.com/v1/playlists/'+playlist_id, token, function(xhr){
                    current_playlist = xhr;
                });

                current_playlist['tracks']['items'] = iterateAll('https://api.spotify.com/v1/playlists/'+playlist_id+'/tracks?limit=100'); //replace
                // console.log(current_playlist['tracks']['items']);
                all_tracks = current_playlist['tracks']['items'];
            }
            console.log(current_playlist);
            AudioFeatureDict = get_playlist_audio_features(all_tracks);
            sortedArtistArr = ArtistDistribution(all_tracks);
            sortedArtistArrwTitle = [['Artist','Number']].concat(sortedArtistArr);
            // console.log(sortedArtistArrwTitle);
            // sortedArtistArr.splice(0,0,['Artist','Number']);
            playlistDivhtml = '<div id="PlaylistMeta" style="display: inline-block">\
                                    <h2>'+playlist_name+'</h2>\
                                </div><br>\
                                <br>\
                                <div id="ArtistDiv">\
                                    <div id="ArtistGraph" style="float: left;">\
                                        <h3 style="margin: 0;">Artists pie chart of '+playlist_name+'</h3>\
                                        <div id="ArtistPiechart" style="width: 900px; height: 500px; margin-top: -45px;""></div>\
                                    </div>\
                                    <div id="ArtistListDiv" class="greycardDiv">\
                                        <h3>top 10 artists</h3>\
                                    </div>\
                                </div><br>\
                                <div id="OldestDiv" class="greycardDiv">\
                                    <h3>top 10 oldest tracks</h3>\
                                </div>\
                                <div id="NewestDiv" class="greycardDiv">\
                                    <h3>top 10 newest tracks</h3>\
                                </div><br>\
                                <div id="SearchDurationDiv" style="margin:1%;">\
                                    <p class="nice-tag">search anything in this playlist</p><br>\
                                    <div class="input_area">\
                                        <input type="text" id="srch_dur_input" placeholder="title or artist"></input>\
                                        <input type="checkbox" id="WholeExactMatch">whole word and match case</input>\
                                        <button id="srch_dur">search song</button><br>\
                                    </div>\
                                    <span class="smol">leave it blank to show everything in this playlist</span><br>\
                                    <div id="SearchDurationResult" class="greycardDiv" style="display:none;padding-top:20px;">\
                                    </div>\
                                </div>'
            $('#currentPlaylistDiv').html(playlistDivhtml);
            if(!use_liked_song){ //add image
                image_url = current_playlist['images'][0]['url'];
                $('#PlaylistMeta').append('<img src="'+image_url+'" width="200px" \
                    style="height:350px; border-radius:20px; width:auto; float:left; opacity:0.85;">');
            }

            $('#PlaylistMeta').append('<div id="AudioFeatureDiv" class="" style="display:inline-block;vertical-align:middle;margin:0;margin-left:15px;"></div>');
            
            tracknameartistdateDict = TrackNameArtistDate(all_tracks);
            sortedtracknameartistdateArr = sortDict(tracknameartistdateDict);
            if(Object.keys(lastfm_tracknameartistcount).length != 0){ //last.fm
                for(var item of sortedtracknameartistdateArr){
                    stuff = item[0].split(' - ');
                    title = stuff[0]+' - '+stuff[1].split(', ')[0];
                    // console.log(title);
                    if(lastfm_tracknameartistcount[title.toLowerCase()]){ //'song_title - 1st_artist'
                        item.push(lastfm_tracknameartistcount[title.toLowerCase()]);
                    }else{ //no play record
                        item.push('0');
                    }
                }
            }
            // console.log(sortedtracknameartistdateArr);

            drawRadar(AudioFeatureDict, 'AudioFeatureDiv');

            AudioFeature2html = '<div id="AudioFeature2Div" class="" style="display:inline-block;vertical-align:middle;margin:0;margin-left:15px;">\
                                    <table>\
                                        <th></th><th></th>\
                                        <tr><td>total tracks</td><td>'+all_tracks.length+'</td></tr>\
                                        <tr><td>average popularity</td><td>'+Math.round(avg_popularity(all_tracks))+'/100</td></tr>\
                                        <tr><td>average duration</td><td>'+Math.floor(AudioFeatureDict["duration_ms"]/1000/60)+'m'+Math.round(AudioFeatureDict["duration_ms"]/1000)%60+'s</td></tr>\
                                        <tr><td>average tempo</td><td>'+Math.round(AudioFeatureDict["tempo"])+' BPM</td></tr>\
                                        <tr><td>average loudness</td><td>'+Math.round(AudioFeatureDict["loudness"])+' dB</td></tr>'
            if(Object.keys(lastfm_tracknameartistcount).length != 0){
                count = 0
                for(var item of sortedtracknameartistdateArr){
                    count += parseInt(item[2]);
                }
                // count /= sortedtracknameartsitdateArr.length;
                AudioFeature2html += '<tr><td>total scrobbles</td><td>'+count+'</td></tr>';
            }
            AudioFeature2html += '</table></div>'
            $('#PlaylistMeta').append(AudioFeature2html)

            google.charts.load('current', {'packages':['corechart']});
            google.charts.setOnLoadCallback(function(){
                var data = google.visualization.arrayToDataTable(sortedArtistArrwTitle);
                var options = {
                  // title: 'Artist pie chart of '+playlist_name,
                    width: 800,
                    pieHole: 0.2,
                    backgroundColor: {
                        fill: 'transparent',
                        // stroke: '#000',
                    },
                    legend: {
                        textStyle:{
                            color: '#fff'
                        }
                    },
                    // pieSliceBorderColor: 'transparent',
                    sliceVisibilityThreshold: .0041, //smaller than this → others
                };
                var chart = new google.visualization.PieChart(document.getElementById('ArtistPiechart'));
                chart.draw(data, options);    
            });


            printable2(sortedArtistArr, 10, 'ArtistListDiv', 'Artist', 'number of tracks');


            if(Object.keys(lastfm_tracknameartistcount).length != 0){
                plays = 'scrobbles';                
            }else{
                plays = null;
            }
            printable4(sortedtracknameartistdateArr, 10, 'OldestDiv', 'title', 'artist', 'days since added', plays);

            sortedtracknameartistdateArr_r = sortedtracknameartistdateArr;
            sortedtracknameartistdateArr_r.reverse();

            printable4(sortedtracknameartistdateArr_r, 10, 'NewestDiv', 'title', 'artist', 'days since added', plays);

            if(Object.keys(lastfm_tracknameartistcount).length != 0){
                mostplayedhtml = '<div id="MostPlayedDiv" class="greycardDiv">\
                                        <h3>top 10 most played tracks</h3>\
                                    </div><br>'
                $(mostplayedhtml).insertAfter("#NewestDiv");
                sortedbyplay = sortArr(sortedtracknameartistdateArr_r,2);
                printable4(sortedbyplay, 10, 'MostPlayedDiv', 'title', 'artist', 'days since added', plays);                
            }

            $('#srch_dur').click(function(){
                searchSong(sortedtracknameartistdateArr);
            });

            EnterExec('#srch_dur_input', function(){
                searchSong(sortedtracknameartistdateArr);
            });
            
            $('#spot_loadcomp').html('data loaded!').show();
            $('#spot_loadcomp_tip').html('click any column title to sort (like you do in Spotify)').show();
        }else{
            $('#spot_loadcomp').html('failed').show();
            alert('no result');
            console.log('failure');
        }
        // playlist_id = $('#playlist_input').val();
        // // `329i010xBb8kqife9WYVu7`

    }else{
        alert('please login first');
        // console.log('no token');
    }
}


function withLoading(callback){
    if(token){
        $('#loadingOverlay').show();
        callback();
        $('#loadingOverlay').hide();
    }else{
        alert('please login to Spotify first');
    }
}

function lastfm_fetch(){
    username = $('#lastfm_username_input').val();
    period = $('#lastfm_period').val();
    var continuue = true;
    var page = 1;
    // var failure = false;
    // console.log(period);
    // continuue = false;
    while(continuue){
        var result;
        url = 'https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks\
                &user='+username+'\
                &period='+period+'\
                &page='+page+'\
                &api_key=df7b292e433f23776b084ff739c37918&format=json'
        $.ajax({
            async: false,
            url : url,
            dataType : 'json',
            type : 'GET',
            success: function(xhr) {
                result = xhr;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // alert('failed');
                continuue = false;
                // failure = true;
                console.log('error ' + textStatus);
                console.log(jqXHR);
            },
            timeout: 5000
        });
        if(result){
            if(result['toptracks']['@attr']['page']==result['toptracks']['@attr']['totalPages']){ //final page
                continuue = false;
            }
            page += 1;
            lastfm_toptracks = lastfm_toptracks.concat(result['toptracks']['track']);
        }else{
            break;
        }

    }
    if(result){
        $('#lastfm_loadcomp').html('<span class="ldComp">'+period+' scrobbles loaded!</span>\
            <span class="ldComp">search your spotify playlist now!</span><br>\
            <span class="smol">some last.fm scrobbles may not correctly match the song</span>').show();

        // console.log(lastfm_toptracks);
        for(var track of lastfm_toptracks){
            title = track['name']+' - '+track['artist']['name'];
            lastfm_tracknameartistcount[title.toLowerCase()] = track['playcount']; //{'Freesol - Seven Lions' : 20}
        }
        // console.log(lastfm_tracknameartistcount);
    }else{
        $('#lastfm_loadcomp').html('<span class="ldComp">loading failed!</span>').show();
        alert('Failed. Check your username.');
    }
}

function DaystoToday(date){ //date in ISO format
    target = new Date(date);
    today = new Date();
    return Math.round((today-target)/86400000) //ms to day
}

function printable2(array, num, targetDiv, title1, title2, title3=null){ //array structure: [[a,b],[c,d],....]
    temp = '<table style=""><th>'+title1+'</th>\
            <th>'+title2+'</th>';
    if(title3){
        temp += '<th>'+title3+'</th>';
    }

    for(var i=0; i<num; i++){
        if(!array[i]){ //is less than num artists
            break;
        }
        temp += '<tr><td>'+array[i][0]+'</td>\
                <td>'+array[i][1]+'</td>'
        if(title3){
            temp += '<td>'+array[i][2]+'</td>';
        }
        temp += '</tr>';
    }
    // console.log(temp);

    $('#'+targetDiv).append(temp);
}

function printable4(array, num, targetDiv, title1, title2, title3, title4){ //array structure: [[a,b],[c,d],....]
    temp = '<table style=""><th>'+title1+'</th>\
            <th>'+title2+'</th>\
            <th id="days_th">'+title3+'</th>';
    if(title4){
            temp += '<th id="count_th">'+title4+'</th>';
    }

    for(var i=0; i<num; i++){
        if(!array[i]){ //is less than num artists
            break;
        }
        temp += '<tr><td>'+array[i][0].split(' - ')[0]+'</td>\
                <td>'+array[i][0].split(' - ')[1]+'</td>\
                <td>'+array[i][1]+'</td>';
        if(title4){
            temp += '<td>'+array[i][2]+'</td>';
        }
        temp += '</tr>';
    }
    // console.log(temp);

    $('#'+targetDiv).append(temp);
}

function searchSong(sortedtracknameartistdateArr){
    input = $('#srch_dur_input').val();
    temp = '<table style=""><th>title</th>\
            <th>artist</th>\
            <th>days since added</th>';
    if(sortedtracknameartistdateArr[0][2]){
        temp += '<th>plays</th>';
    }
    matches = 0;
    const regex = new RegExp("\\b"+input+"\\b");
    // console.log(regex.text());
    if($('#WholeExactMatch').prop("checked")==true){ //whole word and match case
        for(var item of sortedtracknameartistdateArr){
            if(regex.test(item[0])){
                matches += 1;
                temp += '<tr><td>'+item[0].split(' - ')[0]+'</td>\
                            <td>'+item[0].split(' - ')[1]+'</td>\
                            <td>'+item[1]+'</td>';
                if(item[2] || item[2]==0){
                    temp += '<td>'+item[2]+'</td>';
                }
                temp += '</tr>';
            }
        }
    }else{
        for(var item of sortedtracknameartistdateArr){
            if(item[0].toLowerCase().indexOf(input.toLowerCase()) != -1){
                matches += 1;
                temp += '<tr><td>'+item[0].split(' - ')[0]+'</td>\
                            <td>'+item[0].split(' - ')[1]+'</td>\
                            <td>'+item[1]+'</td>';
                if(item[2]){
                    temp += '<td>'+item[2]+'</td>';
                }
                temp += '</tr>';
            }
        }
    }

    if(matches == 0){
        // temp = 'no result';
        alert('no result');
    }else{
        if(matches == 1){
            temp = '<span style="color:#ffd8d2;">'+1+' result</span><br>'+temp; //insert
        }else{
            temp = '<span style="color:#ffd8d2;">'+matches+' results</span><br>'+temp; //insert
        }
        $('#SearchDurationResult').html(temp).show();
    }
}

function iterateAll(next_url){
    if(token){
        var temp = []
        var continuue = true;
        try{
            while(continuue){
                spott_get_sync(next_url, token, function(xhr){
                    if(xhr == 'nooooooooo'){
                        alert('FAILED');
                        continuue = false; 
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

function EnterExec(jq, callback){ //press enter to execute
    $(jq).keypress(function(e){
        if(e.which == 13){
            callback();
        }
    });
}

//table sort on clicking header
// https://stackoverflow.com/a/19947532
$(document).off('click','th');
$(document).on('click','th',function(){
    var table = $(this).parents('table').eq(0);
    i = 0;
    while(table.find('th:eq('+i+')').text()){ //remove the arrows other from the clicked element
        elElement = table.find('th:eq('+i+')');
        if(elElement.text() != $(this)[0]['textContent']){
            if(elElement.text().indexOf(' ↑')!=-1 || elElement.text().indexOf(' ↓')!=-1){
                elElement.html(elElement.text().slice(0,-2));
            }
        }
        i++;
        if(i>=10){ //insurance
            console.log('fuck');
            break;
        }
    }
    // console.log(table.find('th:eq(0)').text());
    currenttext = $(this)[0]['textContent'];
    if(currenttext.indexOf(' ↑')!=-1){
        $(this).html($(this)[0]['textContent'].slice(0,-2)+' ↓');
    }else if(currenttext.indexOf(' ↓')!=-1){
        $(this).html($(this)[0]['textContent'].slice(0,-2)+' ↑');
    }else{
        $(this).html($(this)[0]['textContent']+' ↑');
    }
    var rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()));
    this.asc = !this.asc;
    if (!this.asc){rows = rows.reverse()}
    for (var i = 0; i < rows.length; i++){table.append(rows[i])}
});
function comparer(index) {
    return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index)
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
    }
}
function getCellValue(row, index){ return $(row).children('td').eq(index).text() }

function drawRadar(data, id){
    google.charts.load('upcoming', {
      'packages': ['vegachart']
    }).then(loadCharts);

    console.log(data);

    // dataArr = []
    // for(var feat in data){
    //     if(feat=='acousticness' || feat=='danceability' || feat=='energy' || feat=='instrumentalness' 
    //         || feat=='liveness' || feat=='speechiness' || feat=='valence'){
    //         dataArr.push([feat, data[feat],'']);
    //     }
    // }
    const dataArr = [
        ['speechiness',data['speechiness'],''],
        ['acousticness',data['acousticness'],''],
        ['danceability',data['danceability'],''],
        ['energy',data['energy'],''],
        ['instrumentalness',data['instrumentalness'],''],
        // ['liveness',data['liveness'],''],
        ['valence',data['valence'],'']
    ]

    // const lasagna = dataArr;
    // const lasagna = [
    //   ["Protein", 0.1308, "Lasagna, cheese, frozen, prepared"],
    //   ["Carbohydrates", 0.05032727272727273, "Lasagna, frozen, prepared"],
    //   ["Vitamin C", 0.228, "Lasagna, cheese, frozen, prepared"],
    //   ["Calcium", 0.08538461538461538, "Lasagna, cheese, frozen, prepared"],
    //   ["Zinc", 0.11375, "Lasagna, cheese, frozen, prepared"],
    //   ["Sodium", 0.18933333333333333, "Lasagna, cheese, frozen, prepared"],
    //   ["Sodjium", 0.11, "Lasagna, cheese, frozen, prepared"],
    //   ["Soddjium", 0.1, "Lasagna, cheese, frozen, prepared"]
    // ];


    function loadCharts() {
      addChart('', dataArr, "#FFB588E6");
    };

    function addChart(title, data, color) {
      const dataTable = new google.visualization.DataTable();
      dataTable.addColumn({
        type: 'string',
        'id': 'key'
      });
      dataTable.addColumn({
        type: 'number',
        'id': 'value'
      });
      dataTable.addColumn({
        type: 'string',
        'id': 'category'
      });
      dataTable.addRows(data);

      var strokewidth = 1.4;
      var strokecolor = '#ffffffcc';
      const options = {
        'vega': {
          "$schema": "https://vega.github.io/schema/vega/v5.json",
          "width": 350,
          "height":315,
          "autosize": "none",
          "title": {
            "text": title,
            "anchor": "middle",
            "fontSize": 14,
            "dy": -8,
            "dx": {
              "signal": "-width/4"
            },
            // "subtitle": "RDI per 100g"
          },
          "signals": [{
            "name": "radius",
            "update": "90"
          }],
          "data": [{
              "name": "table",
              "source": "datatable",
            },
            {
              "name": "keys",
              "source": "table",
              "transform": [{
                "type": "aggregate",
                "groupby": ["key"]
              }]
            }
          ],
          "scales": [{
              "name": "angular",
              "type": "point",
              "range": {
                "signal": "[-PI, PI]"
              },
              "padding": 0.5,
              "domain": {
                "data": "table",
                "field": "key"
              }
            },
            {
              "name": "radial",
              "type": "linear",
              "range": {
                "signal": "[0, radius]"
              },
              "zero": true,
              "nice": false,
              "domain": [0, 1],
            }
          ],
          "encode": {
            "enter": {
              "x": {
                "signal": "width/2"
              },
              "y": {
                "signal": "height/2 + 20"
              }
            }
          },
          "marks": [{
              "type": "group",
              "name": "categories",
              "zindex": 1,
              "from": {
                "facet": {
                  "data": "table",
                  "name": "facet",
                  "groupby": ["category"]
                }
              },
              "marks": [{
                  "type": "line",
                  "name": "category-line",
                  "from": {
                    "data": "facet"
                  },
                  "encode": {
                    "enter": {
                      "interpolate": {
                        "value": "linear-closed"
                      },
                      "x": {
                        "signal": "scale('radial', datum.value) * cos(scale('angular', datum.key))"
                      },
                      "y": {
                        "signal": "scale('radial', datum.value) * sin(scale('angular', datum.key))"
                      },
                      "stroke": {
                        "value": color
                      },
                      "strokeWidth": {
                        "value": 2
                      },
                      "fill": {
                        "value": color
                      },
                      "fillOpacity": {
                        "value": 0.4
                      }
                    }
                  }
                },
                {
                  "type": "text",
                  "name": "value-text",
                  "from": {
                    "data": "category-line"
                  },
                  "encode": {
                    "enter": {
                      "x": {
                        "signal": "datum.x + 14 * cos(scale('angular', datum.datum.key))"
                      },
                      "y": {
                        "signal": "datum.y + 14 * sin(scale('angular', datum.datum.key))"
                      },
                      "text": {
                        "signal": "format(datum.datum.value,'.1%')"
                      },
                      "opacity": {
                        "signal": "datum.datum.value > 0.01 ? 1 : 0"
                      },
                      "align": {
                        "value": "center"
                      },
                      "baseline": {
                        "value": "middle"
                      },
                      "fontWeight": {
                        "value": "bold"
                      },
                      "fill": {
                        "value": '#ffffff00'
                      },
                    }
                  }
                }
              ]
            },
            {
              "type": "rule",
              "name": "radial-grid",
              "from": {
                "data": "keys"
              },
              "zindex": 0,
              "encode": {
                "enter": {
                  "x": {
                    "value": 0
                  },
                  "y": {
                    "value": 0
                  },
                  "x2": {
                    "signal": "radius * cos(scale('angular', datum.key))"
                  },
                  "y2": {
                    "signal": "radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            {
              "type": "text",
              "name": "key-label",
              "from": {
                "data": "keys"
              },
              "zindex": 1,
              "encode": {
                "enter": {
                  "x": {
                    "signal": "(radius + 11) * cos(scale('angular', datum.key))"
                  },
                  "y": [{
                      "test": "sin(scale('angular', datum.key)) > 0",
                      "signal": "5 + (radius + 11) * sin(scale('angular', datum.key))"
                    },
                    {
                      "test": "sin(scale('angular', datum.key)) < 0",
                      "signal": "-5 + (radius + 11) * sin(scale('angular', datum.key))"
                    },
                    {
                      "signal": "(radius + 11) * sin(scale('angular', datum.key))"
                    }
                  ],
                  "text": {
                    "field": "key"
                  },
                  "align": {
                    "value": "center"
                  },
                  "baseline": [{
                      "test": "scale('angular', datum.key) > 0",
                      "value": "top"
                    },
                    {
                      "test": "scale('angular', datum.key) == 0",
                      "value": "middle"
                    },
                    {
                      "value": "bottom"
                    }
                  ],
                  "fill": {
                    "value": "#fff"
                  },
                  "fontSize": {
                    "value": 15
                  },
                  "font":{"value": "Segoe Script"},
                }
              }
            },
            {
              "type": "line",
              "name": "twenty-line",
              "from": {
                "data": "keys"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "signal": "0.25 * radius * cos(scale('angular', datum.key))"
                  },
                  "y": {
                    "signal": "0.25 * radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            {
              "type": "line",
              "name": "fourty-line",
              "from": {
                "data": "keys"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "signal": "0.5 * radius * cos(scale('angular', datum.key))"
                  },
                  "y": {
                    "signal": "0.5 * radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            {
              "type": "line",
              "name": "sixty-line",
              "from": {
                "data": "keys"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "signal": "0.75 * radius * cos(scale('angular', datum.key))"
                  },
                  "y": {
                    "signal": "0.75 * radius * sin(scale('angular', datum.key))"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            },
            // {
            //   "type": "line",
            //   "name": "eighty-line",
            //   "from": {
            //     "data": "keys"
            //   },
            //   "encode": {
            //     "enter": {
            //       "interpolate": {
            //         "value": "linear-closed"
            //       },
            //       "x": {
            //         "signal": "0.8 * radius * cos(scale('angular', datum.key))"
            //       },
            //       "y": {
            //         "signal": "0.8 * radius * sin(scale('angular', datum.key))"
            //       },
            //       "stroke": {
            //         "value": "lightgray"
            //       },
            //       "strokeWidth": {
            //         "value": 1
            //       }
            //     }
            //   }
            // },
            {
              "type": "line",
              "name": "outer-line",
              "from": {
                "data": "radial-grid"
              },
              "encode": {
                "enter": {
                  "interpolate": {
                    "value": "linear-closed"
                  },
                  "x": {
                    "field": "x2"
                  },
                  "y": {
                    "field": "y2"
                  },
                  "stroke": {
                    "value": strokecolor
                  },
                  "strokeWidth": {
                    "value": strokewidth
                  }
                }
              }
            }
          ]
        }
      };

      const elem = document.createElement("div");
      // elem.setAttribute("style", "display: inline-block; width: 250px; height: 300px; padding: 20px;");

      const chart = new google.visualization.VegaChart(elem);
      chart.draw(dataTable, options);

      document.getElementById(id).appendChild(elem);
    }

}