function getCode(){ //auth code step 1
    $.ajax({ //get env vars first
        method: 'GET',
        url: "get-env",
        success: function(result){
            let client_id = result['clientID'];
            let redirect_uri = result['redirect_uri'];
            let scopes = 'user-read-playback-state user-library-read playlist-read-private';
            let url = 'https://accounts.spotify.com/authorize'
            url += "?client_id=" + client_id;
            url += "&response_type=code";
            url += "&redirect_uri=" + encodeURI(redirect_uri);
            url += "&scope="+scopes;
            url += "&show_dialog=true"; //always show accept page
            location.href = url;
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus);
            console.log(jqXHR);
        },
    });
}

function parseCodeAndGetToken(){
    let url = String(window.location);
    if(url.search(/=/)!=-1){ //have code in url i.e. is redirected
        let code = url.slice(url.search(/=/)+1);
        if(url.search(/localhost/) == -1){
            window.history.pushState("", "", "/"); //erase the token from displaying url
        }
        requestToken(code); //GET token
        code = null;
    }
    // do nothing otherwise
}

function requestToken(code){ //to backend
    $.ajax({
        method: 'GET',
        data: {
            'code': code,
        },
        url: "request-token",
        success: function(result){
            token = result['data']['access_token'];
            if(token){
                document.cookie = 'token=' + token;
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Something's wrong. Please relogin, wait a while or try another playlist.");
            console.log('error ' + textStatus);
            console.log(jqXHR);
        },
    });
}

function spott_get(url, token, callback, objData=null, async=true){
    if(token){
        let iterAll = 0;
        let useDB = 0;
        let _name = '';
        if(objData){
            if(objData['iterAll']){
                iterAll = objData['iterAll'];
            }
            if(objData['useDB']){
                useDB = objData['useDB'];
            }
            if(objData['name']){
                _name = objData['name'];
            }
        }
        $.ajax({
            async: async,
            url : 'spagett',
            dataType : 'json',
            type : 'GET',
            data:{
                'url': url,
                'token': token,
                'iterAll': iterAll,
                // 'checkDB': checkDB,
                'name': _name,
                'useDB': useDB,
            },
            success: function(xhr) {
                if(xhr['error']){
                    alert('Please login.');
                }else{
                    if(callback){
                        callback(xhr);
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert("Something's wrong. Please relogin, wait a while or try another playlist.");
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

function spott_get_sync(url, token, callback, objData=null, iurl='spagett'){ //sync version
    spott_get(url, token, callback, objData, async=false);
}

function withLoading(callback){ //loading animation
    try{
        if(token){
            $('#loadingOverlay').show();
            setTimeout(() => { //let loadingOverlay rendered before ajax sync
                callback();
                $('#loadingOverlay').hide();
            }, 100);
        }else{
            alert('please login to Spotify first');
        }
    }catch{
        alert('something went wrong 😭😭\n\nplease try another playlist');
        $('#loadingOverlay').hide();
    }
}

//todo
function get_all_playlists(){
    let temp;
    let objData = {iterAll:1, useDB:1, name:'AllPlaylists'};
    if(token){
        let url = 'https://api.spotify.com/v1/me/playlists?limit=50';
        spott_get_sync(url, token, function(xhr){
            temp = xhr['data'];
        }, objData);
        return temp;
    }else{
        alert('please login first');
    }
}

function TrackNameArtistDate(tracks){
    let trackNameArtistDate = {};
    for(let track of tracks){
        // concat track name with artist name to prevent collision
        let trackNameArtist = track['track']['name'] + ARTIST_SEP;
        for(let artist of track['track']['artists']){
            trackNameArtist += artist['name'] + ', ';
        }
        trackNameArtist = trackNameArtist.slice(0,-2); //remove last ', '
        trackNameArtistDate[trackNameArtist] = DaystoToday(track['added_at']);
    }
    return trackNameArtistDate;
}

function ArtistDistribution(tracks){
    let artists = {};
    for(let item of tracks){
        for(let artist of item['track']['artists']){
            if(!artists[artist['name']]){ //if artist isn't added before
                artists[artist['name']] = 0;
            }
            artists[artist['name']] += 1;
        }
    }
    return sortDict(artists);
}

function show_current_playback(){
    spott_get('https://api.spotify.com/v1/me/player', token, function(xhr){ //scope: user-read-playback-state
        let currentTitle;
        if(xhr && xhr['item']){
            $('#currentMeta').show();
            let current_id = xhr['item']['id'];
            let temp = '';
            for(let artist of xhr['item']['artists']){
                temp += artist['name'] + ', ';
            }
            temp = temp.slice(0,-2);
            currentTitle = xhr['item']['name']+' - '+temp;
            let current_AudioFeatureDict = {};
            let artists_ids = [];
            if(!current_id){
                alert('no detailed data for local song');
                $('#currentMeta').hide();
                return
            }
            spott_get_sync('https://api.spotify.com/v1/tracks/'+current_id, token, function(xhr){ //no scope
                for(let artist of xhr['artists']){
                    artists_ids.push(artist['id']);
                }
                current_AudioFeatureDict['duration_ms'] = xhr['duration_ms'];
                current_AudioFeatureDict['popularity'] = xhr['popularity'];
                $('#currentImg').html('<img src="'+xhr['album']['images'][0]['url']+'" class="meta_img">')
            });
            spott_get_sync('https://api.spotify.com/v1/audio-features/'+current_id, token, function(xhr){ //no scope
                temp = ['acousticness','danceability','duration_ms','energy','instrumentalness',
                'liveness','loudness','speechiness','tempo','valence']
                for(let item of temp){
                    current_AudioFeatureDict[item] = xhr[item];
                }
                $('#currentAudioFeatureDiv').html(''); //clear
                drawRadar(current_AudioFeatureDict, 'currentAudioFeatureDiv');
            });

            let currentGenreDict = {};
            for(let id of artists_ids){
                spott_get_sync('https://api.spotify.com/v1/artists/'+id, token, function(xhr){ //no scope
                    for(let gen of xhr['genres']){
                        if(!currentGenreDict[gen]){
                            currentGenreDict[gen] = true;
                        }
                    }
                });
            }
            let currentAudioFeature2html = '<table><th></th><th></th>';
            $("#trackPopularity").html(current_AudioFeatureDict["popularity"] + '/100');
            $("#trackDuration").html(Math.floor(current_AudioFeatureDict["duration_ms"]/1000/60)+'m'+Math.round(current_AudioFeatureDict["duration_ms"]/1000)%60+'s');
            $("#trackTempo").html(Math.round(current_AudioFeatureDict["tempo"]) + ' BPM');
            $("#trackLoudness").html(Math.round(current_AudioFeatureDict["loudness"]) + ' dB');
            let genreStr = '';
            for(let gen of Object.keys(currentGenreDict)){
                genreStr += gen + '<br>';        
            }
            $("#trackArtistGenres").html(genreStr);
            if(showLastfmStat){
                    let [track, artists] = currentTitle.split(ARTIST_SEP);
                    let title = track + ' - ' + artists.split(', ')[0]; // last.fm only shows 1st artist
                let count = 0
                if(lastfm_tracknameartistcount[title.toLowerCase()]){ //'song_title - 1st_artist'
                    count = lastfm_tracknameartistcount[title.toLowerCase()];
                }
                $('#trackScrobbles').html(count);
            }
        }else{
            $('#currentMeta').hide();
            currentTitle = 'nothing is playing';
        }
        $('#currentTitle').html(currentTitle).show();
        $('#currentPlaybackDiv').show();
    });
}

function lastfm_fetch(){
    let lastfm_toptracks = [];
    let username = $('#lastfm_username_input').val();
    let period = $('#lastfm_period').val();
    let continuue = true;
    let page = 1;
    let result;

    while(continuue){
        let url = 'https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks' +
                '&user=' + username +
                '&period=' + period +
                '&page=' + page +
                '&api_key=df7b292e433f23776b084ff739c37918&format=json'
        $.ajax({
            async: false,
            url : url,
            dataType : 'json',
            type : 'GET',
            success: function(xhr) {
                result = xhr;
            },
            error: function(jqXHR, textStatus, errorThrown) {
                continuue = false;
                console.log('error ' + textStatus);
                console.log(jqXHR);
            },
            timeout: 5000
        });
        if(result){
            if(result['toptracks']['@attr']['totalPages'] == 0){ //no scrobbles in this period
                result = 'no data';
                continuue = false;
                break;
            }else{
                page += 1;
                lastfm_toptracks = lastfm_toptracks.concat(result['toptracks']['track']);
                if(result['toptracks']['@attr']['page']==result['toptracks']['@attr']['totalPages']){ //final page
                    continuue = false;
                    break;
                }
            }
        }else{
            break;
        }

    }
    if(result){
        let title;
        showLastfmStat = true; // global var
        for(let track of lastfm_toptracks){
            title = track['name']+' - '+track['artist']['name'];
            lastfm_tracknameartistcount[title.toLowerCase()] = track['playcount']; //{'Freesol - Seven Lions' : 20}
        }
        if(lastfm_toptracks.length == 0){
            $('#lastfm_loadcomp').html('<span class="ldComp">no scrobbles for this period for this user</span>').show();
        }else{
            $('#lastfm_loadcomp').html('<span class="ldComp">'+period+' scrobbles loaded!</span>' +
                '<span class="ldComp">search your spotify playlist now!</span><br>' +
                '<span class="smol">some last.fm scrobbles may not correctly match the song</span>').show();
        }
        $(".lastfmStat").show().css("display", "");
    }else{
        alert('Failed. Check your username.');
        $('#lastfm_loadcomp').html('<span class="ldComp">loading failed!</span>').show();
    }
}

function get_playlist_audio_features(all_tracks){
    let idStr = '';
    let i=0;
    let playlistAudioFeaturesRaw = [];
    let playlistAudioFeatures = {'acousticness':0,'danceability':0,'duration_ms':0,'energy':0,'instrumentalness':0,
    'liveness':0,'loudness':0,'speechiness':0,'tempo':0,'valence':0};
    for(let item of all_tracks){
        i++;
        idStr += item['track']['id']+',';
        if(i%100 == 0 || item == all_tracks[all_tracks.length-1]){ //i|100 or i=last 
            // console.log(idStr);
            let url = 'https://api.spotify.com/v1/audio-features?ids='+idStr; //no scope
            spott_get_sync(url, token, function(xhr){
                playlistAudioFeaturesRaw = playlistAudioFeaturesRaw.concat(xhr['audio_features']);
            });
            idStr = '';
        }
    }
    let num = 0;
    for(let item of playlistAudioFeaturesRaw){
        if(item){
            for(let key in playlistAudioFeatures){
                playlistAudioFeatures[key] += item[key];
            }
            num += 1;
        }else{ //item = null when local
        }
    }
    for(let key in playlistAudioFeatures){
        playlistAudioFeatures[key] /= num; //avg
    }
    return playlistAudioFeatures;
}

function avg_popularity(all_tracks){
    let temp = 0;
    for(let item of all_tracks){
        if(item['track']['popularity']){
            temp += item['track']['popularity'];
        }
    }
    temp /= all_tracks.length;
    return temp;
}

function date_count(all_tracks, type){
    let dateVScountDict = {};
    for(let track of all_tracks){
        let thisDate = ""
        if(type == 'added'){
            thisDate = track['added_at'].slice(0,7); //2021-05
        }else if(type == 'released'){
            if(track['track']['album']['release_date']){
                thisDate = track['track']['album']['release_date'].slice(0,7); //2021-05            
            }else{
                continue
            }
        }
        if(!dateVScountDict[thisDate]){ //init
            dateVScountDict[thisDate] = 0;
        }
        dateVScountDict[thisDate] += 1;
    }
    return dateVScountDict;
}

function idArrify(all_tracks){
    let idArr = [];
    for(let item of all_tracks){
        for(let artist of item['track']['artists']){
            idArr.push(artist['id']);
        }
    }
    return idArr;
}

function getGenresArr(idArr){
    let idStr = '';
    let i = 0;
    let result = [];
    for(let id of idArr){
        if(id && id!='null'){
            i++;
            idStr += id+',';
            if(i%50 == 0 || id==idArr[idArr.length-1]){ //limit = 50
                idStr = idStr.slice(0,-1);
                spott_get_sync('https://api.spotify.com/v1/artists/?ids='+idStr, token, function(xhr){ //no scope
                    result = result.concat(xhr['artists']);
                });
                idStr = '';
            }
        }
    }
    let genreDict = {};
    let bigGenreDict = {};
    for(let item of result){
        let bigGenHist = []; //prevent duplication of big genres within one artist
        // console.log(item['genres']);
        for(let gen of item['genres']){  //one artist
            // for specific genres
            if(!genreDict[gen]){
                genreDict[gen] = 0;
            }
            genreDict[gen] += 1;
            let bigGens
            // for big genres
            if(gen.split(' ').includes('lo-fi')){ //lo-fi is an exception
                bigGens = gen.split(' ');
            }else{
                bigGens = gen.split(/ |-/); //separate with ' ' or '-' e.g. j-indie k-pop
            }
            for(let Gen of bigGens){
                if(!bigGenreDict[Gen]){
                    bigGenreDict[Gen] = 0;
                }
                if(!bigGenHist.includes(Gen)){
                    bigGenreDict[Gen] += 1;
                    bigGenHist.push(Gen);
                }
            }
        }
    }
    let genreArr = sortDict(genreDict);
    let bigGenreArr = sortDict(bigGenreDict);
    return [genreArr,bigGenreArr];
}

function get_playlist_details(use_liked_song=false){
    try {
        if(token){
            let playlist_id = '';
            let playlist_name = '';
            if(use_liked_song){
                playlist_name = 'Liked Songs';
            }else{
                let playlists = get_all_playlists();
                if(!playlists){
                    return;
                }
                let _name = $('#playlist_input').val();
                if($("#playlistExactMatch").prop("checked")){ //need exact match
                    for (let playlist of playlists) { //ignore case and search
                        if(playlist['name'] == _name){
                            playlist_id = playlist['id'];
                            playlist_name = playlist['name'];
                            break;
                        }
                    }
                }else{
                    for (let playlist of playlists) { //ignore case and search
                        if(playlist['name'].toLowerCase().indexOf(_name.toLowerCase()) != -1){
                            playlist_id = playlist['id'];
                            playlist_name = playlist['name'];
                            break;
                        }
                    }
                }
            }
            let current_playlist = null;
            if(playlist_id != ''){
                let all_tracks = null
                if(use_liked_song){
                    let liked_songs = iterateAll('https://api.spotify.com/v1/me/tracks?limit=50');
                    if(!liked_songs){
                        return;
                    }
                    all_tracks = liked_songs;
                }else{
                    spott_get_sync('https://api.spotify.com/v1/playlists/'+playlist_id, token, function(xhr){ //no scope
                        current_playlist = xhr;
                    });
                    let url = 'https://api.spotify.com/v1/playlists/'+playlist_id+'/tracks?limit=100';
                    let objData = {iterAll:1, useDB:1, name:'playlist_items_'+playlist_id};
                    spott_get_sync(url, token, function(xhr){
                        current_playlist['tracks']['items'] = xhr['data'];
                    }, objData);
                    if(!current_playlist['tracks']['items']){
                        return;
                    }
                    all_tracks = current_playlist['tracks']['items'];
                }
                let AudioFeatureDict = get_playlist_audio_features(all_tracks);
                let sortedArtistArr = ArtistDistribution(all_tracks);
                let sortedArtistArrwTitle = [['Artist','Number']].concat(sortedArtistArr);
                $('.playlistName').html(playlist_name);
                $('#currentPlaylistDiv').show();
                if(!use_liked_song && current_playlist['images'].length>0){ //add image
                    let image_url = current_playlist['images'][0]['url'];
                    $('#currengPlaylistImg').html('<img src="'+image_url+'" class="meta_img">');
                }

                let tracknameartistdateDict = TrackNameArtistDate(all_tracks);
                let sortedtracknameartistdateArr = sortDict(tracknameartistdateDict);
                if(showLastfmStat){ //last.fm
                    for(let item of sortedtracknameartistdateArr){
                        let [track, artists] = item[0].split(ARTIST_SEP);
                        let title = track + ' - ' + artists.split(', ')[0]; // last.fm only shows 1st artist
                        if(lastfm_tracknameartistcount[title.toLowerCase()]){ //'song_title - 1st_artist'
                            item.push(lastfm_tracknameartistcount[title.toLowerCase()]);
                        }else{ //no play record
                            item.push('0');
                        }
                    }
                }

                drawRadar(AudioFeatureDict, 'AudioFeatureDiv');

                $("#totalTracks").html(all_tracks.length);
                $("#avgPopularity").html(Math.round(avg_popularity(all_tracks)));
                $("#avgDuration").html(Math.floor(AudioFeatureDict["duration_ms"]/1000/60)+'m'+Math.round(AudioFeatureDict["duration_ms"]/1000)%60+'s');
                $("#avgTempo").html(Math.round(AudioFeatureDict["tempo"])+' BPM');
                $("#avgLoudness").html(Math.round(AudioFeatureDict["loudness"])+' dB');

                if(showLastfmStat){
                    let count = 0
                    for(let item of sortedtracknameartistdateArr){
                        count += parseInt(item[2]);
                    }
                    $("#totalScrobbiles").html(count);
                }

                //added date line graph
                let dateVScountDict = date_count(all_tracks, 'added');
                let dateVScountArr = [];
                for(let date in dateVScountDict){
                    dateVScountArr.push([date,dateVScountDict[date]]);
                }
                dateVScountArr.sort();

                drawLine(dateVScountArr, 'DateGraphDiv', 'date added to '+playlist_name+' (unit: month)', 'num of tracks');

                //released date line graph
                let releaseddateVScountDict = date_count(all_tracks, 'released');
                let releaseddateVScountArr = [];
                for(let date in releaseddateVScountDict){
                    releaseddateVScountArr.push([date,releaseddateVScountDict[date]]);
                }
                releaseddateVScountArr.sort();
                drawLine(releaseddateVScountArr, 'releasedDateGraphDiv', 'date released (unit: month)', 'num of tracks');

                drawPie(sortedArtistArrwTitle, 'ArtistPiechart');
                printable2(sortedArtistArr, 10, 'ArtistListDiv', 'Artist', 'number of tracks');

                //genre cloud
                let idArr = idArrify(all_tracks);
                let genreArrs = getGenresArr(idArr);
                let genreArr = genreArrs[0];
                let genreCloudData = Arr2AnyChartData(genreArr);
                drawCloud(genreCloudData, 'genreCloud');
                printable2(genreArr, 10, 'GenreListDiv', 'Genre', 'tracks with artist<br>of this genre');

                let bigGenreArr = genreArrs[1];            
                let bigGenreCloudData = Arr2AnyChartData(bigGenreArr);
                drawCloud(bigGenreCloudData, "bigGenreCloud");
                printable2(bigGenreArr, 10, 'bigGenreListDiv', 'big Genre', 'num of occurrences');

                //oldest & newest & most played table
                let plays = null
                if(showLastfmStat){
                    plays = 'scrobbles';                
                }
                printable4(sortedtracknameartistdateArr, 10, 'OldestDiv', 'title', 'artist', 'days since added', plays);

                let sortedtracknameartistdateArr_r = sortedtracknameartistdateArr;
                sortedtracknameartistdateArr_r.reverse();

                printable4(sortedtracknameartistdateArr_r, 10, 'NewestDiv', 'title', 'artist', 'days since added', plays);

                if(showLastfmStat){
                    let sortedbyplay = sortArr(sortedtracknameartistdateArr_r,2);
                    printable4(sortedbyplay, 10, 'MostPlayedDiv', 'title', 'artist', 'days since added', plays);                
                }

                //search table
                $('#srch_dur').click(function(){
                    searchSong(sortedtracknameartistdateArr);
                });
                EnterExec('#srch_dur_input', function(){
                    searchSong(sortedtracknameartistdateArr);
                });
                $('#spot_loadcomp').html('data loaded!').show();
            }else{
                $('#spot_loadcomp').html('failed').show();
                alert('no result');
                console.log('failure');
            }

        }else{
            alert('please login first');
        }
    } catch(err) {
        console.log(err);
        alert("something's wrong")
    }
}

function searchSong(sortedtracknameartistdateArr){
    let searchInput = $('#srch_dur_input').val();
    let searchResultHtml = '<table id="searchSongTable" style="margin-top:15px;">'+
                '<th>title</th>'+
                '<th>artist</th>'+
                '<th>days since added</th>';
    if(sortedtracknameartistdateArr[0][2]){
        searchResultHtml += '<th>scrobbles</th>';
    }
    let matches = 0;
    const regex = new RegExp("\\b"+searchInput+"\\b");
    let totalscrobbles = null;
    if(sortedtracknameartistdateArr[0][2]){
        totalscrobbles = 0;
    }
    for(let item of sortedtracknameartistdateArr){
        let condition
        if($('#WholeExactMatch').prop("checked")){ //whole exact match
            condition = regex.test(item[0]);
        }else{ //whatever match
            condition = item[0].toLowerCase().indexOf(searchInput.toLowerCase())!=-1;
        }
        if(condition){
            matches += 1;
            let [track, artists] = item[0].split(ARTIST_SEP);
            searchResultHtml += '<tr><td>'+track+'</td>'+
                        '<td>'+artists+'</td>'+
                        '<td>'+item[1]+'</td>';
            if(item[2] || item[2]==0){
                totalscrobbles += parseInt(item[2]); 
                searchResultHtml += '<td>'+item[2]+'</td>';
            }
            searchResultHtml += '</tr>';
        }
    }
    if(totalscrobbles){
        searchResultHtml = '<span style="color:#ffd8d2; float:right;">'+totalscrobbles+' scrobbles</span>'+searchResultHtml;
    }
    if(matches == 0){
        alert('no result');
    }else{
        if(matches == 1){
            searchResultHtml = '<span style="color:#ffd8d2;">'+1+' result</span>'+searchResultHtml; //insert
        }else{
            searchResultHtml = '<span style="color:#ffd8d2;">'+matches+' results</span>'+searchResultHtml; //insert
        }
        $('#srchTip').show();
        $('#SearchDurationResult').html(searchResultHtml).show();
    }
}

//table sort on clicking header
//https://stackoverflow.com/a/19947532
$(document).off('click','th');
$(document).on('click','th',function(){
    let table = $(this).parents('table').eq(0);
    let i = 0;
    let elElement;
    while(table.find('th:eq('+i+')').text()){ //remove the arrows other from the clicked element
        elElement = table.find('th:eq('+i+')');
        if(elElement.text() != $(this)[0]['textContent']){
            if(elElement.text().indexOf(' ↑')!=-1 || elElement.text().indexOf(' ↓')!=-1){
                elElement.html(elElement.text().slice(0,-2));
            }
        }
        i++;
        if(i >= 10){ //insurance
            console.log('fuck');
            break;
        }
    }
    let currenttext = $(this)[0]['textContent'];
    if(currenttext.indexOf(' ↑')!=-1){
        $(this).html($(this)[0]['textContent'].slice(0,-2)+' ↓');
    }else if(currenttext.indexOf(' ↓')!=-1){
        $(this).html($(this)[0]['textContent'].slice(0,-2)+' ↑');
    }else{
        $(this).html($(this)[0]['textContent']+' ↑');
    }
    let rows = table.find('tr:gt(0)').toArray().sort(
        comparer($(this).index())
    );
    this.asc = !this.asc;
    if (!this.asc){rows = rows.reverse()}
    for (let row of rows) {
        table.append(row);
    }
});
function comparer(index) {
    return function(a, b) {
        let valA = getCellValue(a, index), valB = getCellValue(b, index)
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
    }
}
function getCellValue(row, index){
    return $(row).children('td').eq(index).text() 
}