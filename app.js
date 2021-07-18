function login(){
    var url='https://accounts.spotify.com/authorize'
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-playback-state playlist-read-private"
    location.href = url;
}
// })

function get_token(){
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
                console.log('error ' + textStatus);
                console.log(jqXHR);
            },
            timeout: 5000
        });
    }else{
        alert('please login first');
    }
}

function spott_get_sync(url, token, callback){ //sync version
    spott_get(url, token, callback, async=false);
}

function get_all_playlists(){
    if(token){
        var continuue = true;
        // if(playlists.length != 0){ //alreadt executed
        //     continuue = false;
        // }
        var next_url = 'https://api.spotify.com/v1/me/playlists?limit=50';
        while(continuue){
            spott_get_sync(next_url, token, function(xhr){
                // console.log(xhr['items']);
                playlists = playlists.concat(xhr['items']);
                // for(var i in xhr['items']){
                //     playlists.push(xhr['items'][i]);
                // }
                if(xhr['next']){
                    next_url = xhr['next'];
                }else{
                    continuue = false;
                }
            });
        }
    }else{
        // console.log('no token');
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

function sortDict(ogDict) {
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

function get_playlist_details(){
    if(token){
        get_all_playlists();
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
        if(playlist_id != ''){
            spott_get_sync('https://api.spotify.com/v1/playlists/'+playlist_id, token, function(xhr){
                current_playlist = xhr;
            });
            var continuue = true
            var next_url = 'https://api.spotify.com/v1/playlists/'+playlist_id+'/tracks?limit=100';
            var temp = [];
            i=0;
            while(continuue){
                spott_get_sync(next_url, token, function(xhr){
                    temp = temp.concat(xhr['items']);
                    if(xhr['next']){
                        next_url = xhr['next'];
                    }else{
                        continuue = false;
                    }
                });
                i++
                if(i>=5){
                    break;
                }
            }
            current_playlist['tracks']['items'] = temp; //replace
            sortedArtistArr = ArtistDistribution(current_playlist['tracks']['items']);
            console.log(current_playlist['tracks']['items']);
            sortedArtistArrwTitle = [['Artist','Number']].concat(sortedArtistArr);
            // console.log(sortedArtistArrwTitle);
            // sortedArtistArr.splice(0,0,['Artist','Number']);
            image_url = current_playlist['images'][0]['url'];
            playlistDivhtml = '<div id="PlaylistMeta">\
                                    <h1>'+playlist_name+'</h1>\
                                    <img src="'+image_url+'" width="200px" style="height: 350px;border-radius: 20px;width: auto;">\
                                </div>\
                                <div id="ArtistDiv">\
                                    <div id="ArtistGraph" style="float: left;">\
                                        <h2 style="margin: 0;">Artists pie chart of '+playlist_name+'</h2>\
                                        <div id="ArtistPiechart" style="width: 900px; height: 500px; margin-top: -45px;""></div>\
                                    </div>\
                                    <div id="ArtistListDiv" class="greycardDiv">\
                                        <h2>top 10 artists</h2>\
                                    </div>\
                                </div>\
                                <div id="OldestDiv" class="greycardDiv">\
                                    <h2>top 10 oldest tracks</h2>\
                                </div>\
                                <div id="NewestDiv" class="greycardDiv">\
                                    <h2>top 10 newest tracks</h2>\
                                </div>\
                                <div id="SearchDurationDiv" style="a">\
                                    <input type="text" id="srch_dur_input"></input>\
                                    <input type="checkbox" id="durExactMatch">exact match</input>\
                                    <button id="srch_dur">search song</button>\
                                    <div id="SearchDurationResult" class="greycardDiv" style="display:none;padding-top:20px;">\
                                    </div>\
                                </div>'
            $('#currentPlaylistDiv').html(playlistDivhtml);

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

            // $('#currentPlaylistDiv').append('<div id="ArtistListDiv"></div>');
            // ogsortedArtistArr = sortedArtistArr.slice(1);
            // console.log(sortedArtistArr);
            printable(sortedArtistArr, 10, 'ArtistListDiv', 'Artist', 'number of tracks');
            // ArtistListhtml = '<table style=""><th>'+sortedArtistArr[0][0]+'</th>\
            //                     <th>'+sortedArtistArr[0][1]+'</th>';
            // for(var i=1; i<=10; i++){
            //     if(!sortedArtistArr[i]){ //is less than 10 artists
            //         break;
            //     }
            //     ArtistListhtml += '<tr><td>'+sortedArtistArr[i][0]+'</td>\
            //                         <td>'+sortedArtistArr[i][1]+'</td></tr>'
            // }
            // ArtistListhtml += '</table>'
            // $('#ArtistListDiv').append(ArtistListhtml);

            tracknameartistdateDict = TrackNameArtistDate(current_playlist['tracks']['items']);
            sortedtracknameartistdateArr = sortDict(tracknameartistdateDict);

            printable(sortedtracknameartistdateArr, 10, 'OldestDiv', 'track', 'days since added');

            sortedtracknameartistdateArr_r = sortedtracknameartistdateArr;
            sortedtracknameartistdateArr_r.reverse();

            printable(sortedtracknameartistdateArr_r, 10, 'NewestDiv', 'track', 'days since added');

            $('#srch_dur_input').keypress(function(e){
                if(e.which == 13){
                    searchSong(sortedtracknameartistdateArr);
                }
            });
            $('#srch_dur').click(function(){
                searchSong(sortedtracknameartistdateArr);
            });
            // oldesthtml = '';
            // oldesthtml = '<table style=""><th>track</th>\
            //                     <th>days since added</th>';
            // for(var i=0; i<10; i++){
            //     if(!sortedtracknameartistdateArr[i]){ //is less than 10 artists
            //         break;
            //     }
            //     oldesthtml += '<tr><td>'+sortedtracknameartistdateArr[i][0]+'</td>\
            //                         <td>'+sortedtracknameartistdateArr[i][1]+'</td></tr>'
            // }

            // $('#DurationDiv').append(oldesthtml);
            
            // console.log(sortedtracknameartistdate);

        }else{
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

function DaystoToday(date){ //date in ISO format
    target = new Date(date);
    today = new Date();
    return Math.round((today-target)/86400000) //ms to day
}

function printable(array, num, targetDiv, title1, title2){ //array structure: [[a,b],[c,d],....]
    temp = '<table style=""><th>'+title1+'</th>\
            <th>'+title2+'</th>';
    for(var i=0; i<num; i++){
        if(!array[i]){ //is less than num artists
            break;
        }
        temp += '<tr><td>'+array[i][0]+'</td>\
                <td>'+array[i][1]+'</td></tr>'
    }
    // console.log(temp);

    $('#'+targetDiv).append(temp);
}

function searchSong(sortedtracknameartistdateArr){
    input = $('#srch_dur_input').val();
    temp = '<table style=""><th>song</th>\
                    <th>days since added</th>';
    matches = 0;
    for(var item of sortedtracknameartistdateArr){
        if(item[0].toLowerCase().indexOf(input.toLowerCase()) != -1){
            matches += 1;
            temp += '<tr><td>'+item[0]+'</td>\
                        <td>'+item[1]+'</td></tr>'
            // console.log(item);
            // break;
        }
    }
    if(matches == 0){
        // temp = 'no result';
        alert('no result');
    }else{
        $('#SearchDurationResult').html(temp).show();
    }
}