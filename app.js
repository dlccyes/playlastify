function login(){
    var url='https://accounts.spotify.com/authorize'
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope="+scopes;
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
                alert('please login');
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
            sortedArtistArr = ArtistDistribution(all_tracks);
            sortedArtistArrwTitle = [['Artist','Number']].concat(sortedArtistArr);
            // console.log(sortedArtistArrwTitle);
            // sortedArtistArr.splice(0,0,['Artist','Number']);
            playlistDivhtml = '<div id="PlaylistMeta">\
                                    <h1>'+playlist_name+'</h1>\
                                </div>\
                                <div id="NumDiv" class="smol greycardDiv">\
                                    '+all_tracks.length+' songs\
                                </div>\
                                <div id="ArtistDiv">\
                                    <div id="ArtistGraph" style="float: left;">\
                                        <h2 style="margin: 0;">Artists pie chart of '+playlist_name+'</h2>\
                                        <div id="ArtistPiechart" style="width: 900px; height: 500px; margin-top: -45px;""></div>\
                                    </div>\
                                    <div id="ArtistListDiv" class="greycardDiv">\
                                        <h2>top 10 artists</h2>\
                                    </div>\
                                </div><br>\
                                <div id="OldestDiv" class="greycardDiv">\
                                    <h2>top 10 oldest tracks</h2>\
                                </div>\
                                <div id="NewestDiv" class="greycardDiv">\
                                    <h2>top 10 newest tracks</h2>\
                                </div><br>\
                                <div id="SearchDurationDiv" style="margin:1%;">\
                                    <input type="text" id="srch_dur_input"></input>\
                                    <input type="checkbox" id="WholeExactMatch">whole word and match case</input>\
                                    <button id="srch_dur">search song</button><br>\
                                    <div id="SearchDurationResult" class="greycardDiv" style="display:none;padding-top:20px;">\
                                    </div>\
                                </div>'
            $('#currentPlaylistDiv').html(playlistDivhtml);
            if(!use_liked_song){ //add image
                image_url = current_playlist['images'][0]['url'];
                $('#PlaylistMeta').append('<img src="'+image_url+'" width="200px" style="height: 350px;border-radius: 20px;width: auto;">');
            }

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


            tracknameartistdateDict = TrackNameArtistDate(all_tracks);
            sortedtracknameartistdateArr = sortDict(tracknameartistdateDict);
            if(Object.keys(lastfm_tracknameartistcount).length != 0){ //last.fm
                for(var item of sortedtracknameartistdateArr){
                    stuff = item[0].split(' - ');
                    title = stuff[0]+' - '+stuff[1].split(', ')[0];
                    console.log(title);
                    if(lastfm_tracknameartistcount[title.toLowerCase()]){ //'song_title - 1st_artist'
                        item.push(lastfm_tracknameartistcount[title.toLowerCase()]);
                    }else{ //no play record
                        item.push('0');
                    }
                }
            }
            console.log(sortedtracknameartistdateArr);

            if(Object.keys(lastfm_tracknameartistcount).length != 0){
                plays = 'plays';                
            }else{
                plays = null;
            }
            printable4(sortedtracknameartistdateArr, 10, 'OldestDiv', 'title', 'artist', 'days since added', plays);

            sortedtracknameartistdateArr_r = sortedtracknameartistdateArr;
            sortedtracknameartistdateArr_r.reverse();

            printable4(sortedtracknameartistdateArr_r, 10, 'NewestDiv', 'title', 'artist', 'days since added', plays);

            EnterExec('#srch_dur_input', function(){
                searchSong(sortedtracknameartistdateArr);
            });
            // $('#srch_dur_input').keypress(function(e){
            //     if(e.which == 13){
            //         searchSong(sortedtracknameartistdateArr);
            //     }
            // });

            $('#srch_dur').click(function(){
                searchSong(sortedtracknameartistdateArr);
            });

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
        console.log(lastfm_toptracks);
        for(var track of lastfm_toptracks){
            title = track['name']+' - '+track['artist']['name'];
            lastfm_tracknameartistcount[title.toLowerCase()] = track['playcount']; //{'Freesol - Seven Lions' : 20}
        }
        console.log(lastfm_tracknameartistcount);
    }else{
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
            <th>'+title3+'</th>';
    if(title4){
            temp += '<th>'+title4+'</th>';
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
        temp = '<span style="color:#ffd8d2;">'+matches+' results</span><br>'+temp; //insert
        $('#SearchDurationResult').html(temp).show();
    }
}

function iterateAll(next_url){
    var temp = []
    var continuue = true;
    while(continuue){
        spott_get_sync(next_url, token, function(xhr){
            temp = temp.concat(xhr['items']);
            if(xhr['next']){
                next_url = xhr['next'];
            }else{
                continuue = false;
            }
        });
    }
    return temp;
}

function EnterExec(jq, callback){ //press enter to execute
    $(jq).keypress(function(e){
        if(e.which == 13){
            callback();
        }
    });
}