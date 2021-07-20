<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link rel='stylesheet' href="style.css" type='text/css' media='all' /> 
    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="config.js"></script>
    <script src="app.js"></script>
    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
</head>

<body>

<button id='login' style='margin: 0%;'>login to spotify</button>
<br>
<button id='current_playback' style='margin-left: 0%;'>show current playback</button>
<br>
<div id='currentPlaybackDiv' class="smol greycardDiv" style="display: none; margin-bottom: 3%;"></div>
<br>
<div>
    <p class="nice-tag">OPTIONAL</p>
    <p style="display: inline;">type your last.fm username to get play count data</p>
    <br>
    <div class="input_area">
        <input type="text" id="lastfm_username_input"></input>
        <select id="lastfm_period">
            <option value="7day">7 day</option>
            <option value="1month">1 month</option>
            <option value="3month">3 month</option>
            <option value="6month">6 month</option>
            <option value="12month">12 month</option>
            <option value="overakk">overall</option>
        </select>
        <button id='lastfm_gettoptracks'>load last.fm data</button>
    </div>
</div>
<br>
<!-- <button id='show_all_playlists'>show all playlists</button> -->
<p class="nice-tag">search playlist</p><br>
<div class="input_area">
    <input type="text" id="playlist_input"></input>
    <input type="checkbox" id="playlistExactMatch">exact match</input>
    <button id='get_playlist'>show playlist detail</button>
    <br>
    <button id='get_liked_song'>show liked songs</button>
</div>
<br>
<div id='currentPlaylistDiv'></div>


<script>

var token = null;

var scopes = 'user-read-private user-read-email user-library-read user-read-currently-playing\
                user-read-playback-state playlist-read-private';

var url = String(window.location);
if(url.search(/=/)!=-1){
    var code = url.slice(url.search(/=/)+1,);
}
if(code){
    token = get_token();
}
// var playlists = [];

var lastfm_toptracks = [];
var lastfm_tracknameartistcount = {};

$(document).ready(function(){
    $('#login').click(function(){
        login();
    });

    $('#show_all_playlists').click(function(){
        if(playlists.length == 0){ //alreadt executed
            get_all_playlists();
        }
    });

    EnterExec('#lastfm_username_input', function(){
        $('#lastfm_gettoptracks').html('loading');
        lastfm_fetch();
        $('#lastfm_gettoptracks').html('load last.fm data'); 
    });

    $('#lastfm_gettoptracks').click(function(){
        $('#lastfm_gettoptracks').html('loading');
        lastfm_fetch();
        $('#lastfm_gettoptracks').html('load last.fm data');
    });




    $('#current_playback').click(function(){
        play = spott_get('https://api.spotify.com/v1/me/player', token, function(xhr){
            console.log(xhr['item']['name'],'by', xhr['item']['artists'][0]['name']);
            temp = '';
            for(var artist of xhr['item']['artists']){
                temp += artist['name'] + ', ';
            }
            temp = temp.slice(0,-2);
            currentPlaybackhtml = xhr['item']['name']+' - '+temp;
            $('#currentPlaybackDiv').html(currentPlaybackhtml).show();
      });
    });


    EnterExec('#playlist_input', function(){
        $('#get_playlist').html('loading');
        get_playlist_details();
        $('#get_playlist').html('show playlist detail');
    });

    // $('#playlist_input').keypress(function(e){
    //     if(e.which == 13){
    //         $('#get_playlist').html('loading');
    //         get_playlist_details();
    //         $('#get_playlist').html('show playlist detail');
    //     }
    // });

    $('#get_playlist').click(function(){
        $('#get_playlist').html('loading');
        get_playlist_details();
        $('#get_playlist').html('show playlist detail');
    });
    
    $('#get_liked_song').click(function(){
        $('#get_liked_song').html('loading');
        get_playlist_details(use_liked_song=true);        
        $('#get_liked_song').html('show liked songs');
    })


});

</script>
</body>
</html>